/**
 * Session Recorder - Records all DAW actions, parameters, and analytics
 * Stores data in Firestore with periodic snapshots and event streams
 */

export interface SessionSnapshot {
  id: string;
  timestamp: Date;
  projectId: string;
  trackStates: TrackState[];
  activeClips: ActiveClip[];
  parameterValues: ParameterValue[];
  derivedFeatures: DerivedFeatures;
  userAction?: string;
}

export interface TrackState {
  trackId: string;
  name: string;
  type: 'audio' | 'midi';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: EffectState[];
}

export interface ActiveClip {
  clipId: string;
  trackId: string;
  startTime: number;
  duration: number;
  type: 'audio' | 'midi';
  name: string;
}

export interface ParameterValue {
  component: string;
  parameter: string;
  value: number | string | boolean;
  timestamp: Date;
}

export interface EffectState {
  id: string;
  type: string;
  enabled: boolean;
  parameters: { [key: string]: number };
}

export interface DerivedFeatures {
  bpm: number;
  key: string;
  scale: string;
  loudness: number;
  spectralCentroid: number;
  tempo: number;
  beatPositions: number[];
  chordProgression?: string[];
  energy: number;
  danceability: number;
}

export interface SessionEvent {
  id: string;
  timestamp: Date;
  projectId: string;
  type: 'action' | 'parameter_change' | 'clip_event' | 'transport_event' | 'session_start' | 'session_end';
  action: string;
  details: any;
  userId?: string;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalActions: number;
  parameterChanges: number;
  clipsCreated: number;
  clipsDeleted: number;
  timeSpent: number;
  mostUsedFeatures: string[];
  workflowEfficiency: number;
}

export class SessionRecorder {
  private projectId: string;
  private sessionId: string;
  private startTime: Date;
  private endTime?: Date;
  private timeSpent: number = 0;
  private snapshots: SessionSnapshot[] = [];
  private events: SessionEvent[] = [];
  private analytics: SessionAnalytics;
  private snapshotInterval: number = 10000; // 10 seconds
  private snapshotTimer?: number;
  private isRecording = false;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = new Date();

