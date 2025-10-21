import { Component, OnInit } from '@angular/core';
import { DAWEngine } from './daw-core';

@Component({
  selector: 'app-daw-controls',
  standalone: true,
  template: `
    <div class="daw-controls">
      <button (click)="play()">Play</button>
      <button (click)="pause()">Pause</button>
      <button (click)="stop()">Stop</button>
    </div>
  `
})
export class DAWControlsComponent implements OnInit {
  dawEngine: DAWEngine;

  constructor() {
    this.dawEngine = new DAWEngine();
  }

  ngOnInit() {}

  play() {
    this.dawEngine.play();
  }

  pause() {
    this.dawEngine.pause();
  }

  stop() {
    this.dawEngine.stop();
  }
}
