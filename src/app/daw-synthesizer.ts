/**
 * DAW Synthesizer - Software Synthesizer Module
 * Provides polyphonic synthesis with multiple oscillators, filters, and envelopes
 */

import { RezonateCore } from './rezonate-core';

export interface SynthVoice {
  id: string;
  note: number;
  velocity: number;
  startTime: number;
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  filter: BiquadFilterNode;
  envelope: Envelope;
  isActive: boolean;
}

export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthPreset {
  name: string;
  oscillators: OscillatorConfig[];
  filter: FilterConfig;
  envelope: Envelope;
  effects: any[];
}

export interface OscillatorConfig {
  type: OscillatorType;
  frequency: number;
  detune: number;
  gain: number;
  enabled: boolean;
}

export interface FilterConfig {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain: number;
}

export interface LFOConfig {
  rate: number;
  depth: number;
  waveform: OscillatorType;
  enabled: boolean;
}

export interface ModulationTarget {
  parameter: string;
  amount: number;
  lfoIndex: number;
}

export interface SynthPreset {
  name: string;
  oscillators: OscillatorConfig[];
  filter: FilterConfig;
  envelope: Envelope;
  lfos: LFOConfig[];
  modulationMatrix: ModulationTarget[];
  effects: any[];
}

export class DAWSynthesizer {
  private audioContext: AudioContext;
  private rezonateCore: RezonateCore;
  private voices: Map<string, SynthVoice> = new Map();
  private masterGain: GainNode;
  private activePreset: SynthPreset;
  private polyphony = 8;
  private lfos: OscillatorNode[] = [];
  private lfoGains: GainNode[] = [];

