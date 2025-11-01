# 🎨 创意拼图系统改进方案

**更新时间**: 2025-11-02
**目标**: 从"三张直译图"升级为"诗性三段式艺术卡片"

---

## 🎯 核心问题诊断

### ❌ 改进前的问题
1. **LLM 直译梦境** → 生成字面场景（"老虎在沙漠追我" = 老虎图 + 沙漠图 + 追逐图）
2. **缺乏艺术留白** → 三格都塞满主体，没有呼吸感
3. **无构图指导** → 随机生成，缺少统一视觉语言
4. **过于具象** → 正面展示人脸/动物，失去神秘感

### ✅ 改进目标
1. **间接表现** → 用痕迹、符号、残影替代直接主体
2. **三幕诗性结构** → 因（情绪）→ 境（空间）→ 势（动态）
3. **构图模板化** → 每种风格绑定固定景别/角度/留白规则
4. **强制留白** → 屏蔽人脸、全身照、正面对视

---

## 📐 核心改进：三幕结构 (因-境-势)

基于 GPT 建议，实施**因-境-势**三段式叙事：

| 面板 | 中文名 | 英文名 | 作用 | 技巧 |
|------|--------|--------|------|------|
| **Panel 1** | **因** | THE CAUSE | 建立核心冲突/情绪 | 用**痕迹/符号**替代主体（爪痕≠老虎） |
| **Panel 2** | **境** | THE REALM | 构建空间/时间/氛围 | 弱化主体（远景剪影/极小人物） |
| **Panel 3** | **势** | THE MOMENTUM | 呈现运动/张力/态势 | 运动模糊/碎片化/仅保留残影 |

### 实施位置
- **文件**: `worker/index.ts`
- **函数**: `parseDreamWithLLM()` 系统提示词
- **改进内容**:
  - 添加三幕结构详细说明
  - 强制"间接表现技巧"：痕迹、局部、运动残影、环境反应
  - 禁止字面翻译主体名词

---

## 🎨 改进1: 构图模板系统

### 为四种风格添加固定构图槽位

**文件**: `lib/constants.ts`

每种风格现在有 `compositionGuide` 字段：

#### Minimal（极简手绘）
```typescript
compositionGuide: {
  panel1: '近景特写, 2/3留白, 角落符号物, 高对比黑白',
  panel2: '广角空镜, 中心留白, 极简几何环境, 低地平线',
  panel3: '对角运动线, 动态角度, 高对比, 抽象流动'
}
```

#### Film（胶片颗粒）
```typescript
compositionGuide: {
  panel1: '偏心细节, 浅景深, 三分法, 背景虚化',
  panel2: '对称低角度风景, 晕影框架, 广角环境',
  panel3: '动态模糊, 对角构图, 镜头光晕, 高速拖影'
}
```

#### Cyber（赛博迷雾）
```typescript
compositionGuide: {
  panel1: '反射表面特写, 霓虹点缀, 湿地/镜面',
  panel2: '广角霓虹环境, 强透视线, 雾气, 低角度',
  panel3: '霓虹运动轨迹, 对角速度线, 反射, 光轨'
}
```

#### Pastel（童话粉彩）
```typescript
compositionGuide: {
  panel1: '柔焦细节, 居中构图, 温柔散景',
  panel2: '梦幻广角, 低饱和度, 薄雾氛围',
  panel3: '空灵运动, 柔边, 漂浮粒子, 温柔模糊'
}
```

---

## 🖼️ 改进2: SDXL 生成增强

### 新增功能
**文件**: `worker/index.ts` → `generateImage()`

1. **函数签名变更**:
   ```typescript
   // 旧版
   generateImage(prompt: string, style: string)

   // 新版（增加 panelIndex）
   generateImage(prompt: string, style: string, panelIndex: number)
   ```

2. **构图模板自动注入**:
   ```typescript
   const compositionKey = `panel${panelIndex + 1}` as 'panel1' | 'panel2' | 'panel3';
   const compositionTemplate = styleConfig.compositionGuide[compositionKey];

   // 构图模板放在提示词最前面（强控制）
   const fullPrompt = `${modernArtPrefix} ${compositionTemplate}, ${prompt}...`;
   ```

3. **增强负面提示词**（屏蔽直接主体）:
   ```typescript
   const indirectRepresentationNegative =
     'human face, human faces, direct eye contact, full body shot, portrait,
      close-up face, facial features, literal subject, main character visible,
      person in focus, clear human figure';
   ```

4. **参数调优**:
   - `num_inference_steps`: 30 → **35**（更好遵循构图）
   - `guidance_scale`: 8.5 → **9.0**（更强风格控制）

---

## 🎭 改进3: LLM 提示词重构

### 新增内容模块

