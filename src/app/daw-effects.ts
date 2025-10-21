/**
 * DAW Effects - Built-in audio effects processing
 * Comprehensive effects chain with EQ, compression, reverb, delay, and more
 */

import { Effect } from './daw-core';

export interface EffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: string;
  parameters: EffectParameter[];
  createNode: (audioContext: AudioContext, parameters: { [key: string]: number }) => AudioNode;
}

// Built-in Effects Library
export class DAWEffectsLibrary {
  private static effects: EffectDefinition[] = [
    // EQ Effects
    {
      id: 'parametric-eq',
      name: 'Parametric EQ',
      category: 'EQ',
      parameters: [
        { name: 'frequency', value: 1000, min: 20, max: 20000, step: 1, unit: 'Hz', label: 'Frequency' },
        { name: 'gain', value: 0, min: -20, max: 20, step: 0.1, unit: 'dB', label: 'Gain' },
        { name: 'Q', value: 1, min: 0.1, max: 10, step: 0.1, unit: '', label: 'Q Factor' }
      ],
      createNode: (audioContext, params) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = params.frequency;
        filter.gain.value = params.gain;
        filter.Q.value = params.Q;
        return filter;
      }
    },

    {
      id: 'high-pass-filter',
      name: 'High Pass Filter',
      category: 'EQ',
      parameters: [
        { name: 'frequency', value: 100, min: 20, max: 5000, step: 1, unit: 'Hz', label: 'Cutoff' },
        { name: 'Q', value: 1, min: 0.1, max: 10, step: 0.1, unit: '', label: 'Resonance' }
      ],
      createNode: (audioContext, params) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = params.frequency;
        filter.Q.value = params.Q;
        return filter;
      }
    },

    {
      id: 'low-pass-filter',
      name: 'Low Pass Filter',
      category: 'EQ',
      parameters: [
        { name: 'frequency', value: 5000, min: 20, max: 20000, step: 1, unit: 'Hz', label: 'Cutoff' },
        { name: 'Q', value: 1, min: 0.1, max: 10, step: 0.1, unit: '', label: 'Resonance' }
      ],
      createNode: (audioContext, params) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = params.frequency;
        filter.Q.value = params.Q;
        return filter;
      }
    },

    // Dynamics
    {
      id: 'compressor',
      name: 'Compressor',
      category: 'Dynamics',
      parameters: [
        { name: 'threshold', value: -24, min: -60, max: 0, step: 0.1, unit: 'dB', label: 'Threshold' },
        { name: 'ratio', value: 4, min: 1, max: 20, step: 0.1, unit: ':1', label: 'Ratio' },
        { name: 'attack', value: 0.003, min: 0.001, max: 1, step: 0.001, unit: 's', label: 'Attack' },
        { name: 'release', value: 0.25, min: 0.01, max: 2, step: 0.01, unit: 's', label: 'Release' },
        { name: 'gain', value: 0, min: -20, max: 20, step: 0.1, unit: 'dB', label: 'Makeup Gain' }
      ],
      createNode: (audioContext, params) => {
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = params.threshold;
        compressor.ratio.value = params.ratio;
        compressor.attack.value = params.attack;
        compressor.release.value = params.release;
        // Note: makeup gain would need to be applied separately
        return compressor;
      }
    },

    // Time-based Effects
    {
      id: 'reverb',
      name: 'Reverb',
      category: 'Time',
      parameters: [
        { name: 'decay', value: 2, min: 0.1, max: 10, step: 0.1, unit: 's', label: 'Decay Time' },
        { name: 'wet', value: 0.3, min: 0, max: 1, step: 0.01, unit: '', label: 'Wet Mix' },
        { name: 'dry', value: 0.7, min: 0, max: 1, step: 0.01, unit: '', label: 'Dry Mix' }
      ],
      createNode: (audioContext, params) => {
        // Simple convolution reverb implementation
        const convolver = audioContext.createConvolver();
        // In a real implementation, you'd load an impulse response
        // For now, create a simple artificial reverb
        const impulseResponse = this.createImpulseResponse(audioContext, params.decay);

        convolver.buffer = impulseResponse;

        // Create wet/dry mix
        const input = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        const output = audioContext.createGain();

        wetGain.gain.value = params.wet;
        dryGain.gain.value = params.dry;

        input.connect(convolver);
        input.connect(dryGain);
        convolver.connect(wetGain);
        wetGain.connect(output);
        dryGain.connect(output);

        return { input, output };
      }
    },

    {
      id: 'delay',
      name: 'Delay',
      category: 'Time',
      parameters: [
        { name: 'time', value: 0.3, min: 0.01, max: 2, step: 0.01, unit: 's', label: 'Delay Time' },
        { name: 'feedback', value: 0.3, min: 0, max: 0.9, step: 0.01, unit: '', label: 'Feedback' },
        { name: 'wet', value: 0.3, min: 0, max: 1, step: 0.01, unit: '', label: 'Wet Mix' },
        { name: 'dry', value: 0.7, min: 0, max: 1, step: 0.01, unit: '', label: 'Dry Mix' }
      ],
      createNode: (audioContext, params) => {
        const input = audioContext.createGain();
        const output = audioContext.createGain();
        const delay = audioContext.createDelay(2);
        const feedback = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();

        delay.delayTime.value = params.time;
        feedback.gain.value = params.feedback;
        wetGain.gain.value = params.wet;
        dryGain.gain.value = params.dry;

        input.connect(delay);
        input.connect(dryGain);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(output);
        dryGain.connect(output);

        return { input, output };
      }
    },

    // Modulation Effects
    {
      id: 'chorus',
      name: 'Chorus',
      category: 'Modulation',
      parameters: [
        { name: 'rate', value: 0.5, min: 0.1, max: 5, step: 0.1, unit: 'Hz', label: 'Rate' },
        { name: 'depth', value: 0.3, min: 0, max: 1, step: 0.01, unit: '', label: 'Depth' },
        { name: 'wet', value: 0.5, min: 0, max: 1, step: 0.01, unit: '', label: 'Wet Mix' }
      ],
      createNode: (audioContext, params) => {
        const input = audioContext.createGain();
        const output = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();

        wetGain.gain.value = params.wet;
        dryGain.gain.value = 1 - params.wet;

        // Create multiple delayed signals with LFO modulation
        for (let i = 0; i < 3; i++) {
          const delay = audioContext.createDelay(0.05);
          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();

          delay.delayTime.value = 0.01 + (i * 0.005);
          lfo.frequency.value = params.rate * (0.9 + i * 0.1);
          lfoGain.gain.value = params.depth * 0.005;

          lfo.connect(lfoGain);
          lfoGain.connect(delay.delayTime);

          input.connect(delay);
          delay.connect(wetGain);

          lfo.start();
        }

        input.connect(dryGain);
        wetGain.connect(output);
        dryGain.connect(output);

        return { input, output };
      }
    },

    // Distortion Effects
    {
      id: 'overdrive',
      name: 'Overdrive',
      category: 'Distortion',
      parameters: [
        { name: 'drive', value: 0.5, min: 0, max: 1, step: 0.01, unit: '', label: 'Drive' },
        { name: 'tone', value: 0.5, min: 0, max: 1, step: 0.01, unit: '', label: 'Tone' },
        { name: 'level', value: 0.5, min: 0, max: 1, step: 0.01, unit: '', label: 'Level' }
      ],
      createNode: (audioContext, params) => {
        const input = audioContext.createGain();
        const output = audioContext.createGain();

        // Create overdrive using WaveShaperNode
        const waveshaper = audioContext.createWaveShaper();
        const filter = audioContext.createBiquadFilter();
        const levelGain = audioContext.createGain();

        // Create overdrive curve
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1;
          curve[i] = (3 + params.drive * 10) * x * 20 * deg / (Math.PI + params.drive * 10 * Math.abs(x));
        }

        waveshaper.curve = curve;
        waveshaper.oversample = '4x';

        filter.type = 'lowpass';
        filter.frequency.value = 2000 + params.tone * 8000;
        levelGain.gain.value = params.level;

        input.connect(waveshaper);
        waveshaper.connect(filter);
        filter.connect(levelGain);
        levelGain.connect(output);

        return { input, output };
      }
    }
  ];

  static getAllEffects(): EffectDefinition[] {
    return [...this.effects];
  }

  static getEffectById(id: string): EffectDefinition | undefined {
    return this.effects.find(effect => effect.id === id);
  }

  static getEffectsByCategory(category: string): EffectDefinition[] {
    return this.effects.filter(effect => effect.category === category);
  }

  static getCategories(): string[] {
    const categories = new Set(this.effects.map(effect => effect.category));
    return Array.from(categories);
  }

  private static createImpulseResponse(audioContext: AudioContext, decayTime: number): AudioBuffer {
    const length = audioContext.sampleRate * decayTime;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    return impulse;
  }
}

