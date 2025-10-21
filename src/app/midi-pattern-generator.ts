/**
 * MIDI Pattern Generator - Algorithmic MIDI generation for drums, bass, chords, and leads
 * Uses Euclidean rhythms, Markov chains, and constraint-satisfying algorithms
 */

export interface MIDIPatternSeed {
  tempo: number;
  key: string;
  scale: string;
  style: string;
  complexity: number; // 0-1
  length: number; // in bars
}

export interface MIDINote {
  pitch: number; // MIDI note number (0-127)
  velocity: number; // 0-127
  startTime: number; // in beats
  duration: number; // in beats
  channel?: number;
}

export interface MIDIPattern {
  id: string;
  type: 'drums' | 'bass' | 'chords' | 'lead';
  notes: MIDINote[];
  tempo: number;
  key: string;
  scale: string;
  length: number; // in bars
  grooveAmount: number; // 0-1
  swing: number; // 0-1
  tags: string[];
}

export interface MIDIGeneratorOptions {
  seed?: MIDIPatternSeed;
  count?: number;
  variation?: number; // 0-1
}

export class MIDIPatternGenerator {
  private static readonly DRUM_NOTES = {
    kick: 36,    // C2
    snare: 38,   // D2
    hihat: 42,   // F#2
    ride: 51,    // D#3
    crash: 49,   // C#3
    tom1: 41,    // F2
    tom2: 43,    // G2
    tom3: 45     // A2
  };