**文件**: `worker/index.ts` → `parseDreamWithLLM()` 系统提示词

#### 1. 三幕结构详细说明
```
Panel 1 - 因 (THE CAUSE):
- ❌ 不要显示完整主体（无老虎全身/无人脸）
- ✅ 显示：痕迹（爪痕/脚印/阴影）、符号、氛围
- 构图：特写/抽象形状/符号物体

Panel 2 - 境 (THE REALM):
- ❌ 不要聚焦角色/主体
- ✅ 显示：环境（空间/天气/建筑）、情绪、比例尺
- 构图：广角/低仰角/强调负空间

Panel 3 - 势 (THE MOMENTUM):
- ❌ 不要显示直接对抗或脸部
- ✅ 显示：运动模糊、碎片化、能量（速度线/粒子）
- 构图：对角线/动态角度/局部框架
```

#### 2. 间接表现技巧库
```
1. 痕迹/残留物: 脚印、阴影、爪痕、涟漪、呼吸雾气
2. 符号替代: 警示条纹替代老虎、几何形状替代人物
3. 局部/裁剪: 只显示边缘、角落、剪影 — 绝不完整身体
4. 运动伪影: 模糊、拖影、多重曝光、延时轨迹
5. 环境反应: 沙被踢起、水面涟漪、树叶飞舞
6. 负空间: 显示"不在场"— 空白传达存在感
```

#### 3. 构图模板绑定
将四种风格的构图槽位直接嵌入 LLM 提示词，让 AI 知道每个面板的**景别/角度**期望。

#### 4. 强制约束
```
每个场景必须包含：
- NO faces, NO full bodies, NO direct eye contact
- NO literal subjects（梦里说"老虎"就别在提示词里写"tiger"）
- NO text, NO logos, NO watermarks
```

#### 5. 完整示例
在提示词末尾加入**"老虎在沙漠追我"**的三套完整转换示例（极简/胶片/赛博风格），让 LLM 通过范例学习。

---

## 💡 效果对比：老虎沙漠案例

### ❌ 改进前（直译风格）
```
Panel 1: "Tiger running in desert"
Panel 2: "Person being chased in sand dunes"
Panel 3: "Tiger catching up to person"
```
**问题**: 三格都是主体正面，像动物纪录片截图，毫无艺术性。

---

### ✅ 改进后（Film 风格 - 因境势结构）

#### Panel 1 - 因（预感危险）
**LLM 输出**:
> "Contemporary digital art: Close-up of massive claw marks carved into wind-rippled sand, sharp diagonal cuts through golden surface, heat haze distortion in background. NO tiger visible, NO faces, NO full bodies."

**SDXL 构图模板自动注入**:
> "off-center detail shot, shallow depth of field, rule of thirds, bokeh background, cinematic framing"

**视觉效果**: 特写沙面上深深的爪痕，远处海市蜃楼虚化，没有老虎出现，但危险感十足。

**文案**: "风先知道危险。"

---

#### Panel 2 - 境（热浪沙海）
**LLM 输出**:
> "Film photography: Wide low-angle shot of endless dunes under harsh sun, tiny distant running silhouette warped by heat waves, symmetrical composition with extreme negative space. NO animals, NO faces, minimalist scale."

**SDXL 构图模板**:
> "symmetrical low-angle landscape, vignette framing, wide environmental shot, dramatic sky"

**视觉效果**: 低机位广角看金色沙丘，远处一个极小的奔跑剪影被热浪扭曲变形，强调空间的压迫感。

**文案**: "脚步被太阳烫轻。"

---

#### Panel 3 - 势（追逐残影）
**LLM 输出**:
> "Modern abstract expressionism: Dynamic motion blur of exploding sand particles, edge of frame shows faint striped motion trail (tiger-stripe pattern NOT tiger), diagonal speed lines. NO faces, NO full tiger, only implied presence through traces."

**SDXL 构图模板**:
> "dynamic motion blur, diagonal composition, lens flare, panning shot effect, high shutter drag"

**视觉效果**: 近景沙粒爆炸般飞起，画面边缘出现虎纹样的运动虚影（不是老虎本体），对角速度线。

**文案**: "影子先被追上。"

---

## 🔧 技术实施细节

### 修改文件清单
1. ✅ `worker/index.ts`
   - `parseDreamWithLLM()`: 重构系统提示词（+1500 字符）
   - `generateImage()`: 新增 `panelIndex` 参数，注入构图模板
   - 调用点修改: `generateImage(scene, style, i)`

2. ✅ `lib/constants.ts`
   - 每个风格添加 `compositionGuide: { panel1, panel2, panel3 }`
   - 更新 `negative` 字段（添加 faces/full bodies/literal subjects）

