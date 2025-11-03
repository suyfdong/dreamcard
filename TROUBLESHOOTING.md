# 生成卡住问题排查指南

## 当前问题
用户提交梦境后，进度条卡在 0%，无法生成。

---

## 排查步骤

### 1. 检查 Railway Worker 部署状态

访问 Railway Dashboard：
1. 打开 https://railway.app
2. 找到你的 Worker 服务
3. 检查 **Deployments** 标签页
4. 确认最新的 commit (`411b2be` 或 `c70e0d5`) 已经部署

**症状**：如果 Worker 还在运行旧代码，会因为新 JSON Schema 不匹配导致失败。

---

### 2. 检查 Railway Worker 日志

在 Railway Dashboard 中：
1. 点击 Worker 服务
2. 查看 **Logs** 标签页
3. 查找以下关键信息：

**正常日志应该显示**：
```
Worker started and listening for jobs...
```

**如果有任务进来，应该看到**：
```
Processing job xxx for project yyy
Step 1: Parsing dream with LLM...
✅ Quality check passed!
Step 2: Generating images...
Generating image 1/3...
```

**如果出错，会看到**：
```
⚠️ Quality check failed (attempt 1/3): [错误原因]
🔄 Retrying with feedback to LLM...
```
或
```
Job xxx failed: [错误信息]
```

---

### 3. 检查环境变量

确认 Railway Worker 有以下环境变量：

```bash
OPENROUTER_API_KEY=sk-or-v1-xxx
REPLICATE_API_TOKEN=r8_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
UPSTASH_REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
DATABASE_URL=postgresql://postgres:...
```

**缺失任何一个都会导致失败。**

---

### 4. 检查 OpenRouter 额度

访问 https://openrouter.ai/activity

1. 确认 API Key 有效
2. 确认账户有余额（至少 $1）
3. 查看是否有请求失败记录

---

### 5. 检查 Replicate 额度

访问 https://replicate.com/account/billing

1. 确认已添加支付方式
2. 确认没有达到使用限制
3. 查看近期请求是否成功

---

### 6. 检查 Upstash Redis 连接

在 Railway Worker 日志中查找：

```
Error: Redis connection failed
```

如果出现，检查：
1. `UPSTASH_REDIS_URL` 格式是否正确（`redis://...`，NOT `https://...`）
2. Upstash Dashboard 中 Redis 实例是否正常运行

---

### 7. 检查数据库连接

在 Railway Worker 日志中查找：

```
Error: Can't reach database server
```

如果出现，检查：
1. `DATABASE_URL` 是否正确
2. Supabase 数据库是否在线
3. 是否有防火墙限制

---

## 常见错误及解决方案

### 错误 1: `Failed to parse LLM response as JSON`

**原因**：LLM 返回的不是有效 JSON

**解决方案**：
- 检查 OpenRouter API 是否正常
- 检查 Llama 3.3 70B 模型是否可用
- 查看完整的 LLM 响应内容（在日志中）

---

### 错误 2: `Quality check failed: Abstraction level too low`

**原因**：LLM 生成的内容太具象，不符合抽象标准

**解决方案**：
- 这是正常的，系统会自动重试（最多 2 次）
- 如果连续失败，会接受降级版本
- 查看日志确认是否最终通过或降级接受

---

### 错误 3: `OpenRouter API error: 401 Unauthorized`

**原因**：API Key 无效或过期

**解决方案**：
1. 访问 https://openrouter.ai/keys
2. 生成新的 API Key
3. 更新 Railway 环境变量 `OPENROUTER_API_KEY`
4. 重启 Worker

---

### 错误 4: `Replicate API error: Payment Required`

**原因**：Replicate 账户未添加支付方式

**解决方案**：
1. 访问 https://replicate.com/account/billing
2. 添加信用卡
3. 重试生成

---

### 错误 5: `Redis connection timeout`

**原因**：Worker 无法连接到 Upstash Redis

**解决方案**：
1. 检查 `UPSTASH_REDIS_URL` 格式（必须是 `redis://` 开头）
2. 确认 Upstash Redis 实例正常运行
3. 检查 Railway 网络设置

---

## 快速诊断命令

如果你能访问 Railway CLI：

```bash
# 查看 Worker 日志（最近 100 行）
railway logs --tail 100

# 重启 Worker
railway up --detach

# 检查环境变量
railway variables
```

---

## 临时解决方案

如果 Worker 完全无法工作，可以尝试：

### 1. 手动重启 Worker

在 Railway Dashboard：
1. 点击 Worker 服务
2. Settings → Restart

### 2. 回滚到上一个版本

在 Railway Dashboard：
1. Deployments 标签页
2. 找到上一个稳定版本
3. 点击 "Redeploy"

### 3. 降低抽象度要求（临时）

编辑 `worker/index.ts`，修改质检阈值：

```typescript
// 从
if (structure.abstraction_level < 0.65) {
// 改为
if (structure.abstraction_level < 0.50) {
```

这会让更多具象内容通过，但牺牲艺术感。

---

## 联系支持

如果以上都无法解决，请提供：
1. Railway Worker 完整日志（最近 100 行）
2. 你提交的梦境内容
3. 选择的风格
4. 错误截图（如果有）

我会帮你进一步诊断！
