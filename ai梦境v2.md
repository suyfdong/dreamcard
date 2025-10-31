下面是一份可直接用于落地开发的《DreamCard（梦境/奇思三格卡片）产品与技术实施指南》。它把我们讨论过的**产品目标、MVP范围、页面与交互、技术栈与脚手架、API契约、生成流程、并发与队列、60秒等待期体验设计、防薅羊毛机制、上线与监控、变现与路线图**全部系统化，供你与合作者在 Bolt/Cursor/Claude Code 中按图施工。

---

# 0. 产品一句话 & 目标

**一句话**：把用户的一句话“梦境/奇思”，在 30–60 秒内生成**可分享的三格视觉卡片**（图+简短文案），适配 9:16/1:1，支持社媒分享与（可选）轻动效。

**核心目标**

* **大众可用**：无需注册也能试用（游客模式），体验顺滑。
* **两阶段出图**：10–15 秒先给“草图三格”，后台再产正式风格与拼版。
* **稳/省/扩**：先用 **Next.js + Redis（BullMQ）** 做队列与并发；跑稳后可迁 **Cloudflare Workers + Queues**。

---

# 1. MVP 范围（最小但可用）

**用户流程**

1. 首页输入一句梦境/奇思 → 选择 1 个风格（4 选 1） → 可选象征物（多选 Chip）→ 点击生成
2. **10–15 秒**出现**草图三格**与每格一句短文（可编辑）
3. **30–60 秒**出现**正式风格**与**拼版卡片**（9:16/1:1 PNG）
4. 导出图片、分享到 Twitter/Reddit/Threads/Pinterest
5. 游客每日 3 次免费；可选邮箱 Magic Link 登录获得当日额外额度（不强制）

**功能清单（MVP必须）**

* 4 套风格包（极简手绘 / 胶片颗粒 / 赛博迷雾 / 童话粉彩）
* 两阶段生成：草图 → 正式风格（失败回退草图）
* 拼版导出（PNG，9:16/1:1）
* 进度条与 ETA，排队可视化
* 游客配额 + 轻量“无感”风控
* 公开/私密开关（默认私密）
* 基础埋点：成功率、生成时长、分享率、失败原因

**延后到 v1.5**

* 轻动效（Ken Burns 10–15s MP4）
* 公开墙/周话题榜单
* 订阅与风格包商店

---

# 2. 页面与交互（桌面网页为主，移动响应式）

**首页（/）**

* 输入框（placeholder：*“Describe your dream in one sentence…”*）
* 风格选择（4 张卡片）
* 可选象征物 Chips（Stairs/Mirror/Ocean/Cat/Door/Train/Maze…）
* 情绪 2–3 选（Calm/Lonely/Surreal）
* 生成按钮（显示“预计 ~45s”，拥塞时改“Quick Sketch Mode (~10s)”）
* 示例墙（6 个官方示例）

**结果页（/result/[id]）**

* 三格预览（草图 → 正式图自动替换）
* 每格一句文案可编辑（8–16 字）
* 导出：PNG（9:16/1:1）
* 分享：Twitter/Reddit/Threads/Pinterest（带 #DreamCard #DreamLog）
* 隐私开关（默认 private；打开为 public）
* 再来一张（沿用上次参数或切换风格，开新任务）

**等待期体验（60 秒不无聊）**

* 进度条四段：Parsing（10%）→ Sketching（35%）→ Rendering（80%）→ Collaging（100%）
* 显示 ETA（动态区间：如“~35–50s”）
* 可做的事：编辑文案 / 切风格开新版本 / 保存草图 / 浏览示例墙
* 拥塞时文案：*“High traffic, switching to Quick Sketch Mode (~10s). Full render resumes soon.”*

---

# 3. 技术架构与脚手架（先 Next.js + Redis，后可迁 Cloudflare）

**推荐当前栈**

