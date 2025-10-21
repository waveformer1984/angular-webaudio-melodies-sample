/**
 * DAW Analysis Tools - Audio analysis and visualization utilities
 * Provides spectrum analysis, level metering, frequency analysis, and audio diagnostics
 */

export interface SpectrumData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  phases?: Float32Array;
}

export interface LevelData {
  peak: number;
  rms: number;
  crest: number;
  truePeak?: number;
}

export interface FrequencyAnalysis {
  fundamental: number;
  harmonics: number[];
  centroid: number;
  spread: number;
  rolloff: number;
}

export interface AnalysisOptions {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

export class DAWAnalyzer {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private dataArray: Uint8Array;
  private frequencyData: Float32Array;
  private timeData: Float32Array;

  constructor(audioContext: AudioContext, options: Partial<AnalysisOptions> = {}) {
    this.audioContext = audioContext;

    // Default options
    const defaultOptions: AnalysisOptions = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10
    };

    const finalOptions = { ...defaultOptions, ...options };

    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = finalOptions.fftSize;
    this.analyserNode.smoothingTimeConstant = finalOptions.smoothingTimeConstant;
    this.analyserNode.minDecibels = finalOptions.minDecibels;
    this.analyserNode.maxDecibels = finalOptions.maxDecibels;

    const bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.frequencyData = new Float32Array(bufferLength);
    this.timeData = new Float32Array(bufferLength);
  }

  // Connect to audio source
  connect(source: AudioNode): void {
    source.connect(this.analyserNode);
  }

  disconnect(): void {
    this.analyserNode.disconnect();
  }

  // Spectrum Analysis
  getSpectrumData(): SpectrumData {
    this.analyserNode.getFloatFrequencyData(this.frequencyData);

    const nyquist = this.audioContext.sampleRate / 2;
    const binCount = this.frequencyData.length;
    const frequencies = new Float32Array(binCount);

    for (let i = 0; i < binCount; i++) {
      frequencies[i] = (i * nyquist) / binCount;
    }

    return {
      frequencies,
      magnitudes: new Float32Array(this.frequencyData)
    };
  }

  getByteFrequencyData(): Uint8Array {
    this.analyserNode.getByteFrequencyData(this.dataArray);
    return new Uint8Array(this.dataArray);
  }

  // Level Analysis
  getLevelData(): LevelData {
    this.analyserNode.getFloatTimeDomainData(this.timeData);

    let peak = 0;
    let sumSquares = 0;

    for (let i = 0; i < this.timeData.length; i++) {
      const sample = Math.abs(this.timeData[i]);
      peak = Math.max(peak, sample);
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / this.timeData.length);
    const crest = peak / (rms || 1);

    return {
      peak,
      rms,
      crest,
      truePeak: this.calculateTruePeak(this.timeData)
    };
  }

  private calculateTruePeak(data: Float32Array): number {
    // Simple true peak calculation (interpolated peak)
    let truePeak = 0;

    for (let i = 0; i < data.length - 1; i++) {
      const current = Math.abs(data[i]);
      const next = Math.abs(data[i + 1]);

      if (current > truePeak) truePeak = current;

      // Linear interpolation for peaks between samples
      if ((data[i] > 0 && data[i + 1] < 0) || (data[i] < 0 && data[i + 1] > 0)) {
        const interpolated = Math.abs(data[i] + data[i + 1]) / 2;
        if (interpolated > truePeak) truePeak = interpolated;
      }
    }

    return truePeak;
  }

  // Frequency Analysis
  getFrequencyAnalysis(): FrequencyAnalysis {
    const spectrum = this.getSpectrumData();
    const magnitudes = spectrum.magnitudes;
    const frequencies = spectrum.frequencies;

    // Find fundamental frequency (peak in low frequencies)
    let fundamental = 0;
    let maxMagnitude = -Infinity;

    for (let i = 0; i < Math.min(frequencies.length, 100); i++) { // Focus on low frequencies
      if (magnitudes[i] > maxMagnitude) {
        maxMagnitude = magnitudes[i];
        fundamental = frequencies[i];
      }
    }

    // Find harmonics
    const harmonics: number[] = [];
    const fundamentalIndex = Math.round(fundamental * frequencies.length / (this.audioContext.sampleRate / 2));

    for (let harmonic = 2; harmonic <= 8; harmonic++) {
      const harmonicIndex = fundamentalIndex * harmonic;
      if (harmonicIndex < magnitudes.length) {
        harmonics.push(frequencies[harmonicIndex]);
      }
    }

    // Calculate spectral centroid
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < magnitudes.length; i++) {
      const magnitude = Math.pow(10, magnitudes[i] / 20); // Convert to linear
      numerator += frequencies[i] * magnitude;
      denominator += magnitude;
    }

