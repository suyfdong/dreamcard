# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamCard is an AI-powered dream card generator that transforms user dream descriptions into beautiful 3-panel visual cards with abstract symbolic interpretation. The architecture follows a strict separation of concerns:

- **Vercel (Frontend + Lightweight API)**: Handles UI, creates jobs, queries status
- **Upstash Redis (Queue)**: BullMQ job queue
- **Railway Worker (Heavy Processing)**: Consumes queue, calls AI services, processes images
- **Supabase**: PostgreSQL database + image storage

**Critical Design Principles**:
1. Vercel API routes are intentionally lightweight (only queue operations and status checks). ALL heavy processing (LLM calls, image generation, storage uploads) happens in the Railway Worker.
2. **Abstract Dream Interpretation**: The LLM transforms dreams into symbolic, metaphorical visual narratives rather than literal illustrations (e.g., "老虎追我" becomes abstract representations of fear and pursuit, NOT literal tiger images).
3. **Psychological Dream Types**: Four dream categories (Memory, Surreal, Lucid, Pastel) each with distinct artist references and emotional cores.

## Architecture Flow

```
User → Vercel API → Upstash Redis Queue → Railway Worker
                                              ↓
                                         OpenRouter (LLM)
                                              ↓
                                         Replicate (SDXL)
                                              ↓
                                         Supabase (Storage + DB)
                                              ↓
Vercel API ← Polling Status ← Database Updates
```

## Development Commands

### Essential Commands

```bash
# Development (requires 2 terminals)
npm run dev           # Terminal 1: Next.js dev server (port 3000)
npm run worker        # Terminal 2: BullMQ worker process

# Worker (Railway/Production)
npm run worker:start  # Generate Prisma + push DB schema + start worker (for Railway)

# Database
npm run db:generate   # Generate Prisma client after schema changes
npm run db:push       # Push schema to database (development)
npm run db:studio     # Open Prisma Studio to view/edit data

# Utilities
npm run check-env     # Validate all required environment variables
npm run setup         # Install deps + generate Prisma + check env
```

### Important Notes

- **Worker MUST be running** for any image generation to complete
- Local development requires both `dev` and `worker` running simultaneously
- Worker requires `dotenv` package and loads `.env` via `import 'dotenv/config'` (for tsx execution)
- If jobs stay in "queued" status, check that worker process is running

## Core Architecture

### 1. API Routes (Lightweight - Vercel)

**`app/api/generate/route.ts`**: Creates project, enqueues job
- Validates input with Zod (dream text, style, symbols, mood)
- Creates Project record (status: 'pending')
- Adds job to BullMQ queue
- Returns `{ projectId, jobId }`
- **Does NOT process images or call AI services**

**`app/api/status/route.ts`**: Queries job progress
- Fetches job state from BullMQ and database
- Maps states: waiting/delayed → 'queued', active → 'running', completed → 'success', failed → 'failed'
- Returns `{ status, progress, projectId, error }`

**`app/api/project/route.ts`**: Returns project with panels
- Fetches Project with related Panel records
- Formats for frontend consumption
- Panel.order is 0-indexed in DB, 1-indexed for frontend

### 2. Worker (Heavy Processing - Railway)

**`worker/index.ts`**: Main processing pipeline

**Processing Steps**:
1. **Parse** (Progress: 0.1): OpenRouter Llama 3.3 70B parses dream into abstract 3-panel symbolic narrative
2. **Generate Images** (Progress: 0.35-0.8): Replicate SDXL generates 3 images (768x1024) with artist-specific style
3. **Upload** (Progress: 0.8-1.0): Uploads to Supabase Storage, creates Panel records
4. **Complete** (Progress: 1.0): Updates Project status to 'success'

