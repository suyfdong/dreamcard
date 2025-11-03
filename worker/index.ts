import { Worker, Job } from 'bullmq';
import { connection, ImageGenJobData } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { STYLES, GENERATION_CONFIG, PROGRESS_STAGES } from '@/lib/constants';
import { uploadImageFromUrl } from '@/lib/storage';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface ThreeActStructure {
  abstraction_level: number; // 0.0-1.0, how abstract vs concrete
  global_palette: string; // Main color palette description
  panels: Array<{
    scene: string;
    caption: string;
    compose: 'center' | 'thirds' | 'diagonal' | 'symmetry'; // Composition hook
    distance: 'wide' | 'medium' | 'close'; // Camera distance (WIDE/MID/CLOSE-UP)
    concrete_ratio?: number; // Percentage of concrete nouns (for validation)
  }>;
}

/**
 * Quality validation function - checks if LLM output meets abstract art standards
 */
interface QualityCheckResult {
  passed: boolean;
  failures: string[];
}

function validateAbstractQuality(structure: ThreeActStructure): QualityCheckResult {
  const failures: string[] = [];

  // Rule 1: Abstraction level >= 0.50 (lowered for better success rate)
  if (structure.abstraction_level < 0.50) {
    failures.push(`Abstraction level too low: ${structure.abstraction_level} (need ≥0.50)`);
  }

  // Rule 2: All 3 panels present with required fields
  if (structure.panels.length !== 3) {
    failures.push(`Must have exactly 3 panels, got ${structure.panels.length}`);
  }

  // Rule 3: Check each panel's concrete ratio
  structure.panels.forEach((panel, i) => {
    if (panel.concrete_ratio && panel.concrete_ratio > 0.30) {
      failures.push(`Panel ${i + 1} has too many concrete objects: ${(panel.concrete_ratio * 100).toFixed(0)}% (need ≤30%)`);
    }
  });

  // Rule 4: Three-act structure complete (distance progression)
  const distances = structure.panels.map(p => p.distance);
  const expectedDistances = ['wide', 'medium', 'close'];
  const hasCorrectProgression = distances.every((d, i) => d === expectedDistances[i]);
  if (!hasCorrectProgression) {
    failures.push(`Panel distances must follow wide→medium→close progression, got: ${distances.join('→')}`);
  }

  // Rule 5: Global palette exists
  if (!structure.global_palette || structure.global_palette.trim().length < 10) {
    failures.push('Global palette description missing or too short');
  }

  // Rule 6: All panels have composition hooks
  structure.panels.forEach((panel, i) => {
    if (!panel.compose) {
      failures.push(`Panel ${i + 1} missing 'compose' field`);
    }
    if (!panel.distance) {
      failures.push(`Panel ${i + 1} missing 'distance' field`);
    }
    if (!panel.scene || panel.scene.length < 50) {
      failures.push(`Panel ${i + 1} scene description too short (need detailed abstract language)`);
    }
    if (!panel.caption || panel.caption.length < 4) {
      failures.push(`Panel ${i + 1} caption missing or too short`);
    }
  });

  return {
    passed: failures.length === 0,
    failures,
  };
}

/**
 * Step 1: Parse dream text with LLM to create 3-act structure
 * Includes automatic quality validation and retry (up to 2 retries)
 */
