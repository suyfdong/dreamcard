# 🎨 DreamCard - AI 梦境卡片生成器

用 AI 将你的梦境变成精美的三格卡片。

## 🏗 架构

```
Vercel (前端 + API)
  ├── 接收请求
  ├── 入队到 Upstash Redis
  └── 返回状态

Upstash Redis
  └── BullMQ 队列

Railway Worker ⭐
  ├── 监听队列
  ├── OpenRouter LLM 解析
  ├── Replicate 生成 3 张图
  └── 存储到 Supabase
```

**核心原则：Vercel 只做轻量级操作，所有 AI 重活在 Railway Worker**

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo>
cd dreamcard
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

查看 **[SETUP.md](./SETUP.md)** 获取详细的 API Keys 配置指南。

简要步骤：
```bash
cp .env.example .env
# 编辑 .env，填入 8 个环境变量
```

需要的服务：
- ✅ Supabase（数据库 + 存储）
- ✅ Upstash Redis（队列）
- ✅ OpenRouter（LLM）
- ✅ Replicate（图片生成）

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 5. 创建 Storage Bucket

在 Supabase Dashboard → Storage → 创建 `dreamcard-images` (Public)

### 6. 本地运行

**终端 1（Vercel 部分）：**
```bash
npm run dev
```

**终端 2（Railway Worker 部分）：**
```bash
npm run worker
```

访问 http://localhost:3000

## ☁️ 部署

### Vercel（前端 + API）

```bash
# 1. 推送到 GitHub
git push

# 2. 在 Vercel 导入项目
# 3. 添加所有环境变量
# 4. 部署
```

### Railway（Worker）

```bash
# 1. 访问 railway.app
# 2. 从 GitHub 导入
# 3. Start Command: npm run worker
# 4. 添加所有环境变量
# 5. 部署
```

详细步骤见 **[SETUP.md](./SETUP.md)**

## 📁 核心文件

| 文件 | 说明 |
|------|------|
| `app/api/generate/route.ts` | API：创建任务入队 |
| `app/api/status/route.ts` | API：查询进度 |
| `app/api/project/route.ts` | API：获取结果 |
| `worker/index.ts` | ⭐ Worker：处理所有 AI 生成 |
| `lib/redis.ts` | BullMQ 队列配置 |
| `lib/storage.ts` | Supabase 存储 |
| `prisma/schema.prisma` | 数据库结构 |

## 🎯 API 流程

```
1. 用户提交 → POST /api/generate
2. Vercel 创建任务 → 入队 Redis
3. Railway Worker 监听队列
4. Worker 调用 OpenRouter 解析
5. Worker 调用 Replicate 生成 3 图
6. Worker 上传到 Supabase
7. 前端轮询 GET /api/status
8. 完成后 GET /api/project 获取结果
```

## 💰 成本

- Vercel: 免费
- Railway: $5/月（免费额度）
- Supabase: 免费（有限额）
- Upstash: 免费（10K/天）
- **按使用付费：**
  - OpenRouter: ~$0.02/次
  - Replicate: ~$0.01/次（3 张图）
  - **总计：~$0.03-0.05/次生成**

## 📚 文档

- **[SETUP.md](./SETUP.md)** - 详细的设置和部署指南
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 项目完整总结

## 🛠 技术栈

- **前端**: Next.js 13 + React + TypeScript + Tailwind
- **后端**: Next.js API Routes + Prisma + BullMQ
- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage
- **队列**: Upstash Redis + BullMQ
- **AI**: OpenRouter (Llama 3.3) + Replicate (FLUX Schnell)

## ⚡ 开发命令

```bash
npm run dev          # 启动 Next.js（终端1）
npm run worker       # 启动 Worker（终端2）
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送数据库结构
npm run db:studio    # 打开数据库管理界面
npm run check-env    # 检查环境变量
```

## ❓ 常见问题

**Q: Worker 不工作？**
A: 检查 Railway 日志，确保 Worker 在运行且能连接 Redis。

**Q: 图片不显示？**
A: 确保 Supabase 的 `dreamcard-images` bucket 已创建且为 Public。

**Q: 生成很慢？**
A: 正常，LLM + 3张图大约需要 30-60 秒。

## 📝 License

MIT

---

**准备好开始了吗？查看 [SETUP.md](./SETUP.md) 获取详细步骤！** 🚀
