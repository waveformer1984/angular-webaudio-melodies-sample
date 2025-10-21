import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrackTemplate {
  id: string;
  name: string;
  description: string;
  instrument: string;
  effects: string[];
}

@Component({
  selector: 'app-track-template-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="track-template-visualizer">
      <h2>Track Templates</h2>
      <div class="template-list">
        <div *ngFor="let template of templates"
             class="template-item"
             [class.selected]="template === selectedTemplate"
             (click)="onTemplateClick(template)">
          {{ template.name }}
        </div>
      </div>
      <div *ngIf="selectedTemplate" class="template-inspector">
        <h4>{{ selectedTemplate.name }}</h4>
        <p>{{ selectedTemplate.description }}</p>
        <p><strong>Instrument:</strong> {{ selectedTemplate.instrument }}</p>
        <p><strong>Effects:</strong> {{ selectedTemplate.effects.join(', ') }}</p>
        <button (click)="generateFromTemplate()">Generate with this Template</button>
      </div>
    </div>
  `,
  styles: [`
    .track-template-visualizer {
      background-color: var(--control-bg-color, #2c2c2e);
      padding: 16px;
      border-radius: 8px;
    }
    h2 {
      color: var(--text-color, #fff);
      margin-bottom: 16px;
    }
    .template-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .template-item {
      background-color: var(--secondary-color, #3a3a3c);
      color: var(--text-color, #fff);
      padding: 12px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: background-color 0.2s, border 0.2s;
    }
    .template-item:hover {
      background-color: var(--accent-color-hover, #ffb73a);
    }
    .template-item.selected {
      background-color: var(--accent-color, #ff9f0a);
      border: 2px solid var(--accent-color-hover, #ffb73a);
      color: #000;
    }
    .template-inspector {
      color: var(--text-color, #fff);
      background-color: var(--secondary-color, #3a3a3c);
      padding: 12px;
      border-radius: 4px;
    }
    .template-inspector h4 {
        margin-top: 0;
    }
    .template-inspector p {
        font-size: 0.9em;
    }
    .template-inspector button {
      background: var(--button-bg-color, #5a5a5c);
      color: var(--button-text-color, #fff);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 6px 12px;
      margin-top: 8px;
    }
  `]
})
export class TrackTemplateVisualizerComponent implements OnInit {
  templates: TrackTemplate[] = [];
  selectedTemplate: TrackTemplate | null = null;

  constructor() { }

  ngOnInit(): void {
    this.templates = [
      {
        id: 'bass-1',
        name: 'Deep House Bass',
        description: 'A round, subby bassline perfect for deep house tracks.',
        instrument: 'Analog Bass Synth',
        effects: ['Compressor', 'EQ']
      },
      {
        id: 'lead-1',
        name: 'Progressive Lead',
        description: 'A bright, soaring lead for progressive house or trance.',
        instrument: 'Supersaw Synth',
        effects: ['Reverb', 'Delay', 'EQ']
      },
      {
        id: 'pads-1',
        name: 'Ambient Pads',
        description: 'Lush, evolving pads for creating atmospheric textures.',
        instrument: 'Wavetable Synth',
        effects: ['Long Reverb', 'Chorus']
      },
      {
        id: 'drums-1',
        name: '909 Drums',
        description: 'Classic TR-909 drum kit for house and techno.',
        instrument: 'Drum Machine',
        effects: ['Compressor', 'Saturation']
      }
    ];
  }

  onTemplateClick(template: TrackTemplate) {
    this.selectedTemplate = template;
  }

  generateFromTemplate() {
    if (!this.selectedTemplate) return;

    const prompt = `I want to create a new track using the "${this.selectedTemplate.name}" template. Please generate a 4-bar MIDI clip for this track. The instrument is a ${this.selectedTemplate.instrument} and the effects chain is ${this.selectedTemplate.effects.join(', ')}. The description is: "${this.selectedTemplate.description}".`;
    console.log("PROMPT FOR AI:", prompt);
    // In a future step, this will be connected to the bot chat service to generate the track.
  }
}
