/**
 * DAW Automation - Parameter automation system for tracks and effects
 * Provides envelope-based automation for volume, pan, effects, and other parameters
 */

import { Track, Effect, Automation } from './daw-core';

export interface AutomationPoint {
  time: number;
  value: number;
  curve?: 'linear' | 'exponential' | 'smooth';
}

export interface AutomationLane {
  id: string;
  trackId: string;
  parameter: string;
  points: AutomationPoint[];
  enabled: boolean;
  visible: boolean;
  color: string;
}

export interface AutomationCurve {
  evaluate(time: number): number;
  getPoints(): AutomationPoint[];
  addPoint(time: number, value: number): void;
  removePoint(index: number): void;
  updatePoint(index: number, time: number, value: number): void;
}

export class DAWAutomation {
  private automationLanes: Map<string, AutomationLane> = new Map();
  private activeCurves: Map<string, AutomationCurve> = new Map();

  // Create automation lane
  createAutomationLane(trackId: string, parameter: string): AutomationLane {
    const lane: AutomationLane = {
      id: this.generateId(),
      trackId,
      parameter,
      points: [],
      enabled: true,
      visible: true,
      color: this.getParameterColor(parameter)
    };

    this.automationLanes.set(lane.id, lane);
    return lane;
  }

  // Add automation point
  addAutomationPoint(laneId: string, time: number, value: number, curve: 'linear' | 'exponential' | 'smooth' = 'linear'): void {
    const lane = this.automationLanes.get(laneId);
    if (!lane) return;

    // Insert point in sorted order
    const point: AutomationPoint = { time, value, curve };
    const insertIndex = this.findInsertIndex(lane.points, time);

    lane.points.splice(insertIndex, 0, point);

    // Update curve
    this.updateCurve(laneId);
  }

  // Remove automation point
  removeAutomationPoint(laneId: string, pointIndex: number): void {
    const lane = this.automationLanes.get(laneId);
    if (!lane || pointIndex < 0 || pointIndex >= lane.points.length) return;

    lane.points.splice(pointIndex, 1);
    this.updateCurve(laneId);
  }

  // Update automation point
  updateAutomationPoint(laneId: string, pointIndex: number, time: number, value: number): void {
    const lane = this.automationLanes.get(laneId);
    if (!lane || pointIndex < 0 || pointIndex >= lane.points.length) return;

    lane.points[pointIndex].time = time;
    lane.points[pointIndex].value = value;

    // Re-sort if time changed
    lane.points.sort((a, b) => a.time - b.time);

    this.updateCurve(laneId);
  }

  // Get automation value at time
  getAutomationValue(laneId: string, time: number): number {
    const curve = this.activeCurves.get(laneId);
    if (!curve) return 0;

    return curve.evaluate(time);
  }

  // Enable/disable automation lane
  setAutomationEnabled(laneId: string, enabled: boolean): void {
    const lane = this.automationLanes.get(laneId);
    if (lane) {
      lane.enabled = enabled;
    }
  }

  // Show/hide automation lane
  setAutomationVisible(laneId: string, visible: boolean): void {
    const lane = this.automationLanes.get(laneId);
    if (lane) {
      lane.visible = visible;
    }
  }

  // Get automation lanes for track
  getAutomationLanes(trackId: string): AutomationLane[] {
    return Array.from(this.automationLanes.values())
      .filter(lane => lane.trackId === trackId);
  }

  // Get all automation lanes
  getAllAutomationLanes(): AutomationLane[] {
    return Array.from(this.automationLanes.values());
  }

  // Apply automation to track parameters
  applyAutomation(track: Track, currentTime: number): void {
    const lanes = this.getAutomationLanes(track.id);

    lanes.forEach(lane => {
      if (!lane.enabled) return;

      const value = this.getAutomationValue(lane.id, currentTime);

      switch (lane.parameter) {
        case 'volume':
          track.volume = this.clamp(value, 0, 1);
          break;
        case 'pan':
          track.pan = this.clamp(value, -1, 1);
          break;
        case 'mute':
          track.muted = value > 0.5;
          break;
        case 'solo':
          track.solo = value > 0.5;
          break;
      }
    });
  }

  // Apply automation to effect parameters
  applyEffectAutomation(effect: Effect, currentTime: number): void {
    const lanes = Array.from(this.automationLanes.values())
      .filter(lane => lane.parameter.startsWith(`effect.${effect.id}.`));

    lanes.forEach(lane => {
      if (!lane.enabled) return;

      const paramName = lane.parameter.split('.').pop();
      if (paramName && effect.parameters[paramName] !== undefined) {
        const value = this.getAutomationValue(lane.id, currentTime);
        effect.parameters[paramName] = value;
      }
    });
  }

  // Create automation from existing envelope
  createAutomationFromEnvelope(trackId: string, parameter: string, envelope: AutomationPoint[]): AutomationLane {
    const lane = this.createAutomationLane(trackId, parameter);
    lane.points = [...envelope];
    this.updateCurve(lane.id);
    return lane;
  }

