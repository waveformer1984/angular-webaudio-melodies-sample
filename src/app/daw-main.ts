/**
 * DAW Main Component - Central Hub for the Digital Audio Workstation
 * Integrates all DAW components into a cohesive application
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DAWEngine, Track, Clip } from './daw-core';
import { DAWMixerComponent } from './daw-mixer';
import { DAWTimelineComponent } from './daw-timeline';
import { DAWTransportComponent } from './daw-transport';
import { DAWProjectManager } from './daw-project-manager';
import { DAWSynthesizer } from './daw-synthesizer';
import { RezonateControlsComponent } from './rezonate-controls';
import { KeyboardComponent } from './keyboard.component';
import { dawFileLoader } from './daw-file-loader';
import { ThemeService } from './theming/theme.service';
import { SessionGoalsService, SessionGoal } from './session-goals.service';
import { SessionGoalsComponent } from './session-goals.component';
import { ProjectRoadmapComponent } from './project-roadmap.component';

@Component({
  selector: 'app-daw-main',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DAWMixerComponent,
    DAWTimelineComponent,
    DAWTransportComponent,
    RezonateControlsComponent,
    KeyboardComponent,
    SessionGoalsComponent,
    ProjectRoadmapComponent
  ],
  template: `
    <div class="daw-main">
      <!-- Top Toolbar -->
      <div class="daw-toolbar">
        <div class="toolbar-section">
          <button class="toolbar-btn" (click)="newProject()">New Project</button>
          <button class="toolbar-btn" (click)="openProject()">Open</button>
          <button class="toolbar-btn" (click)="saveProject()">Save</button>
          <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none">
        </div>

        <div class="toolbar-section">
          <button class="toolbar-btn" (click)="addAudioTrack()">Add Audio Track</button>
          <button class="toolbar-btn" (click)="addMidiTrack()">Add MIDI Track</button>
        </div>

        <div class="toolbar-section">
          <span class="project-name">{{ projectName }}</span>
          <span class="modified-indicator" *ngIf="isModified">*</span>
        </div>

        <div class="toolbar-section">
          <button class="toolbar-btn" [disabled]="!canUndo" (click)="undo()">Undo</button>
          <button class="toolbar-btn" [disabled]="!canRedo" (click)="redo()">Redo</button>
        </div>

        <div class="toolbar-section">
          <label for="theme-select" class="theme-label">Theme:</label>
          <select id="theme-select" class="theme-select" [(ngModel)]="selectedTheme" (change)="onThemeChange()">
            <option *ngFor="let theme of themes" [value]="theme.value">{{ theme.name }}</option>
          </select>
        </div>
      </div>

      <!-- Transport Bar -->
      <app-daw-transport
        [isPlaying]="isPlaying"
        [isRecording]="isRecording"
        [currentTime]="currentTime"
        [bpm]="bpm"
        [loopEnabled]="loopEnabled"
        [loopStart]="loopStart"
        [loopEnd]="loopEnd"
        [metronomeEnabled]="metronomeEnabled"
        [timeSignature]="timeSignature"
        (play)="onPlay()"
        (pause)="onPause()"
        (stop)="onStop()"
        (record)="onRecord()"
        (timeChange)="onTimeChange($event)"
        (bpmChange)="onBpmChange($event)"
        (loopToggle)="onLoopToggle($event)"
        (loopPointsChange)="onLoopPointsChange($event)"
        (metronomeToggle)="onMetronomeToggle($event)"
        (timeSignatureChange)="onTimeSignatureChange($event)">
      </app-daw-transport>

      <!-- Main Content Area -->
      <div class="daw-content">
        <!-- Left Panel - Mixer -->
        <div class="left-panel">
          <app-daw-mixer
            [tracks]="tracks"
            [masterVolume]="masterVolume"
            (trackUpdate)="onTrackUpdate($event)"
            (masterVolumeChange)="onMasterVolumeChange($event)"
            (addEffectToTrack)="onAddEffect($event)">
          </app-daw-mixer>
        </div>

        <!-- Center Panel - Timeline -->
        <div class="center-panel">
          <app-daw-timeline
            [tracks]="tracks"
            [playheadPosition]="currentTime"
            [zoom]="timelineZoom"
            [pixelsPerSecond]="pixelsPerSecond"
            (clipMove)="onClipMove($event)"
            (clipResize)="onClipResize($event)"
            (playheadMove)="onPlayheadMove($event)"
            (zoomChange)="onZoomChange($event)">
          </app-daw-timeline>
        </div>

        <!-- Right Panel - Effects, Keyboard & Goals -->
        <div class="right-panel">
            <div class="project-roadmap-panel">
                <app-project-roadmap></app-project-roadmap>
            </div>
          <div class="session-goals-panel">
              <app-session-goals></app-session-goals>
          </div>
          <div class="effects-panel">
            <h4>Rezonate Effects</h4>
            <app-rezonate-controls
              [resonanceEnabled]="resonanceEnabled"
              [hydiEnabled]="hydiEnabled"
              [masterGain]="rezonateGain"
              [hydiIntensity]="hydiIntensity"
              [hydiModulationRate]="hydiModulationRate"
              (resonanceToggle)="onResonanceToggle($event)"
              (hydiToggle)="onHydiToggle($event)"
              (masterGainChange)="onRezonateGainChange($event)">
            </app-rezonate-controls>
          </div>

          <div class="keyboard-panel">
            <h4>Virtual Keyboard</h4>
            <app-keyboard></app-keyboard>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="daw-status-bar">
        <div class="status-item">Tracks: {{ tracks.length }}</div>
        <div class="status-item">Clips: {{ getTotalClips() }}</div>
        <div class="status-item">BPM: {{ bpm }}</div>
        <div class="status-item">Time: {{ formatTime(currentTime) }}</div>
        <div class="status-item">Synth Voices: {{ activeVoices }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./theming/themes.scss'],
  styles: [`
    :host {
      --accent-color-modified: #ff6b6b;
    }

    .daw-main {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--background-color);
      color: var(--text-color);
      font-family: Arial, sans-serif;
    }

    .daw-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: var(--secondary-color);
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 16px;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-btn {
      background: var(--button-bg-color);
      border: none;
      color: var(--button-text-color);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
    }

    .toolbar-btn:hover {
      filter: brightness(1.1);
    }

    .toolbar-btn:disabled {
      background: var(--secondary-color);
      color: var(--text-color);
      opacity: 0.5;
      cursor: not-allowed;
    }

    .project-name {
      font-weight: bold;
      color: var(--text-color);
    }

    .modified-indicator {
      color: var(--accent-color-modified);
      font-weight: bold;
    }

    .theme-label {
        font-size: 0.9em;
        color: var(--text-color);
    }

    .theme-select {
        background: var(--input-bg-color);
        color: var(--input-text-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 4px;
    }

    .daw-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-panel {
      width: 300px;
      border-right: 1px solid var(--border-color);
      background: var(--control-bg-color);
      overflow-y: auto;
    }

    .center-panel {
      flex: 1;
      background: var(--background-color);
      overflow: hidden;
    }

    .right-panel {
      width: 350px;
      border-left: 1px solid var(--border-color);
      background: var(--control-bg-color);
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .project-roadmap-panel, .session-goals-panel {
        flex-shrink: 0;
    }

    .effects-panel, .keyboard-panel {
      margin-bottom: 0;
    }

    .effects-panel h4, .keyboard-panel h4 {
      margin: 0 0 12px 0;
      color: var(--text-color);
      font-size: 1em;
    }

    .daw-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 16px;
      background: var(--secondary-color);
      border-top: 1px solid var(--border-color);
      font-size: 0.8em;
      color: var(--text-color);
      opacity: 0.8;
    }

    .status-item {
      padding: 0 8px;
    }

    h4 {
      color: var(--text-color);
      margin-bottom: 8px;
    }
  `]
})
export class DAWMainComponent implements OnInit, OnDestroy {
  // DAW Engine and Components
  private dawEngine: DAWEngine;
  private projectManager: DAWProjectManager;
  private synthesizer: DAWSynthesizer;

  // UI State
  tracks: Track[] = [];
  isPlaying = false;
  isRecording = false;
  currentTime = 0;
  bpm = 120;
  loopEnabled = false;
  loopStart = 0;
  loopEnd = 0;
  metronomeEnabled = false;
  timeSignature = '4/4';
  timelineZoom = 1;
  pixelsPerSecond = 100;
  masterVolume = 0.8;

  // Rezonate State
  resonanceEnabled = true;
  hydiEnabled = false;
  rezonateGain = 0.3;
  hydiIntensity = 0.5;
  hydiModulationRate = 0.1;

  // Project State
  projectName = 'Untitled Project';
  isModified = false;
  canUndo = false;
  canRedo = false;
  activeVoices = 0;

  // Theming
  themes = [
    { name: 'Dark', value: 'dark-theme' },
    { name: 'Light', value: 'light-theme' },
    { name: 'Solarized Dark', value: 'solarized-dark-theme' }
  ];
  selectedTheme: string;

  constructor(private themeService: ThemeService, private goalsService: SessionGoalsService) {
    this.selectedTheme = this.themeService.getCurrentTheme();
  }

  async ngOnInit() {
    this.themeService.initializeTheme();
    this.initializeGoals();

    try {
      // Initialize file loader and check for required files
      console.log('Loading Rezonate system files...');
      const fileLoadResult = await dawFileLoader.initialize();

      if (!fileLoadResult.success) {
        console.warn('Some required files are missing. System will operate with reduced functionality.');
        console.log(dawFileLoader.generateSetupInstructions());

        // Show user-friendly warning
        this.showFileWarning(fileLoadResult);
      }

      // Initialize DAW components
      this.dawEngine = new DAWEngine();
      this.projectManager = new DAWProjectManager(this.dawEngine);
      this.synthesizer = new DAWSynthesizer(
        this.dawEngine.getAudioContext(),
        this.dawEngine.getRezonateCore()
      );

      // Create default project
      this.newProject();

      // Setup transport callbacks
      this.dawEngine.addTransportCallback((time) => {
        this.currentTime = time;
      });

      // Start auto-save
      this.projectManager.startAutoSave();

      console.log('DAW initialization complete');
    } catch (error) {
      console.error('Failed to initialize DAW:', error);
      // Continue with basic functionality
      this.initializeFallbackMode();
    }
  }

  ngOnDestroy() {
    this.dawEngine.getAudioContext().close();
    this.projectManager.dispose();
  }

  onThemeChange() {
      this.themeService.setTheme(this.selectedTheme);
  }

  // Project Management
  newProject() {
    const project = this.projectManager.createNewProject('New Project');
    this.projectName = project.name;
    this.updateTracks();
    this.isModified = false;
    this.initializeGoals(); // Reset goals for the new project
  }

  openProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.daw.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.projectManager.loadProject(file).then(success => {
          if (success) {
            const session = this.projectManager.getCurrentSession();
            if (session) {
              this.projectName = session.metadata.name;
              this.updateTracks();
              this.isModified = false;
              this.initializeGoals(); // Re-evaluate goals for loaded project
            }
          }
        });
      }
    };
    input.click();
  }

  saveProject() {
    this.projectManager.saveProject();
    this.isModified = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.projectManager.loadProject(file);
    }
  }

  // Track Management
  addAudioTrack() {
    this.dawEngine.createTrack(`Audio Track ${this.tracks.length + 1}`, 'audio');
    this.updateTracks();
    this.markModified();
  }

  addMidiTrack() {
    this.dawEngine.createTrack(`MIDI Track ${this.tracks.length + 1}`, 'midi');
    this.updateTracks();
    this.markModified();
  }

  // Transport Controls
  onPlay() {
    this.dawEngine.play();
    this.isPlaying = true;
  }

  onPause() {
    this.dawEngine.pause();
    this.isPlaying = false;
  }

  onStop() {
    this.dawEngine.stop();
    this.isPlaying = false;
    this.currentTime = 0;
  }

  onRecord() {
    this.isRecording = !this.isRecording;
    // Implementation for recording would go here
  }

  onTimeChange(time: number) {
    this.dawEngine.setPosition(time);
    this.currentTime = time;
  }

  onBpmChange(bpm: number) {
    this.bpm = bpm;
    // Update project BPM
    const project = this.dawEngine.getProject();
    if (project) {
      project.bpm = bpm;
      this.markModified();
    }
  }

  onLoopToggle(enabled: boolean) {
    this.loopEnabled = enabled;
    if (!enabled) {
      this.dawEngine.setLoop(0, 0);
    }
  }

  onLoopPointsChange(points: {start: number, end: number}) {
    this.loopStart = points.start;
    this.loopEnd = points.end;
    this.dawEngine.setLoop(points.start, points.end);
  }

  onMetronomeToggle(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  onTimeSignatureChange(signature: string) {
    this.timeSignature = signature;
  }

  // Track Operations
  onTrackUpdate(update: {trackId: string, updates: Partial<Track>}) {
    this.dawEngine.updateTrack(update.trackId, update.updates);
    this.updateTracks();
    this.markModified();
  }

  onMasterVolumeChange(volume: number) {
    this.masterVolume = volume;
    // Apply to master output
  }

  onAddEffect(trackId: string) {
    // Implementation for adding effects to tracks
    console.log('Add effect to track:', trackId);
  }

  // Timeline Operations
  onClipMove(move: {clip: Clip, newStartTime: number}) {
    // Update clip position
    this.markModified();
  }

  onClipResize(resize: {clip: Clip, newDuration: number, edge: 'left' | 'right'}) {
    // Update clip duration
    this.markModified();
  }

  onPlayheadMove(time: number) {
    this.dawEngine.setPosition(time);
    this.currentTime = time;
  }

  onZoomChange(zoom: number) {
    this.timelineZoom = zoom;
  }

  // Rezonate Controls
  onResonanceToggle(enabled: boolean) {
    this.resonanceEnabled = enabled;
    this.dawEngine.getRezonateCore().setResonanceEnabled(enabled);
  }

  onHydiToggle(config: any) {
    this.hydiEnabled = config.enabled;
    this.hydiIntensity = config.intensity;
    this.hydiModulationRate = config.modulationRate;
    this.dawEngine.getRezonateCore().enableHydi(config);
  }

  onRezonateGainChange(gain: number) {
    this.rezonateGain = gain;
    this.dawEngine.getRezonateCore().setMasterGain(gain);
  }

  // Undo/Redo
  undo() {
    if (this.projectManager.undo()) {
      this.updateTracks();
    }
  }

  redo() {
    if (this.projectManager.redo()) {
      this.updateTracks();
    }
  }

  // Session Goals
  private initializeGoals() {
    const initialGoals: SessionGoal[] = [
      {
        id: 'goal-1',
        title: 'Lay Down the Foundation',
        description: 'Create at least 4 tracks to build your song's structure.',
        metric: 'track_count',
        target: 4,
        progress: 0,
        status: 'incomplete',
        isMandatory: true
      },
      {
        id: 'goal-2',
        title: 'Write a Chorus',
        description: 'A great song needs a catchy chorus. Write at least 4 lines.',
        metric: 'chorus_lines',
        target: 4,
        progress: 0,
        status: 'incomplete',
        isMandatory: true
      },
      {
        id: 'goal-3',
        title: 'Add a Verse',
        description: 'Every story needs a beginning. Write a verse for your song.',
        metric: 'has_verse',
        target: 1,
        progress: 0,
        status: 'incomplete',
        isMandatory: false
      },
      {
        id: 'goal-4',
        title: 'Define the Harmony',
        description: 'Add a chord progression to establish the song\'s mood.',
        metric: 'has_chords',
        target: 1,
        progress: 0,
        status: 'incomplete',
        isMandatory: true
      }
    ];
    this.goalsService.loadGoals(initialGoals);
    this.evaluateGoals();
  }

  private evaluateGoals() {
      const dawState = {
          tracks: this.tracks
          // In the future, we would also pass lyrics, chord progressions, etc.
      };
      this.goalsService.evaluateGoals(dawState);
  }

  // Private Methods
  private updateTracks() {
    this.tracks = this.dawEngine.getTracks();
    this.canUndo = this.projectManager.canUndo();
    this.canRedo = this.projectManager.canRedo();
    this.activeVoices = this.synthesizer.getActiveVoices();
    this.evaluateGoals();
  }

  private markModified() {
    this.isModified = true;
    this.projectManager.markAsModified();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  private getTotalClips(): number {
    return this.tracks.reduce((total, track) => total + track.clips.length, 0);
  }

  // File loading helpers
  private showFileWarning(result: any): void {
    const missingCount = result.missingFiles?.length || 0;
    if (missingCount > 0) {
      console.warn(`Warning: ${missingCount} required Rezonate files are missing. Some features may not work properly.`);
      console.log('Missing files:', result.missingFiles);
    }
  }

  private initializeFallbackMode(): void {
    console.log('Initializing fallback mode with basic functionality...');

    // Initialize with basic components only
    try {
      this.dawEngine = new DAWEngine();
      this.projectManager = new DAWProjectManager(this.dawEngine);

      // Create basic project without synthesizer
      this.newProject();

      console.log('Fallback mode initialized successfully');
    } catch (error) {
      console.error('Failed to initialize fallback mode:', error);
    }
  }
}