    this.analytics = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      totalActions: 0,
      parameterChanges: 0,
      clipsCreated: 0,
      clipsDeleted: 0,
      timeSpent: 0,
      mostUsedFeatures: [],
      workflowEfficiency: 0
    };
  }

  // Start recording session
  startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    console.log(`Started recording session: ${this.sessionId}`);

    // Start periodic snapshots
    this.snapshotTimer = window.setInterval(() => {
      this.takeSnapshot();
    }, this.snapshotInterval);

    // Record session start event
    this.recordEvent('session_start', 'Session recording started', {
      projectId: this.projectId,
      sessionId: this.sessionId
    });
  }

  // Stop recording session
  stopRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.endTime = new Date();
    this.timeSpent = this.endTime.getTime() - this.startTime.getTime();

    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }

    // Take final snapshot
    this.takeSnapshot();

    // Record session end event
    this.recordEvent('session_end', 'Session recording ended', {
      duration: this.timeSpent,
      totalSnapshots: this.snapshots.length,
      totalEvents: this.events.length
    });

    console.log(`Stopped recording session: ${this.sessionId}`);
  }

  // Record a user action
  recordAction(action: string, details: any = {}): void {
    if (!this.isRecording) return;

    this.analytics.totalActions++;

    this.recordEvent('action', action, details);

    // Update analytics based on action type
    this.updateAnalyticsForAction(action, details);
  }

  // Record parameter change
  recordParameterChange(component: string, parameter: string, value: number | string | boolean): void {
    if (!this.isRecording) return;

    this.analytics.parameterChanges++;

    const parameterValue: ParameterValue = {
      component,
      parameter,
      value,
      timestamp: new Date()
    };

    this.recordEvent('parameter_change', `${component}.${parameter} = ${value}`, {
      parameterValue
    });
  }

  // Record clip event
  recordClipEvent(eventType: 'created' | 'deleted' | 'moved' | 'resized', clipId: string, details: any = {}): void {
    if (!this.isRecording) return;

    if (eventType === 'created') this.analytics.clipsCreated++;
    if (eventType === 'deleted') this.analytics.clipsDeleted++;

    this.recordEvent('clip_event', `Clip ${eventType}: ${clipId}`, {
      eventType,
      clipId,
      ...details
    });
  }

  // Record transport event
  recordTransportEvent(eventType: 'play' | 'pause' | 'stop' | 'record', details: any = {}): void {
    if (!this.isRecording) return;

    this.recordEvent('transport_event', `Transport: ${eventType}`, {
      eventType,
      ...details
    });
  }

  // Take a snapshot of current session state
  takeSnapshot(trackStates: TrackState[] = [], activeClips: ActiveClip[] = [], userAction?: string): void {
    if (!this.isRecording) return;

    const derivedFeatures = this.calculateDerivedFeatures(trackStates, activeClips);

    const snapshot: SessionSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      projectId: this.projectId,
      trackStates,
      activeClips,
      parameterValues: [], // Would be populated from current parameter values
      derivedFeatures,
      userAction
    };

    this.snapshots.push(snapshot);

    // Keep only last 100 snapshots to prevent memory issues
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }

  // Calculate derived features from current state
  private calculateDerivedFeatures(trackStates: TrackState[], activeClips: ActiveClip[]): DerivedFeatures {
    // This would analyze the current session state to derive musical features
    // For now, return placeholder values

    return {
      bpm: 120, // Would be calculated from transport
      key: 'C', // Would be analyzed from MIDI clips
      scale: 'major',
      loudness: -12, // LUFS measurement
      spectralCentroid: 1000, // Hz
      tempo: 120, // BPM
      beatPositions: [], // Would be calculated from audio analysis
      energy: 0.5,
      danceability: 0.5
    };
  }

  // Record an event
  private recordEvent(type: SessionEvent['type'], action: string, details: any): void {
    const event: SessionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      projectId: this.projectId,
      type,
      action,
      details
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  // Update analytics based on action
  private updateAnalyticsForAction(action: string, details: any): void {
    // Track most used features
    const feature = action.split('_')[0]; // Extract feature from action name
    const featureIndex = this.analytics.mostUsedFeatures.indexOf(feature);

    if (featureIndex === -1) {
      this.analytics.mostUsedFeatures.push(feature);
    } else {
      // Move to front (most recent)
      this.analytics.mostUsedFeatures.splice(featureIndex, 1);
      this.analytics.mostUsedFeatures.unshift(feature);
    }

    // Keep only top 10
    if (this.analytics.mostUsedFeatures.length > 10) {
      this.analytics.mostUsedFeatures.pop();
    }
  }

  // Get session data for export
  getSessionData(): {
    sessionId: string;
    analytics: SessionAnalytics;
    snapshots: SessionSnapshot[];
    events: SessionEvent[];
  } {
    return {
      sessionId: this.sessionId,
      analytics: {
        ...this.analytics,
        endTime: this.isRecording ? undefined : new Date(),
        timeSpent: this.isRecording ? Date.now() - this.startTime.getTime() : this.analytics.timeSpent
      },
      snapshots: [...this.snapshots],
      events: [...this.events]
    };
  }

  // Export session data to JSON
  exportToJSON(): string {
    const data = this.getSessionData();
    return JSON.stringify(data, (key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
  }

  // Import session data from JSON
  static importFromJSON(jsonData: string): SessionRecorder | null {
    try {
      const data = JSON.parse(jsonData);

      const recorder = new SessionRecorder(data.analytics.projectId || 'imported');
      recorder.sessionId = data.sessionId;
      recorder.analytics = data.analytics;
      recorder.snapshots = data.snapshots.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      }));
      recorder.events = data.events.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));

      return recorder;
    } catch (error) {
      console.error('Failed to import session data:', error);
      return null;
    }
  }

  // Get session statistics
  getStatistics(): {
    duration: number;
    totalActions: number;
    averageActionsPerMinute: number;
    mostActivePeriod: { start: Date, end: Date, actions: number };
    featureUsage: { [feature: string]: number };
  } {
    const duration = this.isRecording ?
      (Date.now() - this.startTime.getTime()) / 1000 / 60 : // minutes
      this.analytics.timeSpent / 1000 / 60;

    const averageActionsPerMinute = duration > 0 ? this.analytics.totalActions / duration : 0;

    // Calculate feature usage
    const featureUsage: { [feature: string]: number } = {};
    this.events.forEach(event => {
      const feature = event.action.split('_')[0];
      featureUsage[feature] = (featureUsage[feature] || 0) + 1;
    });

    // Find most active period (sliding window of 5 minutes)
    let mostActivePeriod = { start: this.startTime, end: this.startTime, actions: 0 };
    const windowSize = 5 * 60 * 1000; // 5 minutes in ms

    for (let i = 0; i < this.events.length; i++) {
      const windowStart = this.events[i].timestamp;
      const windowEnd = new Date(windowStart.getTime() + windowSize);
      let actionsInWindow = 1; // Count current event

      // Count events in this window
      for (let j = i + 1; j < this.events.length; j++) {
        if (this.events[j].timestamp <= windowEnd) {
          actionsInWindow++;
        } else {
          break;
        }
      }

      if (actionsInWindow > mostActivePeriod.actions) {
        mostActivePeriod = {
          start: windowStart,
          end: windowEnd,
          actions: actionsInWindow
        };
      }
    }

    return {
      duration,
      totalActions: this.analytics.totalActions,
      averageActionsPerMinute,
      mostActivePeriod,
      featureUsage
    };
  }

  // Clean up resources
  dispose(): void {
    this.stopRecording();

    // Clear arrays to free memory
    this.snapshots = [];
    this.events = [];
  }

  // Get current recording status
  getStatus(): {
    isRecording: boolean;
    sessionId: string;
    duration: number;
    snapshotsCount: number;
    eventsCount: number;
  } {
    return {
      isRecording: this.isRecording,
      sessionId: this.sessionId,
      duration: this.isRecording ?
        (Date.now() - this.startTime.getTime()) / 1000 : // seconds
        this.analytics.timeSpent / 1000,
      snapshotsCount: this.snapshots.length,
      eventsCount: this.events.length
    };
  }
}

