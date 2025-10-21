/**
 * DAW Timeline - Arrangement and Editing Interface
 * Provides the timeline view for arranging clips and editing audio/MIDI data
 */

import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track, Clip } from './daw-core';

@Component({
  selector: 'app-daw-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="daw-timeline" #timelineContainer>
      <div class="timeline-header">
        <div class="timeline-controls">
          <button class="control-btn" (click)="zoomIn()" title="Zoom In">+</button>
          <button class="control-btn" (click)="zoomOut()" title="Zoom Out">-</button>
          <button class="control-btn" (click)="fitToView()" title="Fit to View">⤢</button>
          <span class="time-display">{{ formatTime(playheadPosition) }}</span>
        </div>
        <div class="timeline-ruler" #timelineRuler>
          <div class="ruler-marks">
            <div
              *ngFor="let mark of rulerMarks"
              class="ruler-mark"
              [style.left.px]="mark.position">
              <div class="ruler-line" [class.major]="mark.major"></div>
              <div class="ruler-label" *ngIf="mark.major">{{ formatTime(mark.time) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-body" #timelineBody>
        <!-- Track lanes -->
        <div class="track-lane" *ngFor="let track of tracks; trackBy: trackByFn" [style.height.px]="trackHeight">
          <div class="track-info" [style.background-color]="track.color">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-type">{{ track.type }}</div>
          </div>

          <div class="track-content">
            <!-- Clips -->
            <div
              class="clip"
              *ngFor="let clip of track.clips; trackBy: clipByFn"
              [style.left.px]="timeToPixels(clip.startTime)"
              [style.width.px]="timeToPixels(clip.duration)"
              [style.background-color]="track.color"
              (mousedown)="startClipDrag($event, clip)"
              (dblclick)="editClip(clip)">

              <div class="clip-content">
                <div class="clip-name">{{ clip.name }}</div>
                <div class="clip-resize-handle left" (mousedown)="startClipResize($event, clip, 'left')"></div>
                <div class="clip-resize-handle right" (mousedown)="startClipResize($event, clip, 'right')"></div>
              </div>

              <!-- Waveform visualization for audio clips -->
              <div class="waveform" *ngIf="clip.type === 'audio'">
                <canvas #waveformCanvas [attr.data-clip-id]="clip.id"></canvas>
              </div>
            </div>

            <!-- Automation lanes -->
            <div class="automation-lane" *ngFor="let automation of track.automation">
              <svg class="automation-curve" viewBox="0 0 1000 100">
                <path [attr.d]="getAutomationPath(automation)" stroke="#00ff00" fill="none" stroke-width="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Playhead -->
      <div
        class="playhead"
        [style.left.px]="timeToPixels(playheadPosition)"
        (mousedown)="startPlayheadDrag($event)">
      </div>

      <!-- Selection overlay -->
      <div
        class="selection-overlay"
        *ngIf="selectionStart !== null && selectionEnd !== null"
        [style.left.px]="Math.min(timeToPixels(selectionStart), timeToPixels(selectionEnd))"
        [style.width.px]="Math.abs(timeToPixels(selectionEnd) - timeToPixels(selectionStart))">
      </div>

      <!-- Context menu -->
      <div
        class="context-menu"
        *ngIf="contextMenu.visible"
        [style.left.px]="contextMenu.x"
        [style.top.px]="contextMenu.y">
        <div class="context-menu-item" (click)="contextMenuAction('cut')">Cut</div>
        <div class="context-menu-item" (click)="contextMenuAction('copy')">Copy</div>
        <div class="context-menu-item" (click)="contextMenuAction('paste')">Paste</div>
        <div class="context-menu-item" (click)="contextMenuAction('delete')">Delete</div>
        <div class="context-menu-item" (click)="contextMenuAction('split')">Split</div>
      </div>
    </div>
  `,
  styles: [`
    .daw-timeline {
      background: #1a1a1a;
      color: #fff;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .timeline-header {
      border-bottom: 1px solid #333;
      background: #2a2a2a;
    }

    .timeline-controls {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
    }

    .control-btn {
      background: #444;
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
    }

    .control-btn:hover {
      background: #555;
    }

    .time-display {
      margin-left: auto;
      font-family: monospace;
      font-size: 0.9em;
    }

    .timeline-ruler {
      height: 30px;
      position: relative;
      border-bottom: 1px solid #333;
    }

    .ruler-marks {
      position: relative;
      height: 100%;
    }

    .ruler-mark {
      position: absolute;
      height: 100%;
    }

    .ruler-line {
      width: 1px;
      height: 100%;
      background: #666;
    }

    .ruler-line.major {
      background: #999;
    }

    .ruler-label {
      position: absolute;
      top: -20px;
      left: -20px;
      font-size: 0.7em;
      color: #ccc;
      white-space: nowrap;
    }

    .timeline-body {
      flex: 1;
      overflow: auto;
    }

    .track-lane {
      display: flex;
      border-bottom: 1px solid #333;
      position: relative;
    }

    .track-info {
      width: 150px;
      padding: 8px;
      border-right: 1px solid #333;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .track-name {
      font-size: 0.9em;
    }

    .track-type {
      font-size: 0.7em;
      opacity: 0.7;
      text-transform: uppercase;
    }

    .track-content {
      flex: 1;
      position: relative;
      background: #222;
    }

    .clip {
      position: absolute;
      top: 4px;
      height: calc(100% - 8px);
      border-radius: 4px;
      cursor: grab;
      user-select: none;
      border: 2px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
    }

    .clip:hover {
      border-color: rgba(255, 255, 255, 0.5);
    }

    .clip.dragging {
      opacity: 0.7;
      cursor: grabbing;
    }

    .clip.selected {
      border-color: #00ff00;
      box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
    }

    .clip-content {
      padding: 4px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .clip-name {
      font-size: 0.8em;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .clip-resize-handle {
      position: absolute;
      top: 0;
      width: 8px;
      height: 100%;
      cursor: ew-resize;
      background: rgba(255, 255, 255, 0.3);
      opacity: 0;
    }

    .clip:hover .clip-resize-handle {
      opacity: 1;
    }

    .clip-resize-handle.left {
      left: 0;
    }

    .clip-resize-handle.right {
      right: 0;
    }

    .waveform {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      opacity: 0.7;
    }

    .automation-lane {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      pointer-events: none;
    }

    .automation-curve {
      width: 100%;
      height: 100%;
    }

    .playhead {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background: #ff0000;
      z-index: 10;
      cursor: ew-resize;
    }

    .playhead::before {
      content: '';
      position: absolute;
      top: -8px;
      left: -4px;
      width: 10px;
      height: 8px;
      background: #ff0000;
      clip-path: polygon(50% 100%, 0 0, 100% 0);
    }

    .selection-overlay {
      position: absolute;
      top: 0;
      height: 100%;
      background: rgba(0, 255, 0, 0.2);
      border: 1px solid #00ff00;
      pointer-events: none;
    }

    .context-menu {
      position: absolute;
      background: #333;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 4px 0;
      z-index: 1000;
      min-width: 120px;
    }

    .context-menu-item {
      padding: 8px 12px;
      cursor: pointer;
      color: #fff;
    }

    .context-menu-item:hover {
      background: #555;
    }
  `]
})
export class DAWTimelineComponent {
  @Input() tracks: Track[] = [];
  @Input() playheadPosition = 0;
  @Input() zoom = 1;
  @Input() pixelsPerSecond = 100;

  @Output() clipMove = new EventEmitter<{clip: Clip, newStartTime: number}>();
  @Output() clipResize = new EventEmitter<{clip: Clip, newDuration: number, edge: 'left' | 'right'}>();
  @Output() clipSelect = new EventEmitter<Clip>();
  @Output() clipEdit = new EventEmitter<Clip>();
  @Output() playheadMove = new EventEmitter<number>();
  @Output() zoomChange = new EventEmitter<number>();

  @ViewChild('timelineContainer', { static: true }) timelineContainer!: ElementRef;
  @ViewChild('timelineRuler') timelineRuler!: ElementRef;

  trackHeight = 80;
  rulerMarks: { time: number; position: number; major: boolean }[] = [];

  // Interaction state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartTime = 0;
  private draggedClip: Clip | null = null;
  private resizeEdge: 'left' | 'right' | null = null;
  private isResizing = false;
  private isPlayheadDragging = false;

  // Selection
  selectionStart: number | null = null;
  selectionEnd: number | null = null;

  // Context menu
  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    target: null as Clip | null
  };

  ngOnInit() {
    this.updateRulerMarks();
  }

  ngOnChanges() {
    this.updateRulerMarks();
  }

  trackByFn(index: number, track: Track): string {
    return track.id;
  }

  clipByFn(index: number, clip: Clip): string {
    return clip.id;
  }

  timeToPixels(time: number): number {
    return time * this.pixelsPerSecond * this.zoom;
  }

  pixelsToTime(pixels: number): number {
    return pixels / (this.pixelsPerSecond * this.zoom);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  updateRulerMarks() {
    this.rulerMarks = [];
    const containerWidth = this.timelineContainer?.nativeElement?.offsetWidth || 1000;
    const visibleDuration = this.pixelsToTime(containerWidth);

    // Major marks every second, minor marks every 0.1 seconds
    const majorInterval = 1;
    const minorInterval = 0.1;

    for (let time = 0; time <= visibleDuration; time += minorInterval) {
      const position = this.timeToPixels(time);
      const major = Math.abs(time % majorInterval) < 0.01;

      if (major || time % 0.5 === 0) {
        this.rulerMarks.push({ time, position, major });
      }
    }
  }

  zoomIn() {
    this.zoom *= 1.5;
    this.zoomChange.emit(this.zoom);
    this.updateRulerMarks();
  }

  zoomOut() {
    this.zoom /= 1.5;
    this.zoomChange.emit(this.zoom);
    this.updateRulerMarks();
  }

  fitToView() {
    // Calculate total duration of all clips
    let maxTime = 0;
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        maxTime = Math.max(maxTime, clip.startTime + clip.duration);
      });
    });

    if (maxTime > 0) {
      const containerWidth = this.timelineContainer.nativeElement.offsetWidth;
      this.zoom = containerWidth / this.timeToPixels(maxTime);
      this.zoomChange.emit(this.zoom);
      this.updateRulerMarks();
    }
  }

  startClipDrag(event: MouseEvent, clip: Clip) {
    if (event.button !== 0) return; // Only left mouse button

    this.isDragging = true;
    this.draggedClip = clip;
    this.dragStartX = event.clientX;
    this.dragStartTime = clip.startTime;

    event.preventDefault();
  }

  startClipResize(event: MouseEvent, clip: Clip, edge: 'left' | 'right') {
    this.isResizing = true;
    this.draggedClip = clip;
    this.resizeEdge = edge;
    this.dragStartX = event.clientX;
    this.dragStartTime = edge === 'left' ? clip.startTime : clip.startTime + clip.duration;

    event.preventDefault();
    event.stopPropagation();
  }

  startPlayheadDrag(event: MouseEvent) {
    this.isPlayheadDragging = true;
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging && this.draggedClip) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaTime = this.pixelsToTime(deltaX);
      const newStartTime = Math.max(0, this.dragStartTime + deltaTime);

      this.clipMove.emit({
        clip: this.draggedClip,
        newStartTime
      });
    }

    if (this.isResizing && this.draggedClip && this.resizeEdge) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaTime = this.pixelsToTime(deltaX);

      if (this.resizeEdge === 'left') {
        const newStartTime = Math.max(0, this.dragStartTime + deltaTime);
        const newDuration = this.draggedClip.startTime + this.draggedClip.duration - newStartTime;
        if (newDuration > 0) {
          this.clipResize.emit({
            clip: this.draggedClip,
            newDuration,
            edge: 'left'
          });
        }
      } else {
        const newDuration = Math.max(0.1, this.dragStartTime - this.draggedClip.startTime + deltaTime);
        this.clipResize.emit({
          clip: this.draggedClip,
          newDuration,
          edge: 'right'
        });
      }
    }

    if (this.isPlayheadDragging) {
      const rect = this.timelineContainer.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const time = this.pixelsToTime(x);
      this.playheadMove.emit(Math.max(0, time));
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.isPlayheadDragging = false;
    this.draggedClip = null;
    this.resizeEdge = null;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    event.preventDefault();

    const rect = this.timelineContainer.nativeElement.getBoundingClientRect();
    this.contextMenu.x = event.clientX - rect.left;
    this.contextMenu.y = event.clientY - rect.top;
    this.contextMenu.visible = true;
  }

  @HostListener('window:click')
  hideContextMenu() {
    this.contextMenu.visible = false;
  }

  editClip(clip: Clip) {
    this.clipEdit.emit(clip);
  }

  contextMenuAction(action: string) {
    // Handle context menu actions
    console.log('Context menu action:', action);
    this.contextMenu.visible = false;
  }

  getAutomationPath(automation: any): string {
    // Generate SVG path for automation curve
    if (!automation.points || automation.points.length === 0) return '';

    const points = automation.points.map((point: any) =>
      `${(point.time / 10) * 1000},${100 - point.value * 100}`
    );

    return `M ${points.join(' L ')}`;
  }
}