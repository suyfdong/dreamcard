// Style presets for image generation
// Maps frontend styles (memory/surreal/lucid/fantasy) to prompts
export const STYLES = {
  memory: {
    name: 'Memory Dream',
    prompt: 'nostalgic vintage photograph, warm sepia tones, soft focus, film grain, gentle lighting, emotional atmosphere, reminiscent mood',
    negative: 'sharp, modern, digital, cold colors, harsh lighting, text, watermark',
  },
  surreal: {
    name: 'Surreal Dream',
    prompt: 'surrealist art, dreamlike atmosphere, impossible geometry, haunting ethereal mood, mysterious shadows, cinematic composition, fine art photography',
    negative: 'realistic, ordinary, mundane, text, watermark, cluttered',
  },
  lucid: {
    name: 'Lucid Dream',
    prompt: 'cyberpunk aesthetic, neon lights, cyan and purple colors, wet reflections, thin fog, glossy surfaces, futuristic atmosphere, mysterious mood',
    negative: 'natural, daylight, warm colors, rustic, text, watermark',
  },
  fantasy: {
    name: 'Fantasy Dream',
    prompt: 'magical fantasy art, soft pastel colors, whimsical atmosphere, fairy tale mood, gentle lighting, dreamy glow, enchanted environment',
    negative: 'realistic, dark, gritty, harsh, text, watermark',
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
