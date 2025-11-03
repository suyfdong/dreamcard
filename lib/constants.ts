// Dream Type presets with PSYCHOLOGICAL ARTIST SYSTEMS and ENERGY PROGRESSION
// 4 core dream types: minimal (Memory) / film (Surreal) / cyber (Lucid) / pastel (Pastel)
export const STYLES = {
  minimal: {
    name: 'Memory Dream',
    // Psychological Core: NOSTALGIA, LOSS, TENDERNESS
    dreamType: 'Memory',
    psychologicalCore: 'Nostalgia, loss, tenderness, longing for the past',
    userFeeling: 'Dreams of places I\'ve been, people I\'ve lost, childhood scenes',
    // Artist System: Van Gogh Late Period + Cézanne (温柔结构主义)
    artistReference: 'Vincent van Gogh late period + Paul Cézanne',
    artistPhilosophy: 'Van Gogh\'s tender warmth meets Cézanne\'s solid architectural structure. Memory has weight and geometry.',
    colorPalette: 'Mist blue, golden fog, ochre red, amber warmth, Cézanne earth tones',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Establish memory\'s atmosphere. Distant mist blue color field with golden fog particles, 70% negative space creating nostalgic emptiness, soft geometric structure like Cézanne planes, warm amber light remnants as memory temperature, tender impasto texture visible, calm entry point into past',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Memory space conflicts with reality. Impossible atmospheric geometry where warm ochre defies gravity (floating color planes, inverted Cézanne blocks), mist blue clashing with amber creating spatial disorientation, thick Van Gogh brushwork showing memory\'s emotional turbulence, environmental tension through color temperature war',
      panel3: 'ECHO (余晖) - CLOSE-UP: Memory dissolves into feeling. Extreme close-up of golden fog dispersing into blue void (80% darkness), soft impasto texture fading like breath on glass, amber warmth becoming particles, emotional release through color dissolution, negative space dominates as memory becomes intangible',
    },
    // Sketch-first: Memory sketch guidance
    sketchPrompt: 'soft geometric sketch, Cézanne-inspired planes, warm-cool color zones, nostalgic atmosphere guide, tender structural composition',
    // Final render: Memory Dream aesthetic
    prompt: 'memory dream atmosphere, Vincent van Gogh tender impasto warmth meets Paul Cézanne geometric color planes, mist blue and golden amber fog creating nostalgic depth, soft ochre and earth tones, thick visible brushwork with architectural structure, warm light remnants like memory temperature, atmospheric haze with geometric solidity, emotional weight through color and form, past solidified as color architecture',
    negative: 'cold digital, oversaturated neon, harsh contrast, chaotic cluttered, modern smartphone aesthetic, flat no-depth, photorealistic details, text, watermark, faces, full bodies, literal objects, sharp edges',
  },
  film: {
    name: 'Surreal Dream',
    // Psychological Core: UNEASE, CONFLICT, ABSURDITY
    dreamType: 'Surreal',
    psychologicalCore: 'Unease, conflict, absurdity, the world\'s rules are broken',
    userFeeling: 'World logic fails, physics breaks, impossible juxtapositions',
    // Artist System: Salvador Dalí + René Magritte (超现实矛盾美学)
    artistReference: 'Salvador Dalí + René Magritte',
    artistPhilosophy: 'Dalí\'s melting reality meets Magritte\'s impossible contradictions. Dreams expose the absurdity beneath rational surfaces.',
    colorPalette: 'Purple-orange clash, green-red inversion, complementary color violence, Magritte sky blue vs earth brown',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Establish surreal calm before chaos. Magritte-style color field where sky purple meets earth orange (70% negative space), crisp hard edges like hyper-real painting, single impossible element (inverted gravity hint), deceptive clarity creating unease, rational surface hiding irrational core',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Logic breaks violently. Dalí melting forms clash with Magritte solid objects, green-red complementary violence creating visual screaming, impossible spatial contradictions (up is down, inside is outside), thick paint texture showing reality\'s fragmentation, environmental chaos through color war and form conflict',
      panel3: 'ECHO (余晖) - CLOSE-UP: Absurdity becomes acceptance. Extreme close-up of contradictory colors merging (purple bleeding into orange like wound), Magritte precision dissolving into Dalí liquidity, 80% void as logic surrenders, emotional release through accepting impossibility, negative space as mind giving up understanding',
    },
    // Sketch-first: Surreal composition guide
    sketchPrompt: 'surrealist composition sketch, Magritte hard edges, Dalí melting forms, impossible object placement, complementary color zones, contradictory perspective',
    // Final render: Surreal Dream aesthetic
    prompt: 'surrealist masterpiece, Salvador Dalí melting distortion meets René Magritte impossible clarity, purple-orange complementary color clash creating visual tension, green-red inversion, hyper-realistic paint texture with irrational composition, impossible spatial contradictions, hard-edge precision breaking into liquid forms, absurdist juxtaposition, dream logic exposing reality\'s fragility, color violence through complementary warfare',
    negative: 'natural realistic, logical composition, harmonious colors, cozy warm, soft romantic, impressionist blur, text, watermark, faces, full bodies, literal narrative, photographic realism, conventional beauty',
  },
  cyber: {
    name: 'Lucid Dream',
    // Psychological Core: AWARENESS, FLOATING, THRESHOLD
    dreamType: 'Lucid',
    psychologicalCore: 'Awareness, floating, threshold between sleep and wake',
    userFeeling: 'I know I\'m dreaming, consciousness floating in void, liminal spaces',
    // Artist System: James Turrell + Syd Mead (光装置未来主义)
    artistReference: 'James Turrell + Syd Mead',
    artistPhilosophy: 'Turrell\'s pure light phenomena meets Syd Mead\'s visionary architecture. Lucid dreams are consciousness observing itself as light in void.',
    colorPalette: 'Cobalt blue void, cold white light, cyan glow, obsidian black, neon threshold markers',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Consciousness awakens in void. Turrell-style vast cobalt blue light field with 75% negative space, single pure light source (cold white) creating liminal threshold, clean geometric light boundaries, volumetric haze revealing space\'s depth, calm awareness of being in-between states, symmetrical order as mind recognizes dream',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Light architecture defies reality. Syd Mead impossible geometry made of pure cyan-white light beams, vertical light defying gravity with mirror reflections creating infinite recursion, low-angle perspective as consciousness looks up into void, atmospheric blue fog with neon accents marking impossible thresholds, spatial turbulence through light phenomena',
      panel3: 'ECHO (余晖) - CLOSE-UP: Awareness dissolves back into sleep. Extreme close-up of light particles dispersing into obsidian void (85% darkness), soft bloom as consciousness fades, cold white becoming cyan mist then disappearing, emotional release through accepting return to unconsciousness, negative space as awareness surrenders control',
    },
    // Sketch-first: Light installation sketch
    sketchPrompt: 'light installation sketch, Turrell-inspired light fields, geometric light boundaries, volumetric fog indication, pure color zones cobalt and cyan',
    // Final render: Lucid Dream aesthetic
    prompt: 'lucid dream atmosphere, James Turrell pure light field installations meets Syd Mead visionary architecture, cobalt blue void with cold white and cyan light phenomena, heavy volumetric fog revealing spatial depth, clean geometric light boundaries, impossible light architecture defying gravity, wet reflective surfaces doubling light, soft bloom and atmospheric glow, liminal threshold aesthetic, consciousness as observer of light in void, negative space dominating, blade runner meets light art installation',
    negative: 'warm daylight, earthy natural colors, dry matte surfaces, cozy intimate mood, organic textures, busy cluttered, oversaturated rainbow, generic cyberpunk street, realistic objects, faces, full bodies, literal architecture, flat composition without depth',
  },
  pastel: {
    name: 'Pastel Dream',
    // Psychological Core: HEALING, LIGHTNESS, TENDERNESS
    dreamType: 'Pastel',
    psychologicalCore: 'Healing, lightness, tenderness, spring-like comfort',
    userFeeling: 'Beautiful dreams, gentle comfort, therapeutic softness, hope',
    // Artist System: Claude Monet + Van Gogh Blossoms (印象治愈主义)
    artistReference: 'Claude Monet + Vincent van Gogh Almond Blossoms',
    artistPhilosophy: 'Monet\'s impressionist light dappling meets Van Gogh\'s tender blossom hope. Pastel dreams are visual therapy, color as comfort.',
    colorPalette: 'Soft pink-white, mint green, lavender, peach, sky blue, cream, impressionist dappled light',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Enter gentle healing space. Monet-style distant color field in soft pink-white and mint green (70% soft negative space), dappled impressionist light creating atmospheric tenderness, delicate short brushstrokes visible like Van Gogh blossoms, warm peach light as comfort temperature, calm entry into therapeutic dream',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Gentle impossibility without violence. Van Gogh blossom branches floating in Monet water lily space, soft lavender and sky blue creating tender spatial contradiction, impressionist blur making gravity optional, short gentle brushstrokes showing emotional lightness, environmental ease through pastel color harmony, Studio Ghibli atmospheric depth',
      panel3: 'ECHO (余晖) - CLOSE-UP: Comfort dissolves into peace. Extreme close-up of pink-white blossom paint dispersing into cream void (75% soft light), impressionist dabs becoming light particles, peach and lavender fading like spring breeze, emotional release through gentle dissolution, negative space as pure comfort, watercolor softness',
    },
    // Sketch-first: Impressionist sketch guide
    sketchPrompt: 'soft impressionist sketch, Monet dappled light zones, Van Gogh blossom composition, pastel color fields, gentle atmospheric guide, tender brushwork indication',
    // Final render: Pastel Dream aesthetic
    prompt: 'pastel dream atmosphere, Claude Monet impressionist dappled light meets Vincent van Gogh Almond Blossoms tender brushwork, soft pink-white and mint green color fields, lavender and peach warmth, delicate short brushstrokes visible, gentle atmospheric haze with bokeh, impressionist light dissolving forms, therapeutic color harmony, spring renewal mood, Studio Ghibli gentle depth, watercolor softness, visual comfort through pastel dissolution',
    negative: 'harsh contrast, oversaturated vivid neon, sharp aggressive edges, dark gritty violent mood, photorealistic details, industrial cold metal, bold graphic design, text, watermark, faces, full bodies, literal objects, realistic rendering, dramatic tension',
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
