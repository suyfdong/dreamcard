# 艺术感提升改造 - 2025-11-03

## 问题诊断

用户反馈："出图一点艺术感没有"

**根本原因**：
- LLM 生成的提示词过于具象（描述"火车"、"老虎"等物体，而非情感和氛围）
- 缺少"色域、笔触、光线、留白"优先的抽象语言系统
- 缺少质量检查机制，无法保证抽象度

---

## 解决方案概览

基于 GPT 方案的**渐进式改造**，注入"抽象优先"核心规则：

### 核心原则
**用色域、笔触、光线、留白作为第一语言，具象物体仅作暗示（≤30%信息量）**

---

## 实施的改动

### 1. LLM 提示词注入"视觉语言优先"规则

**文件**: `worker/index.ts`

#### 新增章节: 🎨 VISUAL LANGUAGE PRIORITY

```
YOUR FIRST LANGUAGE IS:
> COLOR FIELDS (色域) / BRUSHSTROKES (笔触) / LIGHT QUALITIES (光线) / NEGATIVE SPACE (留白) / DIRECTIONAL FLOW (方向性)

Concrete objects are HINTS ONLY — maximum 30% of visual information.
```

#### 语言转换示例

| 具象描述（❌ 禁止） | 抽象描述（✅ 使用） |
|------------------|------------------|
| "火车" (train) | "blue-gold linear flow like rails" + "rectangular light bands like window memories" |
| "海" (ocean) | "horizon swallowed by fog" + "blue fluid consuming sightline" |
| "老虎追我" (tiger chasing) | "inverted orange shadow pursuing upward" + "warm color field surging to engulf space" |
| "楼梯" (stairs) | "parallel ascending light beams" + "diagonal rhythm marks" |

#### 抽象规则
- 每格至少 70% 用"色域+笔触+光线"描述
- 具象元素只作"暗示性符号"（窗框/阴影/反光/轮廓）
- 禁止超过 2 个具象名词/每格

---

### 2. JSON Schema 增强

**新增字段**:

```typescript
interface ThreeActStructure {
  abstraction_level: number;     // 0.0-1.0, 量化抽象度 (目标: ≥0.70)
  global_palette: string;         // 主色板描述（如 "Cobalt blue, amber gold, deep shadow"）
  panels: Array<{
    scene: string;
    caption: string;
    compose: 'center' | 'thirds' | 'diagonal' | 'symmetry';  // 构图钩子
    distance: 'wide' | 'medium' | 'close';                   // 镜头距离
    concrete_ratio?: number;      // 具象名词占比 (目标: ≤0.30)
  }>;
}
```

**用途**:
- `abstraction_level`: 质检门槛
- `global_palette`: 强制 LLM 思考色彩统一性
- `compose/distance`: 为未来拼版模板预留钩子
- `concrete_ratio`: 自我评估具象度

---

### 3. 四类家族风格映射

**文件**: `lib/constants.ts`

| 现有风格 | 映射家族 | 色彩语言 | 核心美学 |
|---------|---------|---------|---------|
| **minimal** | → **Lucid** | Cobalt blue, cold white, steel gray, neon edge light | 阈限空间、对称、负空间主导 |
| **film** | → **Memory** | Mist blue, amber gold, ochre red, warm gray, film grain | 记忆温度、颗粒质感、怀旧光质 |
| **cyber** | → **Surreal** | Purple-blue, cyan-pink, obsidian black, neon accents | 反逻辑、互补色冲突、体积雾 |
| **pastel** | → **Pastel** | Pink-blue, peach, lavender, cream white, soft paper texture | 温柔渐变、柔焦、吉卜力光质 |

**改进点**:
- 每个风格增加 `familyStyle` 和 `colorPalette` 字段
- `compositionGuide` 重写为"色域语言"（而非物体描述）
- `prompt` 增强为"色彩+光线+氛围"优先

**示例（Cyber 风格前后对比）**:

❌ 旧版:
```
prompt: "cyberpunk neon lights, city street, reflections"
```

✅ 新版:
```
prompt: "surreal digital dream atmosphere, dominant purple-blue and cyan-pink color fields,
heavy volumetric fog creating atmospheric mystery, deep obsidian blacks with selective
neon light accents, impossible architecture through light and void"
```

---

### 4. 自动质量检查 + 重试机制

**新增函数**: `validateAbstractQuality()`

#### 6条质检规则:

1. ✅ **抽象度** ≥ 0.65
2. ✅ **三幕结构**齐全（3格，distance: wide→medium→close）
3. ✅ **具象占比** ≤ 30% 每格
4. ✅ **色板统一**：global_palette 存在且详细
5. ✅ **构图钩子**：compose/distance 字段完整
6. ✅ **场景描述**：每格 scene ≥ 50 字符（确保详细抽象语言）

#### 自动重试逻辑:

```
第一次生成 → 质检失败 → 附带失败原因重试 → 仍失败 → 再次重试 →
最多2次重试后接受（降级模式）
```

