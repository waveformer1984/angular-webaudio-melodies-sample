/**
 * Rezonate Controls - UI and State Management for Rezonate Core
 * Provides controls for adjusting resonance and HYDI effects
 */

import { RezonateCore, ResonanceConfig, HydiConfig } from './rezonate-core';

export class RezonateControls {
  private rezonateCore: RezonateCore;
  public resonanceConfig: ResonanceConfig[] = [];
  public hydiConfig: HydiConfig = { enabled: false, intensity: 0.5, harmonics: [], modulationRate: 0.1 };

  constructor(rezonateCore: RezonateCore) {
    this.rezonateCore = rezonateCore;
    // Default resonance settings
    this.resonanceConfig = [
      { frequency: 300, gain: 2, Q: 1.5, type: 'peaking', enabled: true },
      { frequency: 800, gain: 2, Q: 1.5, type: 'peaking', enabled: true },
      { frequency: 1500, gain: 2, Q: 1.5, type: 'peaking', enabled: true },
      { frequency: 3000, gain: 2, Q: 1.5, type: 'peaking', enabled: true }
    ];
  }

  updateResonance(config: ResonanceConfig, index: number) {
    this.resonanceConfig[index] = config;
    this.rezonateCore.updateResonanceConfig(config, index);
  }

  toggleResonance(enabled: boolean) {
    this.rezonateCore.setResonanceEnabled(enabled);
  }

  updateHydi(config: HydiConfig) {
    this.hydiConfig = config;
    this.rezonateCore.enableHydi(config);
  }

  setMasterVolume(volume: number) {
    this.rezonateCore.setMasterGain(volume);
  }

  // New preset methods
  applyResonancePreset(preset: 'Warm' | 'Bright' | 'Mellow') {
    this.rezonateCore.applyResonancePreset(preset);
  }

  applyHydiPreset(preset: 'Gentle' | 'Intense' | 'Ethereal') {
    this.rezonateCore.applyHydiPreset(preset);
  }
}
