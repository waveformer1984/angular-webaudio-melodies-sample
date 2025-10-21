/**
 * DAW Performance Optimization - Memory management, audio processing efficiency, and rendering optimizations
 * Ensures low-latency, high-performance audio processing across different devices
 */

export interface PerformanceMetrics {
  audioContextLatency: number;
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  averageCPULoad: number;
  droppedFrames: number;
  audioGlitches: number;
  bufferUnderruns: number;
}

export class DAWPerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private memoryCheckInterval: number | null = null;

  constructor() {
    this.startTime = performance.now();
    this.metrics = {
      audioContextLatency: 0,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageCPULoad: 0,
      droppedFrames: 0,
      audioGlitches: 0,
      bufferUnderruns: 0
    };
  }

  // Initialize monitoring
  startMonitoring(audioContext: AudioContext): void {
    this.checkAudioContextLatency(audioContext);
    this.startMemoryMonitoring();
    this.startFrameMonitoring();
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  // Audio context latency measurement
  private checkAudioContextLatency(audioContext: AudioContext): void {
    if (audioContext.baseLatency !== undefined) {
      this.metrics.audioContextLatency = audioContext.baseLatency * 1000; // Convert to milliseconds
    }

    // Measure output latency if available
    if ('outputLatency' in audioContext && audioContext.outputLatency !== undefined) {
      this.metrics.audioContextLatency += audioContext.outputLatency * 1000;
    }
  }

  // Memory usage monitoring
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = window.setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.currentMemoryUsage = memory.usedJSHeapSize;
        this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memory.usedJSHeapSize);
      }
    }, 1000);
  }

  // Frame rate monitoring
  private startFrameMonitoring(): void {
    const checkFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;

      if (this.lastFrameTime > 0) {
        // Check for dropped frames (assuming 60fps target)
        const expectedFrameTime = 1000 / 60;
        if (deltaTime > expectedFrameTime * 1.5) {
          this.metrics.droppedFrames++;
        }
      }

      this.lastFrameTime = currentTime;
      this.frameCount++;

      requestAnimationFrame(checkFrame);
    };

    requestAnimationFrame(checkFrame);
  }

  // Performance event tracking
  trackAudioGlitch(): void {
    this.metrics.audioGlitches++;
  }

  trackBufferUnderrun(): void {
    this.metrics.bufferUnderruns++;
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics.droppedFrames = 0;
    this.metrics.audioGlitches = 0;
    this.metrics.bufferUnderruns = 0;
    this.metrics.peakMemoryUsage = this.metrics.currentMemoryUsage;
  }

  // Performance recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.audioContextLatency > 50) {
      recommendations.push('High audio latency detected. Consider using a lower latency audio device.');
    }

    if (this.metrics.currentMemoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('High memory usage. Consider reducing the number of active tracks or effects.');
    }

    if (this.metrics.droppedFrames > 10) {
      recommendations.push('Frame drops detected. Consider reducing visual complexity or closing other applications.');
    }

    if (this.metrics.audioGlitches > 5) {
      recommendations.push('Audio glitches detected. Try reducing the number of active effects or using a lower sample rate.');
    }

    return recommendations;
  }
}

// Audio Processing Optimizer
export class AudioProcessingOptimizer {
  private audioContext: AudioContext;
  private workletLoaded = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // Load optimized audio worklet
  async loadOptimizedWorklet(): Promise<void> {
    if (this.workletLoaded) return;

    try {
      await this.audioContext.audioWorklet.addModule('/assets/audio-worklets/optimized-processor.js');
      this.workletLoaded = true;
    } catch (error) {
      console.warn('Optimized audio worklet not available, using standard processing');
    }
  }

  // Create optimized audio node
  createOptimizedNode(): AudioWorkletNode | null {
    if (!this.workletLoaded) return null;

    try {
      return new AudioWorkletNode(this.audioContext, 'optimized-processor');
    } catch (error) {
      return null;
    }
  }

  // Buffer size optimization
  getOptimalBufferSize(): number {
    // Adaptive buffer size based on device capabilities
    const baseLatency = this.audioContext.baseLatency || 0;

    if (baseLatency < 0.01) return 128;      // Low latency devices
    if (baseLatency < 0.05) return 256;      // Standard devices
    if (baseLatency < 0.1) return 512;       // Higher latency devices
    return 1024;                             // High latency/fallback
  }

  // Sample rate optimization
  getOptimalSampleRate(): number {
    const supportedRates = [48000, 44100, 22050];
    const contextRate = this.audioContext.sampleRate;

    // Use context sample rate if supported, otherwise find closest
    return supportedRates.includes(contextRate) ? contextRate : 44100;
  }
}

// Memory Manager
export class DAWMemoryManager {
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private maxBuffers = 50;
  private totalMemoryUsage = 0;
  private maxMemoryUsage = 200 * 1024 * 1024; // 200MB limit

  // Buffer management
  storeBuffer(id: string, buffer: AudioBuffer): boolean {
    const bufferSize = this.calculateBufferSize(buffer);

    // Check memory limit
    if (this.totalMemoryUsage + bufferSize > this.maxMemoryUsage) {
      this.evictOldBuffers(bufferSize);
    }

    // Check buffer count limit
    if (this.audioBuffers.size >= this.maxBuffers) {
      this.evictOldBuffers(0);
    }

    this.audioBuffers.set(id, buffer);
    this.totalMemoryUsage += bufferSize;

    return true;
  }

