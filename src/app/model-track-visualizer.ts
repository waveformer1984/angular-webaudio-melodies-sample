/**
 * Model Track Visualizer - Advanced visualization for tracks with pattern analysis
 * Shows piano roll, waveform, spectrogram, and pattern heatmaps
 */

export interface TrackVisualization {
  trackId: string;
  pianoRoll: PianoRollData;
  waveform: WaveformData;
  spectrogram: SpectrogramData;
  patternHeatmap: PatternHeatmapData;
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    bpm?: number;
    key?: string;
  };
}

export interface PianoRollData {
  notes: Array<{
    pitch: number;
    startTime: number;
    duration: number;
    velocity: number;
  }>;
  gridSize: number; // pixels per beat
  pitchRange: { min: number, max: number };
}

export interface WaveformData {
  peaks: Float32Array; // amplitude peaks
  rms: Float32Array; // RMS values
  zeroCrossings: Uint32Array;
  samplesPerPixel: number;
}

export interface SpectrogramData {
  frequencies: Float32Array;
  times: Float32Array;
  magnitudes: Float32Array[]; // 2D array [time][frequency]
  fftSize: number;
  hopSize: number;
}

export interface PatternHeatmapData {
  patterns: Array<{
    id: string;
    type: 'rhythmic' | 'melodic' | 'harmonic';
    positions: Array<{ start: number, end: number, strength: number }>;
    color: string;
  }>;
  density: Float32Array; // pattern density over time
  novelty: Float32Array; // novelty score over time
}

export interface VisualizationOptions {
  width: number;
  height: number;
  zoom: number;
  timeRange: { start: number, end: number };
  frequencyRange?: { min: number, max: number };
  showPatterns: boolean;
  showSpectrogram: boolean;
  colorScheme: 'default' | 'heatmap' | 'monochrome';
}

