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
    // Final render: Memory Dream aesthetic (de-emphasize artist names, focus on techniques)
    prompt: 'abstract memory dream atmosphere, tender thick impasto brushwork creating warmth, geometric color field planes with nostalgic depth, mist blue and golden amber atmospheric fog, soft ochre and earth tone palette, visible paint texture with architectural color structure, warm light remnants suggesting memory temperature, post-impressionist color theory, atmospheric haze with geometric solidity, emotional weight through abstract color and form, past expressed as color architecture',
    negative: 'cold digital, oversaturated neon, harsh contrast, chaotic cluttered, modern smartphone aesthetic, flat no-depth, photorealistic details, text, watermark, faces, full bodies, literal objects, sharp edges, famous paintings, recognizable artworks, Starry Night, Sunflowers, art reproduction, museum piece, exact copy of masterpiece, literal Van Gogh painting, literal Cézanne painting',
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
    colorPalette: 'Muted purple-orange harmony, soft green-red balance, desaturated complementary colors, Magritte sky blue vs warm earth tones',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Establish surreal calm before chaos. Magritte-style color field where sky purple meets earth orange (70% negative space), crisp hard edges like hyper-real painting, single impossible element (inverted gravity hint), deceptive clarity creating unease, rational surface hiding irrational core',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Logic breaks violently. Dalí melting forms clash with Magritte solid objects, green-red complementary violence creating visual screaming, impossible spatial contradictions (up is down, inside is outside), thick paint texture showing reality\'s fragmentation, environmental chaos through color war and form conflict',
      panel3: 'ECHO (余晖) - CLOSE-UP: Absurdity becomes acceptance. Extreme close-up of contradictory colors merging (purple bleeding into orange like wound), Magritte precision dissolving into Dalí liquidity, 80% void as logic surrenders, emotional release through accepting impossibility, negative space as mind giving up understanding',
    },
    // Sketch-first: Surreal composition guide
    sketchPrompt: 'surrealist composition sketch, Magritte hard edges, Dalí melting forms, impossible object placement, complementary color zones, contradictory perspective',
    // Final render: Surreal Dream aesthetic
    prompt: 'surrealist masterpiece, Salvador Dalí melting distortion meets René Magritte impossible clarity, muted purple-orange harmony with desaturated complementary colors, soft pastel tones with surreal atmosphere, hyper-realistic paint texture with irrational composition, impossible spatial contradictions, hard-edge precision breaking into liquid forms, absurdist juxtaposition, dream logic exposing reality\'s fragility, gentle color transitions replacing harsh contrasts',
    negative: 'natural realistic, logical composition, harmonious colors, cozy warm, soft romantic, impressionist blur, text, watermark, faces, full bodies, literal narrative, photographic realism, conventional beauty',
  },
  cyber: {
    name: 'Lucid Dream',
    // Psychological Core: AWARENESS, FLOATING, THRESHOLD
    dreamType: 'Lucid',
    psychologicalCore: 'Awareness, floating, threshold between sleep and wake',
    userFeeling: 'I know I\'m dreaming, consciousness floating in void, liminal spaces',
    // Artist System: Yves Tanguy + Giorgio de Chirico (超现实漂浮空间)
    artistReference: 'Yves Tanguy + Giorgio de Chirico',
    artistPhilosophy: 'Tanguy\'s floating organic forms in infinite void meets de Chirico\'s metaphysical shadows and mysterious空旷. Lucid dreams are conscious floating in surreal空间.',
    colorPalette: 'Deep twilight blue, mysterious shadow purple, pale moonlight, dusty rose horizon, metaphysical teal, infinite void gradient',
    // Energy Progression: Sensation → Distortion → Echo
    compositionGuide: {
      panel1: 'SENSATION (初感) - WIDE SHOT: Consciousness awakens in surreal void. Tanguy-style infinite horizon in deep twilight blue with 75% empty sky, single floating organic form (biomorphic shadow) suspended in空间, de Chirico long mysterious shadows cast by invisible light, calm surreal atmosphere of dream awareness, soft gradient from pale moonlight to deep void, weightless solitude',
      panel2: 'DISTORTION (漩涡) - MID SHOT: Floating forms defy gravity and logic. Multiple Tanguy biomorphic shapes hovering in impossible positions, de Chirico metaphysical architecture fragments (arches, columns) floating disconnected, mysterious purple-teal shadows creating spatial confusion, low-angle perspective looking up into dreamscape, atmospheric haze with dusty rose accents, organic surrealism meets architectural mystery',
      panel3: 'ECHO (余晖) - CLOSE-UP: Dream awareness fades into unconsciousness. Extreme close-up of soft biomorphic form dissolving into twilight gradient (85% void), Tanguy organic texture melting like memory, de Chirico shadow becoming formless, pale moonlight dispersing into deep blue-purple infinity, emotional release as lucidity surrenders to sleep, negative space as consciousness lets go',
    },
    // Sketch-first: Surreal floating sketch
    sketchPrompt: 'surrealist floating forms sketch, Tanguy biomorphic shapes, de Chirico mysterious shadows, infinite horizon, twilight gradient zones, metaphysical architecture fragments',
    // Final render: Lucid Dream aesthetic
    prompt: 'lucid dream atmosphere, Yves Tanguy floating biomorphic forms in infinite void meets Giorgio de Chirico metaphysical shadows and mysterious architecture, deep twilight blue and purple gradient sky, pale moonlight creating long enigmatic shadows, organic surrealist shapes suspended weightlessly, dusty rose horizon line, atmospheric depth with soft haze, dreamlike solitude and floating consciousness, mysterious teal accents, metaphysical空旷, smooth gradient void dominating composition, surrealist masterpiece',
    negative: 'warm daylight, bright cheerful colors, busy crowded scene, realistic lighting, photographic realism, cyberpunk neon, sci-fi technology, geometric hard edges, literal objects, faces, full bodies, cluttered details, flat composition, sharp focus throughout',
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
      panel1: 'SENSATION (初感) - WIDE SHOT: Enter gentle healing space. Monet-style distant horizontal color field in soft pink-white and mint green (70% soft negative space creating breathing room), wide landscape format with dappled impressionist light, delicate short brushstrokes visible like Van Gogh blossoms scattered across top third, warm peach light as comfort temperature, calm horizontal stillness, therapeutic atmosphere',
      panel2: 'DISTORTION (漩涡) - MID SHOT: CRITICAL - MUST CREATE CONTRAST. Van Gogh blossom branches in DIAGONAL DYNAMIC composition (45-degree energy), soft lavender and sky blue swirling in impressionist motion blur (NOT static), gentle turbulence through flowing pastel brushstrokes, mid-ground depth with atmospheric layers, movement and rhythm (branches bending, petals flowing), Studio Ghibli wind-blown softness, tender chaos without violence',
      panel3: 'ECHO (余晖) - CLOSE-UP: Comfort dissolves into peace. VERTICAL format extreme close-up of single pink-white blossom dissolving into cream void (80% soft light negative space), impressionist dabs becoming light particles from top to bottom, peach and lavender fading like spring breeze, emotional release through gentle upward dissolution, negative space as pure comfort, watercolor softness',
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