    const centroid = denominator > 0 ? numerator / denominator : 0;

    // Calculate spectral spread
    let spread = 0;
    if (denominator > 0) {
      for (let i = 0; i < magnitudes.length; i++) {
        const magnitude = Math.pow(10, magnitudes[i] / 20);
        const deviation = frequencies[i] - centroid;
        spread += deviation * deviation * magnitude;
      }
      spread = Math.sqrt(spread / denominator);
    }

    // Calculate spectral rolloff (95% of energy)
    let totalEnergy = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      totalEnergy += Math.pow(10, magnitudes[i] / 20);
    }

    let cumulativeEnergy = 0;
    let rolloff = frequencies[frequencies.length - 1];

    for (let i = 0; i < magnitudes.length; i++) {
      cumulativeEnergy += Math.pow(10, magnitudes[i] / 20);
      if (cumulativeEnergy >= totalEnergy * 0.95) {
        rolloff = frequencies[i];
        break;
      }
    }

    return {
      fundamental,
      harmonics,
      centroid,
      spread,
      rolloff
    };
  }

  // Real-time monitoring
  startMonitoring(callback: (data: {
    spectrum: SpectrumData;
    levels: LevelData;
    frequency: FrequencyAnalysis;
  }) => void, interval = 50): void {
    const monitor = () => {
      const spectrum = this.getSpectrumData();
      const levels = this.getLevelData();
      const frequency = this.getFrequencyAnalysis();

      callback({ spectrum, levels, frequency });

      setTimeout(monitor, interval);
    };

    monitor();
  }

  // Configuration
  setFFTSize(size: number): void {
    this.analyserNode.fftSize = size;
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.frequencyData = new Float32Array(bufferLength);
    this.timeData = new Float32Array(bufferLength);
  }

  setSmoothingTimeConstant(constant: number): void {
    this.analyserNode.smoothingTimeConstant = constant;
  }

  // Utility methods
  frequencyToIndex(frequency: number): number {
    const nyquist = this.audioContext.sampleRate / 2;
    return Math.round((frequency / nyquist) * this.analyserNode.frequencyBinCount);
  }

  indexToFrequency(index: number): number {
    const nyquist = this.audioContext.sampleRate / 2;
    return (index * nyquist) / this.analyserNode.frequencyBinCount;
  }

  magnitudeToDecibels(magnitude: number): number {
    return 20 * Math.log10(Math.max(magnitude, Number.EPSILON));
  }

  decibelsToMagnitude(decibels: number): number {
    return Math.pow(10, decibels / 20);
  }
}

// Spectrum Analyzer Component
export class SpectrumAnalyzer {
  private analyser: DAWAnalyzer;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;

