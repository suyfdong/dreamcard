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
3. **Modern Art Style Enforcement**: Aggressive blocking of traditional Asian art styles (watercolor, ink wash, calligraphy) in favor of contemporary digital art aesthetics.

## Architecture Flow

```
User → Vercel API → Upstash Redis Queue → Railway Worker
                                              ↓
                                         OpenRouter (LLM)
                                              ↓
                                         Replicate (Images)
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
- If jobs stay in "queued" status, check that worker process is running

## Core Architecture

### 1. API Routes (Lightweight - Vercel)

**`app/api/generate/route.ts`**: Creates project, enqueues job
- Validates input with Zod
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
2. **Generate Images** (Progress: 0.35-0.8): Replicate SDXL generates 3 images (768x1024) with modern art style enforcement
3. **Upload** (Progress: 0.8-1.0): Uploads to Supabase Storage, creates Panel records
4. **Complete** (Progress: 1.0): Updates Project status to 'success'

**Key Functions**:
- `parseDreamWithLLM()`: Calls OpenRouter with abstract interpretation prompt. LLM MUST include modern art style keywords in every scene description (e.g., "Contemporary digital art:", "Surrealist photography:")
- `generateImage()`: Calls Replicate SDXL with aggressive modern art prefix and comprehensive negative prompts blocking traditional Asian art
- `processImageGeneration()`: Main job processor, handles entire pipeline

**Worker Configuration**:
- Concurrency: 2 (processes 2 jobs simultaneously)
- Rate limit: 10 jobs per 60 seconds
- Auto-retry: 2 attempts with exponential backoff

### 3. Database Schema

**Project**: Main entity
- `status`: pending → queued → running → success/failed
- `progress`: 0.0 to 1.0 (matches PROGRESS_STAGES in constants)
- `style`: minimal | film | cyber | pastel
- One-to-many relationship with Panel

**Panel**: Individual image panels
- `order`: 0, 1, 2 (DB) → 1, 2, 3 (frontend)
- `scene`: LLM-generated visual description
- `caption`: Short poetic text (8-40 chars)
- `imageUrl`: Final Replicate-generated image
- `sketchUrl`: Currently unused (future: quick sketch preview)

**Job**: BullMQ job tracking
- Links `projectId` to `bullmqJobId`
- Enables status queries via job ID

### 4. Style System

Styles defined in `lib/constants.ts`:
- **4 core styles**: minimal (line art) | film (grain) | cyber (neon) | pastel (soft)
- Each style has: name, prompt (positive), negative (negative prompt), sketchPrompt (currently unused)
- **CRITICAL**: Worker uses `style.prompt` (NOT sketchPrompt) for final image generation
- Modern art enforcement: Every prompt starts with "contemporary digital art, modern 21st century aesthetic, photorealistic CGI rendering, cinematic photography" prefix
- Aggressive negative prompts block ALL traditional art styles (watercolor, ink wash, chinese brush painting, sumi-e, calligraphy, seal stamps, etc.)

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
OPENROUTER_API_KEY=sk-or-v1-xxx             # LLM parsing
REPLICATE_API_TOKEN=r8_xxx                   # Image generation
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

## Common Development Tasks

### Adding a New Style

1. Add style definition to `lib/constants.ts` STYLES object with: name, prompt, negative, sketchPrompt
2. Update frontend `DreamStyleCard.tsx` styleConfig with: title, description, imageUrl, gradient
3. Update TypeScript types in `lib/api-client.ts` GenerateRequest interface
4. **IMPORTANT**: Ensure `prompt` (not `sketchPrompt`) is used in `worker/index.ts` `generateImage()` function
5. Test with worker to ensure modern art style enforcement works (no traditional Asian art)

### Debugging Generation Failures

1. Check Railway worker logs for errors
2. Check Prisma Studio: `npm run db:studio`
   - Look at Project.status and errorMsg
   - Verify Panel records were created
3. Common issues:
   - **OpenRouter**: Check account balance, verify model `meta-llama/llama-3.3-70b-instruct` is available
   - **Replicate**: Verify payment method added, check SDXL model `stability-ai/sdxl:39ed52f2a78e...` exists
   - **Storage**: Ensure bucket `dreamcard-images` exists and is public
   - **Worker**: Ensure process is running (Railway logs should show "Worker started and listening for jobs...")
   - **Redis**: Verify `UPSTASH_REDIS_URL` is set correctly (Redis protocol `redis://...`, NOT REST URL)
   - **Traditional art style**: If images show watercolor/calligraphy, check that modern art prefix and negative prompts are in place

