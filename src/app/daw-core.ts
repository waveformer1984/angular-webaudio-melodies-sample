// src/app/daw-core.ts

// --- Interfaces for data structures ---

export interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  // other clip properties...
}

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  clips: Clip[];
  // other track properties...
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  tracks: Track[];
  // other project properties...
}

// --- Rezonate Core stub ---
// This is a placeholder based on existing usage.
class RezonateCore {
    setResonanceEnabled(enabled: boolean) { console.log('setResonanceEnabled', enabled); }
    enableHydi(config: any) { console.log('enableHydi', config); }
    setMasterGain(gain: number) { console.log('setMasterGain', gain); }
}


// --- DAW Engine ---

export class DAWEngine {
  private audioContext: AudioContext;
  private project: Project | null = null;
  private transportCallbacks: ((time: number) => void)[] = [];
  private rezonateCore: RezonateCore;

  constructor() {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContext();
    } else {
        // Provide a mock for non-browser environments (like during server-side rendering or tests)
        this.audioContext = {} as AudioContext;
        console.log("Running in a non-browser environment. AudioContext is mocked.");
    }
    this.rezonateCore = new RezonateCore();
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  getRezonateCore(): RezonateCore {
    return this.rezonateCore;
  }

  // --- Project Management ---

  createProject(name: string, bpm = 120): Project {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      bpm,
      tracks: []
    };
    this.project = newProject;
    return this.project;
  }

  loadProject(project: Project): void {
    this.project = project;
  }

  saveProject(): Project | null {
    return this.project ? { ...this.project } : null;
  }

  getProject(): Project | null {
    return this.project;
  }

  // --- Track Management ---

  getTracks(): Track[] {
    return this.project ? this.project.tracks : [];
  }

  getTrack(trackId: string): Track | undefined {
    return this.project?.tracks.find(t => t.id === trackId);
  }

  createTrack(name: string, type: 'audio' | 'midi'): Track {
    if (!this.project) {
      throw new Error("Cannot create track: no project is loaded.");
    }
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name,
      type,
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      clips: []
    };
    this.project.tracks.push(newTrack);
    return newTrack;
  }

  addTrack(track: Track): void {
      if (!this.project) {
        throw new Error("Cannot add track: no project is loaded.");
      }
      // Should we check for duplicates? For undo, we probably shouldn't.
      this.project.tracks.push(track);
  }

  deleteTrack(trackId: string): void {
    if (this.project) {
      this.project.tracks = this.project.tracks.filter(t => t.id !== trackId);
    }
  }

  updateTrack(trackId: string, updates: Partial<Track>): void {
    if (this.project) {
      const trackIndex = this.project.tracks.findIndex(t => t.id === trackId);
      if (trackIndex > -1) {
        this.project.tracks[trackIndex] = { ...this.project.tracks[trackIndex], ...updates };
      }
    }
  }

  // --- Transport ---

  play(): void {
    console.log("Playback started.");
  }

  pause(): void {
    console.log("Playback paused.");
  }

  stop(): void {
    console.log("Playback stopped.");
  }

  setPosition(time: number): void {
    console.log(`Position set to ${time}.`);
  }

  setLoop(start: number, end: number): void {
    console.log(`Loop set from ${start} to ${end}.`);
  }

  addTransportCallback(callback: (time: number) => void): void {
    this.transportCallbacks.push(callback);
  }
}