async function parseDreamWithLLM(
  inputText: string,
  style: string,
  symbols: string[],
  mood?: string,
  retryCount: number = 0
): Promise<ThreeActStructure> {
  const MAX_RETRIES = 2;

  const systemPrompt = `You are a DREAM LOGIC ARCHITECT. DO NOT illustrate "what I dreamed" — visualize "HOW dreams exist in the mind".

═══════════════════════════════════════════════════════════════════════
🎨 VISUAL LANGUAGE PRIORITY: Paint with COLOR, LIGHT, TEXTURE, SPACE
═══════════════════════════════════════════════════════════════════════

**YOUR FIRST LANGUAGE IS:**
> COLOR FIELDS (色域) / BRUSHSTROKES (笔触) / LIGHT QUALITIES (光线) / NEGATIVE SPACE (留白) / DIRECTIONAL FLOW (方向性)

**Concrete objects are HINTS ONLY — maximum 30% of visual information.**

**Language Paradigm (HOW TO DESCRIBE):**

✅ USE THESE WORDS:
- "flowing / dissolving / reflecting / residual warmth / particles / light mist / impasto / swirling brushstrokes / color field blocks"
- "cobalt blue gradient bleeding into white" (NOT "blue sky")
- "vertical amber streaks like melting metal" (NOT "sunset")
- "geometric void with one thin horizontal line" (NOT "horizon")

✅ TRANSFORM CONCRETE SUBJECTS:
- "火车" (train) → "blue-gold linear flow like rails" + "rectangular light bands like window memories"
- "海" (ocean) → "horizon swallowed by fog" + "blue fluid consuming sightline"
- "老虎追我" (tiger chasing) → "inverted orange shadow pursuing upward" + "warm color field surging to engulf space"
- "楼梯" (stairs) → "parallel ascending light beams" + "diagonal rhythm marks"
- "镜子" (mirror) → "duplicated color void with slight shift" + "reflection as second reality"

❌ FORBIDDEN:
- Direct concrete descriptions: "a tiger running", "ocean waves", "a staircase"
- More than 2 concrete nouns per panel
- Any human faces, full bodies, or recognizable characters

**ABSTRACTION RULES:**
- Each panel must be at least 70% described using "color field + brushstroke + light quality"
- Concrete elements appear ONLY as "suggestive symbols" (window frames / shadows / reflections / silhouettes)
- If you must name an object, immediately convert it to abstract quality: "desk → horizontal plane catching light"

═══════════════════════════════════════════════════════════════════════
🎨 AESTHETIC STANDARDS: What Makes a Dream Card "BEAUTIFUL"
═══════════════════════════════════════════════════════════════════════

**Core Aesthetic Principle:**
> Images must have EMOTION, SYMBOLISM, and RHYTHM. Not translating dreams, but EXPRESSING dreams.
> Viewers should be "PULLED INTO" the image, not "reading" text, but FEELING emotion.

**Creativity Definition:**
> Creativity = UNEXPECTED + EMOTIONAL RESONANCE
> DO NOT paint realistic scenes. Paint dream METAPHORS using COLOR and LIGHT.
> Transform "exam anxiety" into spatial oppression, "urgency" into torn light, "not knowing answers" into visual chaos.
> Examples: Floating geometric voids, twisted chromatic gradients, liquid light dripping from undefined edges.

**What Audiences Love (High-End Dreams):**
- ✅ **Unified color tone**: Clear light/shadow and color contrast (purple-blue / pink neon / black-silver)
- ✅ **Symbolism**: Abstract patterns, impossible spaces, light phenomena
- ✅ **Spatial depth**: Foreground-midground-background layering through COLOR and ATMOSPHERE
- ✅ **Visual rhythm**: Motion vs stillness, bright vs dark alternation
- ✅ **Negative space**: DO NOT fill every corner with elements - BREATHE

**Visual Quality Standards:**
1. **Color Unity**: Single dominant palette per panel (but can shift across 3 panels)
2. **Compositional lines**: Leading lines created by LIGHT and COLOR FLOW, not objects
3. **Cinematic feel**: Low angle, symmetry, or extreme close-up OF ABSTRACT ELEMENTS
4. **Contrast**: Light vs shadow, empty vs dense, sharp vs soft
5. **Style consistency**: Same aesthetic across 3 panels, but different angles:
   - Panel 1: Symbolic origin (abstract/intimate)
   - Panel 2: Spatial anxiety (environmental/vast)
   - Panel 3: Emotional dissolution or internalization (detail/surreal)

**"Beautiful" Means:**
> People feel ABSORBED by COLOR and LIGHT, not recognizing objects. The image PULLS you in emotionally through ATMOSPHERE.
> Every panel must have: MOOD (through color/light), SPACE (through depth/atmosphere), LIGHT (directional, volumetric).

═══════════════════════════════════════════════════════════════════════
🧠 CORE PHILOSOPHY: Dreams don't follow story logic. They follow ASSOCIATION, SYMBOL MUTATION, and SPATIAL IMPOSSIBILITY.

═══════════════════════════════════════════════════════════════════════
🌀 THREE-LAYER DREAM STRUCTURE: 象征 (SYMBOL) → 空间 (SPACE) → 情绪 (EMOTION)
═══════════════════════════════════════════════════════════════════════

**Panel 1 - 象征层 (SYMBOLIC LAYER - Opening/起):**
- PURPOSE: Use METAPHOR or PARTIAL VIEW to hint at the dream's theme
- ROLE: Emotional entry point - "What does this dream FEEL like?"
- VISUAL APPROACH: Abstract / Symbolic / Partial perspective
- CAMERA LANGUAGE: **WIDE SHOT** (establish space) or abstract pattern
- MOOD: CALM, COLD - the beginning
- TECHNIQUE: Do NOT translate literally. "Tiger chasing" ≠ tiger image, = feeling of being chased (shadows, footprints, torn light)
- EXAMPLE: "Exam anxiety" → Endless floating desks in dark void, blank glowing papers, flickering light
- ❌ DO NOT: Show the literal subject (no tiger, no person, no exam room)
- ✅ DO show: The FEELING through symbols (empty desks = pressure, shadows = threat)

**Panel 2 - 空间层 (SPATIAL LAYER - Development/承):**
- PURPOSE: Show the dream's SPACE, TIME, SCENE characteristics
- ROLE: Reveal dream's strange logic - "Where am I? What's happening?"
- VISUAL APPROACH: Wide / Light-and-shadow / Strange composition
- CAMERA LANGUAGE: **MID SHOT** (atmospheric conflict, environmental)
- MOOD: CHAOS, CONFLICT - the tension builds
- TECHNIQUE: Space must be DISJOINTED but UNIFIED (desert classroom, underwater stairs, floating furniture)
- EXAMPLE: "Exam anxiety" → Neon tunnel shaped like answer sheet, walls flicker with error symbols, oppressive reflective floor
- ❌ DO NOT: Continue narrative logically
- ✅ DO show: IMPOSSIBLE SPACES that feel dreamlike (perspective breaks, scale shifts, gravity defies)

**Panel 3 - 情绪层 (EMOTIONAL LAYER - Resolution/转合):**
- PURPOSE: Use motion, color, or structure to express the dream's emotional climax or internalization
- ROLE: End the dream's rhythm - "How does this dream resolve/dissolve?"
- VISUAL APPROACH: Negative space / Motion / Blur / Uncertainty
- CAMERA LANGUAGE: **CLOSE-UP** or symbolic ending (detail, intimate)
- MOOD: DISSOLUTION, NEGATIVE SPACE, AMBIGUITY - the ending fades
- TECHNIQUE: Use dynamics to show emotion dissolving (melting, dispersing, floating away, fragmenting)
- EXAMPLE: "Exam anxiety" → Pen tip dripping glowing liquid ink, melting into code streams, floating numbers, anxiety dissolving
- ❌ DO NOT: Resolve or explain the dream clearly
- ✅ DO show: Emotional release through visual dissolution (blur edges, particles, fading, transformation)

═══════════════════════════════════════════════════════════════════════
🎬 CAMERA LANGUAGE & RHYTHM PROGRESSION (MANDATORY)
═══════════════════════════════════════════════════════════════════════

**Shot Sequence (起承转合):**
1. Panel 1 (象征): **WIDE SHOT** - Establish the dream space (distant, abstract, calm)
2. Panel 2 (空间): **MID SHOT** - Atmospheric conflict (environmental, chaotic)
3. Panel 3 (情绪): **CLOSE-UP** - Symbolic ending (intimate detail, dissolution)

**Rhythm Progression (节奏递进):**
1. Panel 1: **CALM** → Cold, quiet, establishing
2. Panel 2: **CHAOS** → Conflict, tension, disorienting
3. Panel 3: **DISSOLUTION** → Negative space, blur, fading

**Composition Breathing (构图呼吸感):**
- ❌ DO NOT fill every corner with elements
- ✅ DO preserve negative space, blur, or dissolving edges
- ✅ Light/shadow and leading lines must guide the viewer's eye flow
- ✅ Each panel should have visual rhythm: motion vs stillness, bright vs dark alternation

**Color Control (色彩递进):**
- All three panels must share UNIFIED COLOR TONE but vary in brightness
- Color progresses with emotion: cold→warm OR dark→light OR saturated→desaturated
- Example: Panel 1 (dark blue void) → Panel 2 (purple-pink neon) → Panel 3 (soft cyan glow)

═══════════════════════════════════════════════════════════════════════
🎨 STYLE DIFFERENTIATION TABLE
═══════════════════════════════════════════════════════════════════════

**Minimal (极简梦):**
- Light: Negative space, line-based, order
- Color: Monochrome or low saturation
- Rhythm: Calm, clean, cold rhythm
- Elements: Spatial geometry, single objects, minimal color

**Film (胶片梦):**
- Light: Soft focus, grain, natural light, vignette
- Color: Warm gray-brown, yellow-blue tones
- Rhythm: Layered, with realistic traces
- Elements: Dust, reflections, light-shadow planes, solitude

**Cyber (赛博梦):**
- Light: Strong contrast, reflection, neon, flow
- Color: Blue-purple-pink-gold gradients
- Rhythm: Speed, symmetry, geometric structures
- Elements: Light beams, reflections, metal, shadows, energy lines

**Pastel (粉彩梦):**
- Light: Soft light, warm colors, fairy tale feel
- Color: Pink-orange-blue-purple
- Rhythm: Soft, light, intimate feel
- Elements: Plants, fruits, fabric, soft light lines

═══════════════════════════════════════════════════════════════════════
💎 STYLE-SPECIFIC BEAUTY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════

**For Cyber Style (CRITICAL - User tested this and found it lacking):**
- Must be DREAMLIKE, not just "neon lights in city"
- Requires: DEPTH (foreground/midground/background), NEGATIVE SPACE (not cluttered), ATMOSPHERE (fog/haze/glow)
- Color palette: Dominant purple-blue or cyan-pink, NOT oversaturated rainbow
- Lighting: Volumetric rays, soft bloom, reflective surfaces (wet floor/mirror/glass)
- Composition: LOW ANGLE or EXTREME CLOSE-UP, never boring mid-shot
- Feeling: "Being pulled into a digital dream", not "generic cyberpunk street"

**Example - "Lost in Endless Stairs" Dream (Minimal style - CORRECT ABSTRACT APPROACH):**
1. Symbolic: Diagonal ascending light beams in cobalt blue void, 80% negative space, single white neon line cutting through darkness, cold geometric pattern suggesting upward motion
2. Jump-cut: Same diagonal light pattern now inverted and multiplied, creating impossible perspective where lines defy gravity, atmospheric blue haze with hard white accents, disorienting symmetry
3. Internalization: Light beams fragmenting into scattered geometric shards, fading into deep blue-black void, 90% negative space, dissolution of structure into pure color field

All three must share: DIAGONAL LIGHT LINES + COBALT BLUE VOID + GEOMETRIC ABSTRACTION (NO stairs visible!)

═══════════════════════════════════════════════════════════════════════
🔗 RESONANCE PRINCIPLE: Three Panels Must ECHO Not EXPLAIN
═══════════════════════════════════════════════════════════════════════

**Visual DNA Continuity:**
- Panel 1 establishes: LINES (parallel), TEXTURE (metal), COLOR (steel blue)
- Panel 2 reuses: Same lines/texture but in IMPOSSIBLE SPACE (lines on ceiling, defying gravity)
- Panel 3 mutates: Lines become OBJECTS (pencils/chopsticks/cigarettes arranged in parallel)

**Forbidden Connections:**
- ❌ DO NOT create chronological narrative (A→B→C story)
- ❌ DO NOT show "beginning → middle → end"
- ✅ DO create ASSOCIATIVE LEAPS (symbol morphs across impossible contexts)

═══════════════════════════════════════════════════════════════════════
🎨 COMPOSITION TEMPLATES BY STYLE
═══════════════════════════════════════════════════════════════════════

**Minimal Style (象征→跳切→内化):**
- Panel 1: Extreme close-up of geometric pattern/texture, 70% negative space, stark contrast
- Panel 2: Same pattern in IMPOSSIBLE location (on wall/ceiling), disorienting angle
- Panel 3: Pattern materialized as objects (arranged in uncanny precision), still life with wrongness

**Film Style (象征→跳切→内化):**
- Panel 1: Grainy macro shot of texture/lines, shallow depth, organic pattern
- Panel 2: Same visual DNA in broken context (gravity-defying), cinematic wide angle
- Panel 3: Elements crystallized as mundane objects, hyper-real detail with film grain

**Cyber Style (象征→跳切→内化):**
- Panel 1: Neon-lit abstract pattern/reflection, close-up on texture
- Panel 2: Pattern repeated in impossible architecture, vertiginous perspective
- Panel 3: Neon elements as solid objects in uncanny arrangement, glossy surfaces

**Pastel Style (象征→跳切→内化):**
- Panel 1: Soft-focus abstract shape/color field, dreamy texture
- Panel 2: Shape appears in surreal context (floating/inverted), gentle impossibility
- Panel 3: Solidified into soft objects with dream logic, pastel still life

═══════════════════════════════════════════════════════════════════════
🚫 ABSOLUTE PROHIBITIONS
═══════════════════════════════════════════════════════════════════════

**Visual Taboos:**
- ❌ NEVER show human faces, full bodies, or direct eye contact
- ❌ NEVER use the literal dream subject (if dream says "train", DO NOT write "train" in prompt)
- ❌ NEVER create A→B→C chronological story
- ❌ NEVER show traditional art (watercolor, ink wash, calligraphy, classical painting)
- ❌ NEVER include text, logos, watermarks, or readable words
- ❌ ABSOLUTELY FORBIDDEN: rooms, corridors, hallways, buildings, architecture, parking lots, streets, walls, floors, ceilings, doors, windows (architectural elements)
- ❌ ABSOLUTELY FORBIDDEN: recognizable spaces, realistic environments, literal objects
- ✅ ONLY USE: color fields, light phenomena, abstract patterns, atmospheric effects, geometric abstractions

**Conceptual Taboos:**
- ❌ NEVER explain or resolve the dream
- ❌ NEVER use realistic narrative logic
- ❌ NEVER make panels independent - they must ECHO each other

═══════════════════════════════════════════════════════════════════════
✅ MODERN ART STYLE ENFORCEMENT
═══════════════════════════════════════════════════════════════════════

EVERY scene MUST start with explicit modern art style:
- "Contemporary digital art:", "Surrealist photography:", "Modern abstract expressionism:"
- "Photorealistic CGI rendering:", "Cinematic photography:", "Digital illustration:"

═══════════════════════════════════════════════════════════════════════
📝 OUTPUT FORMAT (JSON SCHEMA)
═══════════════════════════════════════════════════════════════════════

You MUST return a JSON object with this exact structure:

{
  "abstraction_level": 0.75,  // Number 0.0-1.0, how abstract (target: ≥0.70)
  "global_palette": "Cobalt blue void, cold white edge light, steel gray gradients",  // Main color description
  "panels": [
    {
      "scene": "...",  // 2-3 sentences (see rules below)
      "caption": "...",  // 8-12 characters dream sentence
      "compose": "symmetry",  // One of: center | thirds | diagonal | symmetry
      "distance": "wide",  // One of: wide | medium | close (WIDE/MID/CLOSE-UP)
      "concrete_ratio": 0.20  // Estimated % of concrete nouns (0.0-1.0, target: ≤0.30)
    }
  ]
}

**For each panel "scene" field, provide 2-3 sentences with:**
1. Modern art style prefix (MANDATORY: "Contemporary digital art:", "Surrealist photography:", etc.)
2. Panel layer type (象征层/跳切层/内化层)
3. Visual DNA element (the pattern/texture/shape that mutates across panels)
4. Composition details using ABSTRACT LANGUAGE (color fields, light direction, atmospheric depth)
5. NO literal dream subjects, NO faces, NO full bodies
6. At least 70% description must be color/light/texture/space

**For "caption" field:**
- 8-12 characters, DREAM SENTENCE (梦句) format
- NOT literal description, NOT explanation
- Poetic fragment that RESONATES with the visual
- Examples: "光跑在前" / "脚印在屋顶" / "铅笔排成路"

**For "compose" field:**
- Choose based on emotional intent: symmetry (calm/order), diagonal (tension), thirds (natural), center (focus)

**For "distance" field:**
- Panel 1 should be "wide" (establish space)
- Panel 2 should be "medium" (atmospheric conflict)
- Panel 3 should be "close" (intimate dissolution)

═══════════════════════════════════════════════════════════════════════
💡 EXAMPLE: "追不上的火车" (Can't Catch the Train)
═══════════════════════════════════════════════════════════════════════

❌ BAD (literal story with concrete objects):
Panel 1: "Train departing from station"
Panel 2: "Person running on platform"
Panel 3: "Train disappearing into distance"

✅ EXCELLENT (Abstract-first with COLOR/LIGHT/SPACE priority):

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
    {
      "scene": "Surrealist photography: 跳切层 - Those same parallel blue-amber bands now appear as ceiling structure in impossible vertical space, gravity-defying perspective with light beams flowing upward, disorienting Dutch angle revealing void below. Atmospheric haze between foreground and distant bands creates depth, NO train, NO faces, spatial paradox expressed through color and light direction.",
      "caption": "脚印在天花板",
      "compose": "diagonal",
      "distance": "medium",
      "concrete_ratio": 0.20
    },
    {
      "scene": "Modern abstract photography: 内化层 - Intimate close-up of parallel amber light streaks dissolving into blue void, soft focus edges fading to darkness, residual warmth trails like memory fragments. Negative space dominates (70% deep blue-black), thin golden lines barely visible, dissolution of pursuit into color mist, NO objects, NO people, pure emotional release through light dispersion.",
      "caption": "线消失在蓝里",
      "compose": "center",
      "distance": "close",
      "concrete_ratio": 0.10
    }
  ]
}

**Visual DNA Continuity:**
All three panels share PARALLEL BLUE-AMBER LINEAR FLOW (color bands → ceiling light → dissolving streaks), but abstraction level increases from textured geometry → impossible space → pure light dissolution.

═══════════════════════════════════════════════════════════════════════

STYLE GUIDANCE for "${style}":
${symbols.length > 0 ? `- If these symbols appear in dream, transmute them into ABSTRACT PATTERNS: ${symbols.join(', ')}` : ''}
${mood ? `- Emotional undertone (NOT literal): ${mood}` : ''}

CRITICAL REMINDERS:
1. First, identify ONE visual DNA element from the dream — expressed as COLOR/LIGHT/TEXTURE (NOT object names)
2. Panel 1 (wide): Show it as PURE COLOR FIELD / LIGHT PATTERN (abstract, atmospheric)
3. Panel 2 (medium): Show it in IMPOSSIBLE SPACE (same color/light DNA, wrong context/gravity)
4. Panel 3 (close): Show it DISSOLVING / DISPERSING (light particles, color mist, fading edges)
5. All three panels must ECHO the same visual DNA through COLOR and LIGHT, not objects
6. Abstraction level must be ≥0.70, concrete_ratio must be ≤0.30 per panel

Respond with VALID JSON (following the schema above):
{
  "abstraction_level": 0.75,
  "global_palette": "Main color description (e.g., 'Cobalt blue, amber gold, deep shadow')",
  "panels": [
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [象征层] - Describe using COLOR FIELDS + LIGHT QUALITIES + ATMOSPHERIC DEPTH. At least 70% abstract language. NO literal subjects, NO faces, NO bodies.",
      "caption": "梦句 (8-12 characters)",
      "compose": "symmetry",
      "distance": "wide",
      "concrete_ratio": 0.20
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [跳切层] - Same visual DNA (color/light) in IMPOSSIBLE CONTEXT. Describe through SPACE and ATMOSPHERE. NO literal subjects, NO faces, NO bodies.",
      "caption": "梦句 (8-12 characters)",
      "compose": "diagonal",
      "distance": "medium",
      "concrete_ratio": 0.25
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [内化层] - Visual DNA DISSOLVING into pure light/color mist. Negative space dominates. NO objects, NO people.",
      "caption": "梦句 (8-12 characters)",
      "compose": "center",
      "distance": "close",
      "concrete_ratio": 0.10
    }
  ]
}

DO NOT illustrate "what happened in the dream". Paint "HOW the dream FEELS" using COLOR, LIGHT, and SPACE.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dreamcard.app',
      'X-Title': 'DreamCard',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputText },
      ],
      temperature: 0.9, // Higher temperature for more creative interpretations
      max_tokens: 1500, // More tokens for detailed descriptions
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }

  const structure: ThreeActStructure = JSON.parse(jsonMatch[0]);

  // Quality validation with auto-retry
  const qualityCheck = validateAbstractQuality(structure);

  if (!qualityCheck.passed) {
    console.warn(`⚠️ Quality check failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, qualityCheck.failures);

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying with feedback to LLM...`);

      // Build retry prompt with specific failures
      const retryPrompt = `${inputText}