**Key Functions**:
- `parseDreamWithLLM(inputText, style, symbols, mood)`: Calls OpenRouter with dream interpretation prompt
  - **CRITICAL FIX (2025-11-04)**: symbols and mood parameters are now properly passed to LLM via enhanced user message
  - Symbols converted to abstract metaphors: "mirror" → duplicated color planes, "stairs" → diagonal light rhythm
  - Mood influences color temperature and compositional energy
  - Returns 3-panel structure with scene descriptions and English captions (3-8 words, philosophical phrases)
- `generateImage(scene, style)`: Calls Replicate SDXL with artist-specific prompts
- `processImageGeneration()`: Main job processor, handles entire pipeline

**Worker Configuration**:
- Concurrency: 2 (processes 2 jobs simultaneously)
- Rate limit: 10 jobs per 60 seconds
- Auto-retry: 2 attempts with exponential backoff
- **Requires dotenv**: Worker loads `.env` via `import 'dotenv/config'` at the top of `worker/index.ts`

### 3. Database Schema

**Project**: Main entity
- `status`: pending → queued → running → success/failed
- `progress`: 0.0 to 1.0 (matches PROGRESS_STAGES in constants)
- `style`: minimal | film | cyber | pastel
- `symbols`: String array (e.g., ["mirror", "stairs", "ocean"])
- `mood`: Optional string (e.g., "lonely", "calm", "anxious")
- One-to-many relationship with Panel

**Panel**: Individual image panels
- `order`: 0, 1, 2 (DB) → 1, 2, 3 (frontend)
- `scene`: LLM-generated abstract visual description
- `caption`: English philosophical phrase (10-50 chars, 3-8 words)
- `imageUrl`: Final Replicate-generated image URL
- `sketchUrl`: Currently unused (future: quick sketch preview)

**Job**: BullMQ job tracking
- Links `projectId` to `bullmqJobId`
- Enables status queries via job ID

### 4. Psychological Dream Type System

**Current System** (as of 2025-11-03, Commit: e2589b7):

Four dream types defined in `lib/constants.ts`:

| Style Key | Dream Type | Artist Reference | Psychological Core | User Feeling |
|-----------|------------|------------------|-------------------|--------------|
| `minimal` | Memory Dream | Van Gogh Early + Cézanne | Nostalgia, loss, tenderness | Dreams of places I've been |
| `film` | Surreal Dream | Dalí + Magritte | Anxiety, conflict, absurdity | World logic breaks |
| `cyber` | Lucid Dream | Tanguy + de Chirico | Consciousness, floating, liminal | Between sleep and wake |
| `pastel` | Pastel Dream | Monet + Van Gogh Blossoms | Healing, lightness, gentleness | Spring-like comfort |

**Key Style Properties**:
- `dreamType`: Psychological category
- `psychologicalCore`: Core emotional theme
- `userFeeling`: User-facing description (English only, no Chinese in UI)
- `artistReference`: Artist pairing for SDXL generation
- `artistPhilosophy`: Detailed explanation of artistic approach
- `colorPalette`: Dominant color scheme
- `prompt`: Positive SDXL prompt with artist-specific techniques
- `negative`: Comprehensive negative prompt
- `compositionGuide`: Panel-by-panel composition templates (panel1/panel2/panel3 with shot types)

**Three-Panel Energy Progression**:
- **Panel A - SENSATION (初感)**: CALM, WIDE SHOT, 70-75% negative space, atmospheric entry
- **Panel B - DISTORTION (漩涡)**: CHAOS, MID SHOT, environmental conflict, turbulence
- **Panel C - ECHO (余晖)**: DISSOLUTION, CLOSE-UP, 80-85% void, emotional release

### 5. Storage

**Supabase Storage**:
- Bucket: `dreamcard-images` (must be Public)
- Path pattern: `{projectId}/panel-{order}-{uuid}.png`
- `lib/storage.ts` handles uploads via service role key

### 6. Redis Queue System

**BullMQ with Upstash Redis**:
- `lib/redis.ts` uses lazy initialization to prevent build-time connection errors
- Checks `NEXT_PHASE === 'phase-production-build'` and returns mock objects during builds
- Worker connects via ioredis using `UPSTASH_REDIS_URL` (Redis protocol, not REST)
- Queue name: `image-generation`
- Job options: 2 retry attempts, exponential backoff, auto-cleanup of completed/failed jobs

