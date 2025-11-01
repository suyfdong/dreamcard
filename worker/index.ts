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
  const systemPrompt = `You are a visionary dream artist creating a THREE-ACT VISUAL STORY. Transform the dream into 3 distinct moments that form a complete narrative journey.

CRITICAL: The 3 panels must tell a STORY with clear progression:
- Panel 1 (BEGINNING): Introduction, the dream starts, initial mood/setting
- Panel 2 (DEVELOPMENT): Transformation, mystery deepens, tension or wonder grows
- Panel 3 (CLIMAX/RESOLUTION): Revelation, emotional peak, or dreamlike conclusion

For EACH panel, create:
1. "scene": A vivid, cinematic visual description (3-4 sentences) with:
   - Unique composition and perspective for THIS moment in the story
   - Symbolic imagery that advances the narrative
   - Dramatic lighting, colors, atmosphere specific to this act
   - Surreal or dreamlike elements that feel mysterious
   - Visual details that DIFFER from other panels (avoid repetition!)

2. "caption": A poetic, meaningful caption (8-40 characters) that TELLS the story moment

STORY GUIDELINES:
- Each panel must be VISUALLY DISTINCT (different angle, distance, lighting, mood)
- Show narrative PROGRESSION: start → transformation → conclusion
- Maintain VISUAL COHERENCE: same protagonist/setting, but evolving
- Use cinematic techniques: establishing shot → action → revelation
- Keep the SAME MAIN SUBJECT/CHARACTER across all 3 panels (if applicable)
- Show transformation through environment, not completely different scenes
- Captions should be story-like: "The door appears" → "Entering the depths" → "Among the wonders"
- Style: "${style}" - maintain aesthetic consistency while varying composition
${symbols.length > 0 ? `- Weave these symbols into the narrative: ${symbols.join(', ')}` : ''}
${mood ? `- Emotional journey ending in: "${mood}"` : ''}

Respond ONLY with valid JSON:
{
  "panels": [
    {"scene": "Panel 1: opening scene description", "caption": "beginning"},
    {"scene": "Panel 2: development/transformation description", "caption": "middle"},
    {"scene": "Panel 3: climax/resolution description", "caption": "end"}
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
 * Step 2: Generate image with Replicate FLUX
 */
async function generateImage(
  prompt: string,
  style: string
): Promise<string> {
  const styleConfig = STYLES[style as keyof typeof STYLES];

  // MAXIMUM ARTISTIC QUALITY - styles now have comprehensive prompts built-in
  const fullPrompt = `cinematic establishing shot: ${prompt}. ${styleConfig.prompt}`;
  const negativePrompt = styleConfig.negative;

  console.log('Generating ENHANCED image, prompt preview:', fullPrompt.substring(0, 150) + '...');

  const output = await replicate.run(
    'black-forest-labs/flux-schnell' as any,
    {
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 4, // FLUX schnell optimized for 4 steps
        width: GENERATION_CONFIG.IMAGE_WIDTH,
        height: GENERATION_CONFIG.IMAGE_HEIGHT,
        output_format: 'png',
        output_quality: 95, // Maximum quality
      },
    }
  ) as any;

  // FLUX schnell returns an array of URLs
  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }

  throw new Error('No image generated');
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

    // Step 2: Generate images for each panel
    console.log('Step 2: Generating images...');
    const panels = [];

    for (let i = 0; i < structure.panels.length; i++) {
      const panelData = structure.panels[i];

      console.log(`Generating panel ${i + 1}/3...`);

      // Generate image
      const imageUrl = await generateImage(panelData.scene, style);

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
          sketchUrl: null, // We're using FLUX schnell directly, no sketch phase
        },
      });

      panels.push(panel);

      // Update progress
      const progress =
        PROGRESS_STAGES.PARSING +
        ((i + 1) / GENERATION_CONFIG.NUM_PANELS) *
          (PROGRESS_STAGES.RENDERING - PROGRESS_STAGES.PARSING);

      await prisma.project.update({
        where: { id: projectId },
        data: { progress },
      });
      await job.updateProgress(progress * 100);
    }

    console.log('Step 3: All panels generated successfully');

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
