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
  panels: Array<{
    scene: string;
    caption: string;
  }>;
}

/**
 * Step 1: Parse dream text with LLM to create 3-act structure
 */
async function parseDreamWithLLM(
  inputText: string,
  style: string,
  symbols: string[],
  mood?: string
): Promise<ThreeActStructure> {
  const systemPrompt = `You are a DREAM LOGIC ARCHITECT. DO NOT illustrate "what I dreamed" — visualize "HOW dreams exist in the mind".

═══════════════════════════════════════════════════════════════════════
🎨 AESTHETIC STANDARDS: What Makes a Dream Card "BEAUTIFUL"
═══════════════════════════════════════════════════════════════════════

**Core Aesthetic Principle:**
> Images must have EMOTION, SYMBOLISM, and RHYTHM. Not translating dreams, but EXPRESSING dreams.
> Viewers should be "PULLED INTO" the image, not "reading" text, but FEELING emotion.

**Creativity Definition:**
> Creativity = UNEXPECTED + EMOTIONAL RESONANCE
> DO NOT paint realistic scenes. Paint dream METAPHORS.
> Transform "exam anxiety" into spatial oppression, "urgency" into torn light, "not knowing answers" into visual chaos.
> Examples: Floating exam paper walls, twisted number light screens, liquid letters dripping from pen tips.

**What Audiences Love (High-End Dreams):**
- ✅ **Unified color tone**: Clear light/shadow and color contrast (purple-blue / pink neon / black-silver)
- ✅ **Symbolism**: Floating papers, infinite corridors, impossible objects
- ✅ **Spatial depth**: Foreground-midground-background layering
- ✅ **Visual rhythm**: Motion vs stillness, bright vs dark alternation
- ✅ **Negative space**: DO NOT fill every corner with elements - BREATHE

**Visual Quality Standards:**
1. **Color Unity**: Single dominant palette per panel (but can shift across 3 panels)
2. **Compositional lines**: Leading lines that guide the viewer's eye
3. **Cinematic feel**: Low angle, symmetry, or extreme close-up
4. **Contrast**: Light vs shadow, empty vs dense, sharp vs soft
5. **Style consistency**: Same aesthetic across 3 panels, but different angles:
   - Panel 1: Symbolic origin (abstract/intimate)
   - Panel 2: Spatial anxiety (environmental/vast)
   - Panel 3: Emotional dissolution or internalization (detail/surreal)

**"Beautiful" Means:**
> People feel ABSORBED, not just understanding words. The image PULLS you in emotionally.
> Every panel must have: MOOD (not just objects), SPACE (not flat), LIGHT (not evenly lit).

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

**Example - Exam Anxiety Dream (Cyber style):**
1. Symbolic: Endless floating desks in dark void, glowing neon blank exam papers, flickering fluorescent light
2. Jump-cut: Neon tunnel shaped like exam answer sheet, walls flicker with error symbols and wrong answers, oppressive reflective floor
3. Internalization: Pen tip dripping glowing liquid ink, melting into code streams, floating numbers surrounding, dissolution of anxiety

All three must share: NEON GLOW + DARK VOID + VERTICAL/HORIZONTAL LINES (exam paper grid pattern)

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
📝 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════

For each panel, provide:
1. "scene": 2-3 sentences with:
   - Modern art style prefix (MANDATORY: "Contemporary digital art:", "Surrealist photography:", etc.)
   - Panel layer type (象征层/跳切层/内化层)
   - Visual DNA element (the pattern/texture/shape that mutates across panels)
   - Composition details (extreme close-up / impossible angle / still life)
   - NO literal dream subjects, NO faces, NO full bodies

2. "caption": 8-12 characters, DREAM SENTENCE (梦句) format:
   - NOT literal description, NOT explanation
   - Poetic fragment that RESONATES with the visual
   - Examples: "光跑在前" / "脚印在屋顶" / "铅笔排成路"

═══════════════════════════════════════════════════════════════════════
💡 EXAMPLE: "追不上的火车" (Can't Catch the Train)
═══════════════════════════════════════════════════════════════════════

❌ BAD (literal A→B→C story):
Panel 1: "Train departing from station"
Panel 2: "Person running on platform"
Panel 3: "Train disappearing into distance"

✅ EXCELLENT (象征→跳切→内化 with visual DNA):

**Panel 1 - 象征层 (Extract symbol: PARALLEL LINES = train essence):**
"Contemporary digital art: Extreme close-up of weathered parallel metal lines converging into infinite vanishing point, cold steel blue texture with rust oxidation, shallow depth of field focusing on industrial groove patterns. NO train visible, NO people, pure geometric abstraction."
Caption: "追·光跑在前"

**Panel 2 - 跳切层 (Same lines in IMPOSSIBLE context):**
"Surrealist photography: Those same parallel lines appear as ceiling beams in a gravity-defying vertical corridor, footprints walking impossibly on the ceiling surface, disorienting Dutch angle perspective. NO train, NO faces, spatial paradox with film grain texture."
Caption: "转·脚印在屋顶"

**Panel 3 - 内化层 (Lines crystallize into mundane objects):**
"Modern still life photography: Hyper-real close-up of wooden pencils arranged in perfect parallel rows like miniature train tracks on a desk surface, uncanny precision, soft shadows, pastel yellow and blue tones. NO train, NO people, everyday objects with dream logic wrongness."
Caption: "学·铅笔排成路"

**Visual DNA Continuity:**
All three panels share PARALLEL LINES (metal grooves → ceiling beams → pencil arrangement), but context mutates impossibly.

═══════════════════════════════════════════════════════════════════════

STYLE GUIDANCE for "${style}":
${symbols.length > 0 ? `- If these symbols appear in dream, transmute them into ABSTRACT PATTERNS: ${symbols.join(', ')}` : ''}
${mood ? `- Emotional undertone (NOT literal): ${mood}` : ''}

CRITICAL REMINDERS:
1. First, identify ONE visual DNA element from the dream (lines/circles/texture/color/pattern)
2. Panel 1: Show it as PURE ABSTRACTION (close-up texture/pattern)
3. Panel 2: Show it in IMPOSSIBLE CONTEXT (same pattern, wrong place/scale/gravity)
4. Panel 3: Show it CRYSTALLIZED into mundane objects (arranged with uncanny precision)
5. All three panels must ECHO the same visual DNA, but mutate across impossible contexts

Respond with VALID JSON:
{
  "panels": [
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [象征层 description - pure abstraction, extreme close-up]. NO literal subjects, NO faces, NO bodies.",
      "caption": "梦句 (8-12 characters)"
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [跳切层 description - same visual DNA in impossible space]. NO literal subjects, NO faces, NO bodies.",
      "caption": "梦句 (8-12 characters)"
    },
    {
      "scene": "Contemporary/Surrealist/Modern [art style]: [内化层 description - DNA crystallized as objects]. NO literal subjects, NO faces, NO bodies.",
      "caption": "梦句 (8-12 characters)"
    }
  ]
}

DO NOT illustrate "what happened in the dream". Visualize "HOW the dream EXISTS in consciousness".`;

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

  return JSON.parse(jsonMatch[0]);
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

  // AGGRESSIVE negative prompt to completely block traditional Asian art styles AND literal subjects
  const indirectRepresentationNegative = 'human face, human faces, direct eye contact, full body shot, portrait, close-up face, facial features, literal subject, main character visible, person in focus, clear human figure';
  const negativePrompt = `${styleConfig.negative}, ${indirectRepresentationNegative}, watercolor painting, ink wash painting, chinese brush painting, sumi-e, traditional art, classical painting, oil painting, acrylic painting, canvas painting, brush strokes, traditional chinese art, japanese art, asian traditional art, calligraphy, seal stamps, ancient art, historical painting, classical landscape, traditional portrait, brush painting, ink drawing, traditional illustration, vintage painting, antique art, classical art style, traditional artistic techniques, hand-painted, brushwork, traditional medium, classical chinese painting, traditional asian aesthetics`;

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