**重试提示词示例**:
```
PREVIOUS ATTEMPT FAILED QUALITY CHECK. Issues found:
1. Abstraction level too low: 0.55 (need ≥0.65)
2. Panel 2 has too many concrete objects: 40% (need ≤30%)

Please regenerate with MORE ABSTRACT language, HIGHER abstraction_level (≥0.70),
and LOWER concrete_ratio (≤0.25 per panel).
Focus on COLOR FIELDS, LIGHT QUALITIES, and ATMOSPHERIC DEPTH rather than objects.
```

---

### 5. 示例更新

**新增完整示例**（"追不上的火车"）:

```json
{
  "abstraction_level": 0.80,
  "global_palette": "Steel blue gradients, cold amber accents, deep shadow voids, weathered metal texture",
  "panels": [
    {
      "scene": "Contemporary digital art: 象征层 - Extreme close-up of weathered parallel color bands in steel blue and amber, converging into infinite perspective void, cold directional light creating diagonal shadow rhythms across textured metal surface. Abstracted essence of pursuit through receding lines, NO train visible, NO people, pure geometric color field with atmospheric depth.",
      "caption": "光跑在前",
      "compose": "diagonal",
      "distance": "wide",
      "concrete_ratio": 0.15
    },
    // ... 省略 Panel 2, 3
  ]
}
```

**关键特征**:
- 70% 描述是"color bands", "directional light", "shadow rhythms"（抽象）
- 30% 是"parallel", "converging"（几何暗示）
- 明确标注 "NO train visible" 避免具象化

---

## 技术细节

### 文件改动清单

| 文件 | 改动类型 | 行数变化 |
|-----|---------|---------|
| `worker/index.ts` | 大幅改动 | +100 行 |
| `lib/constants.ts` | 增强风格定义 | +40 行 |

### 关键函数

1. **`parseDreamWithLLM()`**:
   - 增加 `retryCount` 参数
   - 末尾调用 `validateAbstractQuality()`
   - 失败时递归重试

2. **`validateAbstractQuality()`**:
   - 6条规则校验
   - 返回 `{ passed, failures }` 结构
   - 用于日志和重试提示

3. **风格配置对象**:
   - 新增 `familyStyle` 字段（映射到 GPT 四类）
   - 新增 `colorPalette` 字段（主色板描述）
   - `compositionGuide` 重写为"色域+光线+氛围"语言

---

## 预期效果

### Before (旧系统)
- "火车穿过大海" → 生成具象火车、海浪图像
- 抽象度低，艺术感不足
- 无法保证风格一致性

### After (新系统)
- "火车穿过大海" → 生成"蓝金色流线、矩形光带、消失地平线"
- 抽象度 ≥ 0.70，用色域和光线表达情感
- 自动质检确保艺术标准

---

## 验收标准

### 测试用例 1: "我在无尽楼梯里迷路"
- 期望风格: Minimal (Lucid)
- 期望输出:
  - Panel 1: 蓝色几何虚空 + 平行上升光束（非楼梯图像）
  - Panel 2: 不可能垂直走廊 + 冷蓝雾霾
  - Panel 3: 光束溶解为几何碎片

### 测试用例 2: "火车穿过大海"
- 期望风格: Film (Memory)
- 期望输出:
  - Panel 1: 钢蓝琥珀色带 + 平行线消失点（非火车）
  - Panel 2: 蓝金雾霾 + 矩形光带（窗户暗示）
  - Panel 3: 光线溶解为颗粒

### 测试用例 3: "老虎追我"
- 期望风格: Cyber (Surreal)
- 期望输出:
  - Panel 1: 倒置橙色阴影 + 紫蓝虚空
  - Panel 2: 上涌暖色流体 + 不可能空间
  - Panel 3: 橙色光粒消散入黑暗

---

## 未来优化方向

### 1. 如果艺术感仍不足
- 考虑替换图像模型: FLUX.1-pro / Midjourney API
- 增加"笔触质感"关键词（impasto, palette knife, gestural）
- 进一步降低 concrete_ratio 阈值（0.30 → 0.20）

### 2. 模块化重构（可选）
参考 GPT 方案，拆分为三个独立模块：
- **Intent Parser**: 解析梦境类型
- **Prompt Composer**: 生成三格提示词
- **Quality Gate**: 质检与修正

当前实现是"单体式"，已满足需求。模块化可作为未来优化。

### 3. 用户反馈收集
- 增加"艺术感评分"功能
- A/B 测试：旧提示词 vs 新抽象提示词
- 收集失败案例，优化负面词

---

## 部署注意事项

### 1. Railway Worker 需要重启
```bash
# Railway 会自动检测 git push 并重新部署
git add .
git commit -m "feat: 注入抽象优先视觉语言系统，提升艺术感"
git push origin main
```

### 2. 环境变量无需改动
所有现有环境变量保持不变。

### 3. 数据库无需迁移
新增字段都是可选的（TypeScript `?`），旧数据兼容。

### 4. 前端无需改动
前端只读取 `scene` 和 `caption`，新字段仅用于后端质检。

---

## 成功标志

✅ Worker 日志出现 `✅ Quality check passed!`
✅ 生成的图像以"色域、光线、氛围"为主
✅ 用户反馈"有艺术感了"
✅ abstraction_level 稳定在 0.70-0.85 范围

---

**文档版本**: 1.0
**改动日期**: 2025-11-03
**改动作者**: Claude Code
**参考来源**: GPT "提示词生产线"方案 + 用户反馈