  // Built-in presets
  private static readonly presets: SynthPreset[] = [
    {
      name: 'Basic Synth',
      oscillators: [
        { type: 'sawtooth', frequency: 440, detune: 0, gain: 0.5, enabled: true },
        { type: 'square', frequency: 440, detune: 0, gain: 0.3, enabled: false }
      ],
      filter: { type: 'lowpass', frequency: 1000, Q: 1, gain: 0 },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
      lfos: [],
      modulationMatrix: [],
      effects: []
    },
    {
      name: 'Warm Pad',
      oscillators: [
        { type: 'sawtooth', frequency: 440, detune: -5, gain: 0.4, enabled: true },
        { type: 'sawtooth', frequency: 440, detune: 5, gain: 0.4, enabled: true },
        { type: 'sine', frequency: 220, detune: 0, gain: 0.2, enabled: true }
      ],
      filter: { type: 'lowpass', frequency: 800, Q: 2, gain: 0 },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.0 },
      lfos: [],
      modulationMatrix: [],
      effects: []
    },
    {
      name: 'Brass',
      oscillators: [
        { type: 'sawtooth', frequency: 440, detune: 0, gain: 0.6, enabled: true },
        { type: 'sawtooth', frequency: 440, detune: 10, gain: 0.4, enabled: true }
      ],
      filter: { type: 'lowpass', frequency: 1200, Q: 1.5, gain: 0 },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 0.4 },
      lfos: [],
      modulationMatrix: [],
      effects: []
    }
  ];

  constructor(audioContext: AudioContext, rezonateCore: RezonateCore) {
    this.audioContext = audioContext;
    this.rezonateCore = rezonateCore;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.rezonateCore.getNode());

    // Load default preset
    this.activePreset = DAWSynthesizer.presets[0];

    // Initialize LFOs
    this.initializeLFOs();
  }

  // Note triggering
  noteOn(note: number, velocity = 127): string {
    const voiceId = this.generateId();

    // Check polyphony limit
    if (this.voices.size >= this.polyphony) {
      // Steal oldest voice
      const oldestVoice = Array.from(this.voices.values())
        .sort((a, b) => a.startTime - b.startTime)[0];
      this.noteOff(oldestVoice.id);
    }

    const voice = this.createVoice(note, velocity);
    voice.id = voiceId;
    this.voices.set(voiceId, voice);

    // Start envelope
    this.triggerEnvelope(voice);

    return voiceId;
  }

  noteOff(voiceId: string): void {
    const voice = this.voices.get(voiceId);
    if (!voice) return;

    // Start release phase
    this.releaseEnvelope(voice);
  }

  // Voice management
  private createVoice(note: number, velocity: number): SynthVoice {
    const frequency = this.noteToFrequency(note);
    const voice: SynthVoice = {
      id: '',
      note,
      velocity,
      startTime: this.audioContext.currentTime,
      oscillators: [],
      gainNode: this.audioContext.createGain(),
      filter: this.audioContext.createBiquadFilter(),
      envelope: { ...this.activePreset.envelope },
      isActive: true
    };

    // Setup filter
    voice.filter.type = this.activePreset.filter.type;
    voice.filter.frequency.value = this.activePreset.filter.frequency;
    voice.filter.Q.value = this.activePreset.filter.Q;
    voice.filter.gain.value = this.activePreset.filter.gain;

    // Create oscillators
    this.activePreset.oscillators.forEach((oscConfig, index) => {
      if (!oscConfig.enabled) return;

      const oscillator = this.audioContext.createOscillator();
      const oscGain = this.audioContext.createGain();

      oscillator.type = oscConfig.type;
      oscillator.frequency.value = frequency * (oscConfig.frequency / 440); // Relative to A4
      oscillator.detune.value = oscConfig.detune;

      oscGain.gain.value = oscConfig.gain * (velocity / 127);

      oscillator.connect(oscGain);
      oscGain.connect(voice.filter);

      oscillator.start();

      voice.oscillators.push(oscillator);
    });

    // Connect filter to gain node
    voice.filter.connect(voice.gainNode);
    voice.gainNode.connect(this.masterGain);

    return voice;
  }

  // Envelope processing
  private triggerEnvelope(voice: SynthVoice): void {
    const now = this.audioContext.currentTime;
    const envelope = voice.envelope;
    const gain = voice.gainNode.gain;

    // Attack phase
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(1, now + envelope.attack);

    // Decay to sustain
    gain.linearRampToValueAtTime(
      envelope.sustain,
      now + envelope.attack + envelope.decay
    );
  }

  private releaseEnvelope(voice: SynthVoice): void {
    const now = this.audioContext.currentTime;
    const envelope = voice.envelope;
    const gain = voice.gainNode.gain;

    // Start release from current value
    const currentValue = gain.value;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(currentValue, now);
    gain.linearRampToValueAtTime(0, now + envelope.release);

    // Schedule voice cleanup
    setTimeout(() => {
      this.cleanupVoice(voice.id);
    }, envelope.release * 1000);
  }

  private cleanupVoice(voiceId: string): void {
    const voice = this.voices.get(voiceId);
    if (!voice) return;

    // Stop oscillators
    voice.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    // Disconnect nodes
    voice.gainNode.disconnect();
    voice.filter.disconnect();

    this.voices.delete(voiceId);
  }

  // Preset management
  loadPreset(presetName: string): boolean {
    const preset = DAWSynthesizer.presets.find(p => p.name === presetName);
    if (!preset) return false;

    this.activePreset = { ...preset };
    this.applyModulationMatrix();
    return true;
  }

  getPresets(): string[] {
    return DAWSynthesizer.presets.map(p => p.name);
  }

  getCurrentPreset(): SynthPreset {
    return { ...this.activePreset };
  }

  savePreset(name: string): void {
    const newPreset = { ...this.activePreset, name };
    DAWSynthesizer.presets.push(newPreset);
  }

  // Parameter control
  setOscillatorConfig(index: number, config: Partial<OscillatorConfig>): void {
    if (index >= this.activePreset.oscillators.length) return;
    Object.assign(this.activePreset.oscillators[index], config);
  }

  setFilterConfig(config: Partial<FilterConfig>): void {
    Object.assign(this.activePreset.filter, config);
  }

  setEnvelopeConfig(config: Partial<Envelope>): void {
    Object.assign(this.activePreset.envelope, config);
  }

  setPolyphony(polyphony: number): void {
    this.polyphony = Math.max(1, Math.min(32, polyphony));
  }

  setMasterGain(gain: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, gain));
  }

  // Utility methods
  private noteToFrequency(note: number): number {
    // A4 = 440Hz, MIDI note 69
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Getters
  getActiveVoices(): number {
    return this.voices.size;
  }

  getPolyphony(): number {
    return this.polyphony;
  }

  getMasterGain(): number {
    return this.masterGain.gain.value;
  }

  // LFO System
  private initializeLFOs(): void {
    // Create up to 4 LFOs
    for (let i = 0; i < 4; i++) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();

      lfo.frequency.value = 1; // Default 1 Hz
      lfoGain.gain.value = 0; // Default no modulation

      lfo.connect(lfoGain);
      lfo.start();

      this.lfos.push(lfo);
      this.lfoGains.push(lfoGain);
    }
  }

  private applyModulationMatrix(): void {
    // Disconnect existing modulation connections
    this.lfoGains.forEach(gain => {
      gain.disconnect();
    });

    // Apply modulation matrix
    this.activePreset.modulationMatrix.forEach(target => {
      if (target.lfoIndex < this.lfoGains.length) {
        const lfoGain = this.lfoGains[target.lfoIndex];

        switch (target.parameter) {
          case 'oscillator_frequency':
            // Connect to oscillator frequency modulation
            this.voices.forEach(voice => {
              voice.oscillators.forEach(osc => {
                lfoGain.connect(osc.frequency);
              });
            });
            break;
          case 'filter_frequency':
            // Connect to filter frequency modulation
            this.voices.forEach(voice => {
              lfoGain.connect(voice.filter.frequency);
            });
            break;
          case 'gain':
            // Connect to gain modulation
            this.voices.forEach(voice => {
              lfoGain.connect(voice.gainNode.gain);
            });
            break;
        }

        lfoGain.gain.value = target.amount;
      }
    });
  }

  // LFO Configuration Methods
  setLFOConfig(index: number, config: Partial<LFOConfig>): void {
    if (index >= this.activePreset.lfos.length) return;

    Object.assign(this.activePreset.lfos[index], config);

    // Update actual LFO
    if (index < this.lfos.length) {
      const lfo = this.lfos[index];
      const lfoGain = this.lfoGains[index];

      if (config.rate !== undefined) lfo.frequency.value = config.rate;
      if (config.waveform !== undefined) lfo.type = config.waveform;
      if (config.enabled !== undefined) {
        lfoGain.gain.value = config.enabled ? config.depth || 0 : 0;
      }
    }

    this.applyModulationMatrix();
  }

  addModulationTarget(target: ModulationTarget): void {
    this.activePreset.modulationMatrix.push(target);
    this.applyModulationMatrix();
  }

  removeModulationTarget(index: number): void {
    if (index < this.activePreset.modulationMatrix.length) {
      this.activePreset.modulationMatrix.splice(index, 1);
      this.applyModulationMatrix();
    }
  }

  // Cleanup
  dispose(): void {
    // Stop all voices
    this.voices.forEach(voice => {
      this.cleanupVoice(voice.id);
    });

    // Stop LFOs
    this.lfos.forEach(lfo => {
      try {
        lfo.stop();
      } catch (e) {
        // LFO might already be stopped
      }
    });

    this.masterGain.disconnect();
  }
}