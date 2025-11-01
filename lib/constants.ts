// Style presets based on ORIGINAL v2.md design
// 4 core styles: minimal (line art) / film (grain) / cyber (neon) / pastel (soft)
export const STYLES = {
  minimal: {
    name: 'Minimal Sketch',
    // Sketch-first: Clean line art, simple composition
    sketchPrompt: 'simple line art sketch, clean black ink on white, minimal strokes, elegant composition, architectural drawing style, precise linework, uncluttered, few elements, professional illustration',
    // Final render: Refined minimal aesthetic
    prompt: 'minimal line art illustration, clean geometric shapes, simple elegant composition, white and neutral tones, few carefully placed strokes, professional graphic design, uncluttered negative space, modern minimalist aesthetic, precise clean lines, sophisticated simplicity',
    negative: 'complex busy, cluttered, photorealistic, color noise, texture heavy, chaotic, messy lines, sketchy rough, amateur doodle, text, watermark',
  },
  film: {
    name: 'Film Grain',
    // Sketch-first: Quick film-style composition
    sketchPrompt: 'film photograph sketch, simple composition, rule of thirds guide, vignette framing, basic tonal values, vintage camera aesthetic',
    // Final render: Full film aesthetic
    prompt: 'analog film photography, natural film grain texture, subtle vignette, cinematic composition with rule of thirds, cool and warm color balance, Kodak Portra aesthetic, dust particles in light, authentic vintage photo quality, symmetrical framing, nostalgic mood, professional cinematography',
    negative: 'digital clean, oversaturated, HDR, artificial, modern smartphone, flat, overprocessed, text, watermark, low quality',
  },
  cyber: {
    name: 'Cyber Mist',
    // Sketch-first: Basic neon composition
    sketchPrompt: 'cyberpunk scene layout, neon light placement, fog atmosphere guide, reflective surface indication, basic color zones purple and cyan',
    // Final render: Full cyberpunk aesthetic
    prompt: 'cyberpunk neon dreamscape, purple and cyan color palette, thin atmospheric fog, wet reflective floor surfaces, glowing neon haze, glossy materials, futuristic noir mood, volumetric light rays, cinematic sci-fi atmosphere, moody lighting, blade runner aesthetic',
    negative: 'natural daylight, warm colors, dry matte, bright cheerful, rustic vintage, organic natural, text, watermark, low quality',
  },
  pastel: {
    name: 'Pastel Fairytale',
    // Sketch-first: Soft composition guide
    sketchPrompt: 'soft watercolor sketch, gentle composition, pastel color zones, delicate light indication, whimsical fairytale layout, simple soft edges',
    // Final render: Full pastel dreamscape
    prompt: 'soft pastel dreamscape, gentle diffused lighting, low saturation watercolor tones, delicate grain texture, soft blurred edges, whimsical fairytale atmosphere, tender emotional mood, Studio Ghibli inspired gentleness, dreamy bokeh, peaceful enchanted feeling',
    negative: 'harsh contrast, oversaturated, sharp edges, dark gritty, photorealistic, industrial cold, bold graphic, text, watermark, low quality',
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