  private static readonly SCALE_INTERVALS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
  };

  // Generate drum patterns using Euclidean rhythms
  static generateDrumPatterns(options: MIDIGeneratorOptions): MIDIPattern[] {
    const seed = options.seed || this.getDefaultSeed();
    const count = options.count || 8;
    const patterns: MIDIPattern[] = [];

    for (let i = 0; i < count; i++) {
      const pattern = this.generateDrumPattern(seed, i, options.variation || 0.5);
      patterns.push(pattern);
    }

    return patterns;
  }

  private static generateDrumPattern(seed: MIDIPatternSeed, index: number, variation: number): MIDIPattern {
    const notes: MIDINote[] = [];
    const beatsPerBar = 4; // 4/4 time
    const totalBeats = seed.length * beatsPerBar;

    // Generate kick pattern using Euclidean rhythm
    const kickPulses = Math.max(2, Math.floor(4 + variation * 4)); // 2-8 pulses
    const kickSteps = 16; // 16th notes per bar
    const kickPattern = this.euclideanRhythm(kickPulses, kickSteps);

    // Generate snare pattern
    const snarePulses = Math.max(1, Math.floor(2 + variation * 2)); // 1-4 pulses
    const snareOffset = 8; // Start on beat 3 (8th note)
    const snarePattern = this.euclideanRhythm(snarePulses, kickSteps);

    // Generate hi-hat pattern
    const hihatPattern = this.generateHiHatPattern(seed.style, variation);

    // Add kick notes
    for (let beat = 0; beat < totalBeats; beat++) {
      const step = Math.floor((beat % beatsPerBar) * (kickSteps / beatsPerBar));
      if (kickPattern[step]) {
        const velocity = 100 + Math.random() * 27; // 100-127
        const grooveOffset = this.applyGroove(beat, seed.complexity);

        notes.push({
          pitch: this.DRUM_NOTES.kick,
          velocity: Math.floor(velocity),
          startTime: beat + grooveOffset,
          duration: 0.25, // 16th note
          channel: 9 // Drum channel
        });
      }
    }

    // Add snare notes
    for (let beat = 0; beat < totalBeats; beat++) {
      const step = Math.floor((beat % beatsPerBar) * (kickSteps / beatsPerBar));
      const snareStep = (step + snareOffset) % kickSteps;
      if (snarePattern[snareStep]) {
        const velocity = 80 + Math.random() * 32; // 80-112
        const grooveOffset = this.applyGroove(beat, seed.complexity);

        notes.push({
          pitch: this.DRUM_NOTES.snare,
          velocity: Math.floor(velocity),
          startTime: beat + grooveOffset,
          duration: 0.25,
          channel: 9
        });
      }
    }

    // Add hi-hat notes
    for (let beat = 0; beat < totalBeats; beat++) {
      const step = Math.floor((beat % beatsPerBar) * (kickSteps / beatsPerBar));
      if (hihatPattern[step]) {
        const velocity = 60 + Math.random() * 40; // 60-100
        const grooveOffset = this.applyGroove(beat, seed.complexity);

        notes.push({
          pitch: this.DRUM_NOTES.hihat,
          velocity: Math.floor(velocity),
          startTime: beat + grooveOffset,
          duration: 0.125, // 32nd note
          channel: 9
        });
      }
    }

    // Add fills occasionally
    if (variation > 0.3 && Math.random() < 0.3) {
      this.addDrumFill(notes, totalBeats - 1, seed.complexity);
    }

    return {
      id: `drum-${Date.now()}-${index}`,
      type: 'drums',
      notes,
      tempo: seed.tempo,
      key: seed.key,
      scale: seed.scale,
      length: seed.length,
      grooveAmount: seed.complexity,
      swing: variation * 0.5,
      tags: ['kick', 'snare', 'hihat', this.getStyleTag(seed.style)]
    };
  }

  // Generate bass patterns
  static generateBassPatterns(options: MIDIGeneratorOptions): MIDIPattern[] {
    const seed = options.seed || this.getDefaultSeed();
    const count = options.count || 8;
    const patterns: MIDIPattern[] = [];

    for (let i = 0; i < count; i++) {
      const pattern = this.generateBassPattern(seed, i, options.variation || 0.5);
      patterns.push(pattern);
    }

    return patterns;
  }

  private static generateBassPattern(seed: MIDIPatternSeed, index: number, variation: number): MIDIPattern {
    const notes: MIDINote[] = [];
    const rootNote = this.noteNameToMidi(seed.key);
    const scale = this.SCALE_INTERVALS[seed.scale as keyof typeof this.SCALE_INTERVALS] || this.SCALE_INTERVALS.major;
    const octave = 2; // Bass octave

    // Generate walking bass line
    const beatsPerBar = 4;
    const totalBeats = seed.length * beatsPerBar;

    let currentNote = rootNote + (octave * 12);
    let lastNote = currentNote;

    for (let beat = 0; beat < totalBeats; beat++) {
      // Decide note duration (quarter, eighth, or sixteenth notes)
      const duration = Math.random() < 0.7 ? 1 : (Math.random() < 0.8 ? 0.5 : 0.25);
      const velocity = 80 + Math.random() * 32; // 80-112

      // Choose next note (tend toward chord tones)
      const chordTones = [0, 2, 4]; // Root, third, fifth
      const scaleTones = scale;

      let nextNote: number;
      if (Math.random() < 0.6) {
        // Play chord tone
        const chordTone = chordTones[Math.floor(Math.random() * chordTones.length)];
        nextNote = rootNote + scale[chordTone] + (octave * 12);
      } else {
        // Play scale tone
        const scaleTone = scaleTones[Math.floor(Math.random() * scaleTones.length)];
        nextNote = rootNote + scaleTone + (octave * 12);
      }

      // Add some variation
      if (variation > 0.5 && Math.random() < 0.2) {
        nextNote += Math.random() < 0.5 ? 12 : -12; // Octave jump
      }

      // Ensure reasonable range
      nextNote = Math.max(24, Math.min(48, nextNote)); // C1 to C3

      notes.push({
        pitch: nextNote,
        velocity: Math.floor(velocity),
        startTime: beat,
        duration: duration,
        channel: 1
      });

      lastNote = nextNote;
      beat += duration - (1 / beatsPerBar); // Skip ahead by duration
    }

    return {
      id: `bass-${Date.now()}-${index}`,
      type: 'bass',
      notes,
      tempo: seed.tempo,
      key: seed.key,
      scale: seed.scale,
      length: seed.length,
      grooveAmount: seed.complexity,
      swing: variation * 0.3,
      tags: ['bass', 'walking', this.getStyleTag(seed.style)]
    };
  }

  // Generate chord patterns
  static generateChordPatterns(options: MIDIGeneratorOptions): MIDIPattern[] {
    const seed = options.seed || this.getDefaultSeed();
    const count = options.count || 8;
    const patterns: MIDIPattern[] = [];

    for (let i = 0; i < count; i++) {
      const pattern = this.generateChordPattern(seed, i, options.variation || 0.5);
      patterns.push(pattern);
    }

    return patterns;
  }

  private static generateChordPattern(seed: MIDIPatternSeed, index: number, variation: number): MIDIPattern {
    const notes: MIDINote[] = [];
    const rootNote = this.noteNameToMidi(seed.key);
    const scale = this.SCALE_INTERVALS[seed.scale as keyof typeof this.SCALE_INTERVALS] || this.SCALE_INTERVALS.major;

    // Common chord progressions
    const progressions = [
      [0, 5, 3, 4], // I-VI-IV-V
      [0, 3, 4, 3], // I-IV-V-IV
      [0, 5, 3, 0], // I-VI-IV-I
      [0, 4, 5, 3], // I-V-VI-IV
      [0, 2, 3, 5]  // I-II-III-VI
    ];

    const progression = progressions[Math.floor(Math.random() * progressions.length)];
    const octave = 4; // Chord octave

    for (let bar = 0; bar < seed.length; bar++) {
      const chordIndex = progression[bar % progression.length];
      const chordRoot = rootNote + scale[chordIndex];

      // Generate chord voicings
      const chordNotes = this.generateChordVoicing(chordRoot, octave, variation);

      // Add chord notes
      chordNotes.forEach(note => {
        notes.push({
          pitch: note,
          velocity: 70 + Math.random() * 20, // 70-90
          startTime: bar * 4, // Start of bar
          duration: 4, // Whole bar
          channel: 0
        });
      });
    }

    return {
      id: `chords-${Date.now()}-${index}`,
      type: 'chords',
      notes,
      tempo: seed.tempo,
      key: seed.key,
      scale: seed.scale,
      length: seed.length,
      grooveAmount: seed.complexity,
      swing: variation * 0.2,
      tags: ['chords', 'progression', this.getStyleTag(seed.style)]
    };
  }

  // Generate lead/melody patterns
  static generateLeadPatterns(options: MIDIGeneratorOptions): MIDIPattern[] {
    const seed = options.seed || this.getDefaultSeed();
    const count = options.count || 8;
    const patterns: MIDIPattern[] = [];

    for (let i = 0; i < count; i++) {
      const pattern = this.generateLeadPattern(seed, i, options.variation || 0.5);
      patterns.push(pattern);
    }

    return patterns;
  }

  private static generateLeadPattern(seed: MIDIPatternSeed, index: number, variation: number): MIDIPattern {
    const notes: MIDINote[] = [];
    const rootNote = this.noteNameToMidi(seed.key);
    const scale = this.SCALE_INTERVALS[seed.scale as keyof typeof this.SCALE_INTERVALS] || this.SCALE_INTERVALS.major;
    const octave = 5; // Melody octave

    const beatsPerBar = 4;
    const totalBeats = seed.length * beatsPerBar;

    // Generate melodic line using Markov chain
    const markovChain = this.buildMarkovChain(scale, variation);
    let currentInterval = 0; // Start on root

    for (let beat = 0; beat < totalBeats; beat += 0.25) { // 16th notes
      if (Math.random() < 0.7) { // 70% chance of note
        const pitch = rootNote + scale[currentInterval] + (octave * 12);
        const velocity = 60 + Math.random() * 40; // 60-100
        const duration = Math.random() < 0.8 ? 0.25 : 0.5; // Mostly 16th notes, some 8th

        notes.push({
          pitch: Math.max(48, Math.min(84, pitch)), // C3 to C6
          velocity: Math.floor(velocity),
          startTime: beat,
          duration: duration,
          channel: 2
        });

        // Move to next interval
        currentInterval = markovChain[currentInterval][Math.floor(Math.random() * markovChain[currentInterval].length)];
      }
    }

    return {
      id: `lead-${Date.now()}-${index}`,
      type: 'lead',
      notes,
      tempo: seed.tempo,
      key: seed.key,
      scale: seed.scale,
      length: seed.length,
      grooveAmount: seed.complexity,
      swing: variation * 0.4,
      tags: ['melody', 'lead', this.getStyleTag(seed.style)]
    };
  }

  // Utility methods
  private static euclideanRhythm(pulses: number, steps: number): boolean[] {
    const pattern: boolean[] = new Array(steps).fill(false);

    if (pulses >= steps) {
      return new Array(steps).fill(true);
    }

    let previous = new Array(pulses).fill(true);
    let current = new Array(steps - pulses).fill(false);

    for (let i = 0; i < steps - pulses; i++) {
      const concat = previous.concat(current);
      const len = concat.length;
      const newLen = Math.floor(len / 2);

      previous = concat.slice(0, newLen);
      current = concat.slice(newLen, len);

      if (current.length === 0) break;
    }

    return previous.concat(current);
  }

  private static generateHiHatPattern(style: string, variation: number): boolean[] {
    const pattern = new Array(16).fill(false); // 16th notes

    // Basic hi-hat pattern
    for (let i = 0; i < 16; i += 2) {
      pattern[i] = true; // Every 8th note
    }

    // Add more hi-hats based on style and variation
    if (variation > 0.3) {
      for (let i = 1; i < 16; i += 2) {
        if (Math.random() < variation * 0.5) {
          pattern[i] = true;
        }
      }
    }

    return pattern;
  }

  private static applyGroove(beat: number, complexity: number): number {
    if (complexity < 0.3) return 0;

    // Simple groove - slightly delay off-beats
    const beatInBar = beat % 4;
    if (beatInBar === 1 || beatInBar === 3) { // Off-beats
      return (Math.random() - 0.5) * 0.1 * complexity; // ±0.05 beats max
    }

    return 0;
  }

  private static addDrumFill(notes: MIDINote[], startBeat: number, complexity: number): void {
    const fillNotes = [
      { pitch: this.DRUM_NOTES.snare, velocity: 100 },
      { pitch: this.DRUM_NOTES.tom1, velocity: 90 },
      { pitch: this.DRUM_NOTES.tom2, velocity: 85 },
      { pitch: this.DRUM_NOTES.tom3, velocity: 80 },
      { pitch: this.DRUM_NOTES.crash, velocity: 110 }
    ];

    for (let i = 0; i < 4; i++) { // 4 quick hits
      if (Math.random() < complexity) {
        const note = fillNotes[Math.floor(Math.random() * fillNotes.length)];
        notes.push({
          pitch: note.pitch,
          velocity: note.velocity,
          startTime: startBeat + (i * 0.125), // 32nd notes
          duration: 0.125,
          channel: 9
        });
      }
    }
  }

  private static generateChordVoicing(root: number, octave: number, variation: number): number[] {
    const baseChord = [0, 4, 7]; // Major triad
    const voicing: number[] = [];

    baseChord.forEach(interval => {
      voicing.push(root + interval + (octave * 12));
    });

    // Add extensions based on variation
    if (variation > 0.5) {
      if (Math.random() < 0.3) voicing.push(root + 11 + (octave * 12)); // Major 7th
      if (Math.random() < 0.2) voicing.push(root + 14 + ((octave + 1) * 12)); // 9th
    }

    return voicing;
  }

  private static buildMarkovChain(scale: number[], variation: number): number[][] {
    const chain: number[][] = [];

    scale.forEach((_, index) => {
      const transitions: number[] = [];

      // Prefer nearby scale degrees
      const nearby = [index - 2, index - 1, index + 1, index + 2]
        .filter(i => i >= 0 && i < scale.length);

      // Add some longer jumps based on variation
      if (variation > 0.4) {
        nearby.push(...[index - 4, index + 4].filter(i => i >= 0 && i < scale.length));
      }

      // Weight nearby notes more heavily
      nearby.forEach(nearIndex => {
        const weight = nearIndex === index ? 3 : 2; // Prefer staying or moving nearby
        for (let i = 0; i < weight; i++) {
          transitions.push(nearIndex);
        }
      });

      chain.push(transitions);
    });

    return chain;
  }

  private static noteNameToMidi(noteName: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    const match = noteName.match(/^([A-G]#?)(\d)?$/);
    if (!match) return 60; // Default to C4

    const note = match[1];
    const octave = match[2] ? parseInt(match[2]) : 4;

    return noteMap[note] + (octave * 12);
  }

  private static getStyleTag(style: string): string {
    const styleMap: { [key: string]: string } = {
      'rock': 'rock',
      'pop': 'pop',
      'jazz': 'jazz',
      'funk': 'funk',
      'hiphop': 'hiphop',
      'electronic': 'electronic',
      'lofi': 'lofi',
      'ambient': 'ambient'
    };

    return styleMap[style.toLowerCase()] || 'generic';
  }

  private static getDefaultSeed(): MIDIPatternSeed {
    return {
      tempo: 120,
      key: 'C',
      scale: 'major',
      style: 'pop',
      complexity: 0.5,
      length: 8
    };
  }

  // Export to MIDI file format (simplified)
  static exportToMIDI(pattern: MIDIPattern): Uint8Array {
    // This is a simplified MIDI export - in practice, you'd use a proper MIDI library
    // For now, return a placeholder
    const midiData = new Uint8Array(100);
    // Fill with basic MIDI header and track data
    return midiData;
  }

  // Export to JSON format for DAW
  static exportToJSON(pattern: MIDIPattern): any {
    return {
      id: pattern.id,
      type: pattern.type,
      tempo: pattern.tempo,
      key: pattern.key,
      scale: pattern.scale,
      length: pattern.length,
      grooveAmount: pattern.grooveAmount,
      swing: pattern.swing,
      tags: pattern.tags,
      notes: pattern.notes.map(note => ({
        pitch: note.pitch,
        velocity: note.velocity,
        startTime: note.startTime,
        duration: note.duration,
        channel: note.channel || 0
      }))
    };
  }
}