* **Web框架**：Next.js（App Router）+ TypeScript + Tailwind + shadcn/ui
* **表单/校验/数据**：react-hook-form + zod + TanStack Query（轮询或 SSE）
* **后端路由**：Next.js Route Handlers（/app/api/*）
* **数据库**：Supabase Postgres + Prisma ORM
* **对象存储**：Supabase Storage（存 panel 与拼版图）
* **队列**：BullMQ + Redis（Upstash Redis 或自建 Redis）
* **生成层**

  * LLM 解析：OpenAI *o4-mini* / *gpt-4o-mini*（或 Anthropic Claude 3.5）
  * 文生图：Replicate → **FLUX.1-schnell**（快）→ 回退 **SDXL**（稳）
  * 拼版：Sharp / @napi-rs/canvas（Node 端）
* **部署**：Vercel（Web与API）+ Render/Railway/VPS（Worker）+ Upstash（Redis）
* **监控/埋点**：PostHog 或 Tinybird（任选）

**可迁路线（未来）**

* 队列与 Worker 迁至 **Cloudflare Queues + Workers**（无服务器、自动扩展）
* 图片存 **R2**（或保留 Supabase Storage）
* 入口仍用 Next.js（Vercel），前端逻辑不变

**目录建议（概念级）**

```
/app
  /page.tsx               # 首页
  /result/[id]/page.tsx   # 结果页
  /api/generate           # POST: 创建任务 + 入队
  /api/status             # GET : 查询进度
  /api/project            # GET : 作品详情
/lib
  env.ts      # 环境变量校验
  db.ts       # Prisma + Supabase
  storage.ts  # Supabase Storage helper
  constants.ts# 风格/限制/阈值
  ratelimit.ts# 速率限制（边缘中间件）
/worker
  pipeline.md # 解析→草图→正式→拼版→上传→回写（步骤说明）
```

---

# 4. API 契约（前后端 & 队列）

**1) POST `/api/generate`**（创建任务并入队）

* **Request**

  ```json
  {
    "inputText": "I was lost in an endless stairwell.",
    "style": "film",                 // minimal | film | cyber | pastel
    "symbols": ["stairs","mirror"],  // optional
    "mood": "lonely",                // optional
    "visibility": "private"          // private | public
  }
  ```
* **Response**

  ```json
  { "projectId": "uuid", "jobId": "uuid" }
  ```
* **动作**：写 DB(Project status=pending)，入队（BullMQ）一个 job

**2) GET `/api/status?jobId=<uuid>`**（轮询或 SSE 推送）

* **Response**

  ```json
  {
    "status": "running",    // queued | running | success | failed
    "progress": 0.35,       // 0~1
    "projectId": "uuid",
    "error": null
  }
  ```

**3) GET `/api/project?projectId=<uuid>`**（结果页读取）

* **Response**

  ```json
  {
    "projectId": "uuid",
    "inputText": "...",
    "style": "film",
    "panels": [
      {"caption":"...", "imageUrl":"...", "sketchUrl":"..."},
      {"caption":"...", "imageUrl":"...", "sketchUrl":"..."},
      {"caption":"...", "imageUrl":"...", "sketchUrl":"..."}
    ],
    "collageUrl": "https://.../collage_9x16.png",
    "videoUrl": null,
    "shareSlug": "abc123",
    "visibility": "private"
  }
  ```

**进度节拍（建议）**

* 0.10：LLM 解析完成（三幕与象征）
* 0.35：草图三格完成（全部 `sketchUrl` 可回显）
* 0.80：正式风格三格完成
* 1.00：拼版与上传完成

---

# 5. 生成流程（两阶段、可回退）

**Step 1：LLM 解析（稳定与一致性）**

* 输入句子 → 抽取：主题/情绪/场景/象征物（过滤用户多选）
* 产出“三幕结构”数组（3项），每项含：`scene`（1–2 主体 + ≤2 象征）与 `caption`（8–16字）

**Step 2：模板引擎（把构图固化）**

* 每个风格定义固定“构图/景别/机位/色调/负向词”，减少偏轨
* 合成 3 个 panel 的 prompt（同一风格的子提示差异化但受约束）

**Step 3：草图先行（10–15s）**

* 用 SDXL/低负担提示生成“素描/漫画风”三格（最稳）
* 立刻回写到项目，前端马上显示 **sketch 预览**

**Step 4：正式风格（30–60s 内）**

* 优先 FLUX.1-schnell（快、现代风），失败回退 SDXL
* 对单格失败 → 用对应的草图顶上（保证三格齐）

**Step 5：拼版与导出**

* 把三格竖图拼为 9:16（或 1:1）PNG；叠日期/话题（可选）
* v1.5：Ken Burns 轻动效合成 10–15s MP4

**Step 6：上传与回写**

* 上传至 Supabase Storage → 回写 `panels[].imageUrl`、`collageUrl`、`status=success`
* 失败：`status=failed` + `errorMsg`；前端仍保留草图版可导出

---

# 6. 防薅羊毛与安全（“游客优先，低摩擦”）

**目标**：正常用户几乎**无感**；只有可疑/拥塞时，才轻量加验证或降级
**三道防线**（先启用前两道，足够MVP）

1. **入口限流与鉴权（门外）**

   * **Cloudflare Turnstile（无感模式）**：高风险时才弹一次轻验证
   * **速率限制**：每 IP 5 req/10s；每用户 20 req/10m（Edge Middleware）
   * **游客配额**：3 次/天（cookie/localStorage + IP兜底）
   * CORS 仅主域；所有生成只接受 POST；请求签名（HMAC+nonce）可选

2. **配额与队列（门内）**

   * 入队前检查**逻辑配额**：未登录剩余<1 → 提示“登录送+7次”
   * **全局最大排队数** Qmax（如 500）：溢出 → “拥塞模式”（仅草图/仅订阅用户入队）
   * **单用户最大排队** Umax（如 3）：溢出 → 提示稍后
   * Worker 并发 2–3；外部接口走“**模型网关**”统一限流与重试（429/5xx 指数退避）

3. **供应商与账单（兜底）**

   * OpenAI/Anthropic/Replicate 设置 **Monthly Hard Limit**
   * 60%/80% 用量阈值告警；80% 自动启用“草图-only”
   * Dev/Prod Key 分离；高风险流量可切备用 Key 池

**拥塞/异常时的文案策略**

* 按钮变“Queued • ~45s remaining”
* 高峰：提示“Quick Sketch Mode (~10s)”并自动切草图-only
* 免费用尽：提示“Get +7 today • 1-click email”（Magic Link，无密码）

---

# 7. 指标、埋点与监控

**核心指标**

* 生成成功率（含回退）≥ 90%
* 平均时长：首图（草图）≤ 15s；整单 ≤ 60s
* 分享率 ≥ 20%
* 留存：D1 ≥ 25%，D7 ≥ 12%
* 成本：单次图+拼版 ≤ $0.05（按模型与尺寸可调）

**埋点建议**

* `generate_clicked`（参数：风格、是否游客）
* `sketch_ready`（秒）
* `final_ready`（秒）
* `export_clicked`（格式/尺寸）
* `share_clicked`（平台）
* `queue_wait_time`、`job_fail_reason`

**监控与告警**

* 队列长度、Worker 拒绝率、429/5xx 比例
* 供应商用量阈值 60%/80% 告警
* 将“拥塞模式/熔断开关”做成后台按钮（即刻生效）

---

# 8. 变现策略（从轻到重）

**阶段 1（MVP）**

* 免费：游客 3 次/天，带小水印，768×1024；
* 登录（Magic Link）：当日 +7 次，去水印（或降低强度）；

**阶段 2（订阅）**

* 月付 5–9 美金：去水印、高清导出、动效导出、更多风格包、批量生成、私密图库
* 年付折扣

**阶段 3（生态与合作）**

* **风格包商店**：设计师上架分成（70/30）
* **品牌/话题赞助**：周挑战冠名
* **教育/工作坊**：面向创意写作/心理叙事课程的席位授权

---

# 9. 风格包 v1（关键词基线）

1. **Minimal 极简手绘**：white/neutral、line art、few strokes、no clutter、clean shapes
2. **Film 胶片颗粒**：film grain、vignette、cool/warm tones、symmetry/thirds、dust particles
3. **Cyber 赛博迷雾**：neon haze、purple-cyan、wet floor reflection、thin fog、glossy
4. **Pastel 童话粉彩**：soft pastel、gentle light、grain、low saturation、soft edges

**构图槽位（模板统一）**

* Composition：thirds / center / diagonal / symmetry
* Distance：wide / medium / close
* Angle：eye-level / low-angle / slight tilt
* Negative：no text overlay / no watermark / no crowd / no logos

---

# 10. 上线清单（按顺序执行）

1. Bolt 画出首页/结果页线框并导入 Next.js
2. 建 API：`/api/generate`（入队）、`/api/status`（进度）、`/api/project`（结果）
3. BullMQ + Redis 起一个 `imageGen` 队列与 1–2 个 Worker
4. 两阶段流水线：LLM 解析 → 草图（先回写）→ 正式风格 → 拼版上传 → 回写
5. 游客配额（3 次/天）与无感 Turnstile；边缘速率限制
6. 进度条与 ETA；排队上屏；拥塞模式按钮
7. 埋点/监控与账单硬上限；异常告警
8. 首批示例（5–6 个“示范主题”）上线做冷启动

---

# 11. 未来三个月路线图

**v1（2–3 周）**：MVP 上线（两阶段出图、PNG导出、游客配额、防护最小集）
**v1.5（1–2 月）**：Ken Burns 轻动效导出、公开墙、周话题、订阅实验
**v2（2–3 月）**：风格包商店、批量生成、愿景模式（Vision Board）、Cloudflare 迁移试点

---

# 12. 名词与选择题（你随时会遇到）

* **Next.js + Redis（BullMQ） vs Cloudflare（Workers + Queues）**

  * 先 Next.js+Redis，上手快、调试直观；量起来再迁 Cloudflare，免运维、可弹性扩展。
* **LLM 选谁？**

  * 先 OpenAI *o4-mini* / *gpt-4o-mini*（性价比）；文案风格要求更高再试 Claude 3.5。
* **文生图选谁？**

  * 先 Replicate **FLUX.1-schnell**（快）；失败回退 **SDXL**（稳）。
* **登录要不要？**

  * MVP 不强制。价值先于门槛：用户想要“去水印/多配额/保存/公开”时，才引导 Magic Link。
* **如何控制成本？**

  * 统一分辨率（768×1024），3 图封顶；缓存相同输入 24h；供应商 **Hard Cap**；拥塞时**草图-only**。

---