## Environment Variables

Required variables (all critical):

```bash
OPENROUTER_API_KEY=sk-or-v1-xxx             # LLM parsing (Llama 3.3 70B)
REPLICATE_API_TOKEN=r8_xxx                   # Image generation (SDXL)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...                     # Public access
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Server-side (storage uploads)
UPSTASH_REDIS_URL=redis://default:xxx@xxx.upstash.io:6379  # BullMQ connection (worker uses this)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io  # Optional REST API access
UPSTASH_REDIS_REST_TOKEN=Axxx                # Optional REST API token
DATABASE_URL=postgresql://postgres:...        # Prisma connection
```

**Note**: The worker uses `UPSTASH_REDIS_URL` (Redis protocol) via ioredis, not the REST API.

**Storage Bucket Setup** (one-time):
1. Supabase Dashboard → Storage → New bucket
2. Name: `dreamcard-images`
3. **Must be Public** (or configure policies for public read)

## Frontend Architecture

### Instant Navigation Pattern

**Critical UX Flow** (no waiting on homepage):
1. User submits form → Generate temp ID (`temp-${Date.now()}`)
2. **Navigate IMMEDIATELY** to `/result/temp-xxx` (don't wait for API)
3. API call fires in background: `apiClient.generate()` → POST `/api/generate`
4. Store `jobId`, `actualProjectId`, `tempProjectId` in `sessionStorage`
5. Result page detects temp ID, waits for `jobId` without trying to load project
6. Result page polls `GET /api/status?jobId=xxx` every 2 seconds
7. When status='success', fetches `GET /api/project?projectId=xxx` using **actualProjectId**
8. Displays panels with images

**API Client** (`lib/api-client.ts`):
- Provides typed methods: `generate()`, `getStatus()`, `getProject()`
- Includes `pollStatus()` helper for automated polling
- All methods throw on HTTP errors (catch in frontend)

### UI Language Policy

**IMPORTANT**: All UI text must be in English unless user inputs Chinese.
- Style cards: English titles only ("Memory Dream", not "记忆梦 Memory")
- Descriptions: English only ("Dreams of places I've been")
- Artist subtitles: Removed from display (kept in config only)
- Captions: English philosophical phrases (3-8 words)

### Progress Bar Enhancement

**Enhanced UX** (as of 2025-11-02):
- Height: 16px (4x wider than before)
- Smooth animation: Increments every 100ms (no jumps)
- Fake micro-progress: +0.1-0.3% every 800ms when stuck (stops at 95%)
- Visual: Gradient fill `from-[#6E67FF] to-[#00D4FF]`, shimmer animation, shadow-inner
- Dynamic messages based on progress:
  - 0-10%: "Interpreting your dream..."
  - 10-35%: "Crafting visual metaphors..."
  - 35-80%: "Generating dream imagery..."
  - 80-100%: "Finalizing your dream card..."

### Manga-Style Collage System

**Feature** (`components/ShareButtons.tsx`):
- Combines 3 panels into irregular manga-style layout with rotation and depth
- **5 random layouts**: Diagonal Cascade, Stacked Overlap, L-Shape, Zigzag Rhythm, Center Focus
- **Design elements**:
  - Dark gradient background (radial gradient from #1a1a2e to #0a0a0a)
  - Film grain noise overlay (0.03 opacity)
  - Panel rotation for dynamic composition (-3° to +3°)
  - Drop shadows for depth (rgba(0,0,0,0.6), 30px blur)
  - White borders around each panel (8px)
- **Export formats**: 9:16 (story) and 1:1 (square)
- Uses client-side Canvas API for compositing

## Common Development Tasks

### Adding a New Style

1. Add style definition to `lib/constants.ts` STYLES object with all required fields
2. Update frontend `DreamStyleCard.tsx` styleConfig with English title/description
3. Update TypeScript types in `lib/api-client.ts` GenerateRequest interface
4. Test with worker to ensure artist-specific prompts work correctly

### Debugging Generation Failures

1. Check Railway worker logs for errors
2. Check Prisma Studio: `npm run db:studio`
   - Look at Project.status and errorMsg
   - Verify Panel records were created
3. Common issues:
   - **OpenRouter**: Check account balance, verify model `meta-llama/llama-3.3-70b-instruct` is available
   - **Replicate**: Verify payment method added, check SDXL model exists
   - **Storage**: Ensure bucket `dreamcard-images` exists and is public
   - **Worker**: Ensure process is running (Railway logs should show "Worker started and listening for jobs...")
   - **Redis**: Verify `UPSTASH_REDIS_URL` is set correctly (Redis protocol `redis://...`, NOT REST URL)
   - **Symbols/Mood not working**: Ensure they're passed to `parseDreamWithLLM()` and included in user message

### Modifying Progress Stages

1. Update `PROGRESS_STAGES` in `lib/constants.ts`
2. Update worker progress calls: `job.updateProgress()` and `prisma.project.update()`
3. Update frontend `progressToStages()` function in result page

### Testing the Full Pipeline Locally

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker

# Terminal 3 (watch logs)
# Worker logs show each processing step
```

## Deployment

**Vercel** (Frontend + API):
- Environment: All 9 environment variables
- Build command: `next build` (automatic)
- No worker runs on Vercel
- Auto-deploys on every push to main (repository must be Public for auto-deploy to work)

**Railway** (Worker):
- Start command: `npm run worker:start` (recommended, includes DB setup)
- Or: `npm run worker` (if Prisma client already generated)
- Environment: Same environment variables as Vercel
- Must remain running 24/7
- Auto-deploys on every push to main

**Critical**: Worker and API must share the same Redis and Database instances (same env vars).

## Cost Considerations

- OpenRouter (Llama 3.3 70B): ~$0.01-0.05 per generation
- Replicate (SDXL): ~$0.01-0.02 per image × 3 = ~$0.03-0.06 per generation
- Total: ~$0.04-0.11 per dream card generation
- Upstash Redis: Free tier 500K requests/month (or $0.2 per 100K requests on paid plan)

Set budget limits in OpenRouter and Replicate dashboards.

## Key Files Reference

- `worker/index.ts` - All AI processing logic, LLM prompts, SDXL generation
- `lib/constants.ts` - 4 dream types with artist references, symbols, generation config
- `lib/redis.ts` - BullMQ queue setup with lazy initialization
- `lib/storage.ts` - Supabase Storage helpers
- `lib/api-client.ts` - Frontend API wrapper with TypeScript types
- `app/api/generate/route.ts` - Single-transaction project creation + job enqueue
- `app/api/status/route.ts` - Job status polling
- `app/api/project/route.ts` - Project retrieval with panels
- `app/page.tsx` - Homepage with instant navigation pattern
- `app/result/[id]/page.tsx` - Result page with temp ID handling and progress polling
- `components/ShareButtons.tsx` - Manga-style collage generation (5 random layouts)
- `components/DreamStyleCard.tsx` - Style selection with English-only UI
- `components/ProgressBar.tsx` - Enhanced progress bar with smooth animation
- `prisma/schema.prisma` - Database models (Project, Panel, Job)

---

## ⚠️ Current Known Issues

### 🔴 CRITICAL: Redis Quota Exhausted (2025-11-04)

**Problem**: Upstash Redis free tier quota (500,000 requests) completely used up.

**Symptoms**:
- Website intermittently fails with "Generation failed" error
- Worker logs show: `ERR max requests limit exceeded. Limit: 500000, Usage: 500000`
- Some requests succeed (cached), most fail

**Impact**: **Website effectively non-functional** - cannot process new generations

**Solutions** (pick one):

**Option A: Delete old instance + Create new free instance** (RECOMMENDED)
1. Go to https://console.upstash.com/redis
2. Delete existing Redis instance
3. Create new Regional (free) instance
4. Copy new `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
5. Update environment variables in:
   - Local `.env` file
   - Vercel: Settings → Environment Variables
   - Railway: Variables tab
6. Trigger Vercel redeploy: `git commit --allow-empty -m "chore: update Redis" && git push`
7. Railway auto-redeploys on push

**Data Impact**: Redis only stores BullMQ job queue. All Project/Panel data in PostgreSQL (Supabase) is safe.

**Option B: Upgrade to paid plan**
- Cost: $0.2 per 100K requests (~$2-5/month for typical usage)
- Upstash Dashboard → Select instance → Upgrade
- No data loss, immediate fix

**Option C: Wait for monthly reset** (December 1st)
- Free, but website unusable for ~27 days

**Recommended**: Option A (delete + recreate) - free, immediate, data loss is negligible.

---

### 🟡 Pending Feature Requests (Not Blocking)

**From user feedback (2025-11-02)**:
1. **Collage background**: Blurred light-colored gradient background (currently dark gradient)
2. **Artistic captions in collage**: Display 3 captions beside images in artistic font
3. **Cursor trail effect**: Magic wand cursor with sparkle trail/drag effect

**Status**: Deprioritized until Redis issue resolved and core generation working properly.

---

### 🟢 Recently Fixed Issues (No Action Needed)

**✅ Symbols and Mood Parameters Not Affecting Output** (Fixed: 2025-11-04, Commit: f51025a)
- **Problem**: User selections for symbols/mood had no effect on generated images
- **Root cause**: Parameters passed to `parseDreamWithLLM()` but never included in LLM prompt
- **Fix**: Enhanced user message now includes symbols (as abstract metaphors) and mood (as emotional guidance)
- **Verification**: Test by selecting different symbols/mood combinations - should see variation in output

**✅ UI Language Cleanup** (Fixed: 2025-11-02, Commits: acd246a, 8300879)
- Removed all Chinese text from UI (except user input)
- Changed captions to English philosophical phrases (3-8 words)
- Removed artist names from style card subtitles

**✅ Surreal Dream Color Intensity** (Fixed: 2025-11-04, Commit: 038ed18)
- Reduced Dalí/Magritte color intensity from "color violence" to "muted harmony"
- Added "desaturated complementary colors, soft pastel tones"

**✅ Memory Dream Van Gogh Similarity** (Fixed: 2025-11-02)
- Modified prompts to use techniques as reference (NOT copy famous paintings)
- Added negative prompt blocking: "famous paintings, Starry Night, Sunflowers, art reproduction"

---

## 📅 Recent Updates Summary

### 2025-11-04
- **Commit f51025a**: Fixed symbols/mood parameters - now properly passed to LLM prompt
- **Commit 038ed18**: Reduced Surreal Dream color intensity
- **Added dotenv**: Worker now loads `.env` via `import 'dotenv/config'`

### 2025-11-03
- **Commit e2589b7**: Implemented psychological dream type system (Memory/Surreal/Lucid/Pastel)
- Redesigned Lucid Dream: Tanguy + de Chirico (replacing Turrell + Syd Mead)
- Enhanced Pastel Dream differentiation: HORIZONTAL/DIAGONAL/VERTICAL compositions

### 2025-11-02
- **UI enhancements**: Wider progress bar (16px), smooth animation, shimmer effect
- **Collage system**: 5 random manga-style layouts with rotation and depth

### 2025-11-01
- **Repository mode**: Confirmed Public mode required for Vercel auto-deployment
- **Traditional art prevention**: Enhanced negative prompts, modern art prefix enforcement

---

**Last Updated**: 2025-11-04

**Repository**: https://github.com/suyfdong/dreamcard (Public)

**Critical Next Step**: Resolve Redis quota issue to restore website functionality.
