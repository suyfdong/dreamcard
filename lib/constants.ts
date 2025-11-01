// Style presets with COMPOSITION TEMPLATES for three-act structure
// 4 core styles: minimal (line art) / film (grain) / cyber (neon) / pastel (soft)
export const STYLES = {
  minimal: {
    name: 'Minimal Sketch',
    // Composition templates for 象征→跳切→内化 structure
    compositionGuide: {
      panel1: 'extreme close-up of geometric pattern or texture, 70% negative space, stark black and white contrast, abstract detail shot, minimalist line work',
      panel2: 'same pattern in impossible location (vertical surface, inverted space), disorienting angle, minimalist impossible geometry, clean lines defying logic',
      panel3: 'pattern crystallized as arranged objects (pencils, sticks, minimal items), uncanny precision still life, geometric wrongness, stark shadows',
    },
    // Sketch-first: Clean line art, simple composition
    sketchPrompt: 'simple line art sketch, clean black ink on white, minimal strokes, elegant composition, architectural drawing style, precise linework, uncluttered, few elements, professional illustration',
    // Final render: Refined minimal aesthetic
    prompt: 'minimal line art illustration, clean geometric shapes, simple elegant composition, white and neutral tones, few carefully placed strokes, professional graphic design, uncluttered negative space, modern minimalist aesthetic, precise clean lines, sophisticated simplicity',
    negative: 'complex busy, cluttered, photorealistic, color noise, texture heavy, chaotic, messy lines, sketchy rough, amateur doodle, text, watermark, faces, full bodies, literal subjects',
  },
  film: {
    name: 'Film Grain',
    // Composition templates for 象征→跳切→内化 structure
    compositionGuide: {
      panel1: 'grainy macro shot of organic texture or pattern, shallow depth of field, film grain heavy, close-up on material surface, cinematic detail',
      panel2: 'same texture in gravity-defying context (on ceiling, vertical wall, floating), cinematic wide angle with vignette, impossible spatial orientation, film grain',
      panel3: 'texture materialized as everyday objects arranged with uncanny logic, hyper-real still life, film grain overlay, subtle wrongness in precision',
    },
    // Sketch-first: Quick film-style composition
    sketchPrompt: 'film photograph sketch, simple composition, rule of thirds guide, vignette framing, basic tonal values, vintage camera aesthetic',
    // Final render: Full film aesthetic
    prompt: 'analog film photography, natural film grain texture, subtle vignette, cinematic composition with rule of thirds, cool and warm color balance, Kodak Portra aesthetic, dust particles in light, authentic vintage photo quality, symmetrical framing, nostalgic mood, professional cinematography',
    negative: 'digital clean, oversaturated, HDR, artificial, modern smartphone, flat, overprocessed, text, watermark, low quality, faces, full bodies, direct eye contact',
  },
  cyber: {
    name: 'Cyber Mist',
    // Composition templates for 象征→跳切→内化 structure
    compositionGuide: {
      panel1: 'neon-lit abstract pattern or reflection close-up, purple-cyan color field, glossy texture macro shot, reflective surface detail',
      panel2: 'same neon pattern in impossible architecture (vertical corridor, inverted space), vertiginous perspective, atmospheric fog, spatial paradox with reflections',
      panel3: 'neon elements crystallized as solid objects in uncanny arrangement, glossy still life with cyberpunk lighting, geometric precision with wrongness',
    },
    // Sketch-first: Basic neon composition
    sketchPrompt: 'cyberpunk scene layout, neon light placement, fog atmosphere guide, reflective surface indication, basic color zones purple and cyan',
    // Final render: Full cyberpunk aesthetic
    prompt: 'cyberpunk neon dreamscape, purple and cyan color palette, thin atmospheric fog, wet reflective floor surfaces, glowing neon haze, glossy materials, futuristic noir mood, volumetric light rays, cinematic sci-fi atmosphere, moody lighting, blade runner aesthetic',
    negative: 'natural daylight, warm colors, dry matte, bright cheerful, rustic vintage, organic natural, text, watermark, low quality, faces, full bodies, literal subjects',
  },
  pastel: {
    name: 'Pastel Fairytale',
    // Composition templates for 象征→跳切→内化 structure
    compositionGuide: {
      panel1: 'soft-focus abstract shape or color field, pastel gradient texture, gentle bokeh, dreamy close-up on soft pattern',
      panel2: 'same soft shape in surreal context (floating, inverted, defying physics), gentle impossibility, misty atmosphere, pastel color continuity',
      panel3: 'shape solidified into soft objects with dream logic, pastel still life with uncanny arrangement, gentle wrongness, whimsical precision',
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