### Debugging Traditional Asian Art Style Issues

If generated images show traditional Chinese paintings, calligraphy, or ink wash style:

1. **Check LLM output**: Ensure LLM scenes start with modern art style keywords ("Contemporary digital art:", "Surrealist photography:", etc.)
2. **Check SDXL prompts**: Verify `generateImage()` adds modern art prefix at the BEGINNING of the prompt
3. **Check negative prompts**: Ensure comprehensive blocking of: watercolor painting, ink wash painting, chinese brush painting, sumi-e, calligraphy, seal stamps, traditional art
4. **Check SDXL parameters**: Ensure `guidance_scale >= 8.5`, `num_inference_steps >= 30` for strong style control
5. **Root cause**: SDXL has strong bias toward traditional art when processing vague abstract descriptions - solution is explicit modern art keywords in both LLM and SDXL prompts

### Build-Time Redis Connection Issues

If you see Redis connection errors during `next build`:
- The codebase uses lazy initialization in `lib/redis.ts` to prevent build-time connections
- During build (`NEXT_PHASE === 'phase-production-build'`), mock objects are returned
- This is normal and expected - the worker only connects at runtime
- If errors persist, check that `NEXT_PHASE` environment variable is set by Next.js build process

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
- Environment: All 8 environment variables
- Build command: `next build` (automatic)
- No worker runs on Vercel

**Railway** (Worker):
- Start command: `npm run worker:start` (recommended, includes DB setup)
- Or: `npm run worker` (if Prisma client already generated)
- Environment: Same environment variables as Vercel
- Must remain running 24/7

**Critical**: Worker and API must share the same Redis and Database instances (same env vars).

## Frontend Integration

**Frontend → API Flow** (Instant Navigation Pattern):
1. User submits form → Generate temp ID (`temp-${Date.now()}`)
2. **Navigate IMMEDIATELY** to `/result/temp-xxx` (no waiting)
3. API call fires in background: `apiClient.generate()` → POST `/api/generate`
4. Store `jobId`, `actualProjectId`, `tempProjectId` in `sessionStorage`
5. Result page detects temp ID, waits for `jobId` without trying to load project
6. Result page polls `GET /api/status?jobId=xxx` every 2 seconds
7. When status='success', fetches `GET /api/project?projectId=xxx` using **actualProjectId** (not temp ID)
8. Displays panels with images

**CRITICAL**: This instant navigation pattern prevents 7-second delay on homepage. API calls happen in background while user sees progress screen.

**API Client** (`lib/api-client.ts`):
- Provides typed methods: `generate()`, `getStatus()`, `getProject()`
- Includes `pollStatus()` helper for automated polling
- All methods throw on HTTP errors (catch in frontend)

## Cost Considerations

- OpenRouter (Llama 3.3 70B): ~$0.01-0.05 per generation
- Replicate (SDXL): ~$0.01-0.02 per image × 3 = ~$0.03-0.06 per generation
- Total: ~$0.04-0.11 per dream card generation

Set budget limits in OpenRouter and Replicate dashboards.

## Abstract Dream Interpretation System

**Philosophy**: Dreams are symbolic, metaphorical, and layered with meaning. DO NOT create literal illustrations.

**LLM Transformation Rules** (`worker/index.ts` `parseDreamWithLLM()`):
1. **Abstract literal elements**: "tiger" → fear, power, wildness, danger (not literal tiger image)
2. **Visual metaphors**: Show FEELING, ATMOSPHERE, EMOTIONAL TRUTH (not literal subject)
3. **Symbolic imagery**: Use colors, shapes, shadows, spaces to convey dream's essence
4. **Cinematic thinking**: Each panel = MOOD, not just a scene
5. **MANDATORY modern art style keywords**: Every scene description MUST start with explicit style (e.g., "Contemporary digital art:", "Surrealist photography:")

