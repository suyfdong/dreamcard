# 🔑 环境变量填写清单

把这个文件当作工作表，一步步填写你的 API Keys。

**⚠️ 注意：填写完成后，删除此文件或将其添加到 .gitignore！**

---

## ✅ 清单

### 1. Supabase（4 个变量）

登录：https://supabase.com/dashboard

**步骤：**
1. 选择你的项目
2. 点击左侧 **Settings** → **API**

```
✅ SUPABASE_URL
   在哪找：Project URL
   示例：https://xxxxx.supabase.co
   你的：____________________________________

✅ SUPABASE_ANON_KEY
   在哪找：Project API keys → anon public
   示例：eyJhbGc...
   你的：____________________________________

✅ SUPABASE_SERVICE_ROLE_KEY
   在哪找：Project API keys → service_role
   示例：eyJhbGc...
   你的：____________________________________
```

3. 点击左侧 **Settings** → **Database**
4. 找到 **Connection string** → 点击 **Nodejs** 标签

```
✅ DATABASE_URL
   在哪找：Connection string (Nodejs)
   ⚠️ 记得替换 [YOUR-PASSWORD] 为你的数据库密码
   示例：postgresql://postgres:你的密码@xxxxx.pooler.supabase.com:5432/postgres
   你的：____________________________________
```

---

### 2. Upstash Redis（2 个变量）

登录：https://console.upstash.com/

**步骤：**
1. 选择你的 Redis 数据库
2. 在详情页面复制：

```
✅ UPSTASH_REDIS_REST_URL
   在哪找：REST URL
   示例：https://xxxxx.upstash.io
   你的：____________________________________

✅ UPSTASH_REDIS_REST_TOKEN
   在哪找：REST Token
   示例：AXXXxxx...
   你的：____________________________________
```

---

### 3. OpenRouter（1 个变量）

登录：https://openrouter.ai/

**步骤：**
1. 点击右上角头像 → **Keys**
2. 点击 **Create Key**
3. 复制 API Key

```
✅ OPENROUTER_API_KEY
   在哪找：Keys 页面
   示例：sk-or-v1-xxxxx
   你的：____________________________________
```

**⚠️ 重要：** 确保账户有余额！
- 点击右上角头像 → **Credits**
- 建议充值 $10

---

### 4. Replicate（1 个变量）

登录：https://replicate.com/

**步骤：**
1. 点击右上角头像 → **API tokens**
2. 复制你的 token

```
✅ REPLICATE_API_TOKEN
   在哪找：API tokens 页面
   示例：r8_xxxxx
   你的：____________________________________
```

**⚠️ 重要：** 确保已添加支付方式！
- 点击右上角头像 → **Billing**
- 添加信用卡

---

## 📝 填写到 .env 文件

现在把上面的内容复制到 `.env` 文件：

```bash
# 1. 复制模板
cp .env.example .env

# 2. 编辑 .env
nano .env
# 或用任何文本编辑器打开
```

在 `.env` 文件中填入：

```env
# OpenRouter
OPENROUTER_API_KEY=你上面填的_openrouter_key

# Replicate
REPLICATE_API_TOKEN=你上面填的_replicate_token

# Supabase
SUPABASE_URL=你上面填的_supabase_url
SUPABASE_ANON_KEY=你上面填的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你上面填的_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=你上面填的_redis_url
UPSTASH_REDIS_REST_TOKEN=你上面填的_redis_token

# Database
DATABASE_URL=你上面填的_database_url
```

---

## ✅ 验证

填写完成后，运行：

```bash
npm run check-env
```

如果看到所有 ✅，说明环境变量都配置好了！

---

## 🔒 安全提醒

1. **永远不要** 把 `.env` 文件提交到 Git
2. **永远不要** 在公开场合分享这些 Keys
3. 定期轮换 API Keys
4. 使用 `.gitignore` 确保 `.env` 不被追踪

---

## 📋 快速检查清单

- [ ] 8 个环境变量都已填写
- [ ] DATABASE_URL 中的密码已替换
- [ ] OpenRouter 账户有余额
- [ ] Replicate 已添加支付方式
- [ ] 运行 `npm run check-env` 通过
- [ ] Supabase Storage bucket `dreamcard-images` 已创建
- [ ] `.env` 文件在 `.gitignore` 中

全部完成？恭喜！你可以开始运行了！ 🎉

```bash
# 终端 1
npm run dev

# 终端 2
npm run worker
```
