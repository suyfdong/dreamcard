# 后端测试清单

## 问题：生成完全卡住

可能的原因：
1. ❌ Worker 没有运行
2. ❌ Worker 启动失败（环境变量缺失）
3. ❌ OpenRouter API Key 无效或余额不足
4. ❌ Replicate API Token 无效或未添加支付方式
5. ❌ Redis 连接失败
6. ❌ 数据库连接失败
7. ❌ LLM 生成失败（质量检查不通过）

---

## 立即检查（Railway Dashboard）

### 1. 打开 Railway Dashboard
访问：https://railway.app

### 2. 找到你的 Worker 服务
点击进入 Worker 服务

### 3. 查看部署状态
**Deployments 标签页**：
- ✅ 最新 commit 应该是：`9c168ac` 或 `411b2be` 或 `c70e0d5`
- ✅ 状态应该是：Success / Active
- ❌ 如果是 Failed，点击查看错误日志

### 4. 查看实时日志
**Logs 标签页**（最重要！）：

#### 正常启动日志应该显示：
```
Worker started and listening for jobs...
```

#### 如果你提交了一个梦境，应该看到：
```
Processing job abc123 for project xyz789
Step 1: Parsing dream with LLM...
```

#### 可能的错误日志：

**错误 1：环境变量缺失**
```
Error: OPENROUTER_API_KEY is not defined
或
Error: REPLICATE_API_TOKEN is not defined
```
→ 去 Settings → Variables 检查所有环境变量

**错误 2：OpenRouter 失败**
```
OpenRouter API error: 401 Unauthorized
```
→ API Key 无效，需要重新生成

**错误 3：Replicate 失败**
```
Error: Payment Required
```
→ 需要在 Replicate 添加信用卡

**错误 4：Redis 连接失败**
```
Error: Redis connection timeout
```
→ 检查 UPSTASH_REDIS_URL 格式

**错误 5：质量检查失败**
```
⚠️ Quality check failed (attempt 1/3): Abstraction level too low
🔄 Retrying with feedback to LLM...
```
→ 这是正常的，会自动重试 2 次

**错误 6：数据库连接失败**
```
Error: Can't reach database server
```
→ 检查 DATABASE_URL

---

## 快速修复方案

### 如果 Worker 根本没启动：

1. **检查环境变量**（Settings → Variables）：
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxx
   REPLICATE_API_TOKEN=r8_xxx
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   UPSTASH_REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   DATABASE_URL=postgresql://postgres:...
   ```

2. **手动重启**：
   - Settings → Restart

### 如果 OpenRouter 失败：

1. 访问：https://openrouter.ai/keys
2. 生成新的 API Key
3. 更新 Railway 环境变量
4. 重启 Worker

### 如果 Replicate 失败：

1. 访问：https://replicate.com/account/billing
2. 添加信用卡
3. 重启 Worker

### 如果 Redis 失败：

1. 检查 `UPSTASH_REDIS_URL` 格式：
   - ✅ 正确：`redis://default:xxx@xxx.upstash.io:6379`
   - ❌ 错误：`https://xxx.upstash.io`（这是 REST URL，不是 Redis URL）
2. 去 Upstash Dashboard 复制正确的 Redis URL

---

## 临时解决方案：降低质量要求

如果 Worker 一直失败在"Quality check"，可以临时降低标准：

编辑 `worker/index.ts` 第 37 行：
```typescript
// 从
if (structure.abstraction_level < 0.65) {
// 改为
if (structure.abstraction_level < 0.40) {
```

然后提交：
```bash
git add worker/index.ts
git commit -m "temp: 降低抽象度要求（临时）"
git push
```

**注意**：这会牺牲艺术感，但可以让系统先跑起来。

---

## 下一步

请在 Railway Dashboard 查看日志，然后告诉我：

1. **Worker 启动了吗？**（有 "Worker started" 日志吗？）
2. **有任何错误信息吗？**（复制最近 10 行日志）
3. **提交梦境后有处理日志吗？**（有 "Processing job" 吗？）

我会根据你的反馈进一步诊断！
