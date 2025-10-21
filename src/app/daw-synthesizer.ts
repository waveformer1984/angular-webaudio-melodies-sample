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

export class DAWSynthesizer {
  private audioContext: AudioContext;
  private rezonateCore: RezonateCore;
  private voices: Map<string, SynthVoice> = new Map();
  private masterGain: GainNode;
  private activePreset: SynthPreset;
  private polyphony = 8;

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

  // Cleanup
  dispose(): void {
    // Stop all voices
    this.voices.forEach(voice => {
      this.cleanupVoice(voice.id);
    });

    this.masterGain.disconnect();
  }
}