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
  const systemPrompt = `You are a DREAM INTERPRETER and VISUAL POET. Transform dreams into ABSTRACT, SYMBOLIC three-panel visual narratives using MODERN DIGITAL ART.

🎨 CORE PRINCIPLE: DO NOT be literal. Use INDIRECT REPRESENTATION, SYMBOLIC SUBSTITUTION, and POETIC METAPHOR.

═══════════════════════════════════════════════════════════════════════
📐 THREE-ACT STRUCTURE: 因 (CAUSE) → 境 (REALM) → 势 (MOMENTUM)
═══════════════════════════════════════════════════════════════════════

**Panel 1 - 因 (THE CAUSE / THE FEELING):**
- PURPOSE: Establish core conflict/emotion through SYMBOLS and HINTS
- ❌ DO NOT show the main subject directly (no full tiger, no face, no literal translation)
- ✅ DO show: TRACES (claw marks, shadows, footprints), SYMBOLS (warning signs, geometric patterns), ATMOSPHERE (colors, light quality)
- COMPOSITION: Use close-ups, abstract shapes, or symbolic objects
- TECHNIQUES: Indirect representation - show the CONSEQUENCE not the SUBJECT

**Panel 2 - 境 (THE REALM / THE SPACE):**
- PURPOSE: Build the SPATIAL/TEMPORAL/ATMOSPHERIC context
- ❌ DO NOT focus on characters/subjects
- ✅ DO show: ENVIRONMENT (vast spaces, weather, architecture), MOOD (lighting, colors, textures), SCALE (emptiness, distance)
- COMPOSITION: Wide shots, low/high angles, emphasize negative space
- TECHNIQUES: Weaken the protagonist - make them TINY or DISTANT or SILHOUETTE

**Panel 3 - 势 (THE MOMENTUM / THE DYNAMIC):**
- PURPOSE: Convey MOTION, TENSION, DIRECTION without showing the climax
- ❌ DO NOT show direct confrontation or faces
- ✅ DO show: MOTION BLUR, FRAGMENTATION, ENERGY (speed lines, particles, streaks), IMPLIED MOVEMENT (blurred footprints, wind trails)
- COMPOSITION: Diagonal lines, dynamic angles, partial frames
- TECHNIQUES: Show TRACES OF ACTION not the action itself

═══════════════════════════════════════════════════════════════════════
🎭 INDIRECT REPRESENTATION TECHNIQUES (MANDATORY)
═══════════════════════════════════════════════════════════════════════

**Instead of showing subjects directly, use:**
1. **Traces/Remnants**: Footprints, shadows, claw marks, ripples, breath fog
2. **Symbolic Substitution**: Warning stripes instead of tiger, geometric shapes instead of figures
3. **Partial/Cropped**: Only show edges, corners, silhouettes - NEVER full bodies or faces
4. **Motion Artifacts**: Blur, streaks, multiple exposures, time-lapse trails
5. **Environmental Reaction**: Sand being kicked up, water rippling, leaves scattering
6. **Negative Space**: Show what's NOT there - emptiness conveys presence

═══════════════════════════════════════════════════════════════════════
🎨 COMPOSITION TEMPLATES (bind to style)
═══════════════════════════════════════════════════════════════════════

**Minimal Style:**
- Panel 1: Close-up/macro on symbolic object, 2/3 negative space
- Panel 2: Wide shot with central void, minimalist geometry
- Panel 3: Diagonal motion line across frame, high contrast

**Film Style:**
- Panel 1: Off-center detail shot, shallow depth of field, rule of thirds
- Panel 2: Symmetrical/low-angle landscape, vignette framing
- Panel 3: Dynamic blur, diagonal composition, lens flare

**Cyber Style:**
- Panel 1: Reflective surface close-up, neon accents, mirror/water
- Panel 2: Wide neon-lit environment, strong perspective lines, fog
- Panel 3: Motion trails with neon streaks, diagonal lines, reflections

**Pastel Style:**
- Panel 1: Soft-focus detail, center composition, gentle bokeh
- Panel 2: Dreamy wide shot, low saturation, misty atmosphere
- Panel 3: Ethereal motion, soft edges, floating particles

═══════════════════════════════════════════════════════════════════════
🚫 MANDATORY NEGATIVE CONSTRAINTS
═══════════════════════════════════════════════════════════════════════

For EVERY scene, include these constraints:
- NO faces, NO full bodies, NO direct eye contact
- NO literal subjects (if dream says "tiger", DO NOT put "tiger" in prompt)
- NO text, NO logos, NO watermarks
- NO traditional art (watercolor, ink wash, calligraphy, classical painting)

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
   - Modern art style prefix (MANDATORY)
   - Composition details (shot type, angle, framing)
   - Visual elements (colors, textures, lighting)
   - Indirect representation technique
   - Negative constraints reminder

2. "caption": 8-40 characters, poetic/metaphorical

═══════════════════════════════════════════════════════════════════════
💡 EXAMPLE TRANSFORMATION: "老虎在沙漠追我"
═══════════════════════════════════════════════════════════════════════

❌ BAD (literal, direct):
Panel 1: "Tiger running"
Panel 2: "Desert landscape with person"
Panel 3: "Tiger catching up"

✅ GOOD (indirect, symbolic):
Panel 1: "Contemporary digital art: Close-up of massive claw marks carved into wind-rippled sand, sharp diagonal cuts through golden surface, heat haze distortion in background. NO tiger visible, NO faces, NO full bodies."

Panel 2: "Film photography: Wide low-angle shot of endless dunes under harsh sun, tiny distant running silhouette warped by heat waves, symmetrical composition with extreme negative space. NO animals, NO faces, minimalist scale."

Panel 3: "Modern abstract expressionism: Dynamic motion blur of exploding sand particles, edge of frame shows faint striped motion trail (tiger-stripe pattern NOT tiger), diagonal speed lines. NO faces, NO full tiger, only implied presence through traces."

═══════════════════════════════════════════════════════════════════════

STYLE GUIDANCE for "${style}":
${symbols.length > 0 ? `- Incorporate SYMBOLIC elements (abstracted): ${symbols.join(', ')}` : ''}
${mood ? `- Emotional arc toward: ${mood}` : ''}

Respond with VALID JSON:
{
  "panels": [
    {"scene": "Modern art style: [composition] [visual elements] [indirect technique]. NO faces, NO full bodies.", "caption": "poetic phrase"},
    {"scene": "Modern art style: [composition] [visual elements] [indirect technique]. NO faces, NO full bodies.", "caption": "poetic phrase"},
    {"scene": "Modern art style: [composition] [visual elements] [indirect technique]. NO faces, NO full bodies.", "caption": "poetic phrase"}
  ]
}`;

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