**Example Transformation**:
- ❌ BAD (literal): "老虎在森林中追我" → "Tiger running", "Tiger closer", "Tiger catches"
- ✅ GOOD (abstract): "Contemporary digital art: Piercing amber geometric forms emerge from deep indigo void" → "Surrealist photography: Vertical streaks of motion blur in forest green" → "Modern abstract expressionism: Fragmented orange shards scattered across shadow"

**Three-Panel Structure**:
- Panel 1: THE FEELING (initial emotion/atmosphere)
- Panel 2: THE TENSION (conflict/transformation through visual metaphor)
- Panel 3: THE REVELATION (resolution through symbolic imagery)

## Manga-Style Collage System

**Feature**: Combines 3 panels into irregular manga-style layout with rotation and depth.

**Implementation** (`components/ShareButtons.tsx`):
- **9:16 format**: 3 panels with rotation (-2°, +1.5°, -1°), different sizes, drop shadows, film grain texture, radial speed lines
- **1:1 format**: Irregular panel arrangement with overlapping, dark gradient background
- Uses client-side Canvas API for compositing
- Exports as high-quality PNG

**Design Elements**:
- Dark gradient background (radial gradient from #1a1a2e to #0a0a0a)
- Film grain noise overlay (0.03 opacity, 5000 random pixels)
- Panel rotation for dynamic composition
- Drop shadows for depth (rgba(0,0,0,0.6), 30px blur)
- White borders around each panel (8px)

## Key Files Reference

- `worker/index.ts` - All AI processing logic, abstract interpretation prompts, modern art enforcement
- `lib/constants.ts` - 4 styles (minimal/film/cyber/pastel), symbols, generation config
- `lib/redis.ts` - BullMQ queue setup with lazy initialization
- `lib/storage.ts` - Supabase Storage helpers
- `lib/api-client.ts` - Frontend API wrapper with TypeScript types
- `app/api/generate/route.ts` - Single-transaction project creation
- `app/api/status/route.ts` - Job status polling
- `app/api/project/route.ts` - Project retrieval
- `app/page.tsx` - Homepage with instant navigation pattern
- `app/result/[id]/page.tsx` - Result page with temp ID handling
- `components/ShareButtons.tsx` - Manga-style collage generation
- `components/DreamStyleCard.tsx` - Style selection with preview images
- `prisma/schema.prisma` - Database models (Project, Panel, Job)

---

## Known Issues and Ongoing Work

### ⚠️ CRITICAL: Repository Must Remain Public for Auto-Deployment (2025-11-01)

**Issue**: Private repository mode breaks Vercel auto-deployment synchronization.

**Symptoms**:
- When repository is set to **Private**: Vercel does NOT detect new commits, auto-deployment fails
- When repository is set to **Public**: Auto-deployment works perfectly for both Vercel and Railway

**Root Cause**:
- Vercel GitHub App requires additional permissions for private repositories
- Permission configuration is complex and unreliable
- Public mode uses standard GitHub App mechanism (NOT webhooks)

**Solution**: Keep repository **Public**

**Security Verification** (2025-11-01):
- ✅ `.gitignore` correctly excludes `.env` files
- ✅ No API keys or secrets in git history
- ✅ All documentation uses placeholder values (`xxx`, `your_key_here`)
- ✅ No hardcoded credentials in source code
- ✅ All sensitive data stored in Vercel/Railway environment variables only

**Confirmed Safe**: Repository can remain Public without security risks.

**Auto-Deployment Configuration**:
- Vercel uses GitHub App mechanism (NOT traditional webhooks)
- GitHub repository `settings/hooks` being empty is **NORMAL and EXPECTED**
- Both platforms auto-deploy on every push to main branch
- Repository: `https://github.com/suyfdong/dreamcard` (Public)

### 🔧 RECENT FIX: Traditional Asian Art Style Prevention (2025-11-01)

**Problem**: SDXL was generating traditional Chinese paintings, calligraphy, ink wash art instead of modern abstract art.

**Root Cause**: SDXL has strong bias toward traditional art when processing vague abstract Chinese descriptions.

**Solution Implemented** (commit 81739cc):
1. **LLM Prompt Enhancement**:
   - Added mandatory modern art style keywords requirement
   - Every scene MUST start with explicit style: "Contemporary digital art:", "Surrealist photography:", etc.
   - Forbidden traditional art references: "painting", "watercolor", "ink", "brush", "classical"

2. **SDXL Generation Enhancement**:
   - Modern art prefix at prompt beginning: "contemporary digital art, modern 21st century aesthetic, photorealistic CGI rendering, cinematic photography"
   - Aggressive negative prompt blocking ALL traditional Asian art styles
   - Increased guidance_scale to 8.5 (stronger style control)
   - Increased steps to 30 (better adherence)
   - Higher quality output (95%)

**Current Status**: Implemented and deployed to Railway. Testing in progress.

**If Issue Persists**: See "Debugging Traditional Asian Art Style Issues" section for troubleshooting steps.

---

## 📅 Recent Updates Log

### 2025-11-02: Major System Overhaul - "Painting Dreams" Logic

**Problem Identified**:
用户反馈："出图达不到想要的理解梦的意境、潜意识的感觉的画面"（生成的图像无法表达梦境的诗意和潜意识感）

**Root Cause Analysis**:
1. LLM 提示词过于理论化，缺少实操性的"如何画梦"指导
2. 没有明确的镜头语言系统（远中特景别）
3. 缺少节奏递进规则（情绪起承转合）
4. 风格差异不够明显，容易生成"通用插图"
5. 美学标准模糊，LLM 不知道什么是"好看"

**Solution Implemented** (3 Major Commits):

#### Commit 1: "因-境-势"三幕艺术系统 (3cbdac5)
- 重构 LLM 提示词：实施因(情绪)-境(空间)-势(动态)三幕结构
- 间接表现技巧：用痕迹/符号/残影替代直接主体
- 构图模板系统：为 minimal/film/cyber/pastel 四种风格绑定固定景别/角度/留白规则
- 增强 SDXL 负面约束：屏蔽人脸/全身照/字面主体

#### Commit 2: "象征→跳切→内化"梦境逻辑系统 (81f3a4d)
- 理念升级：从"因-境-势"(现实叙事) → "象征→跳切→内化"(纯梦境逻辑)
- 视觉DNA连续性：三格共享图案但语境突变
- 强制禁止 A→B→C 时间线叙事
- 梦句文案系统：8-12字诗性碎片（"光跑在前"/"脚印在屋顶"）

#### Commit 3: 美学标准系统 - 定义"好看"和"创意" (4b1fb83)
**基于用户Cyber风格测试反馈**，明确定义：
- **好看** = 情绪冲击 + 空间深度 + 视觉节奏 + 留白
- **创意** = 意料之外 + 情绪共鸣
- Cyber风格特别优化：
  - 问题：用户测试发现"不够梦幻/缺少深度"
  - 解决：强制要求深度(前中后景) + 负空间(暗部留白) + 氛围(雾气/光晕)
  - 色彩：主色调紫蓝或青粉（禁止过饱和彩虹色）
  - 构图：低角度或极端特写（禁止无聊中景）
  - 负面词新增：cluttered, oversaturated rainbow, generic street, boring mid-shot, flat, no depth

#### Commit 4: 系统化"画梦"逻辑 - 象征→空间→情绪 + 镜头语言 (94be3e6)
**最终架构**（基于GPT完整方法论）：
- **三层梦境结构重构**：
  - Panel 1 (象征层/起): 远景建立空间 + 冷静情绪 + 抽象符号
  - Panel 2 (空间层/承): 中景环境冲突 + 混乱张力 + 不可能空间
  - Panel 3 (情绪层/转合): 特写情绪释放 + 消散留白 + 视觉溶解
- **镜头语言系统**（新增）：
  - WIDE SHOT (远景): 建立梦境空间,抽象,冷静
  - MID SHOT (中景): 环境冲突,混乱,错乱
  - CLOSE-UP (特写): 象征性结尾,亲密,溶解
- **节奏递进强制规则**：
  - Panel 1: CALM (冷,静,建立)
  - Panel 2: CHAOS (冲突,张力,眩晕)
  - Panel 3: DISSOLUTION (负空间,模糊,消散)
- **画梦准则**（新增）：
  1. 不直译文字："老虎追我" ≠ 画老虎 = 画被追的感觉(阴影/脚印/撕裂光线)
  2. 空间错乱但统一：沙漠里的教室 / 水下的楼梯 / 漂浮的桌椅
  3. 镜头递进：远→中→特
  4. 节奏递进：冷静→混乱→消散
  5. 色调统一但明度变化

**Current Architecture Summary**:
```
LLM 系统提示词结构 (worker/index.ts):
1. 美学标准 (What Makes a Dream Card "BEAUTIFUL")
2. 三层梦境结构 (象征→空间→情绪)
3. 镜头语言 & 节奏递进 (远中特 + 冷静混乱消散)
4. 风格差异化表 (Minimal/Film/Cyber/Pastel)
5. 构图呼吸感原则 + 色彩递进控制
6. 完整示例（"考试焦急梦"Cyber风格）
```

**Technical Changes**:
- `worker/index.ts`: 2500+ lines LLM prompt with structured dream painting methodology
- `lib/constants.ts`: All `compositionGuide` rewritten with explicit shot types (WIDE/MID/CLOSE-UP)
- Cyber style: Enhanced `prompt` (dreamlike, NOT generic street) + stronger `negative` (cluttered, flat, no depth)

---

### 2025-11-02: UI Improvements - Progress Bar Enhancement

**User Feedback**: "进度条要更宽、更好看，进度要一直在变化（不要跳跃式），让用户有期待感"

**Solution Implemented**:
1. **Wider Progress Bar**: Height increased from 2px → 16px (4倍宽度)
2. **Smooth Animation**:
   - Progress increments smoothly every 100ms (no jumps)
   - Adds tiny "fake progress" (0.1-0.3%) every 800ms when stuck
   - Creates expectation and prevents user boredom
3. **Visual Enhancements**:
   - Gradient fill: `from-[#6E67FF] to-[#00D4FF]`
   - Animated shimmer effect (2s infinite loop)
   - Shadow-inner for depth
   - Current stage: `animate-pulse` effect
4. **Better Status Messages**:
   - Large percentage display: `{displayProgress.toFixed(1)}%` (shows decimal)
   - Dynamic messages based on progress:
     - 0-10%: "Interpreting your dream..."
     - 10-35%: "Crafting visual metaphors..."
     - 35-80%: "Generating dream imagery..."
     - 80-100%: "Finalizing your dream card..."
5. **UX Psychology**:
   - Progress never decreases (only increases)
   - Fake micro-increments prevent "stuck" feeling
   - Stops fake progress at 95% (don't lie near completion)

**Files Modified**:
- `components/ProgressBar.tsx`: Added smooth animation logic + visual redesign
- `app/globals.css`: Added `@keyframes shimmer` animation

---

## ⚠️ Current Known Issues

### 1. **Image Quality Still Not Meeting Expectations** (CRITICAL)
**Problem**: 用户反馈"出图达不到想要的理解梦的意境、潜意识的感觉的画面"
**Status**: Partially addressed with today's system overhaul
**Remaining Issues**:
- LLM 可能仍然生成过于字面的描述
- SDXL 可能无法完全遵循复杂的美学指导
- 需要实测验证新系统效果

**Next Steps**:
1. 等待用户测试新系统（4次commit后）
2. 收集具体案例（哪个梦境 + 哪种风格 + 具体问题）
3. 根据反馈微调 LLM 提示词或 SDXL 参数
4. 考虑替换更强大的图像模型（FLUX.1-pro, Midjourney API）

### 2. **Vercel Build Warnings** (Minor)
TypeScript type errors in `worker/index.ts`:
- Missing type definitions: bullmq, replicate, uuid
- Solution: These don't affect runtime, only IDE/build-time warnings
- Can fix with: `npm i --save-dev @types/node @types/uuid`

---

**Last Updated**: 2025-11-02

**Repository Status**: Public (Private mode caused Vercel auto-deployment issues - keeping Public for reliable CI/CD)
