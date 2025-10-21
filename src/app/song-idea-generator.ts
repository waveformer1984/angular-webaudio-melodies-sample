/**
 * Song Idea Generator - AI-powered song concept and structure generation
 * Creates complete song ideas with titles, chord progressions, and metadata
 */

export interface SongIdeaSeed {
  mood: string;
  style: string;
  theme?: string;
  tempo?: number;
  key?: string;
  complexity?: number; // 0-1
}

export interface SongIdea {
  id: string;
  title: string;
  chordProgression: string[]; // Roman numerals
  tempo: number;
  key: string;
  scale: string;
  mood: string;
  style: string;
  theme?: string;
  structure: SongStructure;
  instruments: string[];
  hookLine: string;
  description: string;
  tags: string[];
  metadata: {
    energy: number; // 0-1
    danceability: number; // 0-1
    complexity: number; // 0-1
    novelty: number; // 0-1
    created: Date;
  };
}

export interface SongStructure {
  intro: number; // length in bars
  verse: number;
  chorus: number;
  bridge?: number;
  outro: number;
  arrangement: string[]; // sequence of sections
}

export interface IdeaGeneratorOptions {
  seed: SongIdeaSeed;
  count?: number;
  variety?: number; // 0-1
}

export class SongIdeaGenerator {
  // Chord progression templates by mood and style
  private static readonly CHORD_TEMPLATES = {
    happy: {
      pop: [
        ['I', 'V', 'vi', 'IV'],
        ['I', 'IV', 'V', 'I'],
        ['vi', 'IV', 'I', 'V']
      ],
      rock: [
        ['I', 'IV', 'V', 'I'],
        ['I', 'V', 'IV', 'I'],
        ['I', 'vi', 'IV', 'V']
      ]
    },
    sad: {
      ballad: [
        ['i', 'VI', 'III', 'VII'],
        ['i', 'iv', 'v', 'i'],
        ['VI', 'IV', 'I', 'V']
      ],
      indie: [
        ['i', 'VII', 'VI', 'V'],
        ['iv', 'I', 'VI', 'III'],
        ['i', 'III', 'VI', 'VII']
      ]
    },
    energetic: {
      dance: [
        ['I', 'V', 'vi', 'iii'],
        ['I', 'ii', 'V', 'I'],
        ['vi', 'IV', 'I', 'iii']
      ],
      electronic: [
        ['i', 'VI', 'III', 'VII'],
        ['I', 'IV', 'vi', 'V'],
        ['ii', 'V', 'I', 'IV']
      ]
    },
    nostalgic: {
      folk: [
        ['I', 'IV', 'V', 'I'],
        ['vi', 'IV', 'I', 'V'],
        ['I', 'V', 'IV', 'I']
      ],
      acoustic: [
        ['I', 'vi', 'IV', 'V'],
        ['vi', 'IV', 'I', 'ii'],
        ['I', 'IV', 'ii', 'V']
      ]
    },
    romantic: {
      pop: [
        ['I', 'vi', 'IV', 'V'],
        ['vi', 'IV', 'I', 'V'],
        ['I', 'IV', 'V', 'vi']
      ],
      ballad: [
        ['i', 'VI', 'III', 'VII'],
        ['iv', 'I', 'VI', 'v'],
        ['VI', 'IV', 'I', 'iii']
      ]
    }
  };

  // Title templates
  private static readonly TITLE_TEMPLATES = {
    happy: [
      'Sunshine {concept}',
      'Dancing in the {place}',
      'Bright {emotion} Days',
      'Joyful {activity}',
      'Golden {time}'
    ],
    sad: [
      'Shadows of {past}',
      'Broken {emotion}',
      'Fading {memory}',
      'Lost in {place}',
      'Quiet {time}'
    ],
    energetic: [
      'Electric {concept}',
      'Thunder {activity}',
      'Wild {emotion}',
      'Power of {force}',
      'Fire in the {place}'
    ],
    nostalgic: [
      'Memories of {past}',
      'Yesterday\'s {concept}',
      'Faded {emotion}',
      'Time {activity}',
      'Echoes of {place}'
    ],
    romantic: [
      'Love in {place}',
      'Heart {activity}',
      'Sweet {emotion}',
      'Forever {concept}',
      'Soul {connection}'
    ]
  };

