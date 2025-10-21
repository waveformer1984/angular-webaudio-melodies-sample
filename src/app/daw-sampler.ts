import { DAWEngine } from './daw-core';

export interface SampleSlice {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
}

export class DAWSampler {
  private audioContext: AudioContext;
  private buffer: AudioBuffer | null = null;
  private slices: SampleSlice[] = [];
  private dawEngine: DAWEngine;

  constructor(dawEngine: DAWEngine) {
    this.dawEngine = dawEngine;
    this.audioContext = this.dawEngine.getAudioContext();
  }

  async loadSample(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          try {
            this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.slices = []; // Clear previous slices
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Could not read file'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  getWaveformData(): Float32Array | null {
    if (!this.buffer) {
      return null;
    }
    // For simplicity, we'll use the data from the first channel.
    return this.buffer.getChannelData(0);
  }

  addSlice(startTime: number, endTime: number, name?: string): SampleSlice {
    const newSlice: SampleSlice = {
      id: `slice-${Date.now()}`,
      startTime,
      endTime,
      name: name || `Slice ${this.slices.length + 1}`,
    };
    this.slices.push(newSlice);
    return newSlice;
  }

  getSlices(): SampleSlice[] {
    return this.slices;
  }

  playSlice(sliceId: string): void {
    if (!this.buffer) return;

    const slice = this.slices.find(s => s.id === sliceId);
    if (!slice) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.audioContext.destination);
    source.start(0, slice.startTime, slice.endTime - slice.startTime);
  }
  
  getBuffer(): AudioBuffer | null {
    return this.buffer;
  }
}
