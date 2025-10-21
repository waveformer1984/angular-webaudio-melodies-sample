/**
 * DAW Main Component - Orchestrates the entire DAW
 * Initializes file loading, configures fallback modes, and manages the UI
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { dawFileLoader, FileLoadResult } from './daw-file-loader';
import { DAWEngine } from './daw-core';
import { DAWControlsComponent } from './daw-controls';

@Component({
  selector: 'app-daw-main',
  standalone: true,
  imports: [CommonModule, DAWControlsComponent],
  template: `
    <div class="daw-container">
      <div *ngIf="isLoading" class="loading-overlay">
        <p>Loading DAW... {{ loadingMessage }}</p>
        <div *ngIf="!allFilesLoaded" class="missing-files-warning">
          <p>Missing required files. Some features may be disabled.</p>
          <pre>{{ setupInstructions }}</pre>
        </div>
      </div>

      <div *ngIf="!isLoading && allFilesLoaded" class="daw-ready">
        <h1>Rezonette Studio</h1>
        <p>All systems operational. Ready to create.</p>
        <app-daw-controls></app-daw-controls>
      </div>

      <div *ngIf="!isLoading && !allFilesLoaded" class="fallback-mode">
        <h1>Rezonette Studio (Fallback Mode)</h1>
        <p>The DAW is running with reduced functionality due to missing files.</p>
        <p>Please install the required Rezonate system files to unlock all features.</p>
        <pre>{{ setupInstructions }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .missing-files-warning {
      margin-top: 20px;
      padding: 15px;
      background: #444;
      border-radius: 8px;
    }
    .fallback-mode {
      padding: 20px;
      background: #333;
      color: #ccc;
      border: 1px solid #555;
    }
    pre {
      white-space: pre-wrap;
      background: #222;
      padding: 10px;
      border-radius: 5px;
    }
  `]
})
export class DAWMainComponent implements OnInit {
  isLoading = true;
  allFilesLoaded = false;
  loadingMessage = 'Initializing...';
  setupInstructions = '';

  private dawEngine: DAWEngine;

  constructor() {
    this.dawEngine = new DAWEngine();
  }

  async ngOnInit() {
    console.log('DAW Main Component Initializing...');

    this.loadingMessage = 'Loading required files...';
    const fileLoadResult = await dawFileLoader.initialize();

    if (fileLoadResult.success) {
      console.log('All required files loaded successfully');
      this.allFilesLoaded = true;
      this.loadingMessage = 'Initializing audio engine...';
      await this.initializeDAW();
    } else {
      console.warn('Fallback mode activated due to missing required files');
      this.allFilesLoaded = false;
      this.setupInstructions = dawFileLoader.generateSetupInstructions();
      dawFileLoader.createFallbackConfigurations();
      await this.initializeDAW(true); // Initialize in fallback mode
    }

    this.isLoading = false;
    console.log('DAW Main Component Ready');
  }

  // Initialize the DAW engine and related components
  private async initializeDAW(isFallback = false) {
    if (isFallback) {
      console.log('Initializing DAW in fallback mode');
      // Basic initialization without Rezonate/Hydi features
    } else {
      console.log('Initializing DAW with full functionality');
      // Full initialization with all features
      const rezonateCore = this.dawEngine.getRezonateCore();
      // Configure Rezonate, Hydi, etc.
    }

    // Example: Create a default project
    this.dawEngine.createProject('New Project');
    console.log('DAW Project created');

    // Further initialization logic...
  }

  // Retry loading missing files
  async retryFileLoading() {
    this.isLoading = true;
    this.loadingMessage = 'Retrying file loading...';

    const result = await dawFileLoader.reloadMissingFiles();

    if (result.success) {
      this.allFilesLoaded = true;
      await this.initializeDAW();
    } else {
      this.setupInstructions = dawFileLoader.generateSetupInstructions();
    }

    this.isLoading = false;
  }
}