  getBuffer(id: string): AudioBuffer | null {
    return this.audioBuffers.get(id) || null;
  }

  removeBuffer(id: string): boolean {
    const buffer = this.audioBuffers.get(id);
    if (buffer) {
      this.totalMemoryUsage -= this.calculateBufferSize(buffer);
      this.audioBuffers.delete(id);
      return true;
    }
    return false;
  }

  // Memory cleanup
  clearAllBuffers(): void {
    this.audioBuffers.clear();
    this.totalMemoryUsage = 0;

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // Memory pressure handling
  handleMemoryPressure(): void {
    // Reduce buffer quality or evict non-essential buffers
    const buffersToRemove: string[] = [];

    this.audioBuffers.forEach((buffer, id) => {
      // Mark buffers for removal based on some criteria
      // (e.g., not currently playing, low priority, etc.)
      if (this.shouldEvictBuffer(id, buffer)) {
        buffersToRemove.push(id);
      }
    });

    buffersToRemove.forEach(id => this.removeBuffer(id));
  }

  private calculateBufferSize(buffer: AudioBuffer): number {
    return buffer.length * buffer.numberOfChannels * 4; // 32-bit float = 4 bytes per sample
  }

  private evictOldBuffers(requiredSpace: number): void {
    // Simple LRU eviction - in practice, you'd want a more sophisticated strategy
    const entries = Array.from(this.audioBuffers.entries());

    // Sort by some priority (for now, just remove oldest half)
    const toRemove = entries.slice(0, Math.ceil(entries.length / 2));

    toRemove.forEach(([id]) => {
      this.removeBuffer(id);
    });
  }

  private shouldEvictBuffer(id: string, buffer: AudioBuffer): boolean {
    // Implement eviction logic based on buffer usage patterns
    // For now, just evict every other buffer under memory pressure
    return Math.random() > 0.5;
  }

  // Memory statistics
  getMemoryStats(): {
    bufferCount: number;
    totalMemoryUsage: number;
    averageBufferSize: number;
  } {
    const bufferCount = this.audioBuffers.size;
    const averageBufferSize = bufferCount > 0 ? this.totalMemoryUsage / bufferCount : 0;

    return {
      bufferCount,
      totalMemoryUsage: this.totalMemoryUsage,
      averageBufferSize
    };
  }
}

// Rendering Optimizer
export class DAWRenderingOptimizer {
  private static readonly MAX_CONCURRENT_RENDERS = 2;
  private activeRenders = 0;
  private renderQueue: Array<() => Promise<void>> = [];

  // Queue rendering tasks
  async queueRenderTask(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          this.activeRenders++;
          await task();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.activeRenders--;
          this.processQueue();
        }
      };

      this.renderQueue.push(wrappedTask);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.activeRenders < DAWRenderingOptimizer.MAX_CONCURRENT_RENDERS && this.renderQueue.length > 0) {
      const task = this.renderQueue.shift();
      if (task) {
        task();
      }
    }
  }

  // Progressive rendering for long tasks
  async renderProgressively(
    totalSteps: number,
    stepFunction: (step: number) => Promise<void>,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    for (let step = 0; step < totalSteps; step++) {
      await stepFunction(step);
      progressCallback?.((step + 1) / totalSteps);

      // Yield control to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Resource pooling for frequently used objects
  static createResourcePool<T>(
    factory: () => T,
    destroyer: (resource: T) => void,
    maxSize = 10
  ): ResourcePool<T> {
    return new ResourcePool(factory, destroyer, maxSize);
  }
}

// Resource Pool implementation
class ResourcePool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private destroyer: (resource: T) => void;
  private maxSize: number;

  constructor(factory: () => T, destroyer: (resource: T) => void, maxSize = 10) {
    this.factory = factory;
    this.destroyer = destroyer;
    this.maxSize = maxSize;
  }

  acquire(): T {
    let resource: T;

    if (this.available.length > 0) {
      resource = this.available.pop()!;
    } else if (this.inUse.size < this.maxSize) {
      resource = this.factory();
    } else {
      throw new Error('Resource pool exhausted');
    }

    this.inUse.add(resource);
    return resource;
  }

  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      this.available.push(resource);
    }
  }

  clear(): void {
    this.available.forEach(resource => this.destroyer(resource));
    this.available = [];
    this.inUse.forEach(resource => this.destroyer(resource));
    this.inUse.clear();
  }

  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// Cross-browser compatibility helpers
export class BrowserCompatibilityHelper {
  static isWebAudioSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  static isMediaRecorderSupported(): boolean {
    return !!(window.MediaRecorder);
  }

  static isFileSystemAccessSupported(): boolean {
    return !!(window as any).showOpenFilePicker;
  }

  static getOptimalAudioContextOptions(): AudioContextOptions {
    return {
      latencyHint: 'interactive',
      sampleRate: this.getOptimalSampleRate()
    };
  }

  private static getOptimalSampleRate(): number | undefined {
    // Try to match display refresh rate for best performance
    if ('requestAnimationFrame' in window) {
      // Estimate based on common refresh rates
      return 48000; // Good default for most systems
    }
    return undefined;
  }

  static async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if ('wakeLock' in navigator) {
      try {
        return await navigator.wakeLock.request('screen');
      } catch (error) {
        console.warn('Wake lock not available:', error);
      }
    }
    return null;
  }
}