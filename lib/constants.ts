// Style presets with COMPOSITION TEMPLATES for three-act structure
// 4 core styles: minimal (line art) / film (grain) / cyber (neon) / pastel (soft)
export const STYLES = {
  minimal: {
    name: 'Minimal Sketch',
    // Composition templates for 因-境-势 structure
    compositionGuide: {
      panel1: 'close-up macro shot, 2/3 negative space, symbolic object in corner, high contrast black and white, minimalist geometry',
      panel2: 'wide shot with central void, extreme negative space, minimalist geometric environment, low horizon line, clean lines',
      panel3: 'diagonal motion line across frame, dynamic angle, high contrast, single flowing element, abstract movement',
    },
    // Sketch-first: Clean line art, simple composition
    sketchPrompt: 'simple line art sketch, clean black ink on white, minimal strokes, elegant composition, architectural drawing style, precise linework, uncluttered, few elements, professional illustration',
    // Final render: Refined minimal aesthetic
    prompt: 'minimal line art illustration, clean geometric shapes, simple elegant composition, white and neutral tones, few carefully placed strokes, professional graphic design, uncluttered negative space, modern minimalist aesthetic, precise clean lines, sophisticated simplicity',
    negative: 'complex busy, cluttered, photorealistic, color noise, texture heavy, chaotic, messy lines, sketchy rough, amateur doodle, text, watermark, faces, full bodies, literal subjects',
  },
  film: {
    name: 'Film Grain',
    // Composition templates for 因-境-势 structure
    compositionGuide: {
      panel1: 'off-center detail shot, shallow depth of field, rule of thirds, bokeh background, cinematic framing, film grain texture',
      panel2: 'symmetrical low-angle landscape, vignette framing, wide environmental shot, dramatic sky, vintage film aesthetic',
      panel3: 'dynamic motion blur, diagonal composition, lens flare, panning shot effect, high shutter drag, film grain',
    },
    // Sketch-first: Quick film-style composition
    sketchPrompt: 'film photograph sketch, simple composition, rule of thirds guide, vignette framing, basic tonal values, vintage camera aesthetic',
    // Final render: Full film aesthetic
    prompt: 'analog film photography, natural film grain texture, subtle vignette, cinematic composition with rule of thirds, cool and warm color balance, Kodak Portra aesthetic, dust particles in light, authentic vintage photo quality, symmetrical framing, nostalgic mood, professional cinematography',
    negative: 'digital clean, oversaturated, HDR, artificial, modern smartphone, flat, overprocessed, text, watermark, low quality, faces, full bodies, direct eye contact',
  },
  cyber: {
    name: 'Cyber Mist',
    // Composition templates for 因-境-势 structure
    compositionGuide: {
      panel1: 'reflective surface close-up, neon light accents, mirror or wet ground, purple-cyan glow, macro detail shot',
      panel2: 'wide neon-lit environment, strong perspective lines, atmospheric fog, reflective floor, futuristic architecture, low angle',
      panel3: 'motion trails with neon streaks, diagonal speed lines, reflective surfaces, dynamic angle, light trails, cyberpunk energy',
    },
    // Sketch-first: Basic neon composition
    sketchPrompt: 'cyberpunk scene layout, neon light placement, fog atmosphere guide, reflective surface indication, basic color zones purple and cyan',
    // Final render: Full cyberpunk aesthetic
    prompt: 'cyberpunk neon dreamscape, purple and cyan color palette, thin atmospheric fog, wet reflective floor surfaces, glowing neon haze, glossy materials, futuristic noir mood, volumetric light rays, cinematic sci-fi atmosphere, moody lighting, blade runner aesthetic',
    negative: 'natural daylight, warm colors, dry matte, bright cheerful, rustic vintage, organic natural, text, watermark, low quality, faces, full bodies, literal subjects',
  },
  pastel: {
    name: 'Pastel Fairytale',
    // Composition templates for 因-境-势 structure
    compositionGuide: {
      panel1: 'soft-focus detail, center composition, gentle bokeh, pastel colors, macro shot, dreamy atmosphere',
      panel2: 'dreamy wide shot, low saturation landscape, misty atmosphere, soft lighting, ethereal environment, gentle colors',
      panel3: 'ethereal motion, soft edges, floating particles, gentle blur, pastel streaks, whimsical movement',
    },
    // Sketch-first: Soft composition guide
    sketchPrompt: 'soft watercolor sketch, gentle composition, pastel color zones, delicate light indication, whimsical fairytale layout, simple soft edges',
    // Final render: Full pastel dreamscape
    prompt: 'soft pastel dreamscape, gentle diffused lighting, low saturation watercolor tones, delicate grain texture, soft blurred edges, whimsical fairytale atmosphere, tender emotional mood, Studio Ghibli inspired gentleness, dreamy bokeh, peaceful enchanted feeling',
    negative: 'harsh contrast, oversaturated, sharp edges, dark gritty, photorealistic, industrial cold, bold graphic, text, watermark, low quality, faces, full bodies, direct confrontation',
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
