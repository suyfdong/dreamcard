// Style presets for image generation - ENHANCED FOR MAXIMUM ARTISTIC IMPACT
// Maps frontend styles (memory/surreal/lucid/fantasy) to prompts
export const STYLES = {
  memory: {
    name: 'Memory Dream',
    prompt: 'ethereal nostalgic dreamscape, vintage film aesthetic, golden hour lighting with god rays, soft bokeh depth of field, delicate film grain texture, emotional cinematic atmosphere, award-winning fine art photography, masterful composition with rule of thirds, warm amber and sepia tones, intimate storytelling mood, Kodak Portra 400 film quality, haunting beautiful nostalgia',
    negative: 'sharp digital, modern smartphone photo, cold harsh lighting, artificial, flat, overexposed, underexposed, amateur composition, cluttered, text, watermark, logo, signature, low quality, blurry, pixelated',
  },
  surreal: {
    name: 'Surreal Dream',
    prompt: 'surrealist masterpiece in the style of Salvador Dali and Rene Magritte, impossible dreamlike geometry, mind-bending perspective, ethereal floating elements, mysterious chiaroscuro lighting, deep shadows and luminous highlights, metaphysical atmosphere, symbolic dream imagery, cinematic wide-angle composition, fine art museum quality, otherworldly color palette, haunting poetic mood, dramatic depth and scale',
    negative: 'realistic mundane scene, ordinary everyday, photorealistic, conventional, boring composition, flat lighting, amateur snapshot, cluttered busy, text, watermark, low quality, blurry',
  },
  lucid: {
    name: 'Lucid Dream',
    prompt: 'visionary cyberpunk dreamscape, electric neon atmosphere, vivid cyan magenta and purple color grading, wet reflective surfaces with light trails, volumetric fog and god rays, holographic elements, futuristic noir aesthetic, cinematic blade runner mood, glossy materials and chrome accents, moody atmospheric lighting, award-winning sci-fi concept art, mysterious depth, ultra-detailed textures',
    negative: 'natural daylight, warm earthy tones, rustic vintage, flat matte surfaces, conventional photography, amateur, overlit, washed out, text, watermark, low quality',
  },
  fantasy: {
    name: 'Fantasy Dream',
    prompt: 'enchanted magical realm, Studio Ghibli inspired atmosphere, soft iridescent pastel colors, glowing bioluminescent elements, ethereal fairy lights, whimsical dreamlike composition, gentle volumetric lighting with sparkles, storybook illustration quality, mystical enchanted mood, delicate watercolor textures, award-winning fantasy concept art, emotional wonder and discovery, cinematic depth of field',
    negative: 'realistic gritty, dark horror, harsh shadows, cold industrial, photorealistic mundane, amateur snapshot, overexposed, flat composition, cluttered, text, watermark, low quality',
  },
} as const;

export type StyleType = keyof typeof STYLES;

// Available symbols (lowercase for backend processing)
export const SYMBOLS = [
  'stairs',
  'mirror',
  'door',
  'ocean',
  'cat',
  'clock',
  'window',
  'fog',
  'train',
  'maze',
  'key',
] as const;

// Moods
export const MOODS = ['calm', 'lonely', 'surreal', 'mysterious', 'hopeful'] as const;

// Generation settings
export const GENERATION_CONFIG = {
  IMAGE_WIDTH: 768,
  IMAGE_HEIGHT: 1024,
  NUM_PANELS: 3,
  MAX_CAPTION_LENGTH: 40,
  MIN_CAPTION_LENGTH: 8,
  NUM_INFERENCE_STEPS: 4, // FLUX schnell is optimized for 4 steps
} as const;

// Progress stages (matching frontend expectations)
export const PROGRESS_STAGES = {
  PARSING: 0.1,
  SKETCHING: 0.35,
  RENDERING: 0.8,
  COLLAGING: 1.0,
} as const;
