// Style presets with COMPOSITION TEMPLATES for three-act structure
// 4 core styles: minimal (line art) / film (grain) / cyber (neon) / pastel (soft)
export const STYLES = {
  minimal: {
    name: 'Minimal Sketch',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: abstract geometric space with 70% negative space, distant minimal objects establishing calm mood, stark black and white contrast, line-based order',
      panel2: 'MID SHOT: impossible spatial arrangement (objects on vertical wall, inverted gravity), disorienting angle showing dream logic, clean lines with tension',
      panel3: 'CLOSE-UP: intimate detail of dissolving lines or fragmenting geometry, negative space dominates, emotional dissolution through minimal elements fading',
    },
    // Sketch-first: Clean line art, simple composition
    sketchPrompt: 'simple line art sketch, clean black ink on white, minimal strokes, elegant composition, architectural drawing style, precise linework, uncluttered, few elements, professional illustration',
    // Final render: Refined minimal aesthetic
    prompt: 'minimal line art illustration, clean geometric shapes, simple elegant composition, white and neutral tones, few carefully placed strokes, professional graphic design, uncluttered negative space, modern minimalist aesthetic, precise clean lines, sophisticated simplicity',
    negative: 'complex busy, cluttered, photorealistic, color noise, texture heavy, chaotic, messy lines, sketchy rough, amateur doodle, text, watermark, faces, full bodies, literal subjects',
  },
  film: {
    name: 'Film Grain',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: distant solitary scene with film grain, natural light, vignette framing, calm establishing mood, layered depth with realistic traces',
      panel2: 'MID SHOT: atmospheric environmental conflict, impossible gravity or scale, cinematic wide angle, dust particles in light, tension with soft focus edges',
      panel3: 'CLOSE-UP: intimate detail dissolving or blurring, film grain heavy, emotional release through soft focus, particles fading, nostalgic dissolution',
    },
    // Sketch-first: Quick film-style composition
    sketchPrompt: 'film photograph sketch, simple composition, rule of thirds guide, vignette framing, basic tonal values, vintage camera aesthetic',
    // Final render: Full film aesthetic
    prompt: 'analog film photography, natural film grain texture, subtle vignette, cinematic composition with rule of thirds, cool and warm color balance, Kodak Portra aesthetic, dust particles in light, authentic vintage photo quality, symmetrical framing, nostalgic mood, professional cinematography',
    negative: 'digital clean, oversaturated, HDR, artificial, modern smartphone, flat, overprocessed, text, watermark, low quality, faces, full bodies, direct eye contact',
  },
  cyber: {
    name: 'Cyber Mist',
    // Composition templates for 象征→空间→情绪 structure (起承转合 - DREAMLIKE)
    compositionGuide: {
      panel1: 'WIDE SHOT: vast dark void with distant neon elements, purple-cyan dominant color, establishing calm cyber dream space, volumetric fog, deep blacks with bright accents, symmetry',
      panel2: 'MID SHOT: impossible neon architecture (vertical corridor, infinite reflections), LOW ANGLE vertiginous perspective, heavy atmospheric fog, mirror floor, chaotic energy with strong foreground-midground-background depth',
      panel3: 'CLOSE-UP: neon elements dissolving into light particles or code streams, soft bloom glow, emotional release through dispersion, floating fragments fading into darkness, negative space dominates',
    },
    // Sketch-first: Basic neon composition
    sketchPrompt: 'cyberpunk scene layout, neon light placement, fog atmosphere guide, reflective surface indication, basic color zones purple and cyan',
    // Final render: DREAMLIKE cyberpunk (NOT generic street scene)
    prompt: 'dreamlike cyberpunk atmosphere, dominant purple-blue or cyan-pink color palette (NOT rainbow), heavy volumetric fog, deep blacks with bright neon accents, wet mirror-like reflective surfaces, soft bloom glow, cinematic depth of field with foreground-midground-background layering, moody atmospheric lighting, blade runner aesthetic, NEGATIVE SPACE with darkness, being pulled into digital dream feeling',
    negative: 'natural daylight, warm colors, dry matte, bright cheerful, rustic vintage, organic natural, text, watermark, low quality, faces, full bodies, literal subjects, cluttered, oversaturated rainbow colors, generic cyberpunk street, boring mid-shot, flat composition, no depth',
  },
  pastel: {
    name: 'Pastel Fairytale',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: dreamy distant soft-colored landscape or abstract space, pastel gradient sky, gentle bokeh, calm fairy tale mood, whimsical elements far away',
      panel2: 'MID SHOT: soft impossible space (floating objects, inverted gravity), misty atmosphere with warm colors, gentle tension, layered pastel tones',
      panel3: 'CLOSE-UP: soft elements dissolving into particles or light, gentle blur, emotional release through soft focus fading, pastel streaks dispersing, intimate tender ending',
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
