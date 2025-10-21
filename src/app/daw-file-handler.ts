/**
 * DAW File Handler - Import/Export functionality for various audio formats
 * Handles WAV, MP3, MIDI file operations and project data serialization
 */

import { DAWEngine, Clip, MidiNote } from './daw-core';

export interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
}

export interface ExportOptions {
  format: 'wav' | 'mp3';
  quality: 'high' | 'medium' | 'low';
  sampleRate: number;
  channels: 1 | 2;
  normalize: boolean;
}

export class DAWFileHandler {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // Audio File Import
  async importAudioFile(file: File): Promise<{buffer: AudioBuffer, info: AudioFileInfo}> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

          const info: AudioFileInfo = {
            name: file.name,
            size: file.size,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            format: this.getFileFormat(file.name)
          };

          resolve({ buffer: audioBuffer, info });
        } catch (error) {
          reject(new Error(`Failed to decode audio file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // MIDI File Import
  async importMidiFile(file: File): Promise<MidiNote[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const midiNotes = this.parseMidiFile(arrayBuffer);
          resolve(midiNotes);
        } catch (error) {
          reject(new Error(`Failed to parse MIDI file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read MIDI file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Audio Export
  async exportAudio(
    audioBuffer: AudioBuffer,
    options: ExportOptions,
    progressCallback?: (progress: number) => void
  ): Promise<Blob> {
    // Apply export options
    let processedBuffer = audioBuffer;

    if (options.normalize) {
      processedBuffer = this.normalizeAudioBuffer(audioBuffer);
      progressCallback?.(0.2);
    }

    if (options.sampleRate !== audioBuffer.sampleRate) {
      processedBuffer = await this.resampleAudioBuffer(processedBuffer, options.sampleRate);
      progressCallback?.(0.5);
    }

    if (options.channels === 1 && audioBuffer.numberOfChannels === 2) {
      processedBuffer = this.convertToMono(processedBuffer);
      progressCallback?.(0.7);
    }

    // Encode based on format
    if (options.format === 'wav') {
      return this.encodeWAV(processedBuffer, options);
    } else {
      return this.encodeMP3(processedBuffer, options);
    }
  }

  // Project Export (Full mix)
  async exportProject(
    dawEngine: DAWEngine,
    options: ExportOptions,
    progressCallback?: (progress: number) => void
  ): Promise<Blob> {
    // This would render the entire project timeline to audio
    // For now, return empty implementation
    progressCallback?.(0.1);

    // Calculate total duration
    const tracks = dawEngine.getTracks();
    let maxDuration = 0;

    tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxDuration = Math.max(maxDuration, clip.startTime + clip.duration);
      });
    });

    progressCallback?.(0.3);

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      options.channels,
      Math.ceil(maxDuration * options.sampleRate),
      options.sampleRate
    );

    // Render each track
    for (const track of tracks) {
      if (track.muted) continue;

      for (const clip of track.clips) {
        if (clip.type === 'audio' && clip.data instanceof AudioBuffer) {
          const source = offlineContext.createBufferSource();
          const gainNode = offlineContext.createGain();
          const panNode = offlineContext.createStereoPanner();

          source.buffer = clip.data;
          gainNode.gain.value = track.volume;
          panNode.pan.value = track.pan;

          source.connect(gainNode);
          gainNode.connect(panNode);
          panNode.connect(offlineContext.destination);

          source.start(clip.startTime, clip.offset, clip.duration);
        }
      }
    }

    progressCallback?.(0.7);

    // Render audio
    const renderedBuffer = await offlineContext.startRendering();
    progressCallback?.(0.9);

    // Export the rendered buffer
    const result = await this.exportAudio(renderedBuffer, options);
    progressCallback?.(1.0);

    return result;
  }

  // MIDI Export
  exportMidi(notes: MidiNote[], fileName: string): void {
    // Create MIDI file data
    const midiData = this.createMidiFile(notes);

    // Download file
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.mid') ? fileName : `${fileName}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  // Utility Methods
  private getFileFormat(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'wav': return 'WAV';
      case 'mp3': return 'MP3';
      case 'aac': return 'AAC';
      case 'ogg': return 'OGG';
      case 'flac': return 'FLAC';
      default: return 'Unknown';
    }
  }

  private parseMidiFile(arrayBuffer: ArrayBuffer): MidiNote[] {
    // Basic MIDI parsing - this would need a full MIDI parser for production
    // For now, return empty array
    console.warn('MIDI parsing not fully implemented');
    return [];
  }

  private normalizeAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;

    // Find peak value
    let peak = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
    }

    // Create normalized buffer
    const normalizedBuffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
    const gain = peak > 0 ? 1 / peak : 1;

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const normalizedData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        normalizedData[i] = originalData[i] * gain;
      }
    }

    return normalizedBuffer;
  }

  private async resampleAudioBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const numberOfChannels = buffer.numberOfChannels;
    const originalLength = buffer.length;
    const originalSampleRate = buffer.sampleRate;

    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.round(originalLength * ratio);

    const resampledBuffer = this.audioContext.createBuffer(numberOfChannels, newLength, targetSampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const resampledData = resampledBuffer.getChannelData(channel);

      // Simple linear interpolation resampling
      for (let i = 0; i < newLength; i++) {
        const originalIndex = i / ratio;
        const index = Math.floor(originalIndex);
        const fraction = originalIndex - index;

        if (index < originalLength - 1) {
          resampledData[i] = originalData[index] * (1 - fraction) + originalData[index + 1] * fraction;
        } else {
          resampledData[i] = originalData[index];
        }
      }
    }

    return resampledBuffer;
  }

  private convertToMono(buffer: AudioBuffer): AudioBuffer {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const monoBuffer = this.audioContext.createBuffer(1, length, sampleRate);

    const leftData = buffer.getChannelData(0);
    const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;
    const monoData = monoBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      monoData[i] = (leftData[i] + rightData[i]) / 2;
    }

    return monoBuffer;
  }

  private encodeWAV(buffer: AudioBuffer, options: ExportOptions): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private encodeMP3(buffer: AudioBuffer, options: ExportOptions): Blob {
    // MP3 encoding would require a library like lamejs
    // For now, fall back to WAV
    console.warn('MP3 encoding not implemented, using WAV instead');
    return this.encodeWAV(buffer, options);
  }

  private createMidiFile(notes: MidiNote[]): Uint8Array {
    // Basic MIDI file creation - simplified implementation
    // This would need a proper MIDI library for full functionality
    console.warn('MIDI file creation not fully implemented');
    return new Uint8Array(0);
  }

  // File validation
  validateAudioFile(file: File): boolean {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/ogg', 'audio/flac'];
    const validExtensions = ['.wav', '.mp3', '.aac', '.ogg', '.flac'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    return hasValidType || hasValidExtension;
  }

  validateMidiFile(file: File): boolean {
    const validTypes = ['audio/midi', 'audio/mid'];
    const validExtensions = ['.mid', '.midi'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    return hasValidType || hasValidExtension;
  }

  // Get supported formats
  getSupportedImportFormats(): string[] {
    return ['WAV', 'MP3', 'AAC', 'OGG', 'FLAC', 'MIDI'];
  }

  getSupportedExportFormats(): string[] {
    return ['WAV', 'MP3'];
  }
}