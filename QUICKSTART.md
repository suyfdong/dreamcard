# 🚀 快速开始指南

这是一份快速上手指南，帮助你在 5 分钟内运行 DreamCard。

## ⚡ 5 分钟快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`:

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Keys：

```env
OPENROUTER_API_KEY=你的_openrouter_key
REPLICATE_API_TOKEN=你的_replicate_token
SUPABASE_URL=你的_supabase_url
SUPABASE_ANON_KEY=你的_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_supabase_service_role_key
UPSTASH_REDIS_REST_URL=你的_redis_url
UPSTASH_REDIS_REST_TOKEN=你的_redis_token
DATABASE_URL=你的_数据库_url
```

### 3. 设置数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push
```

### 4. 创建 Supabase Storage Bucket

1. 登录 Supabase Dashboard
2. 进入 Storage 页面
3. 创建新 bucket: `dreamcard-images`
4. 设置为 Public

### 5. 启动开发服务器

**终端 1** - 启动 Next.js 开发服务器:

```bash
npm run dev
```

**终端 2** - 启动 Worker 进程:

```bash
npm run worker
```

### 6. 打开浏览器

访问 [http://localhost:3000](http://localhost:3000)

开始创建你的梦境卡片！ 🎨

## 📝 测试示例

试试输入这个梦境：

```
I was in an ancient library with towering bookshelves reaching the clouds.
Spiral staircases twisted upward. Outside the window, mist covered the ocean,
and a black cat sat on the windowsill watching me.
```

- 选择风格: **Surreal**
- 添加象征物: **Stairs, Ocean, Cat**
- 情绪: **Lonely**

点击 "Generate Dream Card"，等待约 30-60 秒，你就能看到生成的三格梦境卡片了！

## 🔑 快速获取 API Keys

### OpenRouter
1. 访问 https://openrouter.ai/
2. 注册 → Settings → Keys → Create new key
3. 充值至少 $5

### Replicate
1. 访问 https://replicate.com/
2. Sign up → Settings → API tokens → Create token
3. 添加支付方式

### Supabase
1. 访问 https://supabase.com/
2. 创建新项目 → Settings → API
3. 复制 URL, anon key, service_role key
4. Settings → Database → Connection string (复制 DATABASE_URL)

### Upstash Redis
1. 访问 https://upstash.com/
2. 创建 Redis database
3. 复制 REST URL 和 REST TOKEN

## ❓ 遇到问题？

### Worker 连接不上 Redis

检查 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 是否正确。

### 图片上传失败

确保：
1. Supabase Storage bucket `dreamcard-images` 已创建
2. Bucket 设置为 Public
3. `SUPABASE_SERVICE_ROLE_KEY` 已设置

### LLM 调用失败

- 检查 OpenRouter 账户余额
- 确认 `OPENROUTER_API_KEY` 正确

### 依赖安装失败

如果遇到 sharp 安装问题：

```bash
npm install --platform=darwin --arch=x64 sharp
```

或者使用 pnpm/yarn：

```bash
pnpm install
# 或
yarn install
```

## 📚 下一步

- 阅读 [README.md](./README.md) 了解完整功能
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 学习如何部署
- 修改 `lib/constants.ts` 自定义风格

## 💡 提示

- 首次生成可能需要 30-60 秒（包括 LLM 解析 + 3张图片生成）
- Worker 必须保持运行，否则任务无法处理
- 开发时，两个终端都要打开（Next.js + Worker）

祝你玩得开心！ 🎉
