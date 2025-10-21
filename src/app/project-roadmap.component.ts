import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RoadmapSection {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  energy: number; // A value from 0 to 1
}

@Component({
  selector: 'app-project-roadmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="project-roadmap">
      <h2>Project Roadmap</h2>
      <div class="roadmap-visualizer">
        <!-- The visualizer will go here -->
      </div>
    </div>
  `,
  styles: [`
    .project-roadmap {
      background-color: var(--control-bg-color, #2c2c2e);
      padding: 16px;
      border-radius: 8px;
    }

    h2 {
      color: var(--text-color, #fff);
      margin-bottom: 16px;
    }

    .roadmap-visualizer {
      /* Placeholder for the visualizer */
      height: 200px;
      background-color: var(--background-color, #1e1e1e);
      border: 1px solid var(--border-color, #444);
    }
  `]
})
export class ProjectRoadmapComponent implements OnInit {
  roadmap: RoadmapSection[] = [];

  constructor() { }

  ngOnInit(): void {
    // We will populate the roadmap data here
  }
}
