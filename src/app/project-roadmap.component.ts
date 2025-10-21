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
             [class.selected]="section === selectedSection"
             [style.width.%]="getSectionWidth(section)" 
             [style.background-color]="getSectionColor(section.title)"
             (click)="onSectionClick(section)">
          <span>{{ section.title }}</span>
        </div>
        <svg class="energy-curve" width="100%" height="100%" preserveAspectRatio="none">
          <path [attr.d]="energyCurvePath" fill="none" stroke="var(--accent-color, #ff9f0a)" stroke-width="2"></path>
        </svg>
      </div>
      <div *ngIf="selectedSection" class="roadmap-inspector">
        <h4>Selected: {{ selectedSection.title }}</h4>
        <p>Energy Level: {{ selectedSection.energy.toFixed(1) }}</p>
        <button (click)="promptAI()">Ask AI for Suggestions</button>
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
      margin-bottom: 16px;
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
      cursor: pointer;
      transition: filter 0.2s, border 0.2s;
      z-index: 1;
    }
    .roadmap-section:hover {
      filter: brightness(1.2);
    }
    .roadmap-section.selected {
      border: 2px solid var(--accent-color, #ff9f0a);
      filter: brightness(1.3);
      z-index: 2;
    }
    .roadmap-section span {
        pointer-events: none;
    }
    .energy-curve {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 3;
    }
    .roadmap-inspector {
      color: var(--text-color, #fff);
      background-color: var(--secondary-color, #3a3a3c);
      padding: 12px;
      border-radius: 4px;
    }
    .roadmap-inspector h4 {
        margin-top: 0;
    }
    .roadmap-inspector button {
      background: var(--button-bg-color, #5a5a5c);
      color: var(--button-text-color, #fff);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 6px 12px;
    }
  `]
})
export class ProjectRoadmapComponent implements OnInit {
  roadmap: RoadmapSection[] = [];
  totalDuration = 0;
  selectedSection: RoadmapSection | null = null;
  energyCurvePath = '';

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
    this.energyCurvePath = this.createCardinalSpline(this.getEnergyPoints());
  }

  onSectionClick(section: RoadmapSection) {
    this.selectedSection = section;
  }

  promptAI() {
    if (!this.selectedSection) return;
    const prompt = `I've selected the ${this.selectedSection.title} section of my song. It runs from ${this.selectedSection.startTime}s to ${this.selectedSection.endTime}s and has a current energy level of ${this.selectedSection.energy.toFixed(1)}. I'm looking for suggestions to improve it. What kind of instrumentation, harmony, or rhythm changes could I make?`;
    console.log("PROMPT FOR AI:", prompt);
    // In a future step, this will be connected to the bot chat service.
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

  private getEnergyPoints(): [number, number][] {
    const points: [number, number][] = [];
    this.roadmap.forEach(section => {
        const x = ((section.startTime + (section.endTime - section.startTime) / 2) / this.totalDuration) * 100;
        const y = 100 - (section.energy * 90) - 5; // Scale energy to fit within 90% of height with 5% padding
        points.push([x, y]);
    });
    return points;
  }

  private createCardinalSpline(points: [number, number][], tension = 0.5): string {
    if (points.length < 2) return '';

    let path = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i > 0 ? i - 1 : 0];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1_x = p1[0] + (p2[0] - p0[0]) / 6 * tension;
        const cp1_y = p1[1] + (p2[1] - p0[1]) / 6 * tension;

        const cp2_x = p2[0] - (p3[0] - p1[0]) / 6 * tension;
        const cp2_y = p2[1] - (p3[1] - p1[1]) / 6 * tension;

        path += ` C ${cp1_x},${cp1_y} ${cp2_x},${cp2_y} ${p2[0]},${p2[1]}`;
    }

    return path;
  }
}