  constructor(audioContext: AudioContext, canvas: HTMLCanvasElement) {
    this.analyser = new DAWAnalyzer(audioContext);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  connect(source: AudioNode): void {
    this.analyser.connect(source);
  }

  start(): void {
    this.render();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private render = (): void => {
    const spectrum = this.analyser.getSpectrumData();

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const sliceWidth = this.canvas.width / spectrum.magnitudes.length;

    for (let i = 0; i < spectrum.magnitudes.length; i++) {
      const magnitude = spectrum.magnitudes[i];
      const y = this.canvas.height - ((magnitude + 140) / 140) * this.canvas.height; // Scale to canvas

      if (i === 0) {
        this.ctx.moveTo(0, y);
      } else {
        this.ctx.lineTo(i * sliceWidth, y);
      }
    }

    this.ctx.stroke();

    this.animationId = requestAnimationFrame(this.render);
  };
}

// Level Meter Component
export class LevelMeter {
  private analyser: DAWAnalyzer;
  private container: HTMLElement;
  private peakHoldTime = 1000; // ms
  private peakHoldValues: number[] = [];
  private peakHoldTimers: number[] = [];

  constructor(audioContext: AudioContext, container: HTMLElement, channelCount = 2) {
    this.analyser = new DAWAnalyzer(audioContext);
    this.container = container;
    this.initializeMeter(channelCount);
  }

  connect(source: AudioNode): void {
    this.analyser.connect(source);
  }

  private initializeMeter(channelCount: number): void {
    this.container.innerHTML = '';

    for (let i = 0; i < channelCount; i++) {
      const channelDiv = document.createElement('div');
      channelDiv.className = 'level-meter-channel';

      const meterBar = document.createElement('div');
      meterBar.className = 'level-meter-bar';

      const levelIndicator = document.createElement('div');
      levelIndicator.className = 'level-indicator';

      const peakIndicator = document.createElement('div');
      peakIndicator.className = 'peak-indicator';

      meterBar.appendChild(levelIndicator);
      meterBar.appendChild(peakIndicator);
      channelDiv.appendChild(meterBar);

      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'level-value';
      valueDisplay.textContent = '-∞ dB';
      channelDiv.appendChild(valueDisplay);

      this.container.appendChild(channelDiv);
    }

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .level-meter-channel {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 2px;
      }

      .level-meter-bar {
        width: 20px;
        height: 120px;
        background: #333;
        border: 1px solid #555;
        position: relative;
        border-radius: 2px;
      }

      .level-indicator {
        position: absolute;
        bottom: 0;
        width: 100%;
        background: linear-gradient(to top, #00ff00, #ffff00, #ff0000);
        border-radius: 2px;
        transition: height 0.1s ease;
      }

      .peak-indicator {
        position: absolute;
        width: 100%;
        height: 2px;
        background: #fff;
        border-radius: 1px;
      }

      .level-value {
        font-size: 10px;
        color: #ccc;
        margin-top: 4px;
        font-family: monospace;
      }
    `;
    document.head.appendChild(style);
  }

  update(): void {
    const levels = this.analyser.getLevelData();

    // Convert to dB
    const rmsDb = 20 * Math.log10(Math.max(levels.rms, 0.0001));
    const peakDb = 20 * Math.log10(Math.max(levels.peak, 0.0001));

    // Update visual meter (assuming single channel for simplicity)
    const channelDivs = this.container.querySelectorAll('.level-meter-channel');
    if (channelDivs.length > 0) {
      const channelDiv = channelDivs[0] as HTMLElement;
      const levelIndicator = channelDiv.querySelector('.level-indicator') as HTMLElement;
      const peakIndicator = channelDiv.querySelector('.peak-indicator') as HTMLElement;
      const valueDisplay = channelDiv.querySelector('.level-value') as HTMLElement;

      // Scale to 0-100% (assuming -60dB to 0dB range)
      const levelPercent = Math.max(0, Math.min(100, (rmsDb + 60) * (100 / 60)));
      const peakPercent = Math.max(0, Math.min(100, (peakDb + 60) * (100 / 60)));

      levelIndicator.style.height = `${levelPercent}%`;
      peakIndicator.style.bottom = `${peakPercent}%`;

      valueDisplay.textContent = `${rmsDb.toFixed(1)} dB`;
    }
  }

  startMonitoring(interval = 50): void {
    const monitor = () => {
      this.update();
      setTimeout(monitor, interval);
    };
    monitor();
  }
}

// Audio Analysis Utilities
export class AudioAnalysisUtils {
  static calculateRMS(buffer: AudioBuffer): number {
    let sum = 0;
    const channelData = buffer.getChannelData(0); // Use first channel

    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }

    return Math.sqrt(sum / channelData.length);
  }

  static calculatePeak(buffer: AudioBuffer): number {
    let peak = 0;
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }

    return peak;
  }

  static detectClipping(buffer: AudioBuffer, threshold = 0.99): boolean {
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) >= threshold) {
        return true;
      }
    }

    return false;
  }

  static calculateDynamicRange(buffer: AudioBuffer): { min: number, max: number, range: number } {
    let min = Infinity;
    let max = -Infinity;
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      min = Math.min(min, channelData[i]);
      max = Math.max(max, channelData[i]);
    }

    return {
      min,
      max,
      range: max - min
    };
  }

  static generateNoiseFloor(buffer: AudioBuffer, windowSize = 1024): number {
    const channelData = buffer.getChannelData(0);
    let totalNoise = 0;
    let sampleCount = 0;

    for (let i = 0; i < channelData.length; i += windowSize) {
      let windowSum = 0;
      const windowEnd = Math.min(i + windowSize, channelData.length);

      for (let j = i; j < windowEnd; j++) {
        windowSum += channelData[j] * channelData[j];
      }

      const windowRMS = Math.sqrt(windowSum / (windowEnd - i));
      totalNoise += windowRMS;
      sampleCount++;
    }

    return totalNoise / sampleCount;
  }
}