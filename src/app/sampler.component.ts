import { Component, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DAWSampler, SampleSlice } from './daw-sampler';
import { DAWEngine } from './daw-core';

@Component({
  selector: 'app-sampler',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sampler-panel">
      <h4>Sampler</h4>
      <input type="file" (change)="onFileChange($event)" accept="audio/*">
      <div class="waveform-container" #waveformContainer>
        <canvas #waveformCanvas (mousedown)="onMouseDown($event)" (mousemove)="onMouseMove($event)" (mouseup)="onMouseUp($event)"></canvas>
      </div>
      <div class="slice-controls">
        <button (click)="clearSlices()">Clear Slices</button>
      </div>
      <div class="slice-list">
        <div *ngFor="let slice of slices" class="slice-item" (click)="sampler.playSlice(slice.id)">
          {{ slice.name }} ({{ slice.startTime.toFixed(2) }}s - {{ slice.endTime.toFixed(2) }}s)
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sampler-panel {
      padding: 16px;
      background-color: var(--control-bg-color, #2c2c2e);
      border-radius: 8px;
      color: var(--text-color, #fff);
    }
    h4 {
      margin-top: 0;
      margin-bottom: 16px;
    }
    input[type="file"] {
      margin-bottom: 16px;
    }
    .waveform-container {
      position: relative;
      width: 100%;
      height: 120px;
      background-color: var(--background-color, #1e1e1e);
      border: 1px solid var(--border-color, #444);
      border-radius: 4px;
      margin-bottom: 16px;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
    .slice-controls button {
      background: var(--button-bg-color, #5a5a5c);
      color: var(--button-text-color, #fff);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 6px 12px;
    }
    .slice-list {
      margin-top: 16px;
    }
    .slice-item {
      background-color: var(--secondary-color, #3a3a3c);
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
    }
    .slice-item:hover {
        background-color: var(--accent-color-hover, #ffb73a);
    }
  `]
})
export class SamplerComponent implements OnInit {
  @ViewChild('waveformCanvas') waveformCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waveformContainer') waveformContainer!: ElementRef<HTMLDivElement>;
  
  sampler: DAWSampler;
  slices: SampleSlice[] = [];
  
  private isDragging = false;
  private selectionStart = 0;

  constructor(private dawEngine: DAWEngine) {
    this.sampler = new DAWSampler(this.dawEngine);
  }

  ngOnInit(): void { }

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      await this.sampler.loadSample(file);
      this.drawWaveform();
    }
  }

  drawWaveform() {
    const canvas = this.waveformCanvas.nativeElement;
    const parent = this.waveformContainer.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waveformData = this.sampler.getWaveformData();
    if (!waveformData) return;
    
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'var(--accent-color, #ff9f0a)';

    const data = waveformData;
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }
  
onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.selectionStart = this.getAudioTimeFromCanvasX(event.offsetX);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    // You could draw a selection rectangle here if you wanted
  }

  onMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const selectionEnd = this.getAudioTimeFromCanvasX(event.offsetX);
    const startTime = Math.min(this.selectionStart, selectionEnd);
    const endTime = Math.max(this.selectionStart, selectionEnd);
    
    if (endTime - startTime > 0.01) { // Threshold for a valid slice
      const newSlice = this.sampler.addSlice(startTime, endTime);
      this.slices = this.sampler.getSlices();
    }
  }
  
  clearSlices() {
      this.slices = [];
  }

  private getAudioTimeFromCanvasX(x: number): number {
      const canvas = this.waveformCanvas.nativeElement;
      const buffer = this.sampler.getBuffer();
      if (!buffer) return 0;

      const ratio = x / canvas.width;
      return buffer.duration * ratio;
  }
}
