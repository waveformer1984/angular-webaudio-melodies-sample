/**
 * DAW Transport - Playback Controls and Transport Bar
 * Provides play, pause, stop, record, and navigation controls
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-daw-transport',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="daw-transport">
      <!-- Main transport controls -->
      <div class="transport-controls">
        <button
          class="transport-btn"
          [class.active]="isRecording"
          (click)="toggleRecord()"
          title="Record">
          <div class="record-icon"></div>
        </button>

        <button
          class="transport-btn"
          (click)="goToStart()"
          title="Go to Start">
          ⏮
        </button>

        <button
          class="transport-btn"
          (click)="rewind()"
          title="Rewind">
          ⏪
        </button>

        <button
          class="transport-btn play-btn"
          [class.active]="isPlaying"
          (click)="togglePlay()"
          title="Play/Pause">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>

        <button
          class="transport-btn"
          (click)="stop()"
          title="Stop">
          ⏹
        </button>

        <button
          class="transport-btn"
          (click)="fastForward()"
          title="Fast Forward">
          ⏩
        </button>

        <button
          class="transport-btn"
          (click)="goToEnd()"
          title="Go to End">
          ⏭
        </button>
      </div>

      <!-- Time display and position -->
      <div class="time-display">
        <div class="time-input-group">
          <label>Position:</label>
          <input
            type="text"
            class="time-input"
            [value]="formatTime(currentTime)"
            (input)="onTimeInput($event)"
            (blur)="onTimeBlur()"
            placeholder="0:00.00">
        </div>

        <div class="tempo-display">
          <label>BPM:</label>
          <input
            type="number"
            class="tempo-input"
            [value]="bpm"
            (input)="onBpmChange($event)"
            min="60"
            max="200"
            step="1">
        </div>

        <div class="time-signature">
          <select [(ngModel)]="timeSignature" (change)="onTimeSignatureChange()">
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
          </select>
        </div>
      </div>

      <!-- Loop controls -->
      <div class="loop-controls">
        <label>
          <input
            type="checkbox"
            [(ngModel)]="loopEnabled"
            (change)="onLoopToggle()">
          Loop
        </label>

        <div class="loop-points" *ngIf="loopEnabled">
          <input
            type="text"
            class="time-input small"
            [value]="formatTime(loopStart)"
            (input)="onLoopStartInput($event)"
            placeholder="Start">
          <span>to</span>
          <input
            type="text"
            class="time-input small"
            [value]="formatTime(loopEnd)"
            (input)="onLoopEndInput($event)"
            placeholder="End">
        </div>
      </div>

      <!-- Metronome -->
      <div class="metronome-controls">
        <label>
          <input
            type="checkbox"
            [(ngModel)]="metronomeEnabled"
            (change)="onMetronomeToggle()">
          Metronome
        </label>
      </div>

      <!-- Status indicators -->
      <div class="status-indicators">
        <div class="status-item" [class.active]="isPlaying">
          <span class="status-dot"></span>
          {{ isPlaying ? 'Playing' : 'Stopped' }}
        </div>
        <div class="status-item" [class.active]="isRecording">
          <span class="status-dot record"></span>
          {{ isRecording ? 'Recording' : 'Ready' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .daw-transport {
      background: #2a2a2a;
      color: #fff;
      padding: 12px;
      border-bottom: 1px solid #444;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .transport-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .transport-btn {
      background: #444;
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: background 0.2s;
    }

    .transport-btn:hover {
      background: #555;
    }

    .transport-btn.active {
      background: #007acc;
    }

    .transport-btn.play-btn.active {
      background: #00cc44;
    }

    .record-icon {
      width: 16px;
      height: 16px;
      background: #ff4444;
      border-radius: 50%;
      margin: auto;
    }

    .time-display {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .time-input-group, .tempo-display {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .time-input, .tempo-input {
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      width: 80px;
      font-family: monospace;
    }

    .time-input.small {
      width: 60px;
    }

    .tempo-input {
      width: 50px;
    }

    .time-signature select {
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 4px;
      border-radius: 3px;
    }

    .loop-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .loop-points {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .metronome-controls {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .status-indicators {
      display: flex;
      gap: 15px;
      margin-left: auto;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.9em;
      opacity: 0.7;
    }

    .status-item.active {
      opacity: 1;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #666;
      border-radius: 50%;
    }

    .status-dot.record {
      background: #ff4444;
    }

    .status-item.active .status-dot {
      background: #00ff00;
    }

    label {
      font-size: 0.9em;
      color: #ccc;
    }

    input[type="checkbox"] {
      margin-right: 5px;
    }
  `]
})
export class DAWTransportComponent {
  @Input() isPlaying = false;
  @Input() isRecording = false;
  @Input() currentTime = 0;
  @Input() bpm = 120;
  @Input() loopEnabled = false;
  @Input() loopStart = 0;
  @Input() loopEnd = 0;
  @Input() metronomeEnabled = false;
  @Input() timeSignature = '4/4';

  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() stop = new EventEmitter<void>();
  @Output() record = new EventEmitter<void>();
  @Output() goToStart = new EventEmitter<void>();
  @Output() goToEnd = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() fastForward = new EventEmitter<void>();
  @Output() timeChange = new EventEmitter<number>();
  @Output() bpmChange = new EventEmitter<number>();
  @Output() loopToggle = new EventEmitter<boolean>();
  @Output() loopPointsChange = new EventEmitter<{start: number, end: number}>();
  @Output() metronomeToggle = new EventEmitter<boolean>();
  @Output() timeSignatureChange = new EventEmitter<string>();

  private timeInputValue = '';

  togglePlay() {
    if (this.isPlaying) {
      this.pause.emit();
    } else {
      this.play.emit();
    }
  }

  stop() {
    this.stop.emit();
  }

  toggleRecord() {
    this.record.emit();
  }

  goToStart() {
    this.goToStart.emit();
  }

  goToEnd() {
    this.goToEnd.emit();
  }

  rewind() {
    this.rewind.emit();
  }

  fastForward() {
    this.fastForward.emit();
  }

  onTimeInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.timeInputValue = target.value;
  }

  onTimeBlur() {
    if (this.timeInputValue) {
      const time = this.parseTime(this.timeInputValue);
      if (time !== null) {
        this.timeChange.emit(time);
      }
    }
    this.timeInputValue = '';
  }

  onBpmChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const bpm = parseInt(target.value);
    if (bpm >= 60 && bpm <= 200) {
      this.bpmChange.emit(bpm);
    }
  }

  onLoopToggle() {
    this.loopToggle.emit(this.loopEnabled);
  }

  onLoopStartInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const time = this.parseTime(target.value);
    if (time !== null) {
      this.loopPointsChange.emit({ start: time, end: this.loopEnd });
    }
  }

  onLoopEndInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const time = this.parseTime(target.value);
    if (time !== null) {
      this.loopPointsChange.emit({ start: this.loopStart, end: time });
    }
  }

  onMetronomeToggle() {
    this.metronomeToggle.emit(this.metronomeEnabled);
  }

  onTimeSignatureChange() {
    this.timeSignatureChange.emit(this.timeSignature);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  private parseTime(timeString: string): number | null {
    const match = timeString.match(/^(\d+):(\d+)\.(\d+)$/);
    if (!match) return null;

    const mins = parseInt(match[1]);
    const secs = parseInt(match[2]);
    const ms = parseInt(match[3]);

    return mins * 60 + secs + ms / 100;
  }
}