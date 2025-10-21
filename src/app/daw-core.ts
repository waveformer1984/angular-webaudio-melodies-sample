/**
 * DAW Core - Central Audio Engine and Project Management
 * Provides the foundation for the Digital Audio Workstation
 */

import { RezonateCore } from './rezonate-core';

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  clips: Clip[];
  effects: Effect[];
  automation: Automation[];
}

export interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  offset: number;
  type: 'audio' | 'midi';
  data: AudioBuffer | MidiNote[];
  name: string;
}

export interface MidiNote {
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export interface Effect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: { [key: string]: number };
}

export interface Automation {
  parameter: string;
  points: { time: number; value: number }[];
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  sampleRate: number;
  tracks: Track[];
  masterEffects: Effect[];
  metadata: { [key: string]: any };
}

export class DAWEngine {
  private audioContext: AudioContext;
  private rezonateCore: RezonateCore;
  private tracks: Map<string, Track> = new Map();
  private project: Project | null = null;
  private _isPlaying = false;
  private currentTime = 0;
  private loopStart = 0;
  private loopEnd = 0;
  private transportCallbacks: ((time: number) => void)[] = [];

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  constructor() {
    this.audioContext = new AudioContext();
    this.rezonateCore = new RezonateCore(this.audioContext);
    this.initializeMasterChain();
  }

  private initializeMasterChain() {
    // Connect Rezonate to destination
    this.rezonateCore.connect(this.audioContext.destination);
  }

  // Project Management
  createProject(name: string, bpm = 120): Project {
    this.project = {
      id: this.generateId(),
      name,
      bpm,
      sampleRate: this.audioContext.sampleRate,
      tracks: [],
      masterEffects: [],
      metadata: {}
    };
    return this.project;
  }

  loadProject(projectData: Project): void {
    this.project = projectData;
    this.tracks.clear();

    projectData.tracks.forEach(track => {
      this.tracks.set(track.id, track);
    });
  }

  saveProject(): Project | null {
    if (!this.project) return null;

    this.project.tracks = Array.from(this.tracks.values());
    return { ...this.project };
  }

  // Track Management
  createTrack(name: string, type: 'audio' | 'midi'): Track {
    const track: Track = {
      id: this.generateId(),
      name,
      type,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      color: this.getRandomColor(),
      clips: [],
      effects: [],
      automation: []
    };

    this.tracks.set(track.id, track);

    if (this.project) {
      this.project.tracks.push(track);
    }

    return track;
  }

  deleteTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    // Stop any playing clips on this track
    this.stopTrack(trackId);

    this.tracks.delete(trackId);

    if (this.project) {
      this.project.tracks = this.project.tracks.filter(t => t.id !== trackId);
    }