  // Word banks for title generation
  private static readonly WORD_BANK = {
    concept: ['Dreams', 'Light', 'Night', 'Stars', 'Fire', 'Wind', 'Rain', 'Sea'],
    place: ['City', 'Mountains', 'Ocean', 'Streets', 'Home', 'Garden', 'Sky', 'Road'],
    emotion: ['Love', 'Hope', 'Fear', 'Joy', 'Pain', 'Peace', 'Rage', 'Calm'],
    activity: ['Running', 'Falling', 'Flying', 'Waiting', 'Calling', 'Breaking', 'Healing', 'Searching'],
    past: ['Yesterday', 'Childhood', 'Summer', 'Winter', 'Spring', 'Autumn', 'Old Days', 'Lost Time'],
    time: ['Morning', 'Evening', 'Night', 'Dawn', 'Dusk', 'Midnight', 'Forever', 'Moment'],
    force: ['Will', 'Spirit', 'Mind', 'Body', 'Soul', 'Heart', 'Blood', 'Breath'],
    memory: ['Faces', 'Voices', 'Places', 'Moments', 'Dreams', 'Secrets', 'Promises', 'Lies'],
    connection: ['Mate', 'Friend', 'Stranger', 'Lover', 'Family', 'Enemy', 'Self', 'World']
  };

  // Generate song ideas
  static async generateIdeas(options: IdeaGeneratorOptions): Promise<SongIdea[]> {
    const count = options.count || 5;
    const ideas: SongIdea[] = [];

    for (let i = 0; i < count; i++) {
      const idea = this.generateSongIdea(options.seed, i, options.variety || 0.7);
      ideas.push(idea);
    }

    return ideas;
  }

  private static generateSongIdea(seed: SongIdeaSeed, index: number, variety: number): SongIdea {
    // Generate title
    const title = this.generateTitle(seed.mood, variety);

    // Generate chord progression
    const chordProgression = this.generateChordProgression(seed.mood, seed.style, variety);

    // Generate tempo and key
    const tempo = seed.tempo || this.generateTempo(seed.mood, seed.style);
    const key = seed.key || this.generateKey(seed.style);
    const scale = this.getScaleForKey(key);

    // Generate structure
    const structure = this.generateStructure(seed.style, variety);

    // Generate instruments
    const instruments = this.generateInstruments(seed.style, seed.mood);

    // Generate hook line
    const hookLine = this.generateHookLine(seed.mood, variety);

    // Generate description
    const description = this.generateDescription(title, seed.mood, seed.style, instruments);

    // Generate tags
    const tags = this.generateTags(seed.mood, seed.style, instruments);

    // Calculate metadata
    const metadata = this.calculateMetadata(seed, variety, tempo, chordProgression.length);

    return {
      id: `idea-${Date.now()}-${index}`,
      title,
      chordProgression,
      tempo,
      key,
      scale,
      mood: seed.mood,
      style: seed.style,
      theme: seed.theme,
      structure,
      instruments,
      hookLine,
      description,
      tags,
      metadata
    };
  }

  private static generateTitle(mood: string, variety: number): string {
    const templates = this.TITLE_TEMPLATES[mood as keyof typeof this.TITLE_TEMPLATES] || this.TITLE_TEMPLATES.happy;
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Replace placeholders with random words
    let title = template;
    const placeholders = template.match(/\{(\w+)\}/g);

    if (placeholders) {
      placeholders.forEach(placeholder => {
        const category = placeholder.slice(1, -1);
        const words = this.WORD_BANK[category as keyof typeof this.WORD_BANK] || ['Dream'];
        const word = words[Math.floor(Math.random() * words.length)];
        title = title.replace(placeholder, word);
      });
    }

    return title;
  }

  private static generateChordProgression(mood: string, style: string, variety: number): string[] {
    const moodTemplates = this.CHORD_TEMPLATES[mood as keyof typeof this.CHORD_TEMPLATES];
    if (!moodTemplates) return ['I', 'IV', 'V', 'I'];

    const styleTemplates = (moodTemplates as any)[style] || (moodTemplates as any)[Object.keys(moodTemplates)[0]];
    const template = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];

    // Add variation by modifying the progression
    if (variety > 0.5 && Math.random() < variety) {
      return this.varyChordProgression(template);
    }

