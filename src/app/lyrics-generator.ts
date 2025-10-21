/**
 * Lyrics Generator - AI-powered lyric generation with structure and rhyme
 * Creates verse/chorus/bridge lyrics with proper syllable counts and rhyme schemes
 */

export interface LyricsSeed {
  title: string;
  mood: string;
  style: string;
  theme?: string;
  targetLength?: number; // in lines
}

export interface LyricLine {
  text: string;
  syllableCount: number;
  rhymeSound: string;
  position: number; // line number in section
}

export interface LyricSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro';
  lines: LyricLine[];
  rhymeScheme: string;
  syllableTarget: number;
}

export interface LyricsStructure {
  title: string;
  sections: LyricSection[];
  metadata: {
    mood: string;
    style: string;
    theme?: string;
    totalSyllables: number;
    averageLineLength: number;
    rhymeDensity: number;
  };
}

export interface LyricsGeneratorOptions {
  seed: LyricsSeed;
  structure?: 'simple' | 'complex' | 'custom';
  rhymeScheme?: { [key: string]: string };
  syllableTargets?: { [key: string]: number };
}

export class LyricsGenerator {
  // Rhyme database - simplified phonetic rhyme matching
  private static readonly RHYME_SOUNDS = [
    'ay', 'ee', 'eye', 'oh', 'oo', 'ow', 'uh', 'ah',
    'ing', 'ang', 'ong', 'ung', 'ink', 'ank', 'onk', 'unk'
  ];

  // Word banks organized by mood and theme
  private static readonly WORD_BANK = {
    happy: {
      nouns: ['sunshine', 'laughter', 'dancing', 'freedom', 'dreams', 'stars', 'music', 'love'],
      verbs: ['shine', 'dance', 'sing', 'fly', 'dream', 'laugh', 'play', 'love'],
      adjectives: ['bright', 'joyful', 'free', 'golden', 'sweet', 'wild', 'pure', 'alive']
    },
    sad: {
      nouns: ['tears', 'shadows', 'rain', 'memories', 'goodbye', 'loneliness', 'heartbreak', 'night'],
      verbs: ['cry', 'fade', 'fall', 'remember', 'lose', 'break', 'drift', 'whisper'],
      adjectives: ['dark', 'broken', 'lonely', 'faded', 'cold', 'empty', 'lost', 'quiet']
    },
    nostalgic: {
      nouns: ['memories', 'yesterday', 'childhood', 'photos', 'summers', 'friends', 'home', 'time'],
      verbs: ['remember', 'return', 'drift', 'cherish', 'recall', 'linger', 'whisper', 'fade'],
      adjectives: ['golden', 'faded', 'sweet', 'distant', 'warm', 'bittersweet', 'precious', 'gentle']
    },
    energetic: {
      nouns: ['fire', 'thunder', 'energy', 'power', 'speed', 'lightning', 'storm', 'beat'],
      verbs: ['run', 'fight', 'break', 'crash', 'explode', 'charge', 'rage', 'burn'],
      adjectives: ['wild', 'fierce', 'powerful', 'fast', 'intense', 'electric', 'bold', 'strong']
    },
    romantic: {
      nouns: ['love', 'heart', 'kiss', 'embrace', 'forever', 'soul', 'eyes', 'touch'],
      verbs: ['love', 'hold', 'kiss', 'cherish', 'adore', 'whisper', 'dance', 'dream'],
      adjectives: ['sweet', 'tender', 'passionate', 'deep', 'true', 'gentle', 'warm', 'beautiful']
    }
  };

  // Generate complete lyrics structure
  static async generateLyrics(options: LyricsGeneratorOptions): Promise<LyricsStructure> {
    const seed = options.seed;
    const structure = options.structure || 'simple';

    // Generate sections based on structure
    const sections = this.generateSections(seed, structure, options);

    // Calculate metadata
    const metadata = this.calculateMetadata(sections, seed);

    return {
      title: seed.title,
      sections,
      metadata
    };
  }

  private static generateSections(seed: LyricsSeed, structure: string, options: LyricsGeneratorOptions): LyricSection[] {
    const sections: LyricSection[] = [];

    switch (structure) {
      case 'simple':
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateVerse(seed, 1, options));
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateVerse(seed, 2, options));
        sections.push(this.generateChorus(seed, options));
        break;

