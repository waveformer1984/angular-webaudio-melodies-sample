import { Component, OnInit } from '@angular/core';
import { DAWEngine, Track } from './daw-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  dawEngine: DAWEngine;
  tracks: Track[] = [];

  constructor() {
    this.dawEngine = new DAWEngine();
  }

  ngOnInit() {
    this.tracks = this.dawEngine.getTracks();
  }

  createTrack() {
    this.dawEngine.createTrack('New Track', 'audio');
    this.tracks = this.dawEngine.getTracks();
  }

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
