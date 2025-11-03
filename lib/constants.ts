// Style presets with COMPOSITION TEMPLATES for three-act structure
// 4 core styles: minimal (line art) / film (grain) / cyber (neon) / pastel (soft)
export const STYLES = {
  minimal: {
    name: 'Minimal Sketch',
    // Family Style: LUCID (阈限空间美学)
    familyStyle: 'Lucid',
    colorPalette: 'Cobalt blue, cold white, steel gray, obsidian black, neon edge light accents',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: vast geometric void in cobalt blue and cold white, 70% negative space with single neon edge light, establishing liminal calm, stark contrast creating threshold atmosphere, symmetrical order suggesting impossible architecture',
      panel2: 'MID SHOT: impossible liminal corridor with vertical light beams defying gravity, low-angle vertiginous perspective, mirror symmetry creating disorienting infinite space, atmospheric cold blue haze with hard neon accents',
      panel3: 'CLOSE-UP: intimate detail of neon light dissolving into geometric fragments, cold white fading to deep blue-black void, negative space dominates (80%), emotional dissolution through minimal light particles dispersing',
    },
    // Sketch-first: Clean line art, simple composition
    sketchPrompt: 'simple line art sketch, clean black ink on white, minimal strokes, elegant composition, architectural drawing style, precise linework, uncluttered, few elements, professional illustration',
    // Final render: Refined minimal aesthetic with LUCID color palette
    prompt: 'liminal space aesthetic, cobalt blue and cold white color field, minimal geometric light structures, neon edge light accents, threshold atmosphere with deep negative space, symmetrical impossible architecture, modern abstract minimalism, clean precise light beams, sophisticated emptiness with volumetric blue haze',
    negative: 'complex busy, cluttered, photorealistic details, warm colors, organic textures, chaotic, messy lines, sketchy rough, amateur doodle, text, watermark, faces, full bodies, literal subjects, recognizable objects',
  },
  film: {
    name: 'Film Grain',
    // Family Style: MEMORY (记忆温度美学)
    familyStyle: 'Memory',
    colorPalette: 'Mist blue, milk white, ochre red, amber gold, warm gray gradients, film grain texture',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: distant color field in mist blue and ochre gradients, heavy film grain creating nostalgic atmosphere, soft vignette framing, layered depth through atmospheric haze, warm light remnants like memory temperature',
      panel2: 'MID SHOT: impossible atmospheric space where warm amber light defies gravity, cinematic wide angle with dust particles suspended in blue-gold haze, soft focus edges creating dream blur, environmental tension through color temperature shifts',
      panel3: 'CLOSE-UP: intimate color dissolving into grain texture, amber gold fading to milk white void, heavy film particles dispersing like memory fragments, emotional release through soft atmospheric dissolution, nostalgic light trails fading',
    },
    // Sketch-first: Quick film-style composition
    sketchPrompt: 'film photograph sketch, simple composition, rule of thirds guide, vignette framing, basic tonal values, vintage camera aesthetic',
    // Final render: Full MEMORY aesthetic with color temperature
    prompt: 'analog film photography aesthetic, natural film grain texture like memory particles, mist blue and amber gold color temperature, subtle vignette creating intimacy, dust particles suspended in light creating atmospheric depth, Kodak Portra color palette, soft edges and warm-cool gradients, nostalgic mood through color and texture, authentic vintage photo quality with emotional warmth',
    negative: 'digital clean, oversaturated neon, HDR artificial, modern smartphone look, flat no-depth, overprocessed sharp, text, watermark, low quality, faces, full bodies, direct eye contact, literal objects, realistic details',
  },
  cyber: {
    name: 'Cyber Mist',
    // Family Style: SURREAL (反逻辑拼置美学)
    familyStyle: 'Surreal',
    colorPalette: 'Purple-blue dominant, cyan-pink accents, deep obsidian black, neon edge light, complementary color clash',
    // Composition templates for 象征→空间→情绪 structure (起承转合 - DREAMLIKE)
    compositionGuide: {
      panel1: 'WIDE SHOT: vast dark void (obsidian black 70%) with distant neon color fields in purple-cyan, establishing dreamlike liminal space, heavy volumetric fog creating atmospheric depth, single bright accent creating focal tension, low-angle symmetry suggesting impossible architecture',
      panel2: 'MID SHOT: impossible neon light architecture defying gravity (vertical light beams, infinite mirror reflections), LOW ANGLE vertiginous perspective pulling viewer into void, heavy atmospheric fog with cyan-pink color clash, wet mirror floor creating foreground-midground-background depth through reflection, chaotic energy through complementary color collision',
      panel3: 'CLOSE-UP: neon color fields dissolving into light particles and code-like streams, soft bloom glow dispersing into darkness, emotional release through light fragmentation, floating cyan-pink fragments fading into obsidian void, negative space dominates (80% darkness)',
    },
    // Sketch-first: Basic neon composition
    sketchPrompt: 'cyberpunk scene layout, neon light placement, fog atmosphere guide, reflective surface indication, basic color zones purple and cyan',
    // Final render: SURREAL dreamlike atmosphere (NOT generic cyberpunk)
    prompt: 'surreal digital dream atmosphere, dominant purple-blue and cyan-pink color fields (NOT oversaturated rainbow), heavy volumetric fog creating atmospheric mystery, deep obsidian blacks with selective neon light accents, wet mirror-like reflective surfaces doubling space, soft bloom glow and light dispersion, cinematic depth through color and atmosphere layering, impossible architecture through light and void, blade runner aesthetic meets abstract expressionism, negative space with darkness pulling viewer in',
    negative: 'natural daylight, warm earthy colors, dry matte surfaces, bright cheerful mood, rustic vintage, organic natural textures, text, watermark, low quality, faces, full bodies, literal subjects, cluttered details, oversaturated rainbow colors, generic cyberpunk street scene, boring mid-shot, flat composition without depth, realistic objects',
  },
  pastel: {
    name: 'Pastel Fairytale',
    // Family Style: PASTEL (温柔奇遇美学)
    familyStyle: 'Pastel',
    colorPalette: 'Pink-blue, peach, lavender purple, cream white, soft paper texture, gentle gradients',
    // Composition templates for 象征→空间→情绪 structure (起承转合)
    compositionGuide: {
      panel1: 'WIDE SHOT: dreamy distant color field in soft pink-blue gradients, gentle bokeh creating atmospheric haze, delicate paper texture visible, calm fairy tale mood through pastel color harmony, whimsical light quality like morning mist',
      panel2: 'MID SHOT: soft impossible space where pastel color fields defy gravity (floating peach-lavender light, inverted gradients), gentle misty atmosphere with warm-cool balance, tender tension through color layering, Studio Ghibli-like atmospheric depth',
      panel3: 'CLOSE-UP: pastel color dissolving into soft light particles, pink-blue fading to cream white void, gentle blur creating emotional release, delicate streaks dispersing like watercolor on paper, intimate tender dissolution with 70% soft negative space',
    },
    // Sketch-first: Soft composition guide
    sketchPrompt: 'soft watercolor sketch, gentle composition, pastel color zones, delicate light indication, whimsical fairytale layout, simple soft edges',
    // Final render: Full PASTEL aesthetic with gentle color fields
    prompt: 'soft pastel dreamscape, gentle diffused light creating atmospheric color fields, low saturation pink-blue and peach-lavender gradients, delicate paper grain texture, soft blurred edges creating tender mood, whimsical fairytale atmosphere through color harmony, Studio Ghibli inspired gentle light quality, dreamy bokeh and atmospheric haze, peaceful enchanted feeling through pastel color dissolution',
    negative: 'harsh contrast, oversaturated vivid colors, sharp edges, dark gritty mood, photorealistic details, industrial cold, bold graphic, text, watermark, low quality, faces, full bodies, direct confrontation, literal objects, realistic rendering',
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
