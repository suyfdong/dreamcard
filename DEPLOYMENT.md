# DreamCard 部署指南

这是一份详细的部署指南，帮助你将 DreamCard 部署到生产环境。

## 🎯 部署架构

```
┌─────────────────┐
│   Vercel        │  ← 前端 + API Routes
│   (Next.js)     │
└────────┬────────┘
         │
         ├──────→ Supabase (数据库 + 存储)
         ├──────→ Upstash Redis (队列)
         ├──────→ OpenRouter (LLM)
         └──────→ Replicate (图片生成)

┌─────────────────┐
│  Railway/Render │  ← Worker 进程
│  (BullMQ Worker)│
└────────┬────────┘
         │
         ├──────→ Upstash Redis (队列)
         ├──────→ Supabase (数据库 + 存储)
         ├──────→ OpenRouter (LLM)
         └──────→ Replicate (图片生成)
```

## 📝 准备工作

### 1. 获取所需的 API Keys

#### Supabase
1. 访问 [supabase.com](https://supabase.com/)
2. 创建新项目
3. 获取：
   - `SUPABASE_URL`: 项目设置 → API → Project URL
   - `SUPABASE_ANON_KEY`: 项目设置 → API → anon public
   - `SUPABASE_SERVICE_ROLE_KEY`: 项目设置 → API → service_role (保密！)
   - `DATABASE_URL`: 项目设置 → Database → Connection string (Nodejs)

#### Upstash Redis
1. 访问 [upstash.com](https://upstash.com/)
2. 创建新 Redis 数据库
3. 选择区域（建议与 Vercel 同区域）
4. 获取：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

#### OpenRouter
1. 访问 [openrouter.ai](https://openrouter.ai/)
2. 注册并充值账户（推荐 $10 起步）
3. 创建 API Key
4. 获取 `OPENROUTER_API_KEY`

#### Replicate
1. 访问 [replicate.com](https://replicate.com/)
2. 注册并添加支付方式
3. 获取 API Token: 账户设置 → API tokens
4. 获取 `REPLICATE_API_TOKEN`

### 2. 设置 Supabase Storage

1. 在 Supabase 项目中，进入 **Storage**
2. 创建新 bucket: `dreamcard-images`
3. 设置为 **Public**
4. 或配置访问策略：

```sql
-- 允许公开读取
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'dreamcard-images' );

-- 允许服务角色写入
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dreamcard-images'
  AND auth.role() = 'service_role'
);
```

### 3. 设置数据库

在本地运行：

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push
```

## 🚀 部署步骤

### 步骤 1: 部署前端到 Vercel

#### 方法 1: 通过 GitHub (推荐)

1. 将代码推送到 GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. 在 Vercel 中导入项目:
   - 访问 [vercel.com](https://vercel.com/)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 框架预设会自动检测为 Next.js

3. 配置环境变量:

在 Vercel 项目设置 → Environment Variables 中添加：

```
OPENROUTER_API_KEY=sk-or-...
REPLICATE_API_TOKEN=r8_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...
DATABASE_URL=postgresql://postgres:...
```

4. 部署:
   - 点击 "Deploy"
   - 等待构建完成

#### 方法 2: 通过 Vercel CLI

```bash
npm i -g vercel
vercel login
vercel

# 按提示配置项目
# 然后在 Vercel Dashboard 添加环境变量
```

### 步骤 2: 部署 Worker 到 Railway

#### 创建 Worker 启动脚本

确保 `package.json` 有：

```json
{
  "scripts": {
    "worker": "tsx worker/index.ts"
  }
}
```

#### 部署到 Railway

1. 访问 [railway.app](https://railway.app/)
2. 创建新项目 → Deploy from GitHub repo
3. 选择你的仓库
4. 配置：
   - **Start Command**: `npm run worker`
   - **Environment Variables**: 添加所有环境变量（与 Vercel 相同）

5. 部署

### 步骤 3: 部署 Worker 到 Render (替代方案)

1. 访问 [render.com](https://render.com/)
2. 创建新 Web Service
3. 连接 GitHub 仓库
4. 配置：
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run worker`
   - **Environment Variables**: 添加所有 env vars

5. 创建服务

## ✅ 验证部署

### 1. 检查前端

访问你的 Vercel URL，应该能看到首页。

### 2. 检查 Worker

在 Railway/Render 的日志中，应该看到：

```
Worker started and listening for jobs...
```

### 3. 测试完整流程

1. 在前端输入一个梦境描述
2. 选择风格并点击生成
3. 应该看到进度条
4. 检查 Worker 日志，确认在处理任务
5. 等待图片生成完成

## 🔧 环境变量完整清单

```env
# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-xxx

# Replicate (图片生成)
REPLICATE_API_TOKEN=r8_xxx

# Supabase (数据库 + 存储)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhxxx

# Upstash Redis (队列)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXxxx

# Database
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres
```

## 🐛 常见问题

### Q: Worker 连不上 Redis

**A:** 检查 Redis URL 和 Token 是否正确，确保 Worker 和 Vercel 使用相同的 Redis 实例。

### Q: 图片上传失败

**A:**
- 检查 Supabase Storage bucket 是否创建
- 确认 `SUPABASE_SERVICE_ROLE_KEY` 已设置
- 检查存储策略是否允许上传

### Q: LLM 调用失败

**A:**
- 确认 OpenRouter 账户有余额
- 检查 API Key 是否正确
- 查看 OpenRouter 使用限制

### Q: Replicate 超时

**A:**
- FLUX Schnell 通常 10-15 秒，如果超时可能是 Replicate 拥堵
- 检查 Replicate 账户余额
- 考虑增加超时时间或重试机制

### Q: Worker 不处理任务

**A:**
- 检查 Worker 日志是否有错误
- 确认 Worker 和 API 连接到同一个 Redis
- 尝试重启 Worker 服务

## 📊 监控与日志

### Vercel 日志

在 Vercel Dashboard → 你的项目 → Logs 查看 API 请求日志。

### Worker 日志

在 Railway/Render Dashboard 查看 Worker 运行日志。

### 数据库监控

在 Supabase Dashboard → Database → Query Editor 运行：

```sql
-- 查看最近的项目
SELECT id, status, progress, created_at
FROM "Project"
ORDER BY created_at DESC
LIMIT 10;

-- 查看失败的任务
SELECT id, status, "errorMsg"
FROM "Project"
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Redis 监控

在 Upstash Dashboard 查看：
- 队列长度
- 处理速率
- 连接数

## 💰 成本估算

| 服务 | 免费额度 | 预计成本 |
|------|---------|---------|
| Vercel | Hobby 免费 | $0/月 (小流量) |
| Railway | $5 免费额度 | ~$5-10/月 |
| Supabase | 500MB 数据库 + 1GB 存储 | $0-25/月 |
| Upstash Redis | 10,000 命令/天 | $0-10/月 |
| OpenRouter | 按使用付费 | ~$0.01-0.05/次生成 |
| Replicate | 按使用付费 | ~$0.003-0.01/图片 |

**单次生成成本**: 约 $0.02-0.10 (LLM + 3张图片)

**月成本估算**:
- 100 次生成/天 = ~$60-300/月
- 1000 次生成/天 = ~$600-3000/月

## 🚀 性能优化

### 1. 缓存策略

为相同输入添加缓存：

```typescript
// 在 worker 中添加
const cacheKey = `dream:${hashInput(inputText + style)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

### 2. 并发控制

在 `worker/index.ts` 中调整：

```typescript
const worker = new Worker(
  'image-generation',
  processImageGeneration,
  {
    connection,
    concurrency: 3, // 增加并发数
    limiter: {
      max: 20, // 每分钟最多 20 个任务
      duration: 60000,
    },
  }
);
```

### 3. 图片压缩

使用 Sharp 压缩图片以节省存储和带宽：

```typescript
import sharp from 'sharp';

const compressed = await sharp(imageBuffer)
  .resize(768, 1024, { fit: 'cover' })
  .jpeg({ quality: 85 })
  .toBuffer();
```

## 🔐 安全建议

1. **永远不要** 将 `SUPABASE_SERVICE_ROLE_KEY` 暴露给前端
2. 为 API 路由添加速率限制
3. 实施输入验证和内容过滤
4. 定期轮换 API Keys
5. 监控异常使用模式

## 📈 扩展方案

当流量增长时：

1. **迁移到 Cloudflare Workers + Queues** (参考 ai梦境v2.md)
2. **使用 CDN** 缓存静态资源
3. **添加负载均衡** 为 Worker
4. **实施缓存层** (Redis Cache)
5. **数据库读写分离** (Supabase 自动支持)

## 🎉 部署完成！

恭喜！你的 DreamCard 应用已经成功部署。

现在可以：
- 分享你的 Vercel URL 给用户
- 监控使用情况和成本
- 收集反馈并持续改进

祝你的 DreamCard 项目成功！ 🚀