PREVIOUS ATTEMPT FAILED QUALITY CHECK. Issues found:
${qualityCheck.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Please regenerate with MORE ABSTRACT language, HIGHER abstraction_level (≥0.70), and LOWER concrete_ratio (≤0.25 per panel).
Focus on COLOR FIELDS, LIGHT QUALITIES, and ATMOSPHERIC DEPTH rather than objects.`;

      // Recursive retry
      return parseDreamWithLLM(retryPrompt, style, symbols, mood, retryCount + 1);
    } else {
      // After max retries, lower abstraction requirements and accept fallback
      console.warn('⚠️ Max retries reached. Accepting with lowered standards.');
      console.warn('Quality issues:', qualityCheck.failures);
      // Still return the structure (fallback mode)
    }
  } else {
    console.log('✅ Quality check passed!');
  }

  return structure;
}

/**
 * Step 2: Generate image with composition template and indirect representation
 */
async function generateImage(
  prompt: string,
  style: string,
  panelIndex: number // 0, 1, 2 for panel1, panel2, panel3
): Promise<string> {
  const styleConfig = STYLES[style as keyof typeof STYLES];

  // Get composition template for this panel
  const compositionKey = `panel${panelIndex + 1}` as 'panel1' | 'panel2' | 'panel3';
  const compositionTemplate = styleConfig.compositionGuide[compositionKey];

  // FORCE modern art style by adding explicit contemporary keywords
  // Build prompt with modern art enforcement at the BEGINNING (most important position)
  const modernArtPrefix = 'contemporary digital art, modern 21st century aesthetic, photorealistic CGI rendering, cinematic photography,';

  // Add composition template BEFORE the LLM scene description for stronger control
  const fullPrompt = `${modernArtPrefix} ${compositionTemplate}, ${prompt}. ${styleConfig.prompt}`;

  // AGGRESSIVE negative prompt to completely block traditional Asian art styles, literal subjects, AND architectural elements
  const indirectRepresentationNegative = 'human face, human faces, direct eye contact, full body shot, portrait, close-up face, facial features, literal subject, main character visible, person in focus, clear human figure';
  const architecturalNegative = 'room, corridor, hallway, building, architecture, parking lot, garage, street, road, wall, floor, ceiling, door, window, interior, exterior, house, office, lobby, tunnel, bridge, staircase visible, recognizable space, realistic environment, constructed space, man-made structure';
  const negativePrompt = `${styleConfig.negative}, ${indirectRepresentationNegative}, ${architecturalNegative}, watercolor painting, ink wash painting, chinese brush painting, sumi-e, traditional art, classical painting, oil painting, acrylic painting, canvas painting, brush strokes, traditional chinese art, japanese art, asian traditional art, calligraphy, seal stamps, ancient art, historical painting, classical landscape, traditional portrait, brush painting, ink drawing, traditional illustration, vintage painting, antique art, classical art style, traditional artistic techniques, hand-painted, brushwork, traditional medium, classical chinese painting, traditional asian aesthetics`;

  console.log('Generating image with style:', style, 'panel:', panelIndex + 1);
  console.log('Composition template:', compositionTemplate);
  console.log('Prompt preview:', fullPrompt.substring(0, 200) + '...');

  // Use standard SDXL with aggressive style control
  const output = await replicate.run(
    'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' as any,
    {
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 35, // More steps for better adherence to composition
        guidance_scale: 9.0, // Even stronger guidance for indirect representation
        width: GENERATION_CONFIG.IMAGE_WIDTH,
        height: GENERATION_CONFIG.IMAGE_HEIGHT,
        scheduler: 'DPMSolverMultistep', // Better quality than K_EULER
        output_format: 'png',
        output_quality: 95, // Higher quality
      },
    }
  ) as any;

  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }

  throw new Error('No image generated');
}

/**
 * Step 2B: Generate FINAL RENDER (higher quality, 30-60s total)
 * Use FLUX.1-dev for better quality (slower but much better results)
 */
async function generateFinalImage(
  prompt: string,
  style: string
): Promise<string> {
  const styleConfig = STYLES[style as keyof typeof STYLES];

  // Use full detailed prompts for final render
  const fullPrompt = `masterpiece, best quality, highly detailed: ${prompt}. ${styleConfig.prompt}`;
  const negativePrompt = styleConfig.negative;

  console.log('Generating FINAL RENDER (high quality), prompt:', fullPrompt.substring(0, 100) + '...');

  try {
    // Try FLUX.1-dev (better quality than schnell)
    const output = await replicate.run(
      'black-forest-labs/flux-dev' as any,
      {
        input: {
          prompt: fullPrompt,
          guidance: 3.5, // Guidance scale for dev model
          num_inference_steps: 28, // Good balance of speed/quality
          width: GENERATION_CONFIG.IMAGE_WIDTH,
          height: GENERATION_CONFIG.IMAGE_HEIGHT,
          output_format: 'png',
          output_quality: 100, // Maximum quality for final
        },
      }
    ) as any;

    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
  } catch (error) {
    console.warn('FLUX-dev failed, falling back to SDXL:', error);

    // Fallback to SDXL if FLUX-dev fails
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' as any,
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          num_inference_steps: 40,
          width: GENERATION_CONFIG.IMAGE_WIDTH,
          height: GENERATION_CONFIG.IMAGE_HEIGHT,
          scheduler: 'DPMSolverMultistep',
          output_format: 'png',
          output_quality: 100,
        },
      }
    ) as any;

    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
  }

  throw new Error('No final image generated');
}

/**
 * Main worker processor
 */
async function processImageGeneration(job: Job<ImageGenJobData>) {
  const { projectId, inputText, style, symbols, mood } = job.data;

  try {
    console.log(`Processing job ${job.id} for project ${projectId}`);

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'running', progress: 0 },
    });

    await job.updateProgress(0);

    // Step 1: Parse with LLM
    console.log('Step 1: Parsing dream with LLM...');
    const structure = await parseDreamWithLLM(inputText, style, symbols, mood);

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: PROGRESS_STAGES.PARSING },
    });
    await job.updateProgress(PROGRESS_STAGES.PARSING * 100);

    // Step 2: SIMPLIFIED SINGLE-STAGE GENERATION
    console.log('Step 2: Generating images...');
    const panels = [];

    // Generate all 3 panels with SDXL (good quality, reasonable speed)
    for (let i = 0; i < structure.panels.length; i++) {
      const panelData = structure.panels[i];

      console.log(`Generating image ${i + 1}/3...`);

      try {
        // Generate image using SDXL with full style prompts and composition template
        const imageUrl = await generateImage(panelData.scene, style, i);

        // Upload to Supabase
        const filename = `${projectId}/panel-${i}-${uuidv4()}.png`;
        const uploadedUrl = await uploadImageFromUrl(imageUrl, filename);

        // Create panel in database
        const panel = await prisma.panel.create({
          data: {
            id: uuidv4(),
            projectId,
            order: i,
            scene: panelData.scene,
            caption: panelData.caption,
            imageUrl: uploadedUrl,
            sketchUrl: uploadedUrl, // Same as imageUrl for now
          },
        });

        panels.push(panel);

        // Update progress (0.1 → 0.8)
        const progress =
          PROGRESS_STAGES.PARSING +
          ((i + 1) / GENERATION_CONFIG.NUM_PANELS) *
            (PROGRESS_STAGES.RENDERING - PROGRESS_STAGES.PARSING);

        await prisma.project.update({
          where: { id: projectId },
          data: { progress },
        });
        await job.updateProgress(progress * 100);

      } catch (error) {
        console.error(`Failed to generate panel ${i + 1}:`, error);
        throw error; // Fail the whole job if one panel fails
      }
    }

    console.log('✓ All images generated successfully!');

    // Mark project as complete
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'success',
        progress: PROGRESS_STAGES.COLLAGING,
      },
    });

    await job.updateProgress(100);

    console.log(`Job ${job.id} completed successfully`);

    return { success: true, projectId };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);

    // Update project with error
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        errorMsg: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

// Create worker
const worker = new Worker<ImageGenJobData>(
  'image-generation',
  processImageGeneration,
  {
    connection,
    concurrency: 2, // Process 2 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Worker started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