    return template;
  }

  private static varyChordProgression(progression: string[]): string[] {
    const varied = [...progression];

    // Randomly extend or modify
    if (Math.random() < 0.3) {
      // Add a chord
      const newChord = ['ii', 'iii', 'VI', 'VII'][Math.floor(Math.random() * 4)];
      varied.splice(Math.floor(Math.random() * varied.length), 0, newChord);
    }

    if (Math.random() < 0.2) {
      // Replace a chord
      const index = Math.floor(Math.random() * varied.length);
      const replacements = { 'I': 'iii', 'IV': 'ii', 'V': 'VII', 'vi': 'III' };
      varied[index] = replacements[varied[index] as keyof typeof replacements] || varied[index];
    }

    return varied;
  }

  private static generateTempo(mood: string, style: string): number {
    const tempoRanges = {
      happy: { pop: [100, 140], rock: [120, 160] },
      sad: { ballad: [60, 90], indie: [70, 100] },
      energetic: { dance: [120, 140], electronic: [110, 150] },
      nostalgic: { folk: [80, 110], acoustic: [70, 100] },
      romantic: { pop: [80, 120], ballad: [50, 80] }
    };

    const moodRanges = tempoRanges[mood as keyof typeof tempoRanges] || tempoRanges.happy;
    const styleRange = (moodRanges as any)[style] || (moodRanges as any)[Object.keys(moodRanges)[0]];

    return Math.floor(Math.random() * (styleRange[1] - styleRange[0])) + styleRange[0];
  }

  private static generateKey(style: string): string {
    const keyPreferences = {
      pop: ['C', 'G', 'D', 'A', 'E', 'F'],
      rock: ['E', 'A', 'D', 'G', 'C', 'F#'],
      ballad: ['A', 'E', 'D', 'G', 'C', 'B'],
      indie: ['C', 'G', 'D', 'A', 'F', 'Bb'],
      dance: ['C', 'F', 'G', 'D', 'A', 'E'],
      electronic: ['C', 'F', 'G', 'D', 'A', 'E'],
      folk: ['G', 'C', 'D', 'A', 'E', 'F'],
      acoustic: ['C', 'G', 'D', 'A', 'E', 'F']
    };

    const keys = keyPreferences[style as keyof typeof keyPreferences] || keyPreferences.pop;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  private static getScaleForKey(key: string): string {
    // For simplicity, assume major keys. In practice, you'd analyze the chord progression
    return 'major';
  }

  private static generateStructure(style: string, variety: number): SongStructure {
    const structures = {
      pop: {
        intro: 8,
        verse: 16,
        chorus: 16,
        bridge: 8,
        outro: 8,
        arrangement: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro']
      },
      rock: {
        intro: 4,
        verse: 16,
        chorus: 16,
        bridge: 8,
        outro: 4,
        arrangement: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro']
      },
      ballad: {
        intro: 8,
        verse: 12,
        chorus: 16,
        bridge: 12,
        outro: 8,
        arrangement: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro']
      }
    };

    const baseStructure = structures[style as keyof typeof structures] || structures.pop;

    // Add variety
    if (variety > 0.6) {
      if (Math.random() < 0.3) {
        // Remove bridge
        const variedArrangement = baseStructure.arrangement.filter(section => section !== 'bridge');
        return { ...baseStructure, arrangement: variedArrangement, bridge: 0 };
      }
    }

    return baseStructure;
  }

  private static generateInstruments(style: string, mood: string): string[] {
    const instrumentSets = {
      pop: ['Piano', 'Guitar', 'Bass', 'Drums', 'Synth Lead', 'Backing Vocals'],
      rock: ['Electric Guitar', 'Bass', 'Drums', 'Piano', 'Organ'],
      ballad: ['Piano', 'Acoustic Guitar', 'Strings', 'Drums', 'Vocals'],
      indie: ['Acoustic Guitar', 'Piano', 'Bass', 'Drums', 'Synth Pads'],
      dance: ['Synth Bass', 'Drums', 'Synth Leads', 'Piano', 'FX'],
      electronic: ['Synthesizer', 'Drum Machine', 'Bass Synth', 'FX Processors'],
      folk: ['Acoustic Guitar', 'Banjo', 'Fiddle', 'Bass', 'Harmonica'],
      acoustic: ['Acoustic Guitar', 'Piano', 'Bass', 'Percussion', 'Strings']
    };

    const instruments = instrumentSets[style as keyof typeof instrumentSets] || instrumentSets.pop;

    // Filter based on mood
    if (mood === 'energetic') {
      return instruments.filter(inst => !inst.includes('Piano') || Math.random() > 0.5);
    }

    return instruments.slice(0, Math.floor(instruments.length * (0.7 + Math.random() * 0.3)));
  }

  private static generateHookLine(mood: string, variety: number): string {
    const hooks = {
      happy: [
        "Feel the rhythm in your soul",
        "Dancing till the break of dawn",
        "Love is lighting up the night",
        "Joy is calling out your name"
      ],
      sad: [
        "Tears are falling like the rain",
        "Heart is breaking once again",
        "Shadows whisper your name",
        "Lost in memories of yesterday"
      ],
      energetic: [
        "Fire burning through my veins",
        "Thunder crashing in my brain",
        "Power surging through the night",
        "Energy that feels so right"
      ],
      nostalgic: [
        "Memories fade but never die",
        "Yesterday comes back tonight",
        "Time has taken its cruel flight",
        "Echoes of a love so bright"
      ],
      romantic: [
        "Love is flowing through my heart",
        "Whispers in the midnight air",
        "Souls connected from the start",
        "Forever we will always share"
      ]
    };

    const moodHooks = hooks[mood as keyof typeof hooks] || hooks.happy;
    return moodHooks[Math.floor(Math.random() * moodHooks.length)];
  }

  private static generateDescription(title: string, mood: string, style: string, instruments: string[]): string {
    const templates = [
      `A ${mood} ${style} track featuring ${instruments.slice(0, 3).join(', ')} that captures the essence of ${title.toLowerCase()}.`,
      `${title} is a ${mood} ${style} composition with ${instruments.length} instruments creating a rich sonic landscape.`,
      `This ${style} piece explores ${mood} themes through ${instruments.slice(0, 2).join(' and ')} arrangements.`,
      `A ${mood} journey in ${style} style, ${title} combines ${instruments.slice(0, 3).join(', ')} for an emotional experience.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateTags(mood: string, style: string, instruments: string[]): string[] {
    const tags = [mood, style];

    // Add instrument-based tags
    if (instruments.includes('Piano')) tags.push('piano');
    if (instruments.includes('Guitar')) tags.push('guitar');
    if (instruments.includes('Drums')) tags.push('drums');
    if (instruments.some(inst => inst.includes('Synth'))) tags.push('electronic');

    // Add style-specific tags
    const styleTags = {
      pop: ['catchy', 'melodic'],
      rock: ['driving', 'energetic'],
      ballad: ['emotional', 'intimate'],
      indie: ['authentic', 'alternative'],
      dance: ['rhythmic', 'upbeat'],
      electronic: ['modern', 'synthetic'],
      folk: ['organic', 'traditional'],
      acoustic: ['natural', 'intimate']
    };

    const additionalTags = styleTags[style as keyof typeof styleTags] || [];
    tags.push(...additionalTags);

    return [...new Set(tags)]; // Remove duplicates
  }

  private static calculateMetadata(seed: SongIdeaSeed, variety: number, tempo: number, progressionLength: number): SongIdea['metadata'] {
    // Calculate energy based on tempo and mood
    let energy = 0.5;
    if (seed.mood === 'energetic') energy += 0.3;
    if (seed.mood === 'happy') energy += 0.2;
    if (tempo > 120) energy += 0.2;
    energy = Math.min(1, energy);

    // Calculate danceability
    let danceability = 0.5;
    if (seed.style === 'dance' || seed.style === 'electronic') danceability += 0.3;
    if (tempo > 100 && tempo < 140) danceability += 0.2;
    danceability = Math.min(1, danceability);

    // Calculate complexity
    const complexity = seed.complexity || (progressionLength > 4 ? 0.7 : 0.4);

    // Calculate novelty (higher variety = more novel)
    const novelty = variety;

    return {
      energy,
      danceability,
      complexity,
      novelty,
      created: new Date()
    };
  }

  // Export to JSON
  static exportToJSON(idea: SongIdea): any {
    return {
      id: idea.id,
      title: idea.title,
      chordProgression: idea.chordProgression,
      tempo: idea.tempo,
      key: idea.key,
      scale: idea.scale,
      mood: idea.mood,
      style: idea.style,
      theme: idea.theme,
      structure: idea.structure,
      instruments: idea.instruments,
      hookLine: idea.hookLine,
      description: idea.description,
      tags: idea.tags,
      metadata: {
        ...idea.metadata,
        created: idea.metadata.created.toISOString()
      }
    };
  }

  // Validate song idea
  static validateIdea(idea: SongIdea): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!idea.title) errors.push('Missing title');
    if (!idea.chordProgression || idea.chordProgression.length === 0) errors.push('No chord progression');
    if (!idea.key) errors.push('Missing key');
    if (idea.tempo < 40 || idea.tempo > 200) errors.push('Invalid tempo range');
    if (!idea.instruments || idea.instruments.length === 0) errors.push('No instruments specified');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate project manifest from idea
  static generateProjectManifest(idea: SongIdea): any {
    return {
      projectId: idea.id,
      title: idea.title,
      bpm: idea.tempo,
      key: idea.key,
      mood: idea.mood,
      style: idea.style,
      assets: [],
      status: 'idea',
      structure: idea.structure,
      instruments: idea.instruments,
      metadata: idea.metadata
    };
  }
}