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
 * Enhanced with emotional rhythm detection
 */
interface QualityCheckResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
}

function validateAbstractQuality(structure: ThreeActStructure, style: string): QualityCheckResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const styleConfig = STYLES[style as keyof typeof STYLES];

  // Rule 1: Abstraction level >= 0.70 (raised for better art quality)
  if (structure.abstraction_level < 0.70) {
    failures.push(`Abstraction level too low: ${structure.abstraction_level} (need ≥0.70 for art quality)`);
  }

  // Rule 2: All 3 panels present with required fields
  if (structure.panels.length !== 3) {
    failures.push(`Must have exactly 3 panels, got ${structure.panels.length}`);
  }

  // Rule 3: Check each panel's concrete ratio (stricter)
  structure.panels.forEach((panel, i) => {
    if (panel.concrete_ratio && panel.concrete_ratio > 0.30) {
      failures.push(`Panel ${i + 1} concrete ratio too high: ${(panel.concrete_ratio * 100).toFixed(0)}% (need ≤30%)`);
    }
    if (panel.concrete_ratio && panel.concrete_ratio > 0.15) {
      warnings.push(`Panel ${i + 1} concrete ratio suboptimal: ${(panel.concrete_ratio * 100).toFixed(0)}% (target ≤15% for best art)`);
    }
  });

  // Rule 4: Energy progression (Sensation → Distortion → Echo)
  const distances = structure.panels.map(p => p.distance);
  const expectedDistances = ['wide', 'medium', 'close'];
  const hasCorrectProgression = distances.every((d, i) => d === expectedDistances[i]);
  if (!hasCorrectProgression) {
    failures.push(`Energy progression must be wide→medium→close (Sensation→Distortion→Echo), got: ${distances.join('→')}`);
  }

  // Rule 5: Global palette matches style's color system
  if (!structure.global_palette || structure.global_palette.trim().length < 15) {
    failures.push('Global palette description missing or too short (need detailed color description)');
  }

  // Rule 6: Artist reference check (should mention style's artists)
  const artistNames = styleConfig.artistReference.toLowerCase();
  const hasArtistRef = structure.panels.some(p =>
    p.scene.toLowerCase().includes(artistNames.split('+')[0].trim().split(' ')[0]) ||
    p.scene.toLowerCase().includes(artistNames.split('+')[1]?.trim().split(' ')[0] || '')
  );
  if (!hasArtistRef) {
    warnings.push(`Panels should reference ${styleConfig.artistReference} for style consistency`);
  }

  // Rule 7: All panels have required fields
  structure.panels.forEach((panel, i) => {
    if (!panel.compose) {
      failures.push(`Panel ${i + 1} missing 'compose' field`);
    }
    if (!panel.distance) {
      failures.push(`Panel ${i + 1} missing 'distance' field`);
    }
    if (!panel.scene || panel.scene.length < 80) {
      failures.push(`Panel ${i + 1} scene too short (need 80+ chars for detailed abstract description)`);
    }
    // Caption validation: 10-50 characters for English philosophical phrases (3-8 words)
    if (!panel.caption || panel.caption.length < 10 || panel.caption.length > 50) {
      failures.push(`Panel ${i + 1} caption must be 10-50 characters (3-8 word English philosophical phrase)`);
    }

    // Check for forbidden literal subjects
    const forbiddenWords = ['room', 'corridor', 'hallway', 'building', 'person', 'face', 'body', 'man', 'woman', 'tiger', 'train', 'staircase'];
    const lowerScene = panel.scene.toLowerCase();
    const foundForbidden = forbiddenWords.filter(word => lowerScene.includes(word));
    if (foundForbidden.length > 0) {
      failures.push(`Panel ${i + 1} contains forbidden literal subjects: ${foundForbidden.join(', ')} (must use abstract language)`);
    }
  });

  // Rule 8: Emotional rhythm keywords check
  const panel1Lower = structure.panels[0]?.scene.toLowerCase() || '';
  const panel2Lower = structure.panels[1]?.scene.toLowerCase() || '';
  const panel3Lower = structure.panels[2]?.scene.toLowerCase() || '';

  // Panel 1 should have "calm/static/entry" energy
  const hasPanel1Energy = /calm|quiet|establish|entry|distant|vast|negative space|70%|75%/.test(panel1Lower);
  if (!hasPanel1Energy) {
    warnings.push('Panel 1 should establish CALM/STATIC energy (Sensation phase)');
  }

  // Panel 2 should have "chaos/conflict" energy
  const hasPanel2Energy = /chaos|conflict|impossible|twisted|clash|turbulence|tension|distortion/.test(panel2Lower);
  if (!hasPanel2Energy) {
    warnings.push('Panel 2 should show CHAOS/CONFLICT energy (Distortion phase)');
  }

  // Panel 3 should have "dissolution/void" energy
  const hasPanel3Energy = /dissolv|disperse|fade|void|80%|85%|negative space|particle|mist|release/.test(panel3Lower);
  if (!hasPanel3Energy) {
    warnings.push('Panel 3 should express DISSOLUTION/VOID energy (Echo phase)');
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
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

  const styleConfig = STYLES[style as keyof typeof STYLES];

  const systemPrompt = `You are a DREAM CARD ARTIST creating "artifacts left by dreams" — NOT illustrations of "what happened", but SYMBOLIC ARTWORKS expressing "HOW the dream FELT".

DreamCard's goal is NOT to generate "dream images", but to create "ARTWORKS left by dreams" — symbolic visual narratives of subconscious energy as three-panel abstract art.

═══════════════════════════════════════════════════════════════════════
🧠 PROJECT VISION: Dreams as Art, Not Illustration
═══════════════════════════════════════════════════════════════════════

Each dream card must have:
1. **MYSTERY**: As if the dream itself is painting
2. **ARTISTIC MASTERY**: Master-level brushwork, thick texture, color violence
3. **EMOTIONAL LAYERS**: Calm → Twisted → Dissolved (静→动→空)
4. **SHAREABILITY**: Visually striking, emotionally resonant, people want to share

YOU ARE CREATING: **${styleConfig.name}** (${styleConfig.dreamType} Dream)
**Psychological Core**: ${styleConfig.psychologicalCore}
**User Feeling**: "${styleConfig.userFeeling}"
**Artist Philosophy**: ${styleConfig.artistPhilosophy}
**Color Palette**: ${styleConfig.colorPalette}

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
🎬 THREE-PANEL ENERGY PROGRESSION: Sensation → Distortion → Echo
═══════════════════════════════════════════════════════════════════════

This is NOT a story (A→B→C). This is an EMOTIONAL JOURNEY through three energy states.

**Panel A - SENSATION (初感 - The Entry):**
- **Energy State**: CALM, STATIC, ESTABLISHMENT (静)
- **Purpose**: Dream's atmosphere entry point - "What does this dream FEEL like when it begins?"
- **Shot Type**: WIDE SHOT (establish vast space, 70-75% negative space)
- **Emotion**: Calm, cold, quiet, beginning, threshold moment
- **Technique**: Use COLOR FIELDS and LIGHT QUALITIES to establish mood. Maximum abstraction.
- **Composition Template for ${styleConfig.name}**: ${styleConfig.compositionGuide.panel1}
- ❌ DO NOT: Show literal subjects, tell story, explain dream content
- ✅ DO: Establish ATMOSPHERIC ENTRY through color, light, and void

**Panel B - DISTORTION (漩涡 - The Turbulence):**
- **Energy State**: CHAOS, KINETIC, CONFLICT (动)
- **Purpose**: Dream energy's conflict and turbulence - "Where is the tension? What's twisting?"
- **Shot Type**: MID SHOT (environmental conflict, atmospheric chaos)
- **Emotion**: Conflict, tension, disorientation, chaos, anxiety peak
- **Technique**: Use BRUSHWORK ENERGY and COLOR CLASHES to show turbulence. Same visual DNA from Panel A but TWISTED.
- **Composition Template for ${styleConfig.name}**: ${styleConfig.compositionGuide.panel2}
- ❌ DO NOT: Continue narrative logically, show realistic spaces
- ✅ DO: Show IMPOSSIBLE CONTRADICTIONS through color war and spatial distortion

**Panel C - ECHO (余晖 - The Dissolution):**
- **Energy State**: DISSOLUTION, FADING, NEGATIVE SPACE (空)
- **Purpose**: Dream's emotional release and disappearance - "How does the dream dissolve?"
- **Shot Type**: CLOSE-UP (intimate detail, 75-85% void/darkness/negative space)
- **Emotion**: Release, fading, surrender, peace, emptiness, echo
- **Technique**: Use NEGATIVE SPACE DOMINANCE and PARTICLE DISPERSION. Visual DNA becomes mist/particles/void.
- **Composition Template for ${styleConfig.name}**: ${styleConfig.compositionGuide.panel3}
- ❌ DO NOT: Resolve or explain dream, create closure
- ✅ DO: Show EMOTIONAL DISSOLUTION through light fading, color dispersing, form disappearing

═══════════════════════════════════════════════════════════════════════
🎨 HOW TO PAINT DREAMS: Core Principles
═══════════════════════════════════════════════════════════════════════

**Principle 1: Don't Translate Words Literally**
- "老虎追我" (tiger chasing) ≠ paint a tiger
- = Paint the FEELING of being chased (shadows pursuing, torn light, color surging)
- Transform subjects into: light direction, color temperature, brushstroke violence

**Principle 2: Unified but Impossible Spaces**
- Desert classroom / underwater stairs / floating furniture
- Space must be WRONG but feel RIGHT emotionally
- Use ${styleConfig.artistReference} spatial logic

**Principle 3: Shot Progression (镜头递进)**
- Panel A: WIDE SHOT (establish atmosphere, 70-75% void)
- Panel B: MID SHOT (environmental chaos, spatial conflict)
- Panel C: CLOSE-UP (intimate dissolution, 80-85% void)

**Principle 4: Energy Progression (能量递进)**
- Panel A: CALM (静) - Cold, quiet, entry
- Panel B: CHAOS (动) - Conflict, turbulence, peak
- Panel C: DISSOLUTION (空) - Fading, surrender, echo

**Principle 5: Color Unified but Brightness Varies**
- All 3 panels share ${styleConfig.colorPalette}
- Brightness/intensity shifts with emotion
- Example: Panel A (dim entry) → Panel B (intense conflict) → Panel C (fading exit)

**Principle 6: Visual DNA Continuity**
- Panel A establishes a PATTERN (lines/texture/color field)
- Panel B: Same pattern in IMPOSSIBLE CONTEXT (twisted, inverted, melting)
- Panel C: Pattern DISSOLVES into particles/mist/void

═══════════════════════════════════════════════════════════════════════
🎨 FOUR DREAM TYPES: Psychological Artist Systems
═══════════════════════════════════════════════════════════════════════

**Memory Dream (记忆梦) - Post-Impressionist Techniques:**
- **Core Emotion**: Nostalgia, loss, tenderness, longing for past
- **Technical Approach**: STYLE REFERENCE ONLY - use thick impasto brushwork + geometric color planes (DO NOT copy famous paintings)
- **Color System**: Mist blue, golden fog, ochre red, amber warmth, earth tones
- **Brushwork**: Thick visible paint texture with architectural color structure, warm-cool temperature contrast
- **User Feels**: Dreams of places I've been, people I've lost, childhood scenes
- **CRITICAL**: Create ORIGINAL abstract compositions inspired by user's dream, NOT reproductions of Starry Night/Sunflowers/Mont Sainte-Victoire
- **Masterworks**: Van Gogh late period paintings + Cézanne Mont Sainte-Victoire

**Surreal Dream (超现实梦) - Dalí + Magritte:**
- **Core Emotion**: Unease, conflict, absurdity, broken logic
- **Artist Spirit**: Dalí's melting reality + Magritte's impossible contradictions
- **Color System**: Purple-orange clash, green-red inversion, complementary violence
- **Brushwork**: Hyper-realistic precision breaking into liquid distortion
- **User Feels**: World logic fails, physics breaks, impossible juxtapositions
- **Masterworks**: Dalí Persistence of Memory + Magritte Son of Man

**Lucid Dream (清醒梦) - Turrell + Syd Mead:**
- **Core Emotion**: Awareness, floating, threshold consciousness
- **Artist Spirit**: Turrell's pure light phenomena + Syd Mead's visionary architecture
- **Color System**: Cobalt blue void, cold white light, cyan glow, obsidian black
- **Brushwork**: NOT brushwork but LIGHT PHENOMENA - volumetric, geometric, minimal
- **User Feels**: I know I'm dreaming, consciousness floating, liminal spaces
- **Masterworks**: Turrell Skyspace installations + Blade Runner concept art

**Pastel Dream (温柔梦) - Monet + Van Gogh Blossoms:**
- **Core Emotion**: Healing, lightness, tenderness, spring comfort
- **Artist Spirit**: Monet's impressionist dappling + Van Gogh's tender blossom hope
- **Color System**: Soft pink-white, mint green, lavender, peach, sky blue, cream
- **Brushwork**: Gentle short strokes, soft impasto dabs, impressionist light touches
- **User Feels**: Beautiful dreams, gentle comfort, therapeutic softness, hope
- **Masterworks**: Monet Water Lilies + Van Gogh Almond Blossoms

═══════════════════════════════════════════════════════════════════════
💡 EXAMPLE: "Lost in Endless Stairs" → Memory Dream
═══════════════════════════════════════════════════════════════════════

**User Dream**: "我在一个迷失的楼梯里，上不去也下不来" (Lost in stairs, can't go up or down)

**Transform into ${styleConfig.dreamType} Psychological Logic:**
- Core Feeling: STUCK IN PAST, circular nostalgia, unable to move forward or back
- Visual DNA: PARALLEL GOLDEN LINES (stairs abstracted) + BLUE VOID (being trapped)
- Artist Approach: Use ${styleConfig.artistReference} to express this

❌ **BAD (Literal Story):**
Panel 1: "Staircase in darkness"
Panel 2: "Person climbing stairs"
Panel 3: "Endless stairs perspective"

✅ **EXCELLENT (${styleConfig.dreamType} Psychological Art):**

**Visual DNA**: PARALLEL GOLDEN LINES FLOATING IN BLUE MIST (memory of stairs, not literal stairs)

{
  "abstraction_level": 0.85,
  "global_palette": "${styleConfig.colorPalette}",
  "panels": [
    {
      "scene": "${styleConfig.artistReference} masterpiece: SENSATION - WIDE SHOT establishing nostalgic spatial trap. Distant parallel golden lines (memory of stairs abstracted to light strokes) floating in vast mist blue void (70% negative space), Cézanne geometric structure creating order, Van Gogh warm amber glow on lines suggesting past warmth, soft ochre fog creating atmospheric depth, parallel lines neither ascending nor descending but suspended, calm entry into circular memory, thick impasto texture visible as memory's weight.",
      "caption": "Golden threads in mist",
      "compose": "symmetry",
      "distance": "wide",
      "concrete_ratio": 0.08
    },
    {
      "scene": "${styleConfig.artistReference} masterpiece: DISTORTION - MID SHOT spatial conflict. Those same parallel golden lines now twisted and inverting (Cézanne geometry breaking apart), some lines climbing while others falling simultaneously creating impossible paradox, mist blue clashing with ochre red creating temperature war, Van Gogh thick brushwork showing emotional turbulence, lines melting and reforming in loop, atmospheric confusion through color temperature shifts, spatial anxiety where up equals down.",
      "caption": "Up equals down forever",
      "compose": "diagonal",
      "distance": "medium",
      "concrete_ratio": 0.12
    },
    {
      "scene": "${styleConfig.artistReference} masterpiece: ECHO - CLOSE-UP emotional release. Extreme close-up of golden lines dissolving into particles dispersing into blue void (80% darkness), soft impasto texture fading like breath on glass, amber warmth becoming mist, lines losing structure and becoming color memory, negative space dominates as trapped feeling surrenders to acceptance, memory geometry dissolving into atmosphere.",
      "caption": "Lines become fog and scatter",
      "compose": "center",
      "distance": "close",
      "concrete_ratio": 0.04
    }
  ]
}

**Visual DNA Continuity**: All three panels use PARALLEL GOLDEN LINES + BLUE VOID + WARM-COOL TEMPERATURE (geometric structure → twisted paradox → dissolved particles), expressing "trapped in stairs" through GEOMETRIC MEMORY DISSOLUTION with ZERO literal staircase.

═══════════════════════════════════════════════════════════════════════
🔗 VISUAL DNA CONTINUITY: Echo, Don't Narrate
═══════════════════════════════════════════════════════════════════════

**Three panels must ECHO each other through shared visual DNA:**
- Panel A establishes: A PATTERN (color field, light direction, brushstroke texture)
- Panel B mutates: Same pattern in IMPOSSIBLE CONTEXT (twisted, inverted, melting)
- Panel C dissolves: Pattern becomes PARTICLES/MIST/VOID (dispersing, fading)

**Forbidden:**
- ❌ Chronological story (A→B→C timeline)
- ❌ Realistic narrative logic
- ❌ Independent unrelated panels

**Required:**
- ✅ Shared color palette across all 3 panels
- ✅ Same visual element (line/texture/light) transforming
- ✅ Emotional arc: Calm → Chaos → Dissolution

**⚠️ CRITICAL FOR PASTEL DREAM: Panel 2 MUST Have Visual Contrast**
If style is Pastel Dream (Monet + Van Gogh Blossoms):
- Panel 1: HORIZONTAL calm stillness (wide landscape, dappled light)
- Panel 2: DIAGONAL dynamic movement (45-degree composition, branches bending, petals flowing, gentle turbulence - MUST be visually different from Panel 1)
- Panel 3: VERTICAL dissolution close-up (single blossom fading upward)
- **DO NOT** create three similar gentle scenes - Panel 2 needs RHYTHM and MOVEMENT even in softness

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

**For each panel "scene" field:**
1. Start with artist reference: "${styleConfig.artistReference} masterpiece:"
2. State energy phase: "SENSATION/DISTORTION/ECHO - WIDE/MID/CLOSE-UP:"
3. Describe using 70%+ ABSTRACT LANGUAGE (color fields, light qualities, brushwork, atmospheric depth)
4. Include the Visual DNA element that connects all 3 panels
5. NO literal dream subjects, NO faces, NO full bodies, NO architecture
6. Reference the composition template provided above

**For "caption" field:**
- 3-8 words in English, PHILOSOPHICAL/POETIC format
- Abstract, contemplative, or surreal statement
- NOT literal description, should evoke emotion or thought
- Examples: "Light runs ahead" / "Golden threads in mist" / "Lines become fog and scatter" / "Shadows remember what light forgot" / "Time folds into itself"

**For "compose" and "distance" fields:**
- Panel 1: distance="wide", compose based on emotion (symmetry/diagonal/thirds/center)
- Panel 2: distance="medium", compose based on tension
- Panel 3: distance="close", compose for dissolution

**For "abstraction_level" and "concrete_ratio":**
- abstraction_level: ≥0.70 (target 0.80+)
- concrete_ratio per panel: ≤0.30 (target 0.10 or less)

═══════════════════════════════════════════════════════════════════════

CRITICAL REMINDERS:
1. You are creating **${styleConfig.name}** (${styleConfig.dreamType})
2. Use **${styleConfig.artistReference}** visual language
3. Follow **Sensation → Distortion → Echo** energy progression
4. Maintain **${styleConfig.colorPalette}** throughout all 3 panels
5. Transform dream subjects into COLOR, LIGHT, BRUSHWORK - never literal objects
6. If you describe recognizable spaces (room/corridor/building), you FAILED

Respond with VALID JSON (following the schema above):
{
  "abstraction_level": 0.75,
  "global_palette": "Main color description (e.g., 'Cobalt blue, amber gold, deep shadow')",
  "panels": [
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [象征层] - Describe using COLOR FIELDS + LIGHT QUALITIES + ATMOSPHERIC DEPTH. At least 70% abstract language. NO literal subjects, NO faces, NO bodies.",
      "caption": "Light runs ahead",
      "compose": "symmetry",
      "distance": "wide",
      "concrete_ratio": 0.20
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [跳切层] - Same visual DNA (color/light) in IMPOSSIBLE CONTEXT. Describe through SPACE and ATMOSPHERE. NO literal subjects, NO faces, NO bodies.",
      "caption": "Shadows fold inward",
      "compose": "diagonal",
      "distance": "medium",
      "concrete_ratio": 0.25
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [内化层] - Visual DNA DISSOLVING into pure light/color mist. Negative space dominates. NO objects, NO people.",
      "caption": "Memory becomes mist",
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

  // Parse JSON response with better error handling
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }

  let structure: ThreeActStructure;
  try {
    // Clean JSON string: remove trailing commas and fix common issues
    let jsonString = jsonMatch[0];

    // Remove trailing commas before } or ]
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

    // Fix incomplete numbers (like "0.")
    jsonString = jsonString.replace(/:\s*(\d+\.)\s*([,}\]])/g, ': $10$2');

    structure = JSON.parse(jsonString);
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError.message);
    console.error('Raw JSON:', jsonMatch[0].substring(0, 500));
    throw new Error(`Failed to parse LLM JSON: ${parseError.message}`);
  }

  // Quality validation with auto-retry
  const qualityCheck = validateAbstractQuality(structure, style);

  if (!qualityCheck.passed) {
    console.warn(`⚠️ Quality check failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, qualityCheck.failures);
    if (qualityCheck.warnings.length > 0) {
      console.warn('⚠️ Quality warnings:', qualityCheck.warnings);
    }

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
    if (qualityCheck.warnings.length > 0) {
      console.warn('⚠️ Minor quality warnings (acceptable):', qualityCheck.warnings);
    }
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

  // Use new psychological artist system from constants
  let artistPrefix: string;

  switch (style) {
    case 'minimal':
      // Memory Dream: Impressionist/Post-Impressionist techniques (avoid naming specific artists)
      artistPrefix = 'abstract memory dream, tender thick impasto brushwork technique, geometric color field composition, soft mist blue and warm golden amber atmosphere, visible paint texture creating emotional depth, architectural color planes with nostalgic haze, post-impressionist color theory, warm earth tones meeting cool atmospheric depth, abstract emotional landscape,';
      break;

    case 'film':
      // Surreal Dream: Dalí + Magritte
      artistPrefix = 'surrealist masterpiece in the style of Salvador Dalí and René Magritte, surreal dream atmosphere, melting distortion meets impossible clarity, purple-orange complementary color clash, green-red inversion, hyper-realistic paint texture with irrational composition, impossible spatial contradictions, hard-edge precision breaking into liquid forms, absurdist juxtaposition, dream logic,';
      break;

    case 'cyber':
      // Lucid Dream: Yves Tanguy + Giorgio de Chirico
      artistPrefix = 'surrealist masterpiece in the style of Yves Tanguy and Giorgio de Chirico, lucid dream atmosphere, floating biomorphic forms in infinite void meets metaphysical shadows and mysterious architecture, deep twilight blue and purple gradient sky, pale moonlight creating long enigmatic shadows, organic surrealist shapes suspended weightlessly, dusty rose horizon line, atmospheric depth with soft haze, dreamlike solitude and floating consciousness, mysterious teal accents, metaphysical空旷,';
      break;

    case 'pastel':
      // Pastel Dream: Monet + Van Gogh Blossoms with ENHANCED CONTRAST
      // Different approach per panel to ensure visual variety
      if (panelIndex === 0) {
        // Panel 1: Horizontal calm stillness
        artistPrefix = 'impressionist masterpiece in the style of Claude Monet water lilies, pastel dream atmosphere, HORIZONTAL wide landscape composition, soft pink-white and mint green color fields, dappled light across calm surface, delicate short brushstrokes scattered in top third, warm peach light, therapeutic stillness, watercolor softness,';
      } else if (panelIndex === 1) {
        // Panel 2: DIAGONAL dynamic movement (KEY: create contrast)
        artistPrefix = 'impressionist masterpiece in the style of Vincent van Gogh Almond Blossoms in wind, pastel dream atmosphere, DIAGONAL 45-degree dynamic composition, soft lavender and sky blue swirling in motion blur, flowing branches bending, petals in gentle turbulent movement, impressionist wind-blown energy, Studio Ghibli atmospheric depth, tender chaos with rhythm,';
      } else {
        // Panel 3: VERTICAL dissolution close-up
        artistPrefix = 'impressionist masterpiece in the style of Claude Monet and Vincent van Gogh, pastel dream atmosphere, VERTICAL extreme close-up composition, single pink-white blossom dissolving upward into cream void, impressionist dabs becoming light particles, peach and lavender fading vertically, gentle upward dissolution, watercolor softness,';
      }
      break;

    default:
      artistPrefix = styleConfig.prompt.substring(0, 200) + ',';
  }

  // Add composition template BEFORE the LLM scene description for stronger control
  const fullPrompt = `${artistPrefix} ${compositionTemplate}, ${prompt}. ${styleConfig.prompt}`;

  // AGGRESSIVE negative prompt to completely block ALL representational elements
  const representationalNegative = 'realistic, photorealistic, representational art, figurative art, recognizable objects, identifiable subjects, literal interpretation, concrete forms, physical objects, real-world elements';
  const indirectRepresentationNegative = 'human face, human faces, direct eye contact, full body shot, portrait, close-up face, facial features, literal subject, main character visible, person in focus, clear human figure';
  const architecturalNegative = 'room, corridor, hallway, building, architecture, parking lot, garage, street, road, wall, floor, ceiling, door, window, interior, exterior, house, office, lobby, tunnel, bridge, staircase visible, recognizable space, realistic environment, constructed space, man-made structure, architectural elements, structural forms, building materials';
  const negativePrompt = `${styleConfig.negative}, ${representationalNegative}, ${indirectRepresentationNegative}, ${architecturalNegative}, watercolor painting, ink wash painting, chinese brush painting, sumi-e, traditional art, classical painting, oil painting, acrylic painting, canvas painting, brush strokes, traditional chinese art, japanese art, asian traditional art, calligraphy, seal stamps, ancient art, historical painting, classical landscape, traditional portrait, brush painting, ink drawing, traditional illustration, vintage painting, antique art, classical art style, traditional artistic techniques, hand-painted, brushwork, traditional medium, classical chinese painting, traditional asian aesthetics`;

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