// Effect Chain Processor
export class EffectChainProcessor {
  private audioContext: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private effectNodes: AudioNode[] = [];
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();

    this.wetGain.gain.value = 1;
    this.dryGain.gain.value = 0; // Start with effects off

    this.input.connect(this.dryGain);
    this.input.connect(this.wetGain);
    this.dryGain.connect(this.output);
  }

  // Add effect to chain
  addEffect(effectDef: EffectDefinition, parameters: { [key: string]: number }): void {
    const effectNode = effectDef.createNode(this.audioContext, parameters);

    if (this.effectNodes.length > 0) {
      // Connect to last effect in chain
      const lastEffect = this.effectNodes[this.effectNodes.length - 1];
      if (lastEffect && typeof lastEffect === 'object' && 'output' in lastEffect) {
        (lastEffect as any).output.connect((effectNode as any).input || effectNode);
      } else {
        lastEffect.connect((effectNode as any).input || effectNode);
      }
    } else {
      // First effect in chain
      this.wetGain.connect((effectNode as any).input || effectNode);
    }

    this.effectNodes.push(effectNode);

    // Connect last effect to output
    if (typeof effectNode === 'object' && 'output' in effectNode) {
      (effectNode as any).output.connect(this.output);
    } else {
      effectNode.connect(this.output);
    }
  }

  // Remove effect from chain
  removeEffect(index: number): void {
    if (index < 0 || index >= this.effectNodes.length) return;

    const effectToRemove = this.effectNodes[index];
    this.effectNodes.splice(index, 1);

    // Rebuild chain connections
    this.reconnectChain();
  }

  // Update effect parameters
  updateEffectParameters(index: number, effectDef: EffectDefinition, parameters: { [key: string]: number }): void {
    if (index < 0 || index >= this.effectNodes.length) return;

    // Remove old effect
    this.removeEffect(index);

    // Add new effect at same position
    this.effectNodes.splice(index, 0, effectDef.createNode(this.audioContext, parameters));

    // Reconnect chain
    this.reconnectChain();
  }

  // Set wet/dry mix
  setWetDryMix(wet: number, dry: number): void {
    this.wetGain.gain.value = wet;
    this.dryGain.gain.value = dry;
  }

  // Get input/output nodes
  getInput(): AudioNode {
    return this.input;
  }

  getOutput(): AudioNode {
    return this.output;
  }

  // Clear all effects
  clear(): void {
    this.effectNodes.forEach(effect => {
      try {
        if (typeof effect === 'object' && 'input' in effect && 'output' in effect) {
          (effect as any).input.disconnect();
          (effect as any).output.disconnect();
        } else {
          effect.disconnect();
        }
      } catch (e) {
        // Effect might already be disconnected
      }
    });

    this.effectNodes = [];
    this.wetGain.disconnect();
    this.input.connect(this.wetGain);
  }

  private reconnectChain(): void {
    // Disconnect all effects
    this.wetGain.disconnect();

    if (this.effectNodes.length === 0) {
      this.wetGain.connect(this.output);
      return;
    }

    // Reconnect chain
    this.wetGain.connect((this.effectNodes[0] as any).input || this.effectNodes[0]);

    for (let i = 0; i < this.effectNodes.length - 1; i++) {
      const currentEffect = this.effectNodes[i];
      const nextEffect = this.effectNodes[i + 1];

      if (typeof currentEffect === 'object' && 'output' in currentEffect) {
        (currentEffect as any).output.connect((nextEffect as any).input || nextEffect);
      } else {
        currentEffect.connect((nextEffect as any).input || nextEffect);
      }
    }

    // Connect last effect to output
    const lastEffect = this.effectNodes[this.effectNodes.length - 1];
    if (typeof lastEffect === 'object' && 'output' in lastEffect) {
      (lastEffect as any).output.connect(this.output);
    } else {
      lastEffect.connect(this.output);
    }
  }
}