### 兼容性说明
- ✅ **无破坏性变更**：保持原有 API 接口不变
- ✅ **向后兼容**：前端/数据库无需修改
- ✅ **渐进增强**：改进仅在 Worker 层生效

---

## 📊 预期效果提升

| 维度 | 改进前 | 改进后 |
|------|--------|--------|
| **艺术性** | 直译插图风格 | 诗性间接表现 |
| **留白** | 三格都塞满 | 因（特写）→ 境（广角）→ 势（局部） |
| **神秘感** | 全部正面展示 | 痕迹/残影/符号化 |
| **构图** | 随机生成 | 每种风格固定模板 |
| **一致性** | 三格风格割裂 | 构图统一但不雷同 |
| **可读性** | 需要说明才懂 | "看不透一点"但能感受情绪 |

---

## 🚀 部署步骤

### 1. 本地测试
```bash
# Terminal 1: 启动开发服务器
npm run dev

# Terminal 2: 启动 Worker
npm run worker

# Terminal 3: 测试案例
# 在前端输入: "老虎在沙漠追我"
# 选择风格: Film Grain
# 观察三个面板是否符合"因-境-势"结构
```

### 2. 验证检查点
- [ ] Panel 1: 是否为**特写/符号/痕迹**（无完整主体）
- [ ] Panel 2: 是否为**广角/环境**（主体极小或远景）
- [ ] Panel 3: 是否为**运动/残影**（模糊/局部）
- [ ] 三格：是否无人脸/无正面眼神对视
- [ ] 整体：是否无传统中国画风格（水墨/书法）

### 3. 部署到 Railway
```bash
# 确保 .env 配置正确
npm run check-env

# 提交代码到 main 分支（自动部署）
git add .
git commit -m "feat: 实施因-境-势三幕艺术系统，增强间接表现技巧"
git push origin main

# Railway 将自动检测并部署
# 查看部署日志确认 Worker 启动成功
```

---

## 🎓 创意延伸建议

### 未来可选功能

#### 1. 六种拼版方式（当前默认：Triptych）
- 中格加宽
- 错位叠贴（Zine 拼贴）
- 剪影穿插
- 色块分隔
- 阴影镜面

实施方式：在 `components/ShareButtons.tsx` 添加布局选择器。

#### 2. 拼版质感升级
- Film: 灰尘颗粒覆盖层（5-8% 透明度）
- Minimal: 纸纹理（10-12%）
- Cyber: 细雾与镜面反射（30-40%）
- Pastel: 柔光光晕

实施方式：在 Canvas 合成时添加纹理图层。

#### 3. 文案生成优化
当前 LLM 生成的 `caption` 已是诗性短语，可进一步要求：
- 统一节奏（都为陈述句或都为隐喻句）
- 字数严格控制（8-16 字）
- 首尾呼应（Panel 1 与 Panel 3 语义关联）

---

## 📖 参考资源

### GPT 创意指南核心思想
1. **画面语言**: 三格不等于三句翻译
2. **风格包 × 构图模板联动**: 减少跑偏
3. **间接表现技巧**: 局部/背影/残影/痕迹
4. **"看不透"的艺术**: 避免正脸，用几何/条纹代替猛兽

### 关键原则
> "当'把梦做成三格拼图'落地到具体画面时，最容易变成'三张直译图'，又土又直白。"

✅ 解决方案：**因-境-势** + **构图模板** + **间接表现** = 诗性三段式艺术卡片

---

## 🛠️ 故障排查

### 问题1: LLM 仍然生成字面主体
**检查**:
- OpenRouter 是否使用 Llama 3.3 70B（较新模型）
- 提示词是否完整（检查 `systemPrompt` 变量）
- Temperature 是否为 0.9（足够创意）

### 问题2: SDXL 忽略构图模板
**检查**:
- `compositionTemplate` 是否正确注入到 `fullPrompt` 开头
- `guidance_scale` 是否 ≥ 9.0
- `num_inference_steps` 是否 ≥ 35

### 问题3: 仍然出现传统画风
**检查**:
- 负面提示词是否包含完整列表
- 现代艺术前缀是否在最开头
- LLM 输出的 `scene` 是否以现代艺术风格开头

---

## ✅ 完成状态

- [x] LLM 提示词重构（因-境-势结构）
- [x] 四种风格添加构图模板
- [x] SDXL 生成函数增强（注入模板 + 间接表现负面词）
- [x] 函数调用修复（`generateImage` 新增参数）
- [x] 编写完整改进文档
- [ ] 本地测试验证
- [ ] 部署到 Railway
- [ ] 真实案例效果评估

---

**下一步**: 在本地环境测试"老虎在沙漠追我"案例，验证改进效果。

---

_本文档由 Claude Code 基于 GPT 创意指南生成 · 2025-11-02_
