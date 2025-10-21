import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SessionGoalsService, SessionGoalsState, SessionGoal } from './session-goals.service';

@Component({
  selector: 'app-session-goals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-goals-panel">
      <h4 class="panel-title">Session Goals</h4>
      <div class="overall-progress-container">
        <div class="progress-bar-background">
          <div class="progress-bar-foreground" [style.width.%]="overallProgress * 100">
            {{ (overallProgress * 100).toFixed(0) }}%
          </div>
        </div>
      </div>
      <ul class="goals-list">
        <li *ngFor="let goal of goals" class="goal-item" [ngClass]="getGoalClass(goal)">
          <div class="goal-checkbox">{{ goal.status === 'complete' ? '✅' : '🔲' }}</div>
          <div class="goal-details">
            <div class="goal-title">{{ goal.title }} <span *ngIf="goal.isMandatory" class="mandatory-star">*</span></div>
            <div class="goal-description">{{ goal.description }}</div>
          </div>
          <div class="goal-progress-bar" *ngIf="goal.status !== 'complete'">
            <div class="goal-progress-fill" [style.width.%]="goal.progress * 100"></div>
          </div>
        </li>
      </ul>
      <div *ngIf="isComplete" class="completion-message">
        <p>🎉 All essential goals complete! Ready to generate the final song idea.</p>
      </div>
    </div>
  `,
  styles: [`
    .session-goals-panel {
      background-color: var(--control-bg-color, #2c2c2e);
      color: var(--text-color, #fff);
      padding: 12px;
      border-radius: 6px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .panel-title {
      margin: 0 0 12px 0;
      font-size: 1.1em;
      font-weight: bold;
      color: var(--text-color, #fff);
    }

    .overall-progress-container {
      margin-bottom: 12px;
    }

    .progress-bar-background {
      background-color: var(--secondary-color, #3a3a3c);
      border-radius: 4px;
      height: 20px;
      overflow: hidden;
      width: 100%;
    }

    .progress-bar-foreground {
      background-color: var(--primary-color, #0a84ff);
      height: 100%;
      text-align: center;
      color: var(--button-text-color, #fff);
      font-weight: bold;
      font-size: 0.8em;
      line-height: 20px;
      transition: width 0.3s ease-in-out;
    }

    .goals-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      overflow-y: auto;
      flex-grow: 1;
    }

    .goal-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .goal-item.status-complete {
      opacity: 0.7;
      text-decoration: line-through;
    }

    .goal-item.status-in-progress {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .goal-checkbox {
      font-size: 1.2em;
      margin-right: 12px;
    }

    .goal-details {
      flex-grow: 1;
    }

    .goal-title {
      font-weight: bold;
    }
    
    .mandatory-star {
        color: var(--accent-color, #ff9f0a);
        font-weight: bold;
    }

    .goal-description {
      font-size: 0.85em;
      opacity: 0.8;
    }

    .goal-progress-bar {
      width: 50px;
      height: 6px;
      background-color: var(--secondary-color, #3a3a3c);
      border-radius: 3px;
      margin-left: 10px;
    }

    .goal-progress-fill {
      height: 100%;
      background-color: var(--accent-color, #ff9f0a);
      border-radius: 3px;
    }

    .completion-message {
      text-align: center;
      padding: 10px;
      background-color: var(--primary-color, #0a84ff);
      color: var(--button-text-color, #fff);
      border-radius: 4px;
      margin-top: 10px;
    }
  `]
})
export class SessionGoalsComponent implements OnInit, OnDestroy {
  private stateSubscription!: Subscription;
  
  public goals: SessionGoal[] = [];
  public overallProgress = 0;
  public isComplete = false;

  constructor(private goalsService: SessionGoalsService) {}

  ngOnInit() {
    this.stateSubscription = this.goalsService.state$.subscribe(state => {
      this.goals = state.goals;
      this.overallProgress = state.overallProgress;
      this.isComplete = state.isComplete;
    });
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  getGoalClass(goal: SessionGoal): string {
    return `status-${goal.status}`;
  }
}
