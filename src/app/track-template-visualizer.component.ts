import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrackTemplate {
  id: string;
  name: string;
  instrument: string;
  effects: string[];
  midiPatterns: any[]; // Replace 'any' with a more specific type later
}

@Component({
  selector: 'app-track-template-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="track-template-visualizer">
      <h2>Track Templates</h2>
      <div class="template-list">
        <!-- The list of templates will go here -->
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
      /* Placeholder for the template list */
      height: 200px;
      background-color: var(--background-color, #1e1e1e);
      border: 1px solid var(--border-color, #444);
    }
  `]
})
export class TrackTemplateVisualizerComponent implements OnInit {
  templates: TrackTemplate[] = [];

  constructor() { }

  ngOnInit(): void {
    // We will populate the template data here
  }
}