  // Export automation data
  exportAutomation(): any {
    const lanes = Array.from(this.automationLanes.values());
    return {
      lanes: lanes.map(lane => ({
        ...lane,
        points: lane.points.map(point => ({ ...point }))
      }))
    };
  }

  // Import automation data
  importAutomation(data: any): void {
    if (!data.lanes) return;

    data.lanes.forEach((laneData: any) => {
      const lane: AutomationLane = {
        id: laneData.id || this.generateId(),
        trackId: laneData.trackId,
        parameter: laneData.parameter,
        points: laneData.points || [],
        enabled: laneData.enabled !== false,
        visible: laneData.visible !== false,
        color: laneData.color || this.getParameterColor(laneData.parameter)
      };

      this.automationLanes.set(lane.id, lane);
      this.updateCurve(lane.id);
    });
  }

  // Clear automation for track
  clearTrackAutomation(trackId: string): void {
    const lanesToRemove = Array.from(this.automationLanes.values())
      .filter(lane => lane.trackId === trackId)
      .map(lane => lane.id);

    lanesToRemove.forEach(laneId => {
      this.automationLanes.delete(laneId);
      this.activeCurves.delete(laneId);
    });
  }

  // Clear all automation
  clearAllAutomation(): void {
    this.automationLanes.clear();
    this.activeCurves.clear();
  }

  // Private methods
  private updateCurve(laneId: string): void {
    const lane = this.automationLanes.get(laneId);
    if (!lane) return;

    const curve = new AutomationCurveImpl(lane.points);
    this.activeCurves.set(laneId, curve);
  }

  private findInsertIndex(points: AutomationPoint[], time: number): number {
    for (let i = 0; i < points.length; i++) {
      if (points[i].time > time) {
        return i;
      }
    }
    return points.length;
  }

  private getParameterColor(parameter: string): string {
    const colorMap: { [key: string]: string } = {
      'volume': '#00ff00',
      'pan': '#ffff00',
      'mute': '#ff0000',
      'solo': '#00ffff',
      'send': '#ff00ff'
    };

    return colorMap[parameter] || '#ffffff';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Automation Curve Implementation
class AutomationCurveImpl implements AutomationCurve {
  private points: AutomationPoint[];

  constructor(points: AutomationPoint[]) {
    this.points = [...points].sort((a, b) => a.time - b.time);
  }

  evaluate(time: number): number {
    if (this.points.length === 0) return 0;
    if (this.points.length === 1) return this.points[0].value;

    // Find the segment containing the time
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (time >= p1.time && time <= p2.time) {
        return this.interpolate(p1, p2, time);
      }
    }

    // Time is beyond the last point
    return this.points[this.points.length - 1].value;
  }

  private interpolate(p1: AutomationPoint, p2: AutomationPoint, time: number): number {
    const t = (time - p1.time) / (p2.time - p1.time);

    switch (p1.curve) {
      case 'exponential':
        return p1.value * Math.pow(p2.value / p1.value, t);
      case 'smooth':
        // Smooth interpolation using cosine
        const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
        return p1.value + (p2.value - p1.value) * smoothT;
      case 'linear':
      default:
        return p1.value + (p2.value - p1.value) * t;
    }
  }

  getPoints(): AutomationPoint[] {
    return [...this.points];
  }

  addPoint(time: number, value: number): void {
    const point: AutomationPoint = { time, value, curve: 'linear' };
    this.points.push(point);
    this.points.sort((a, b) => a.time - b.time);
  }

  removePoint(index: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
    }
  }

  updatePoint(index: number, time: number, value: number): void {
    if (index >= 0 && index < this.points.length) {
      this.points[index].time = time;
      this.points[index].value = value;
      this.points.sort((a, b) => a.time - b.time);
    }
  }
}

// Automation UI Helper
export class AutomationUIHelper {
  static getParameterRange(parameter: string): { min: number, max: number, default: number } {
    const ranges: { [key: string]: { min: number, max: number, default: number } } = {
      'volume': { min: 0, max: 1, default: 0.8 },
      'pan': { min: -1, max: 1, default: 0 },
      'mute': { min: 0, max: 1, default: 0 },
      'solo': { min: 0, max: 1, default: 0 },
      'send': { min: 0, max: 1, default: 0 }
    };

    return ranges[parameter] || { min: 0, max: 1, default: 0.5 };
  }

  static getParameterUnits(parameter: string): string {
    const units: { [key: string]: string } = {
      'volume': 'dB',
      'pan': '',
      'mute': '',
      'solo': '',
      'send': 'dB'
    };

    return units[parameter] || '';
  }

  static formatParameterValue(parameter: string, value: number): string {
    const range = this.getParameterRange(parameter);
    const units = this.getParameterUnits(parameter);

    switch (parameter) {
      case 'volume':
        return `${(value * 100).toFixed(1)}${units}`;
      case 'pan':
        if (value === 0) return 'C';
        return value > 0 ? `R${(value * 100).toFixed(0)}` : `L${(Math.abs(value) * 100).toFixed(0)}`;
      case 'mute':
      case 'solo':
        return value > 0.5 ? 'ON' : 'OFF';
      default:
        return value.toFixed(2);
    }
  }
}