      case 'complex':
        sections.push(this.generateIntro(seed, options));
        sections.push(this.generateVerse(seed, 1, options));
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateVerse(seed, 2, options));
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateBridge(seed, options));
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateOutro(seed, options));
        break;

      default:
        sections.push(this.generateChorus(seed, options));
        sections.push(this.generateVerse(seed, 1, options));
        sections.push(this.generateChorus(seed, options));
    }

    return sections;
  }

  private static generateChorus(seed: LyricsSeed, options: LyricsGeneratorOptions): LyricSection {
    const rhymeScheme = options.rhymeScheme?.['chorus'] || 'AABB';
    const syllableTarget = options.syllableTargets?.['chorus'] || 8;
    const lines: LyricLine[] = [];

    // Generate hook line first
    const hookLine = this.generateHookLine(seed);
    lines.push({
      text: hookLine.text,
      syllableCount: hookLine.syllables,
      rhymeSound: hookLine.rhymeSound,
      position: 0
    });

    // Generate remaining lines to match rhyme scheme
    for (let i = 1; i < rhymeScheme.length; i++) {
      const targetRhyme = rhymeScheme[i];
      const previousLine = lines.find(line => rhymeScheme[line.position] === targetRhyme);

      const line = this.generateLine(seed, syllableTarget, previousLine?.rhymeSound);
      lines.push({
        text: line.text,
        syllableCount: line.syllables,
        rhymeSound: line.rhymeSound,
        position: i
      });
    }

    return {
      type: 'chorus',
      lines,
      rhymeScheme,
      syllableTarget
    };
  }

  private static generateVerse(seed: LyricsSeed, verseNumber: number, options: LyricsGeneratorOptions): LyricSection {
    const rhymeScheme = options.rhymeScheme?.['verse'] || 'ABAB';
    const syllableTarget = options.syllableTargets?.['verse'] || 8;
    const lines: LyricLine[] = [];

    for (let i = 0; i < rhymeScheme.length; i++) {
      const targetRhyme = rhymeScheme[i];
      const previousLine = lines.find(line => rhymeScheme[line.position] === targetRhyme);

      const line = this.generateLine(seed, syllableTarget, previousLine?.rhymeSound);
      lines.push({
        text: line.text,
        syllableCount: line.syllables,
        rhymeSound: line.rhymeSound,
        position: i
      });
    }

    return {
      type: 'verse',
      lines,
      rhymeScheme,
      syllableTarget
    };
  }

  private static generateBridge(seed: LyricsSeed, options: LyricsGeneratorOptions): LyricSection {
    const rhymeScheme = options.rhymeScheme?.['bridge'] || 'ABAB';
    const syllableTarget = options.syllableTargets?.['bridge'] || 7;
    const lines: LyricLine[] = [];

    for (let i = 0; i < rhymeScheme.length; i++) {
      const targetRhyme = rhymeScheme[i];
      const previousLine = lines.find(line => rhymeScheme[line.position] === targetRhyme);

      const line = this.generateLine(seed, syllableTarget, previousLine?.rhymeSound, 'bridge');
      lines.push({
        text: line.text,
        syllableCount: line.syllables,
        rhymeSound: line.rhymeSound,
        position: i
      });
    }

    return {
      type: 'bridge',
      lines,
      rhymeScheme,
      syllableTarget
    };
  }

  private static generateIntro(seed: LyricsSeed, options: LyricsGeneratorOptions): LyricSection {
    const lines: LyricLine[] = [
      {
        text: this.generateIntroLine(seed),
        syllableCount: 6,
        rhymeSound: '',
        position: 0
      }
    ];

    return {
      type: 'intro',
      lines,
      rhymeScheme: 'A',
      syllableTarget: 6
    };
  }

  private static generateOutro(seed: LyricsSeed, options: LyricsGeneratorOptions): LyricSection {
    const lines: LyricLine[] = [
      {
        text: this.generateOutroLine(seed),
        syllableCount: 8,
        rhymeSound: '',
        position: 0
      }
    ];

    return {
      type: 'outro',
      lines,
      rhymeScheme: 'A',
      syllableTarget: 8
    };
  }

  private static generateHookLine(seed: LyricsSeed): { text: string, syllables: number, rhymeSound: string } {
    const hooks = {
      happy: [
        "Feel the sunshine in my soul",
        "Dancing in the light so bright",
        "Joy is calling, hear it now",
        "Love is lifting me up high"
      ],
      sad: [
        "Tears are falling from my eyes",
        "Shadows whisper in the night",
        "Heart is breaking, can't deny",
        "Pain is holding me so tight"
      ],
      nostalgic: [
        "Memories fade but never die",
        "Yesterday comes back tonight",
        "Golden moments passing by",
        "Time has taken its cruel flight"
      ],
      energetic: [
        "Fire burning in my veins",
        "Thunder crashing through the sky",
        "Energy that never wanes",
        "Power rising up so high"
      ],
      romantic: [
        "Love is flowing through my heart",
        "Whispers in the midnight air",
        "Souls connected from the start",
        "Forever we will always share"
      ]
    };

    const moodHooks = hooks[seed.mood as keyof typeof hooks] || hooks.happy;
    const selectedHook = moodHooks[Math.floor(Math.random() * moodHooks.length)];

    return {
      text: selectedHook,
      syllables: this.countSyllables(selectedHook),
      rhymeSound: this.extractRhymeSound(selectedHook)
    };
  }

  private static generateLine(seed: LyricsSeed, targetSyllables: number, rhymeWith?: string, context?: string): { text: string, syllables: number, rhymeSound: string } {
    const wordBank = this.WORD_BANK[seed.mood as keyof typeof this.WORD_BANK] || this.WORD_BANK.happy;

    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      // Generate line structure
      const structure = this.getRandomLineStructure();
      let line = '';
      let syllableCount = 0;

      for (const part of structure) {
        switch (part) {
          case 'adj':
            const adj = wordBank.adjectives[Math.floor(Math.random() * wordBank.adjectives.length)];
            line += (line ? ' ' : '') + adj;
            syllableCount += this.countSyllables(adj);
            break;
          case 'noun':
            const noun = wordBank.nouns[Math.floor(Math.random() * wordBank.nouns.length)];
            line += (line ? ' ' : '') + noun;
            syllableCount += this.countSyllables(noun);
            break;
          case 'verb':
            const verb = wordBank.verbs[Math.floor(Math.random() * wordBank.verbs.length)];
            line += (line ? ' ' : '') + verb;
            syllableCount += this.countSyllables(verb);
            break;
          case 'conj':
            const conj = ['and', 'but', 'when', 'where', 'how', 'why'][Math.floor(Math.random() * 6)];
            line += (line ? ' ' : '') + conj;
            syllableCount += this.countSyllables(conj);
            break;
        }
      }

      // Capitalize first letter
      line = line.charAt(0).toUpperCase() + line.slice(1);

      // Check syllable count and rhyme
      if (Math.abs(syllableCount - targetSyllables) <= 1) {
        const rhymeSound = this.extractRhymeSound(line);

        if (!rhymeWith || this.rhymesWith(rhymeSound, rhymeWith)) {
          return {
            text: line,
            syllables: syllableCount,
            rhymeSound
          };
        }
      }

      attempts++;
    }

    // Fallback - generate a simple line
    const fallback = this.generateFallbackLine(targetSyllables);
    return {
      text: fallback,
      syllables: this.countSyllables(fallback),
      rhymeSound: this.extractRhymeSound(fallback)
    };
  }

  private static generateIntroLine(seed: LyricsSeed): string {
    const intros = [
      "In the beginning",
      "Listen closely",
      "Here's the story",
      "Take my hand",
      "Close your eyes",
      "Feel the rhythm"
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  }

  private static generateOutroLine(seed: LyricsSeed): string {
    const outros = [
      "This is how the story ends",
      "Memories will never fade",
      "Forever in my heart you'll stay",
      "Until we meet again someday",
      "This love will never die",
      "The end is just the start"
    ];
    return outros[Math.floor(Math.random() * outros.length)];
  }

  private static getRandomLineStructure(): string[] {
    const structures = [
      ['adj', 'noun'],
      ['verb', 'adj', 'noun'],
      ['noun', 'conj', 'verb'],
      ['adj', 'noun', 'verb'],
      ['verb', 'noun', 'adj']
    ];
    return structures[Math.floor(Math.random() * structures.length)];
  }

  private static generateFallbackLine(targetSyllables: number): string {
    const words = ['love', 'heart', 'dream', 'night', 'light', 'soul', 'time', 'life', 'world', 'mind'];
    let line = '';
    let syllables = 0;

    while (syllables < targetSyllables - 1) {
      const word = words[Math.floor(Math.random() * words.length)];
      if (line) line += ' ';
      line += word;
      syllables += this.countSyllables(word);
    }

    return line.charAt(0).toUpperCase() + line.slice(1);
  }

  private static countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Simple syllable counting algorithm
    let syllables = 0;
    const vowels = 'aeiouy';

    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i])) {
        syllables++;
        // Skip consecutive vowels
        while (i < word.length - 1 && vowels.includes(word[i + 1])) {
          i++;
        }
      }
    }

    // Handle silent 'e'
    if (word.endsWith('e')) syllables--;

    // Ensure at least 1 syllable
    return Math.max(1, syllables);
  }

  private static extractRhymeSound(word: string): string {
    // Extract the last syllable sound for rhyming
    const words = word.toLowerCase().split(' ');
    const lastWord = words[words.length - 1];

    // Find the last vowel sound
    const vowels = 'aeiou';
    let lastVowelIndex = -1;

    for (let i = lastWord.length - 1; i >= 0; i--) {
      if (vowels.includes(lastWord[i])) {
        lastVowelIndex = i;
        break;
      }
    }

    if (lastVowelIndex === -1) return lastWord;

    return lastWord.substring(lastVowelIndex);
  }

  private static rhymesWith(sound1: string, sound2: string): boolean {
    // Simple rhyme checking - can be made more sophisticated
    return sound1 === sound2 ||
           sound1.endsWith(sound2) ||
           sound2.endsWith(sound1) ||
           this.getRhymeKey(sound1) === this.getRhymeKey(sound2);
  }

  private static getRhymeKey(sound: string): string {
    // Normalize rhyme sounds
    return sound.replace(/[aeiou]/g, 'V').replace(/[^V]/g, 'C');
  }

  private static calculateMetadata(sections: LyricSection[], seed: LyricsSeed): LyricsStructure['metadata'] {
    const allLines = sections.flatMap(section => section.lines);
    const totalSyllables = allLines.reduce((sum, line) => sum + line.syllableCount, 0);
    const averageLineLength = totalSyllables / allLines.length;

    // Calculate rhyme density
    let rhymePairs = 0;
    for (const section of sections) {
      const rhymeGroups = new Map<string, number>();
      section.lines.forEach(line => {
        const count = rhymeGroups.get(line.rhymeSound) || 0;
        rhymeGroups.set(line.rhymeSound, count + 1);
      });

      rhymeGroups.forEach(count => {
        if (count > 1) rhymePairs += count - 1;
      });
    }

    const rhymeDensity = rhymePairs / allLines.length;

    return {
      mood: seed.mood,
      style: seed.style,
      theme: seed.theme,
      totalSyllables,
      averageLineLength,
      rhymeDensity
    };
  }

  // Export to JSON format
  static exportToJSON(lyrics: LyricsStructure): any {
    return {
      title: lyrics.title,
      sections: lyrics.sections.map(section => ({
        type: section.type,
        rhymeScheme: section.rhymeScheme,
        syllableTarget: section.syllableTarget,
        lines: section.lines.map(line => ({
          text: line.text,
          syllableCount: line.syllableCount,
          rhymeSound: line.rhymeSound,
          position: line.position
        }))
      })),
      metadata: lyrics.metadata
    };
  }

  // Export to plain text format
  static exportToText(lyrics: LyricsStructure): string {
    let text = `${lyrics.title}\n\n`;

    for (const section of lyrics.sections) {
      text += `[${section.type.toUpperCase()}]\n`;
      for (const line of section.lines) {
        text += `${line.text}\n`;
      }
      text += '\n';
    }

    text += `---\nMood: ${lyrics.metadata.mood}\n`;
    text += `Style: ${lyrics.metadata.style}\n`;
    text += `Total Syllables: ${lyrics.metadata.totalSyllables}\n`;
    text += `Rhyme Density: ${(lyrics.metadata.rhymeDensity * 100).toFixed(1)}%\n`;

    return text;
  }

  // Validate lyrics structure
  static validateLyrics(lyrics: LyricsStructure): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!lyrics.title) errors.push('Missing title');
    if (!lyrics.sections || lyrics.sections.length === 0) errors.push('No sections found');

    for (const section of lyrics.sections) {
      if (!section.lines || section.lines.length === 0) {
        errors.push(`Section ${section.type} has no lines`);
      }

      for (const line of section.lines) {
        if (!line.text) errors.push('Empty line found');
        if (line.syllableCount < 1) errors.push('Invalid syllable count');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}