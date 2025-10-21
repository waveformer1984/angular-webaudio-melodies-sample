import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Defines the structure of a single goal
export interface SessionGoal {
  id: string;
  title: string;
  description: string;
  metric: string; // The DAW state parameter to track, e.g., 'track_count', 'chorus_lines', 'loop_length'
  target: number; // The value the user needs to reach
  progress: number; // Current progress, from 0 to 1
  status: 'incomplete' | 'in-progress' | 'complete';
  isMandatory: boolean; // Determines if the goal is essential for the 'song idea'
}

// Defines the overall state of the session goals
export interface SessionGoalsState {
  goals: SessionGoal[];
  overallProgress: number; // A value from 0 to 1 representing completion of all goals
  isComplete: boolean; // True if all mandatory goals are complete
}

@Injectable({
  providedIn: 'root'
})
export class SessionGoalsService {
  private readonly state = new BehaviorSubject<SessionGoalsState>({
    goals: [],
    overallProgress: 0,
    isComplete: false
  });

  public readonly state$: Observable<SessionGoalsState> = this.state.asObservable();

  constructor() {}

  /**
   * Loads a set of goals for the current session, often from a song idea or template.
   * @param goals The array of goals to load.
   */
  loadGoals(goals: SessionGoal[]): void {
    this.state.next({
      goals,
      overallProgress: 0,
      isComplete: false
    });
    this.evaluateGoals({}); // Initial evaluation
  }

  /**
   * The core logic engine. Evaluates the current set of goals against the DAW's state.
   * @param dawState An object representing the current state of the DAW (e.g., track count, clip details).
   */
  evaluateGoals(dawState: any): void {
    const currentState = this.state.getValue();
    let completedMandatoryGoals = 0;
    let totalMandatoryGoals = 0;

    const updatedGoals = currentState.goals.map(goal => {
      if (goal.status === 'complete') {
        if (goal.isMandatory) {
          completedMandatoryGoals++;
          totalMandatoryGoals++;
        }
        return goal;
      }

      if (goal.isMandatory) {
          totalMandatoryGoals++;
      }

      // --- This is where the logic for each metric goes ---
      let currentProgress = goal.progress;
      switch (goal.metric) {
        case 'track_count':
          const trackCount = dawState.tracks?.length || 0;
          currentProgress = Math.min(1, trackCount / goal.target);
          break;
        case 'chorus_lines':
          // This is a placeholder; a real implementation would need to inspect lyric content
          const lines = dawState.lyrics?.chorus?.length || 0;
          currentProgress = Math.min(1, lines / goal.target);
          break;
        case 'has_verse':
           currentProgress = (dawState.lyrics?.verse1?.length > 0) ? 1 : 0;
           break;
        case 'has_chords':
            currentProgress = (dawState.chords?.length > 0) ? 1: 0;
            break;
        // Add more cases for other metrics here...
      }

      const newStatus = currentProgress >= 1 ? 'complete' : (currentProgress > 0 ? 'in-progress' : 'incomplete');
      if (newStatus === 'complete' && goal.isMandatory) {
        completedMandatoryGoals++;
      }

      return { ...goal, progress: currentProgress, status: newStatus };
    });

    const overallProgress = totalMandatoryGoals > 0 ? completedMandatoryGoals / totalMandatoryGoals : 0;
    const isComplete = overallProgress >= 1;

    this.state.next({
      goals: updatedGoals,
      overallProgress,
      isComplete
    });
  }

  /**
   * Resets the goals to their initial state.
   */
  resetGoals(): void {
    this.state.next({ goals: [], overallProgress: 0, isComplete: false });
  }
}
