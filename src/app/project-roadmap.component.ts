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
        <div *ngFor="let section of roadmap" 
             class="roadmap-section" 
             [style.width.%]="getSectionWidth(section)" 
             [style.background-color]="getSectionColor(section.title)">
          {{ section.title }}
        </div>
        <svg class="energy-curve" width="100%" height="100%">
          <path [attr.d]="getEnergyCurvePath()" fill="none" stroke="var(--accent-color, #ff9f0a)" stroke-width="2"></path>
        </svg>
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
      position: relative;
      display: flex;
      height: 100px;
      background-color: var(--background-color, #1e1e1e);
      border: 1px solid var(--border-color, #444);
      border-radius: 4px;
      overflow: hidden;
    }

    .roadmap-section {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color, #fff);
      font-size: 0.8em;
      font-weight: bold;
      text-transform: uppercase;
      border-right: 1px solid var(--border-color, #444);
    }

    .energy-curve {
      position: absolute;
      top: 0;
      left: 0;
    }
  `]
})
export class ProjectRoadmapComponent implements OnInit {
  roadmap: RoadmapSection[] = [];
  totalDuration = 0;

  constructor() { }

  ngOnInit(): void {
    this.roadmap = [
      { id: '1', title: 'Intro', startTime: 0, endTime: 15, energy: 0.2 },
      { id: '2', title: 'Verse', startTime: 15, endTime: 45, energy: 0.5 },
      { id: '3', title: 'Chorus', startTime: 45, endTime: 75, energy: 0.8 },
      { id: '4', title: 'Verse', startTime: 75, endTime: 105, energy: 0.6 },
      { id: '5', title: 'Chorus', startTime: 105, endTime: 135, energy: 0.9 },
      { id: '6', title: 'Bridge', startTime: 135, endTime: 150, energy: 0.4 },
      { id: '7', title: 'Chorus', startTime: 150, endTime: 180, energy: 0.9 },
      { id: '8', title: 'Outro', startTime: 180, endTime: 200, energy: 0.1 },
    ];
    this.totalDuration = this.roadmap[this.roadmap.length - 1].endTime;
  }

  getSectionWidth(section: RoadmapSection): number {
    return (section.endTime - section.startTime) / this.totalDuration * 100;
  }

  getSectionColor(title: string): string {
    const colors: { [key: string]: string } = {
      'Intro': '#4a4a4a',
      'Verse': '#5a5a5a',
      'Chorus': '#6a6a6a',
      'Bridge': '#7a7a7a',
      'Outro': '#4a4a4a',
    };
    return colors[title] || '#8a8a8a';
  }

  getEnergyCurvePath(): string {
    if (this.roadmap.length === 0) {
      return '';
    }

    const pathParts = this.roadmap.map((section, index) => {
      const x = (section.startTime / this.totalDuration) * 100;
      const y = 100 - (section.energy * 100);
      return (index === 0 ? 'M' : 'L') + `${x},${y}`;
    });

    // Add a point for the end of the last section
    const lastSection = this.roadmap[this.roadmap.length - 1];
    const endX = (lastSection.endTime / this.totalDuration) * 100;
    const endY = 100 - (lastSection.energy * 100);
    pathParts.push(`L${endX},${endY}`);

    return pathParts.join(' ');
  }
}
