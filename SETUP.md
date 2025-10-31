# DreamCard 设置指南

## 📋 你需要的所有 API Keys

### 1. Supabase（4 个变量）

登录 [Supabase Dashboard](https://supabase.com/dashboard)，选择你的项目：

**获取 URL 和 Keys：**
- 点击左侧 **Settings** → **API**
- 复制以下内容：
  ```
  Project URL → SUPABASE_URL
  Project API keys:
    - anon public → SUPABASE_ANON_KEY
    - service_role → SUPABASE_SERVICE_ROLE_KEY (保密！)
  ```

**获取数据库连接字符串：**
- 点击左侧 **Settings** → **Database**
- 找到 **Connection string** 部分
- 点击 **Nodejs** 标签
- 复制连接字符串 → `DATABASE_URL`
- 记得将 `[YOUR-PASSWORD]` 替换成你创建项目时设置的密码

示例：
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:5432/postgres
```

### 2. Upstash Redis（2 个变量）

登录 [Upstash Console](https://console.upstash.com/)：

- 选择你的 Redis 数据库
- 在详情页面找到：
  ```
  UPSTASH_REDIS_REST_URL → 复制 REST URL
  UPSTASH_REDIS_REST_TOKEN → 复制 REST Token
  ```

示例：
```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx...
```

### 3. OpenRouter（1 个变量）

登录 [OpenRouter](https://openrouter.ai/)：

- 点击右上角头像 → **Keys**
- 点击 **Create Key**
- 复制 API Key → `OPENROUTER_API_KEY`

示例：
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

**重要：** 确保账户有余额（建议充值 $10）

### 4. Replicate（1 个变量）

登录 [Replicate](https://replicate.com/)：

- 点击右上角头像 → **API tokens**
- 复制你的 token → `REPLICATE_API_TOKEN`

示例：
```env
REPLICATE_API_TOKEN=r8_xxxxx
```

**重要：** 确保已添加支付方式

---

## 🚀 本地运行步骤

### 步骤 1：配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入上面获取的所有 API Keys。

### 步骤 2：安装依赖

```bash
npm install
```

### 步骤 3：设置数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构
npm run db:push
```

### 步骤 4：创建 Supabase Storage Bucket

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧 **Storage**
4. 点击 **New bucket**
5. 输入名称：`dreamcard-images`
6. 勾选 **Public bucket**
7. 点击 **Create bucket**

### 步骤 5：启动开发服务器

**你需要打开 2 个终端窗口：**

**终端 1 - 前端和 API（Vercel 部分）：**
```bash
npm run dev
```

**终端 2 - Worker（Railway 部分）：**
```bash
npm run worker
```

### 步骤 6：测试

打开浏览器访问：http://localhost:3000

输入一个梦境描述，点击生成，等待 30-60 秒看到结果！

---

## ☁️ 部署到生产环境

### A. 部署前端到 Vercel（轻量级：仅入队和查询）

#### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

#### 2. 在 Vercel 部署

1. 访问 [Vercel](https://vercel.com/)
2. 点击 **New Project**
3. 选择你的 GitHub 仓库
4. 点击 **Import**

#### 3. 添加环境变量

在 Vercel 项目设置中，进入 **Settings** → **Environment Variables**

添加以下所有变量（复制你 `.env` 文件的内容）：

```
OPENROUTER_API_KEY
REPLICATE_API_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
DATABASE_URL
```

#### 4. 部署

点击 **Deploy**，等待构建完成。

---

### B. 部署 Worker 到 Railway（重活：LLM + 图片生成）

#### 1. 访问 Railway

打开 [Railway](https://railway.app/)，用 GitHub 登录。

#### 2. 创建新项目

1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择你的 DreamCard 仓库

#### 3. 配置 Worker

1. 点击你的服务
2. 进入 **Settings**
3. 找到 **Start Command**，设置为：
   ```
   npm run worker
   ```

#### 4. 添加环境变量

在 **Variables** 标签页，添加所有环境变量（与 Vercel 相同）：

```
OPENROUTER_API_KEY=你的key
REPLICATE_API_TOKEN=你的token
SUPABASE_URL=你的URL
SUPABASE_ANON_KEY=你的key
SUPABASE_SERVICE_ROLE_KEY=你的key
UPSTASH_REDIS_REST_URL=你的URL
UPSTASH_REDIS_REST_TOKEN=你的token
DATABASE_URL=你的数据库URL
```

#### 5. 部署

Railway 会自动部署。等待部署完成，查看日志应该看到：

```
Worker started and listening for jobs...
```

---

## ✅ 验证部署

1. 访问你的 Vercel URL（例如 `https://your-app.vercel.app`）
2. 输入一个梦境描述
3. 点击生成
4. 等待 30-60 秒
5. 应该能看到生成的 3 张图片！

如果失败：
- 检查 Railway 的日志（Worker 是否在运行）
- 检查 Vercel 的 Functions 日志（API 是否正常）
- 确认所有环境变量都已设置

---

## 🎯 架构说明

```
用户浏览器
    ↓
Vercel (轻量级)
├── POST /api/generate → 创建任务，入队到 Upstash Redis
├── GET /api/status → 查询任务状态
└── GET /api/project → 获取结果

Upstash Redis
└── BullMQ 队列 (任务存储)

Railway Worker (重活)
├── 监听队列
├── 调用 OpenRouter (LLM 解析)
├── 调用 Replicate (生成 3 张图)
└── 上传到 Supabase Storage
```

---

## 💰 预估成本

- **Vercel**: 免费（Hobby 计划）
- **Railway**: $5/月（免费额度）
- **Supabase**: 免费（有额度限制）
- **Upstash Redis**: 免费（10K 命令/天）
- **OpenRouter**: ~$0.01-0.05/次
- **Replicate**: ~$0.003/图 × 3 = ~$0.01/次

**单次生成总成本：约 $0.02-0.06**

---

## ❓ 常见问题

### Q: Worker 不处理任务
**A:** 检查 Railway 日志，确保 Worker 在运行，并且能连接到 Redis。

### Q: 图片不显示
**A:** 确保 Supabase Storage bucket `dreamcard-images` 已创建且为 Public。

### Q: LLM 调用失败
**A:** 检查 OpenRouter 账户余额。

### Q: Replicate 超时
**A:** 正常，FLUX 生成需要 10-15 秒/图，总共 30-45 秒。

---

## 🎉 完成！

现在你的 DreamCard 应用已经完全运行了！

- Vercel 处理前端和轻量级 API
- Railway Worker 处理所有 AI 生成重活
- 成本低廉且可扩展

有问题随时问！
