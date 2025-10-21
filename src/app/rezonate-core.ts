/**
 * Rezonate Core - Resonance Effects System for Web Audio API
 * Provides advanced resonance processing for audio synthesis and effects
 */

export interface ResonanceConfig {
  frequency: number;
  gain: number;
  Q: number;
  type: BiquadFilterType;
  enabled: boolean;
}

export interface HydiConfig {
  enabled: boolean;
  intensity: number;
  harmonics: number[];
  modulationRate: number;
}

export class RezonateCore {
  private audioContext: AudioContext;
  private resonanceFilters: BiquadFilterNode[] = [];
  private hydiOscillators: OscillatorNode[] = [];
  private hydiGains: GainNode[] = [];
  private masterGain: GainNode;
  private resonanceEnabled = true;
  private hydiEnabled = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.initializeResonanceFilters();
  }

  private initializeResonanceFilters() {
    // Example initialization of resonance filters
    const frequencies = [300, 800, 1500, 3000];
    frequencies.forEach(freq => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = 2;
      filter.Q.value = 1.5;
      this.resonanceFilters.push(filter);
    });
  }

  connect(destination: AudioNode) {
    this.masterGain.connect(destination);
    let lastNode: AudioNode = this.masterGain;
    if (this.resonanceEnabled) {
      this.resonanceFilters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
    }
    lastNode.connect(this.audioContext.destination);
  }

  disconnect() {
    this.masterGain.disconnect();
    this.resonanceFilters.forEach(filter => filter.disconnect());
    this.hydiOscillators.forEach(osc => osc.disconnect());
    this.hydiGains.forEach(gain => gain.disconnect());
  }

  dispose() {
    this.disconnect();
  }

  setResonanceEnabled(enabled: boolean) {
    this.resonanceEnabled = enabled;
    this.disconnect();
    this.connect(this.audioContext.destination);
  }

  enableHydi(config: HydiConfig) {
    this.hydiEnabled = config.enabled;
    if (this.hydiEnabled) {
      this.initializeHydi(config);
    } else {
      this.disposeHydi();
    }
  }

  private initializeHydi(config: HydiConfig) {
    this.disposeHydi(); // Ensure no previous HYDI instances are running
    config.harmonics.forEach(harmonic => {
      const osc = this.audioContext.createOscillator();
      osc.frequency.value = harmonic;
      const gain = this.audioContext.createGain();
      gain.gain.value = config.intensity;

      // Modulation for HYDI effect
      const modulator = this.audioContext.createOscillator();
      modulator.frequency.value = config.modulationRate;
      const modGain = this.audioContext.createGain();
      modGain.gain.value = 0.5;
      modulator.connect(modGain);
      modGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(this.masterGain);

      this.hydiOscillators.push(osc);
      this.hydiGains.push(gain);
      modulator.start();
      osc.start();
    });
  }

  private disposeHydi() {
    this.hydiOscillators.forEach(osc => osc.stop());
    this.hydiGains.forEach(gain => gain.disconnect());
    this.hydiOscillators = [];
    this.hydiGains = [];
  }

  setMasterGain(gain: number) {
    this.masterGain.gain.value = gain;
  }

  updateResonanceConfig(config: ResonanceConfig, index: number) {
    if (this.resonanceFilters[index]) {
      const filter = this.resonanceFilters[index];
      filter.frequency.value = config.frequency;
      filter.gain.value = config.gain;
      filter.Q.value = config.Q;
      filter.type = config.type;
    }
  }

  getNode(): AudioNode {
    return this.masterGain;
  }
  
  // New preset methods
  applyResonancePreset(preset: 'Warm' | 'Bright' | 'Mellow') {
    const configs: { [key: string]: Partial<ResonanceConfig>[] } = {
      Warm: [
        { frequency: 250, gain: 3, Q: 1.2 },
        { frequency: 500, gain: 2, Q: 1.5 }
      ],
      Bright: [
        { frequency: 2000, gain: 2.5, Q: 2.0 },
        { frequency: 4000, gain: 3, Q: 2.5 }
      ],
      Mellow: [
        { frequency: 400, gain: -2, Q: 0.8 },
        { frequency: 1000, gain: -1, Q: 1.0 }
      ]
    };

    const selected = configs[preset];
    if (selected) {
      selected.forEach((config, index) => this.updateResonanceConfig(config as ResonanceConfig, index));
    }
  }

  applyHydiPreset(preset: 'Gentle' | 'Intense' | 'Ethereal') {
    const configs: { [key: string]: Partial<HydiConfig> } = {
      Gentle: { intensity: 0.2, harmonics: [50, 100], modulationRate: 0.05 },
      Intense: { intensity: 0.8, harmonics: [150, 300, 450], modulationRate: 0.2 },
      Ethereal: { intensity: 0.4, harmonics: [1000, 2000, 3000], modulationRate: 0.01 }
    };

    const selected = configs[preset];
    if (selected) {
      this.enableHydi({ ...this.getHydiConfig(), ...selected, enabled: true });
    }
  }
  
  private getHydiConfig(): HydiConfig {
    // Return a default or current HydiConfig
    return { enabled: this.hydiEnabled, intensity: 0.5, harmonics: [], modulationRate: 0.1 };
  }  
}