    return true;
  }

  updateTrack(trackId: string, updates: Partial<Track>): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    Object.assign(track, updates);
    return true;
  }

  // Clip Management
  addClip(trackId: string, clip: Omit<Clip, 'id' | 'trackId'>): Clip | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    const newClip: Clip = {
      ...clip,
      id: this.generateId(),
      trackId
    };

    track.clips.push(newClip);
    return newClip;
  }

  removeClip(trackId: string, clipId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return false;

    track.clips.splice(clipIndex, 1);
    return true;
  }

  // Transport Controls
  play(): void {
    if (this.isPlaying) return;

    this._isPlaying = true;
    this.schedulePlayback();
  }

  pause(): void {
    this._isPlaying = false;
  }

  stop(): void {
    this._isPlaying = false;
    this.currentTime = 0;
    this.stopAllTracks();
  }

  setPosition(time: number): void {
    this.currentTime = Math.max(0, time);
    if (this.isPlaying) {
      this.stopAllTracks();
      this.schedulePlayback();
    }
  }

  setLoop(start: number, end: number): void {
    this.loopStart = start;
    this.loopEnd = end;
  }

  // Recording
  async startRecording(trackId: string): Promise<boolean> {
    const track = this.tracks.get(trackId);
    if (!track || track.type !== 'audio') return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Implementation would continue with recording logic
      return true;
    } catch (error) {
      console.error('Recording failed:', error);
      return false;
    }
  }

  stopRecording(trackId: string): void {
    // Implementation for stopping recording
  }

  // Playback Scheduling
  private schedulePlayback(): void {
    if (!this.isPlaying) return;

    const lookAhead = 0.1; // 100ms look-ahead
    const scheduleTime = this.currentTime + lookAhead;

    // Schedule clips that should be playing
    this.tracks.forEach(track => {
      if (track.muted || this.isSoloActive(track.id)) return;

      track.clips.forEach(clip => {
        if (this.shouldPlayClip(clip, scheduleTime)) {
          this.playClip(track, clip, scheduleTime);
        }
      });
    });

    // Schedule next iteration
    setTimeout(() => {
      this.currentTime += lookAhead;
      if (this.currentTime >= this.loopEnd && this.loopEnd > 0) {
        this.currentTime = this.loopStart;
      }
      this.schedulePlayback();
    }, lookAhead * 1000);

    // Notify transport callbacks
    this.transportCallbacks.forEach(callback => callback(this.currentTime));
  }

  private shouldPlayClip(clip: Clip, currentTime: number): boolean {
    return currentTime >= clip.startTime &&
           currentTime < clip.startTime + clip.duration;
  }

  private playClip(track: Track, clip: Clip, currentTime: number): void {
    if (clip.type === 'audio' && clip.data instanceof AudioBuffer) {
      this.playAudioClip(track, clip, currentTime);
    } else if (clip.type === 'midi' && Array.isArray(clip.data)) {
      this.playMidiClip(track, clip, currentTime);
    }
  }

  private playAudioClip(track: Track, clip: Clip, currentTime: number): void {
    const audioBuffer = clip.data as AudioBuffer;
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const panNode = this.audioContext.createStereoPanner();

    source.buffer = audioBuffer;
    gainNode.gain.value = track.volume;
    panNode.pan.value = track.pan;

    // Connect through track effects chain
    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.rezonateCore.getNode());

    const offset = Math.max(0, currentTime - clip.startTime + clip.offset);
    source.start(0, offset, Math.min(clip.duration, audioBuffer.duration - offset));
  }

  private playMidiClip(track: Track, clip: Clip, currentTime: number): void {
    const midiNotes = clip.data as MidiNote[];
    const clipTime = currentTime - clip.startTime;

    midiNotes.forEach(note => {
      if (clipTime >= note.startTime && clipTime < note.startTime + note.duration) {
        // Trigger MIDI note - would integrate with synthesizer
        this.triggerMidiNote(note.note, note.velocity, track);
      }
    });
  }

  private triggerMidiNote(note: number, velocity: number, track: Track): void {
    // Implementation would trigger synthesizer or MIDI output
    console.log(`MIDI Note: ${note}, Velocity: ${velocity}, Track: ${track.name}`);
  }

  private stopAllTracks(): void {
    // Implementation to stop all active audio sources
  }

  private stopTrack(trackId: string): void {
    // Implementation to stop specific track
  }

  private isSoloActive(trackId: string): boolean {
    // Check if any track is soloed and this track is not soloed
    const soloedTracks = Array.from(this.tracks.values()).filter(t => t.solo);
    return soloedTracks.length > 0 && !this.tracks.get(trackId)?.solo;
  }

  // Effects Management
  addEffect(trackId: string, effect: Effect): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.effects.push(effect);
    return true;
  }

  removeEffect(trackId: string, effectId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.effects = track.effects.filter(e => e.id !== effectId);
    return true;
  }

  // Automation
  addAutomation(trackId: string, automation: Automation): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.automation.push(automation);
    return true;
  }

  // Transport Callbacks
  addTransportCallback(callback: (time: number) => void): void {
    this.transportCallbacks.push(callback);
  }

  removeTransportCallback(callback: (time: number) => void): void {
    const index = this.transportCallbacks.indexOf(callback);
    if (index > -1) {
      this.transportCallbacks.splice(index, 1);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Getters
  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  getProject(): Project | null {
    return this.project;
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  getRezonateCore(): RezonateCore {
    return this.rezonateCore;
  }
}
