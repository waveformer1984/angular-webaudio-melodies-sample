/**
 * DAW File Loader - Manages loading and validation of required Rezonate system files
 * Handles missing dependencies gracefully with fallbacks and clear error reporting
 */

export interface RequiredFile {
  name: string;
  path: string;
  type: 'zip' | 'config' | 'audio' | 'als' | 'asd';
  required: boolean;
  description: string;
  fallback?: () => any;
  alternativeNames?: string[]; // Alternative filenames to check
}

export interface FileLoadResult {
  success: boolean;
  loadedFiles: string[];
  missingFiles: string[];
  errors: string[];
}

export class DAWFileLoader {
  private static readonly REQUIRED_FILES: RequiredFile[] = [
    {
      name: 'Rezonate_Core.zip',
      path: '/assets/rezonate/Rezonate_Core.zip',
      type: 'zip',
      required: true,
      description: 'Core Rezonate system files (main package)',
      alternativeNames: ['Rezonate_Bootstrap.zip', 'Resonate.zip', 'Rezonette_Sys.zip.7z'],
      fallback: () => console.warn('Rezonate Core not available - using basic functionality')
    },
    {
      name: 'Hydi_Core_Rebuild_With_Launcher.zip',
      path: '/assets/rezonate/Hydi_Core_Rebuild_With_Launcher.zip',
      type: 'zip',
      required: true,
      description: 'Hydi harmonic synthesis core',
      fallback: () => console.warn('Hydi core not available - harmonic synthesis disabled')
    },
    {
      name: 'Rezonette_LocalNFT_Minter.zip',
      path: '/assets/rezonate/Rezonette_LocalNFT_Minter.zip',
      type: 'zip',
      required: false,
      description: 'NFT minting functionality',
      fallback: () => console.log('NFT minter not available - feature disabled')
    },
    {
      name: 'Rezonette_SampleManager_Waveform.zip',
      path: '/assets/rezonate/Rezonette_SampleManager_Waveform.zip',
      type: 'zip',
      required: false,
      description: 'Sample management and waveform display',
      fallback: () => console.log('Sample manager not available - basic sample loading used')
    },
    {
      name: 'Rezonette_Studio_Assistant_GUI_Audio_Visualizer.zip',
      path: '/assets/rezonate/Rezonette_Studio_Assistant_GUI_Audio_Visualizer.zip',
      type: 'zip',
      required: false,
      description: 'Studio assistant and audio visualizer',
      fallback: () => console.log('Studio assistant not available - basic UI used')
    },
    {
      name: 'VirtualFolders.cfg',
      path: '/assets/config/VirtualFolders.cfg',
      type: 'config',
      required: false,
      description: 'Virtual folder configuration',
      fallback: () => ({ folders: [] })
    },
    {
      name: 'Metadata.cfg',
      path: '/assets/config/Metadata.cfg',
      type: 'config',
      required: false,
      description: 'System metadata configuration',
      fallback: () => ({ version: '1.0.0', features: [] })
    },
    {
      name: 'Properties.cfg',
      path: '/assets/config/Properties.cfg',
      type: 'config',
      required: false,
      description: 'System properties configuration',
      fallback: () => ({ settings: {} })
    },
    {
      name: 'Sample Reference.als',
      path: '/assets/samples/Sample Reference.als',
      type: 'als',
      required: false,
      description: 'Ableton Live sample reference',
      fallback: () => null
    },
    {
      name: '212 Kit.adg.ogg',
      path: '/assets/samples/212 Kit.adg.ogg',
      type: 'audio',
      required: false,
      description: '212 drum kit sample',
      fallback: () => null
    },
    {
      name: '212 Kit.adg.ogg.asd',
      path: '/assets/samples/212 Kit.adg.ogg.asd',
      type: 'asd',
      required: false,
      description: '212 kit analysis data',
      fallback: () => null
    }
  ];

  private loadedFiles: Map<string, any> = new Map();
  private loadStatus: Map<string, 'pending' | 'loaded' | 'failed'> = new Map();

