# DreamCard - AI Dream Card Generator

Transform your dreams into beautiful visual cards using AI.

## 🌟 Features

- **AI-Powered Dream Interpretation**: LLM analyzes your dream text and creates a 3-panel story
- **Multiple Art Styles**: Choose from Memory, Surreal, Lucid, or Fantasy styles
- **Real-Time Progress**: Watch your dream come to life with live progress updates
- **High-Quality Images**: Generated using FLUX Schnell model via Replicate
- **Export & Share**: Download your dream cards and share on social media

## 🛠 Tech Stack

### Frontend
- **Next.js 13+** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components

### Backend
- **Next.js API Routes**
- **Prisma** + **Supabase** (PostgreSQL)
- **BullMQ** + **Upstash Redis** (Queue system)
- **Supabase Storage** (Image storage)

### AI Services
- **OpenRouter** (meta-llama/llama-3.3-70b-instruct) - Dream interpretation
- **Replicate** (black-forest-labs/flux-schnell) - Image generation

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (via Supabase)
- Upstash Redis account
- OpenRouter API key
- Replicate API token
- Supabase account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dreamcard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Replicate API
REPLICATE_API_TOKEN=your_replicate_api_token

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Database
DATABASE_URL=your_postgresql_database_url
```

### 4. Set Up Supabase

#### Create a Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage**
3. Create a new bucket named `dreamcard-images`
4. Set it to **Public** (or configure policies as needed)

#### Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Run Development Servers

You need to run **two** processes:

#### Terminal 1: Next.js Development Server

```bash
npm run dev
```

This starts the frontend and API routes at `http://localhost:3000`

#### Terminal 2: Worker Process

```bash
npm run worker
```

This starts the BullMQ worker that processes image generation jobs.

### 6. Open in Browser

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # Create generation job
│   │   ├── status/route.ts      # Poll job status
│   │   └── project/route.ts     # Get project details
│   ├── result/[id]/page.tsx     # Result page with progress
│   └── page.tsx                 # Home page
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── DreamStyleCard.tsx       # Style selection card
│   ├── ProgressBar.tsx          # Progress visualization
│   └── PanelGrid.tsx            # Display generated panels
├── lib/
│   ├── api-client.ts            # Frontend API client
│   ├── constants.ts             # Style configs & constants
│   ├── db.ts                    # Prisma client
│   ├── redis.ts                 # BullMQ queue setup
│   └── storage.ts               # Supabase storage helpers
├── worker/
│   └── index.ts                 # BullMQ worker (image generation)
├── prisma/
│   └── schema.prisma            # Database schema
└── package.json
```

## 🔄 How It Works

1. **User Input**: User describes their dream and selects a style
2. **API Call**: Frontend calls `/api/generate` which creates a job
3. **Queue Job**: Job is added to BullMQ queue
4. **Worker Processing**:
   - LLM (Llama 3.3) analyzes dream and creates 3-panel structure
   - FLUX Schnell generates images for each panel
   - Images are uploaded to Supabase Storage
   - Progress is updated in database
5. **Real-Time Updates**: Frontend polls `/api/status` for progress
6. **Display Result**: Once complete, images are displayed via `/api/project`

## 🎨 Available Styles

| Style | Description |
|-------|-------------|
| **Memory** | Warm, nostalgic, vintage photography feel |
| **Surreal** | Haunting, ethereal, dreamlike atmosphere |
| **Lucid** | Cyberpunk aesthetic with neon colors |
| **Fantasy** | Magical, whimsical, fairy tale mood |

## 🚢 Deployment

### Deploy to Vercel

1. **Frontend & API**:
   ```bash
   vercel deploy
   ```

2. **Environment Variables**: Add all env vars in Vercel dashboard

3. **Worker**: Deploy worker separately to:
   - **Railway** / **Render** / **Fly.io** (recommended)
   - Or run on a VPS

### Worker Deployment Example (Railway)

```bash
# In your worker service, run:
npm run worker
```

Make sure the worker has access to the same Redis and Database as your Vercel deployment.

## 📊 Database Schema

```prisma
model Project {
  id          String   @id @default(uuid())
  inputText   String
  style       String
  symbols     String[]
  mood        String?
  visibility  String   @default("private")
  status      String   @default("pending")
  progress    Float    @default(0.0)
  panels      Panel[]
  collageUrl  String?
  createdAt   DateTime @default(now())
}

model Panel {
  id         String  @id @default(uuid())
  projectId  String
  order      Int
  scene      String
  caption    String
  imageUrl   String?
  sketchUrl  String?
}

model Job {
  id          String  @id @default(uuid())
  projectId   String  @unique
  bullmqJobId String  @unique
  status      String  @default("queued")
  progress    Float   @default(0.0)
}
```

## 🐛 Troubleshooting

### Worker not processing jobs

- Check Redis connection is working
- Verify environment variables are set
- Check worker logs: `npm run worker`

### Images not displaying

- Verify Supabase Storage bucket is public
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure storage policies allow public access

### API errors

- Check all API keys are valid
- Verify database connection
- Check Vercel function logs

## 📝 API Endpoints

### POST `/api/generate`

Create a new dream generation job.

**Request:**
```json
{
  "inputText": "I was in an ancient library...",
  "style": "surreal",
  "symbols": ["stairs", "mirror"],
  "mood": "lonely",
  "visibility": "private"
}
```

**Response:**
```json
{
  "projectId": "uuid",
  "jobId": "uuid"
}
```

### GET `/api/status?jobId=<uuid>`

Get job progress.

**Response:**
```json
{
  "status": "running",
  "progress": 0.35,
  "projectId": "uuid",
  "error": null
}
```

### GET `/api/project?projectId=<uuid>`

Get project details with generated images.

**Response:**
```json
{
  "projectId": "uuid",
  "inputText": "...",
  "style": "surreal",
  "panels": [
    {
      "position": 1,
      "caption": "...",
      "imageUrl": "https://...",
      "sketchUrl": null
    }
  ],
  "status": "success",
  "progress": 1.0
}
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) - LLM API
- [Replicate](https://replicate.com/) - Image generation
- [Supabase](https://supabase.com/) - Database & Storage
- [Upstash](https://upstash.com/) - Redis
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## 💡 Next Steps / Roadmap

- [ ] Add collage generation (combine 3 panels into one image)
- [ ] Add video export (Ken Burns effect)
- [ ] Implement rate limiting
- [ ] Add user authentication
- [ ] Public gallery feature
- [ ] More art styles
- [ ] Batch generation