export class ModelTrackVisualizer {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private fftSize: number = 2048;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = this.fftSize;
  }

  // Generate complete visualization for a track
  async generateVisualization(
    audioBuffer: AudioBuffer,
    midiNotes?: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>,
    options: Partial<VisualizationOptions> = {}
  ): Promise<TrackVisualization> {
    const opts = this.getDefaultOptions(options);

    // Generate all visualization components
    const pianoRoll = midiNotes ? this.generatePianoRoll(midiNotes, opts) : this.generateEmptyPianoRoll();
    const waveform = this.generateWaveform(audioBuffer, opts);
    const spectrogram = await this.generateSpectrogram(audioBuffer, opts);
    const patternHeatmap = midiNotes ? this.generatePatternHeatmap(midiNotes, audioBuffer, opts) : this.generateEmptyPatternHeatmap();

    return {
      trackId: `track-${Date.now()}`,
      pianoRoll,
      waveform,
      spectrogram,
      patternHeatmap,
      metadata: {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        bpm: this.detectBPM(audioBuffer),
        key: midiNotes ? this.detectKey(midiNotes) : undefined
      }
    };
  }

  // Generate piano roll visualization
  private generatePianoRoll(
    notes: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>,
    options: VisualizationOptions
  ): PianoRollData {
    // Sort notes by pitch for efficient rendering
    const sortedNotes = notes.sort((a, b) => a.pitch - b.pitch);

    // Calculate pitch range
    const pitches = sortedNotes.map(note => note.pitch);
    const minPitch = Math.min(...pitches) - 6; // Add some padding
    const maxPitch = Math.max(...pitches) + 6;

    return {
      notes: sortedNotes,
      gridSize: options.zoom * 100, // pixels per beat
      pitchRange: { min: minPitch, max: maxPitch }
    };
  }

  // Generate waveform visualization
  private generateWaveform(audioBuffer: AudioBuffer, options: VisualizationOptions): WaveformData {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const samplesPerPixel = Math.floor(audioBuffer.length / options.width);
    const numPixels = Math.floor(audioBuffer.length / samplesPerPixel);

    const peaks = new Float32Array(numPixels);
    const rms = new Float32Array(numPixels);
    const zeroCrossings = new Uint32Array(numPixels);

    for (let i = 0; i < numPixels; i++) {
      const startSample = i * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, audioBuffer.length);

      let maxPeak = 0;
      let sumSquares = 0;
      let crossings = 0;
      let prevSample = 0;

      for (let j = startSample; j < endSample; j++) {
        const sample = channelData[j];
        maxPeak = Math.max(maxPeak, Math.abs(sample));
        sumSquares += sample * sample;

        // Count zero crossings
        if ((prevSample >= 0 && sample < 0) || (prevSample < 0 && sample >= 0)) {
          crossings++;
        }
        prevSample = sample;
      }

      peaks[i] = maxPeak;
      rms[i] = Math.sqrt(sumSquares / (endSample - startSample));
      zeroCrossings[i] = crossings;
    }

    return {
      peaks,
      rms,
      zeroCrossings,
      samplesPerPixel
    };
  }

  // Generate spectrogram visualization
  private async generateSpectrogram(audioBuffer: AudioBuffer, options: VisualizationOptions): Promise<SpectrogramData> {
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor((audioBuffer.length - fftSize) / hopSize) + 1;

    // Create FFT analyzer
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    // Create buffer source for analysis
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    const frequencies = new Float32Array(fftSize / 2);
    const times = new Float32Array(numFrames);
    const magnitudes: Float32Array[] = [];

    // Generate frequency bins
    for (let i = 0; i < frequencies.length; i++) {
      frequencies[i] = (i * audioBuffer.sampleRate) / fftSize;
    }

    // Process audio in frames
    for (let frame = 0; frame < numFrames; frame++) {
      const startSample = frame * hopSize;
      times[frame] = startSample / audioBuffer.sampleRate;

      // Extract frame data
      const frameData = new Float32Array(fftSize);
      for (let i = 0; i < fftSize; i++) {
        const sampleIndex = startSample + i;
        if (sampleIndex < audioBuffer.length) {
          frameData[i] = channelData[sampleIndex];
        }
      }

      // Apply window function (Hann window)
      for (let i = 0; i < fftSize; i++) {
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
        frameData[i] *= window;
      }

      // Perform FFT (simplified - in practice you'd use a proper FFT library)
      const magnitude = this.computeMagnitude(frameData);
      magnitudes.push(magnitude);
    }

    return {
      frequencies,
      times,
      magnitudes,
      fftSize,
      hopSize
    };
  }

  // Generate pattern heatmap
  private generatePatternHeatmap(
    midiNotes: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>,
    audioBuffer: AudioBuffer,
    options: VisualizationOptions
  ): PatternHeatmapData {
    const patterns: PatternHeatmapData['patterns'] = [];
    const duration = audioBuffer.duration;
    const numBins = Math.floor(duration * 10); // 10 bins per second

    const density = new Float32Array(numBins);
    const novelty = new Float32Array(numBins);

    // Analyze rhythmic patterns
    const rhythmicPatterns = this.analyzeRhythmicPatterns(midiNotes, duration);
    patterns.push(...rhythmicPatterns);

    // Analyze melodic patterns
    const melodicPatterns = this.analyzeMelodicPatterns(midiNotes, duration);
    patterns.push(...melodicPatterns);

    // Calculate density and novelty
    for (let i = 0; i < numBins; i++) {
      const time = (i / numBins) * duration;
      density[i] = this.calculatePatternDensity(patterns, time, 0.1); // 100ms window
      novelty[i] = this.calculateNoveltyScore(patterns, time, 0.1);
    }

    return {
      patterns,
      density,
      novelty
    };
  }

  // Analyze rhythmic patterns
  private analyzeRhythmicPatterns(
    notes: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>,
    duration: number
  ): PatternHeatmapData['patterns'] {
    const patterns: PatternHeatmapData['patterns'] = [];
    const noteTimes = notes.map(note => note.startTime).sort((a, b) => a - b);

    // Look for repeating rhythmic intervals
    const intervals: number[] = [];
    for (let i = 1; i < noteTimes.length; i++) {
      intervals.push(noteTimes[i] - noteTimes[i - 1]);
    }

    // Find common intervals (quantized to 16th notes)
    const quantizedIntervals = intervals.map(interval => Math.round(interval * 16) / 16);
    const intervalCounts = new Map<number, number>();

    quantizedIntervals.forEach(interval => {
      intervalCounts.set(interval, (intervalCounts.get(interval) || 0) + 1);
    });

    // Create patterns for common intervals
    intervalCounts.forEach((count, interval) => {
      if (count >= 3) { // At least 3 occurrences
        const positions: Array<{ start: number, end: number, strength: number }> = [];

        for (let i = 0; i < noteTimes.length - 1; i++) {
          if (Math.abs(noteTimes[i + 1] - noteTimes[i] - interval) < 0.05) { // Within 50ms
            positions.push({
              start: noteTimes[i],
              end: noteTimes[i + 1],
              strength: Math.min(count / 10, 1) // Normalize strength
            });
          }
        }

        if (positions.length > 0) {
          patterns.push({
            id: `rhythmic-${interval.toFixed(2)}`,
            type: 'rhythmic',
            positions,
            color: this.getRhythmicPatternColor(interval)
          });
        }
      }
    });

    return patterns;
  }

  // Analyze melodic patterns
  private analyzeMelodicPatterns(
    notes: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>,
    duration: number
  ): PatternHeatmapData['patterns'] {
    const patterns: PatternHeatmapData['patterns'] = [];
    const sortedNotes = notes.sort((a, b) => a.startTime - b.startTime);

    // Look for repeating pitch sequences
    const sequences = new Map<string, Array<{ start: number, pitches: number[] }>>();

    for (let length = 3; length <= 5; length++) { // Look for 3-5 note sequences
      for (let i = 0; i <= sortedNotes.length - length; i++) {
        const sequence = sortedNotes.slice(i, i + length);
        const pitches = sequence.map(note => note.pitch);
        const key = pitches.join('-');

        if (!sequences.has(key)) {
          sequences.set(key, []);
        }

        sequences.get(key)!.push({
          start: sequence[0].startTime,
          pitches
        });
      }
    }

    // Create patterns for sequences that appear multiple times
    sequences.forEach((occurrences, key) => {
      if (occurrences.length >= 2) {
        const positions: Array<{ start: number, end: number, strength: number }> = [];

        occurrences.forEach(occurrence => {
          const endTime = occurrence.start + 1; // Assume 1 second duration for pattern
          positions.push({
            start: occurrence.start,
            end: endTime,
            strength: Math.min(occurrences.length / 5, 1)
          });
        });

        patterns.push({
          id: `melodic-${key}`,
          type: 'melodic',
          positions,
          color: this.getMelodicPatternColor(key)
        });
      }
    });

    return patterns;
  }

  // Calculate pattern density at a given time
  private calculatePatternDensity(patterns: PatternHeatmapData['patterns'], time: number, window: number): number {
    let density = 0;

    patterns.forEach(pattern => {
      pattern.positions.forEach(position => {
        if (time >= position.start - window/2 && time <= position.end + window/2) {
          density += position.strength;
        }
      });
    });

    return Math.min(density, 1); // Cap at 1
  }

  // Calculate novelty score
  private calculateNoveltyScore(patterns: PatternHeatmapData['patterns'], time: number, window: number): number {
    // Novelty is high when pattern density is low
    const density = this.calculatePatternDensity(patterns, time, window);
    return 1 - density;
  }

  // Utility methods
  private getDefaultOptions(options: Partial<VisualizationOptions>): VisualizationOptions {
    return {
      width: 800,
      height: 400,
      zoom: 1,
      timeRange: { start: 0, end: 0 }, // Will be set based on audio
      showPatterns: true,
      showSpectrogram: true,
      colorScheme: 'default',
      ...options
    };
  }

  private generateEmptyPianoRoll(): PianoRollData {
    return {
      notes: [],
      gridSize: 100,
      pitchRange: { min: 48, max: 72 }
    };
  }

  private generateEmptyPatternHeatmap(): PatternHeatmapData {
    return {
      patterns: [],
      density: new Float32Array(0),
      novelty: new Float32Array(0)
    };
  }

  private computeMagnitude(frameData: Float32Array): Float32Array {
    // Simplified FFT magnitude computation
    // In practice, you'd use a proper FFT implementation
    const magnitude = new Float32Array(frameData.length / 2);

    for (let i = 0; i < magnitude.length; i++) {
      let real = 0, imag = 0;

      for (let j = 0; j < frameData.length; j++) {
        const angle = -2 * Math.PI * i * j / frameData.length;
        real += frameData[j] * Math.cos(angle);
        imag += frameData[j] * Math.sin(angle);
      }

      magnitude[i] = Math.sqrt(real * real + imag * imag);
    }

    return magnitude;
  }

  private detectBPM(audioBuffer: AudioBuffer): number {
    // Simplified BPM detection - in practice, you'd use a proper beat detection algorithm
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Calculate autocorrelation for tempo detection
    const windowSize = Math.floor(sampleRate / 2); // 0.5 second window
    const correlations: number[] = [];

    for (let lag = Math.floor(sampleRate / 200); lag < Math.floor(sampleRate / 60); lag++) { // 60-200 BPM range
      let correlation = 0;
      for (let i = 0; i < windowSize; i++) {
        if (i + lag < channelData.length) {
          correlation += channelData[i] * channelData[i + lag];
        }
      }
      correlations.push(correlation);
    }

    // Find peak correlation
    const maxIndex = correlations.indexOf(Math.max(...correlations));
    const lag = maxIndex + Math.floor(sampleRate / 200);
    const bpm = 60 * sampleRate / lag;

    return Math.round(bpm);
  }

  private detectKey(midiNotes: Array<{ pitch: number, startTime: number, duration: number, velocity: number }>): string {
    // Simplified key detection based on pitch histogram
    const pitchHistogram = new Array(12).fill(0);

    midiNotes.forEach(note => {
      const pitchClass = note.pitch % 12;
      pitchHistogram[pitchClass] += note.duration; // Weight by duration
    });

    // Find the pitch class with maximum weight
    const maxPitchClass = pitchHistogram.indexOf(Math.max(...pitchHistogram));

    const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keyNames[maxPitchClass];
  }

  private getRhythmicPatternColor(interval: number): string {
    // Color based on interval type
    const colors = {
      0.25: '#FF6B6B', // 16th notes - red
      0.5: '#4ECDC4',  // 8th notes - teal
      1: '#45B7D1',    // Quarter notes - blue
      2: '#96CEB4',    // Half notes - green
      4: '#FFEAA7'     // Whole notes - yellow
    };

    return colors[interval as keyof typeof colors] || '#A8E6CF';
  }

  private getMelodicPatternColor(sequenceKey: string): string {
    // Generate consistent color based on sequence
    let hash = 0;
    for (let i = 0; i < sequenceKey.length; i++) {
      hash = sequenceKey.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  // Render visualization to canvas
  static renderToCanvas(
    visualization: TrackVisualization,
    canvas: HTMLCanvasElement,
    options: Partial<VisualizationOptions> = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const defaultOpts: VisualizationOptions = {
      width: canvas.width,
      height: canvas.height,
      zoom: 1,
      timeRange: { start: 0, end: visualization.metadata.duration },
      showPatterns: true,
      showSpectrogram: true,
      colorScheme: 'default'
    };

    const opts = { ...defaultOpts, ...options };

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render components
    if (opts.showSpectrogram) {
      this.renderSpectrogram(ctx, visualization.spectrogram, opts);
    }

    this.renderWaveform(ctx, visualization.waveform, opts);
    this.renderPianoRoll(ctx, visualization.pianoRoll, opts);

    if (opts.showPatterns) {
      this.renderPatternHeatmap(ctx, visualization.patternHeatmap, opts);
    }
  }

  private static renderSpectrogram(ctx: CanvasRenderingContext2D, spectrogram: SpectrogramData, options: VisualizationOptions): void {
    const { width, height } = options;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let x = 0; x < width; x++) {
      const timeIndex = Math.floor((x / width) * spectrogram.times.length);

      for (let y = 0; y < height; y++) {
        const freqIndex = Math.floor((y / height) * spectrogram.frequencies.length);
        const magnitude = spectrogram.magnitudes[timeIndex]?.[freqIndex] || 0;

        // Convert magnitude to color
        const intensity = Math.min(magnitude * 255, 255);
        const pixelIndex = (y * width + x) * 4;

        data[pixelIndex] = intensity;     // R
        data[pixelIndex + 1] = intensity; // G
        data[pixelIndex + 2] = 0;         // B
        data[pixelIndex + 3] = 255;       // A
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static renderWaveform(ctx: CanvasRenderingContext2D, waveform: WaveformData, options: VisualizationOptions): void {
    const { width, height } = options;
    const centerY = height / 2;

    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor((x / width) * waveform.peaks.length);
      const amplitude = waveform.peaks[sampleIndex] || 0;

      const y = centerY - (amplitude * centerY);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  private static renderPianoRoll(ctx: CanvasRenderingContext2D, pianoRoll: PianoRollData, options: VisualizationOptions): void {
    const { width, height } = options;
    const pixelsPerSecond = width / (options.timeRange.end - options.timeRange.start);
    const pixelsPerSemitone = height / (pianoRoll.pitchRange.max - pianoRoll.pitchRange.min);

    // Draw note rectangles
    pianoRoll.notes.forEach(note => {
      const x = (note.startTime - options.timeRange.start) * pixelsPerSecond;
      const y = height - ((note.pitch - pianoRoll.pitchRange.min) * pixelsPerSemitone);
      const noteWidth = note.duration * pixelsPerSecond;
      const noteHeight = pixelsPerSemitone * 0.8;

      // Color based on velocity
      const alpha = note.velocity / 127;
      ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
      ctx.fillRect(x, y - noteHeight, noteWidth, noteHeight);

      // Outline
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y - noteHeight, noteWidth, noteHeight);
    });
  }

  private static renderPatternHeatmap(ctx: CanvasRenderingContext2D, heatmap: PatternHeatmapData, options: VisualizationOptions): void {
    const { width, height } = options;

    // Render pattern positions
    heatmap.patterns.forEach(pattern => {
      ctx.fillStyle = pattern.color;

      pattern.positions.forEach(position => {
        const x = ((position.start - options.timeRange.start) / (options.timeRange.end - options.timeRange.start)) * width;
        const width_bar = ((position.end - position.start) / (options.timeRange.end - options.timeRange.start)) * width;
        const y = 0;
        const height_bar = position.strength * height * 0.1; // 10% of height max

        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, y, width_bar, height_bar);
        ctx.globalAlpha = 1;
      });
    });
  }
}