  // Initialize file loading
  async initialize(): Promise<FileLoadResult> {
    console.log('Initializing DAW File Loader...');

    const result: FileLoadResult = {
      success: true,
      loadedFiles: [],
      missingFiles: [],
      errors: []
    };

    // Load all required files
    for (const file of DAWFileLoader.REQUIRED_FILES) {
      try {
        this.loadStatus.set(file.name, 'pending');
        const loaded = await this.loadFile(file);

        if (loaded !== null) {
          this.loadedFiles.set(file.name, loaded);
          this.loadStatus.set(file.name, 'loaded');
          result.loadedFiles.push(file.name);
          console.log(`✓ Loaded: ${file.name}`);
        } else {
          this.loadStatus.set(file.name, 'failed');
          result.missingFiles.push(file.name);

          if (file.required) {
            result.errors.push(`Required file missing: ${file.name} - ${file.description}`);
            console.error(`✗ Required file missing: ${file.name}`);
          } else {
            console.warn(`⚠ Optional file missing: ${file.name}`);
          }

          // Use fallback if available
          if (file.fallback) {
            const fallbackData = file.fallback();
            this.loadedFiles.set(file.name, fallbackData);
          }
        }
      } catch (error) {
        this.loadStatus.set(file.name, 'failed');
        result.missingFiles.push(file.name);
        result.errors.push(`Failed to load ${file.name}: ${error}`);

        if (file.required) {
          result.success = false;
        }

        // Use fallback
        if (file.fallback) {
          const fallbackData = file.fallback();
          this.loadedFiles.set(file.name, fallbackData);
        }
      }
    }

    // Generate summary
    console.log('\n=== File Loading Summary ===');
    console.log(`Loaded: ${result.loadedFiles.length}`);
    console.log(`Missing: ${result.missingFiles.length}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    return result;
  }

  // Load individual file with alternative name checking
  private async loadFile(file: RequiredFile): Promise<any> {
    // First try the primary filename
    let loaded = await this.checkFile(file.path);
    if (loaded) {
      return loaded;
    }

    // Try alternative names if specified
    if (file.alternativeNames) {
      for (const altName of file.alternativeNames) {
        const altPath = file.path.replace(file.name, altName);
        loaded = await this.checkFile(altPath);
        if (loaded) {
          console.log(`Found alternative: ${altName} for ${file.name}`);
          return loaded;
        }
      }
    }

    // File not found
    return null;
  }

  private async checkFile(path: string): Promise<any> {
    try {
      // Check if file exists by attempting to fetch it
      const response = await fetch(path, { method: 'HEAD' });

      if (!response.ok) {
        return null;
      }

      // For ZIP files, we can't load them directly in browser
      // Return a placeholder indicating the file exists
      if (path.endsWith('.zip') || path.endsWith('.7z')) {
        return {
          type: 'zip',
          path: path,
          exists: true,
          loaded: false, // ZIP files need special handling
          description: 'ZIP archive file'
        };
      }

      // For config files, try to load as text
      if (path.endsWith('.cfg')) {
        const configResponse = await fetch(path);
        if (configResponse.ok) {
          const text = await configResponse.text();
          try {
            return JSON.parse(text);
          } catch {
            return text; // Return as string if not JSON
          }
        }
      }

      // For audio files, load as AudioBuffer (would need audio context)
      if (path.endsWith('.ogg') || path.endsWith('.wav') || path.endsWith('.mp3')) {
        // This would require an audio context to decode
        // For now, just confirm file exists
        return {
          type: 'audio',
          path: path,
          exists: true,
          loaded: false,
          description: 'Audio sample file'
        };
      }

      // For other file types, just confirm existence
      return {
        type: 'file',
        path: path,
        exists: true,
        loaded: true,
        description: 'File exists'
      };

    } catch (error) {
      // File doesn't exist or can't be loaded
      return null;
    }
  }

  // Get loaded file data
  getFile(name: string): any {
    return this.loadedFiles.get(name);
  }

  // Check if file is loaded
  isFileLoaded(name: string): boolean {
    return this.loadStatus.get(name) === 'loaded';
  }

  // Check if required files are available
  areRequiredFilesLoaded(): boolean {
    return DAWFileLoader.REQUIRED_FILES
      .filter(file => file.required)
      .every(file => this.isFileLoaded(file.name));
  }

  // Get loading status
  getLoadingStatus(): { [fileName: string]: 'pending' | 'loaded' | 'failed' } {
    const status: { [fileName: string]: 'pending' | 'loaded' | 'failed' } = {};
    this.loadStatus.forEach((value, key) => {
      status[key] = value;
    });
    return status;
  }

  // Get missing files list
  getMissingFiles(): string[] {
    return Array.from(this.loadStatus.entries())
      .filter(([_, status]) => status === 'failed')
      .map(([name, _]) => name);
  }

  // Generate setup instructions for missing files
  generateSetupInstructions(): string {
    const missingFiles = this.getMissingFiles();
    const requiredMissing = missingFiles.filter(name =>
      DAWFileLoader.REQUIRED_FILES.find(f => f.name === name)?.required
    );

    if (requiredMissing.length === 0) {
      return 'All required files are loaded. The system is ready to use.';
    }

    let instructions = 'The following required files are missing:\n\n';

    requiredMissing.forEach(fileName => {
      const file = DAWFileLoader.REQUIRED_FILES.find(f => f.name === fileName);
      if (file) {
        instructions += `• ${file.name}\n`;
        instructions += `  Description: ${file.description}\n`;
        instructions += `  Expected location: ${file.path}\n`;

        if (file.alternativeNames && file.alternativeNames.length > 0) {
          instructions += `  Alternative names: ${file.alternativeNames.join(', ')}\n`;
        }

        instructions += '\n';
      }
    });

    instructions += 'To resolve this issue:\n';
    instructions += '1. Locate the Rezonate system files on your system\n';
    instructions += '2. Copy the files to the /public/assets/rezonate/ directory\n';
    instructions += '3. For the main core file, you can use:\n';
    instructions += '   - Rezonate_Core.zip (preferred)\n';
    instructions += '   - Rezonate_Bootstrap.zip\n';
    instructions += '   - Resonate.zip\n';
    instructions += '   - Rezonette_Sys.zip.7z\n';
    instructions += '4. Refresh the application to reload the files\n';
    instructions += '5. Some features will work with reduced functionality until files are available\n';

    return instructions;
  }

  // Create fallback configurations for missing files
  createFallbackConfigurations(): void {
    const missingFiles = this.getMissingFiles();

    missingFiles.forEach(fileName => {
      const file = DAWFileLoader.REQUIRED_FILES.find(f => f.name === fileName);
      if (file && file.fallback) {
        const fallbackData = file.fallback();
        this.loadedFiles.set(fileName, fallbackData);
      }
    });
  }

  // Attempt to reload missing files
  async reloadMissingFiles(): Promise<FileLoadResult> {
    const missingFiles = this.getMissingFiles();

    if (missingFiles.length === 0) {
      return {
        success: true,
        loadedFiles: [],
        missingFiles: [],
        errors: []
      };
    }

    console.log('Attempting to reload missing files...');

    const filesToReload = DAWFileLoader.REQUIRED_FILES.filter(file =>
      missingFiles.includes(file.name)
    );

    const result: FileLoadResult = {
      success: true,
      loadedFiles: [],
      missingFiles: [],
      errors: []
    };

    for (const file of filesToReload) {
      try {
        const loaded = await this.loadFile(file);
        if (loaded !== null) {
          this.loadedFiles.set(file.name, loaded);
          this.loadStatus.set(file.name, 'loaded');
          result.loadedFiles.push(file.name);
          console.log(`✓ Reloaded: ${file.name}`);
        } else {
          result.missingFiles.push(file.name);
          result.errors.push(`Still missing: ${file.name}`);
        }
      } catch (error) {
        result.missingFiles.push(file.name);
        result.errors.push(`Reload failed for ${file.name}: ${error}`);
      }
    }

    if (result.missingFiles.length > 0) {
      result.success = false;
    }

    return result;
  }

  // Check for specific core file
  hasCoreFile(): boolean {
    const coreFiles = ['Rezonate_Core.zip', 'Rezonate_Bootstrap.zip', 'Resonate.zip', 'Rezonette_Sys.zip.7z'];
    return coreFiles.some(fileName => this.isFileLoaded(fileName));
  }
}

// Global instance
export const dawFileLoader = new DAWFileLoader();