// Session analysis utilities
export class SessionAnalyzer {
  // Analyze workflow efficiency
  static calculateWorkflowEfficiency(session: SessionRecorder): number {
    const stats = session.getStatistics();
    const data = session.getSessionData();

    // Efficiency based on actions per minute and feature diversity
    const actionsPerMinute = stats.averageActionsPerMinute;
    const featureDiversity = Object.keys(stats.featureUsage).length;
    const totalFeatures = 10; // Expected number of different features

    // Normalize to 0-1 scale
    const efficiency = Math.min(
      (actionsPerMinute / 20) * 0.6 + // 60% weight on productivity
      (featureDiversity / totalFeatures) * 0.4, // 40% weight on feature usage
      1
    );

    return efficiency;
  }

  // Detect patterns in user behavior
  static detectUsagePatterns(session: SessionRecorder): {
    peakUsageHours: number[];
    preferredWorkflow: string[];
    commonActionSequences: string[][];
  } {
    const data = session.getSessionData();

    // Analyze timestamps for peak hours
    const hourCounts = new Array(24).fill(0);
    data.events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    });

    const peakUsageHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    // Detect preferred workflow (most common action sequences)
    const actionSequences: string[][] = [];
    const sequenceLength = 3;

    for (let i = 0; i < data.events.length - sequenceLength; i++) {
      const sequence = data.events
        .slice(i, i + sequenceLength)
        .map(event => event.action.split('_')[0]); // Extract feature

      actionSequences.push(sequence);
    }

    // Find most common sequences
    const sequenceCounts = new Map<string, number>();
    actionSequences.forEach(seq => {
      const key = seq.join('->');
      sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
    });

    const commonActionSequences = Array.from(sequenceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sequence]) => sequence.split('->'));

    return {
      peakUsageHours,
      preferredWorkflow: data.analytics.mostUsedFeatures,
      commonActionSequences
    };
  }

  // Generate session insights
  static generateInsights(session: SessionRecorder): string[] {
    const stats = session.getStatistics();
    const patterns = this.detectUsagePatterns(session);
    const efficiency = this.calculateWorkflowEfficiency(session);

    const insights: string[] = [];

    // Efficiency insights
    if (efficiency > 0.8) {
      insights.push("Highly efficient session - great productivity!");
    } else if (efficiency > 0.6) {
      insights.push("Good workflow efficiency with room for optimization.");
    } else {
      insights.push("Consider streamlining your workflow for better efficiency.");
    }

    // Usage pattern insights
    if (patterns.peakUsageHours.length > 0) {
      const hours = patterns.peakUsageHours.join(', ');
      insights.push(`Most active during hours: ${hours}`);
    }

    if (patterns.preferredWorkflow.length > 0) {
      insights.push(`Preferred features: ${patterns.preferredWorkflow.slice(0, 3).join(', ')}`);
    }

    // Action insights
    if (stats.totalActions > 100) {
      insights.push("Very active session with lots of experimentation.");
    } else if (stats.totalActions < 20) {
      insights.push("Focused session with deliberate, careful work.");
    }

    return insights;
  }
}