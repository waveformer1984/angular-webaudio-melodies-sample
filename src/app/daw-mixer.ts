/**
 * DAW Mixer - Audio Mixing Interface and Track Controls
 * Provides the mixing console functionality for the DAW
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Track } from './daw-core';

@Component({
  selector: 'app-daw-mixer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="daw-mixer">
      <div class="mixer-header">
        <h3>Mixer</h3>
        <div class="master-controls">
          <div class="fader-group">
            <label>Master Volume</label>
            <input type="range" min="0" max="1" step="0.01"
                   [(ngModel)]="masterVolume" (input)="onMasterVolumeChange()"
                   class="vertical-fader">
            <div class="fader-value">{{ (masterVolume * 100) | number:'1.0-0' }}%</div>
          </div>
        </div>
      </div>

      <div class="tracks-container">
        <div class="track-strip" *ngFor="let track of tracks; trackBy: trackByFn">
          <div class="track-header" [style.background-color]="track.color">
            <div class="track-name" [title]="track.name">{{ track.name }}</div>
            <button class="delete-track-btn" (click)="deleteTrack(track.id)">X</button>
            <div class="track-type">{{ track.type.toUpperCase() }}</div>
          </div>

          <div class="track-controls">
            <!-- Mute/Solo -->
            <div class="button-group">
              <button
                class="control-button mute"
                [class.active]="track.muted"
                (click)="toggleMute(track.id)"
                title="Mute">
                M
              </button>
              <button
                class="control-button solo"
                [class.active]="track.solo"
                (click)="toggleSolo(track.id)"
                title="Solo">
                S
              </button>
            </div>

            <!-- Volume Fader -->
            <div class="fader-group">
              <input type="range" min="0" max="1" step="0.01"
                     [value]="track.volume" (input)="onVolumeChange(track.id, $event)"
                     class="vertical-fader">
              <div class="fader-value">{{ (track.volume * 100) | number:'1.0-0' }}%</div>
            </div>

            <!-- Pan Control -->
            <div class="pan-group">
              <label>Pan</label>
              <input type="range" min="-1" max="1" step="0.01"
                     [value]="track.pan" (input)="onPanChange(track.id, $event)"
                     class="pan-knob">
              <div class="pan-value">{{ track.pan >= 0 ? 'R' : 'L' }}{{ (Math.abs(track.pan * 100)) | number:'1.0-0' }}</div>
            </div>

            <!-- Effects Chain -->
            <div class="effects-chain">
              <div class="effect-slot" *ngFor="let effect of track.effects; trackBy: effectTrackByFn">
                <div class="effect-name" [title]="effect.type">{{ effect.type }}</div>
                <button class="effect-bypass" [class.active]="effect.enabled"
                        (click)="toggleEffect(track.id, effect.id)">
                  ✓
                </button>
              </div>
              <button class="add-effect" (click)="addEffect(track.id)" title="Add Effect">
                +
              </button>
            </div>

            <!-- VU Meter -->
            <div class="vu-meter">
              <div class="vu-bar">
                <div class="vu-level" [style.height.%]="getVuLevel(track.id) * 100"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .daw-mixer {
      background: #2a2a2a;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      min-height: 300px;
    }

    .mixer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    }

    .master-controls {
      display: flex;
      gap: 15px;
    }

    .tracks-container {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 10px 0;
    }

    .track-strip {
      min-width: 120px;
      background: #333;
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .track-header {
      width: 100%;
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
      color: white;
      font-weight: bold;
      font-size: 0.9em;
      position: relative;
    }

    .delete-track-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(0,0,0,0.4);
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
      line-height: 20px;
      text-align: center;
    }

    .track-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .track-type {
      font-size: 0.7em;
      opacity: 0.8;
      margin-top: 2px;
    }

    .track-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
    }

    .button-group {
      display: flex;
      gap: 5px;
    }

    .control-button {
      width: 25px;
      height: 25px;
      border: none;
      border-radius: 3px;
      background: #555;
      color: white;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.8em;
    }

    .control-button.active {
      background: #ff6b6b;
    }

    .control-button.mute.active {
      background: #ff4444;
    }

    .control-button.solo.active {
      background: #44ff44;
    }

    .fader-group, .pan-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .vertical-fader {
      writing-mode: bt-lr;
      width: 20px;
      height: 100px;
      transform: rotate(270deg);
      background: #444;
      border-radius: 3px;
    }

    .pan-knob {
      width: 60px;
      height: 20px;
      background: #444;
      border-radius: 10px;
    }

    .fader-value, .pan-value {
      font-size: 0.7em;
      color: #ccc;
    }

    .effects-chain {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 100%;
    }

    .effect-slot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #444;
      padding: 3px 5px;
      border-radius: 3px;
      font-size: 0.7em;
    }

    .effect-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .effect-bypass, .add-effect {
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 3px;
      background: #666;
      color: white;
      cursor: pointer;
      font-size: 0.8em;
    }

    .effect-bypass.active {
      background: #44ff44;
    }

    .add-effect {
      background: #666;
      margin-top: 5px;
      align-self: center;
    }

    .vu-meter {
      width: 100%;
      height: 80px;
      background: #222;
      border-radius: 3px;
      padding: 2px;
    }

    .vu-bar {
      width: 100%;
      height: 100%;
      background: #111;
      border-radius: 2px;
      position: relative;
    }

    .vu-level {
      width: 100%;
      background: linear-gradient(to top, #00ff00, #ffff00, #ff0000);
      border-radius: 2px;
      position: absolute;
      bottom: 0;
      transition: height 0.1s ease;
    }

    h3 {
      margin: 0;
      color: #fff;
    }

    label {
      font-size: 0.8em;
      color: #ccc;
    }
  `]
})
export class DAWMixerComponent {
  @Input() tracks: Track[] = [];
  @Input() masterVolume = 0.8;

  @Output() trackUpdate = new EventEmitter<{trackId: string, updates: Partial<Track>}>();
  @Output() trackDelete = new EventEmitter<string>();
  @Output() masterVolumeChange = new EventEmitter<number>();
  @Output() effectToggle = new EventEmitter<{trackId: string, effectId: string}>();
  @Output() addEffectToTrack = new EventEmitter<string>();

  // VU meter levels (mock implementation)
  private vuLevels = new Map<string, number>();

  trackByFn(index: number, track: Track): string {
    return track.id;
  }

  effectTrackByFn(index: number, effect: any): string {
    return effect.id;
  }

  deleteTrack(trackId: string): void {
    this.trackDelete.emit(trackId);
  }

  toggleMute(trackId: string): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      this.trackUpdate.emit({
        trackId,
        updates: { isMuted: !track.isMuted }
      });
    }
  }

  toggleSolo(trackId: string): void {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      this.trackUpdate.emit({
        trackId,
        updates: { isSolo: !track.isSolo }
      });
    }
  }

  onVolumeChange(trackId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value);
    this.trackUpdate.emit({
      trackId,
      updates: { volume }
    });
  }

  onPanChange(trackId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const pan = parseFloat(target.value);
    this.trackUpdate.emit({
      trackId,
      updates: { pan }
    });
  }

  onMasterVolumeChange(): void {
    this.masterVolumeChange.emit(this.masterVolume);
  }

  toggleEffect(trackId: string, effectId: string): void {
    this.effectToggle.emit({ trackId, effectId });
  }

  addEffect(trackId: string): void {
    this.addEffectToTrack.emit(trackId);
  }

  getVuLevel(trackId: string): number {
    // Mock VU meter - in real implementation, this would come from audio analysis
    return this.vuLevels.get(trackId) || 0;
  }

  // Method to update VU levels (called by audio engine)
  updateVuLevel(trackId: string, level: number): void {
    this.vuLevels.set(trackId, Math.min(1, Math.max(0, level)));
  }
}
