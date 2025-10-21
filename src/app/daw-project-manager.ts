import { DAWEngine, Project, Track } from './daw-core';
import { Command } from './daw-commands';

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxUndoSteps = 50;

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export interface ProjectMetadata {
  name: string;
  created: Date;
  modified: Date;
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
}

export interface SessionState {
  project: Project;
  metadata: ProjectMetadata;
  isModified: boolean;
}

export class DAWProjectManager {
  private dawEngine: DAWEngine;
  private commandManager: CommandManager;
  private currentSession: SessionState | null = null;

  constructor(dawEngine: DAWEngine) {
    this.dawEngine = dawEngine;
    this.commandManager = new CommandManager();
  }

  // Command Execution
  executeCommand(command: Command): void {
    this.commandManager.execute(command);
    this.markAsModified();
  }

  // Project creation and management
  createNewProject(name: string, bpm = 120): Project {
    const project = this.dawEngine.createProject(name, bpm);
    this.currentSession = {
      project,
      metadata: {
        name,
        created: new Date(),
        modified: new Date(),
        version: '1.0.0'
      },
      isModified: false
    };
    this.commandManager.clear();
    return project;
  }

  async loadProject(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const sessionData = JSON.parse(text);

      if (!this.validateProjectData(sessionData)) {
        throw new Error('Invalid project file format');
      }

      this.dawEngine.loadProject(sessionData.project);
      this.currentSession = {
        ...sessionData,
        metadata: {
          ...sessionData.metadata,
          modified: new Date()
        },
        isModified: false
      };
      this.commandManager.clear();
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      return false;
    }
  }

  async saveProject(): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      this.currentSession.metadata.modified = new Date();
      this.currentSession.isModified = false;

      const saveData = {
        ...this.currentSession,
        project: this.dawEngine.saveProject()
      };

      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentSession.metadata.name}.daw.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  // Undo/Redo functionality
  undo(): void {
    this.commandManager.undo();
  }

  redo(): void {
    this.commandManager.redo();
  }

  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  // Session management
  getCurrentSession(): SessionState | null {
    return this.currentSession;
  }

  isModified(): boolean {
    return this.currentSession?.isModified ?? false;
  }

  markAsModified(): void {
    if (this.currentSession) {
      this.currentSession.isModified = true;
    }
  }

  // Auto-save, LocalStorage, Recent Projects, Templates (omitted for brevity, no changes needed)
    startAutoSave(intervalMs = 30000): void {
    setInterval(() => {
      if (this.currentSession?.isModified) {
        this.saveToLocalStorage();
      }
    }, intervalMs);
  }
  private saveToLocalStorage(): void {
    if (!this.currentSession) return;

    try {
      const saveData = {
        ...this.currentSession,
        project: this.dawEngine.saveProject()
      };

      localStorage.setItem('daw-autosave', JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
    private validateProjectData(data: any): boolean {
    // Basic validation - could be more comprehensive
    return data &&
           data.project &&
           data.project.id &&
           data.project.name &&
           Array.isArray(data.project.tracks) &&
           data.metadata &&
           data.metadata.name;
  }
    dispose(): void {
    // Clear auto-save
    localStorage.removeItem('daw-autosave');
  }
}
