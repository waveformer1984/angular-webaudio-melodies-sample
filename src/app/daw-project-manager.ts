/**
 * DAW Project Manager - Project Save/Load and Session Management
 * Handles project persistence, file operations, and session state
 */

import { DAWEngine, Project } from './daw-core';

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
  undoStack: Project[];
  redoStack: Project[];
  isModified: boolean;
}

export class DAWProjectManager {
  private dawEngine: DAWEngine;
  private currentSession: SessionState | null = null;
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];
  private maxUndoSteps = 50;

  constructor(dawEngine: DAWEngine) {
    this.dawEngine = dawEngine;
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
      undoStack: [],
      redoStack: [],
      isModified: false
    };

    this.saveToUndoStack();
    return project;
  }

  async loadProject(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const sessionData = JSON.parse(text);

      // Validate project data
      if (!this.validateProjectData(sessionData)) {
        throw new Error('Invalid project file format');
      }

      // Load project into DAW engine
      this.dawEngine.loadProject(sessionData.project);

      // Restore session state
      this.currentSession = {
        ...sessionData,
        metadata: {
          ...sessionData.metadata,
          modified: new Date()
        },
        undoStack: [],
        redoStack: [],
        isModified: false
      };

      this.saveToUndoStack();
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      return false;
    }
  }

  async saveProject(): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      // Update metadata
      this.currentSession.metadata.modified = new Date();
      this.currentSession.isModified = false;

      // Create save data
      const saveData = {
        ...this.currentSession,
        project: this.dawEngine.saveProject()
      };

      // Convert to JSON
      const jsonString = JSON.stringify(saveData, null, 2);

      // Create and download file
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

  async exportAudio(format: 'wav' | 'mp3' = 'wav', quality: 'high' | 'medium' | 'low' = 'high'): Promise<boolean> {
    try {
      // Implementation would render the project to audio
      // This is a placeholder for the actual implementation
      console.log(`Exporting project as ${format} with ${quality} quality`);
      return true;
    } catch (error) {
      console.error('Failed to export audio:', error);
      return false;
    }
  }

  // Undo/Redo functionality
  undo(): boolean {
    if (!this.currentSession || this.undoStack.length === 0) return false;

    // Save current state to redo stack
    const currentProject = this.dawEngine.saveProject();
    if (currentProject) {
      this.redoStack.push(currentProject);
    }

    // Restore previous state
    const previousState = this.undoStack.pop();
    if (previousState) {
      this.dawEngine.loadProject(previousState);
      this.currentSession.isModified = true;
      return true;
    }

    return false;
  }

  redo(): boolean {
    if (!this.currentSession || this.redoStack.length === 0) return false;

    // Save current state to undo stack
    const currentProject = this.dawEngine.saveProject();
    if (currentProject) {
      this.undoStack.push(currentProject);
    }

    // Restore next state
    const nextState = this.redoStack.pop();
    if (nextState) {
      this.dawEngine.loadProject(nextState);
      this.currentSession.isModified = true;
      return true;
    }

    return false;
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

  // Auto-save functionality
  startAutoSave(intervalMs = 30000): void {
    setInterval(() => {
      if (this.currentSession?.isModified) {
        this.saveToLocalStorage();
      }
    }, intervalMs);
  }

  loadFromLocalStorage(): boolean {
    try {
      const savedData = localStorage.getItem('daw-autosave');
      if (!savedData) return false;

      const sessionData = JSON.parse(savedData);

      // Validate and load
      if (this.validateProjectData(sessionData)) {
        this.dawEngine.loadProject(sessionData.project);
        this.currentSession = sessionData;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  }

  // Recent projects
  getRecentProjects(): ProjectMetadata[] {
    try {
      const recent = localStorage.getItem('daw-recent-projects');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      return [];
    }
  }

  addToRecentProjects(metadata: ProjectMetadata): void {
    try {
      const recent = this.getRecentProjects();
      const filtered = recent.filter(p => p.name !== metadata.name);
      filtered.unshift(metadata);

      // Keep only last 10 projects
      const trimmed = filtered.slice(0, 10);

      localStorage.setItem('daw-recent-projects', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save recent projects:', error);
    }
  }

  // Template system
  async loadTemplate(templateName: string): Promise<boolean> {
    try {
      // Templates would be stored as JSON files
      const response = await fetch(`/assets/templates/${templateName}.json`);
      const templateData = await response.json();

      if (this.validateProjectData(templateData)) {
        this.dawEngine.loadProject(templateData.project);
        this.currentSession = {
          ...templateData,
          metadata: {
            ...templateData.metadata,
            name: `New Project from ${templateName}`,
            created: new Date(),
            modified: new Date()
          },
          undoStack: [],
          redoStack: [],
          isModified: true
        };

        this.saveToUndoStack();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to load template:', error);
      return false;
    }
  }

  getAvailableTemplates(): string[] {
    // This would scan the templates directory
    return ['Empty Project', 'Basic Beat', 'Synth Template', 'Full Production'];
  }

  // Private methods
  private saveToUndoStack(): void {
    if (!this.currentSession) return;

    const currentProject = this.dawEngine.saveProject();
    if (currentProject) {
      this.undoStack.push(currentProject);

      // Limit undo stack size
      if (this.undoStack.length > this.maxUndoSteps) {
        this.undoStack.shift();
      }

      // Clear redo stack when new action is performed
      this.redoStack = [];
    }
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

  // Getters
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getProjectName(): string {
    return this.currentSession?.metadata.name ?? 'Untitled Project';
  }

  // Cleanup
  dispose(): void {
    // Clear auto-save
    localStorage.removeItem('daw-autosave');
  }
}