import { DAWEngine, Track } from './daw-core';

/**
 * Represents an action that can be executed and undone.
 */
export interface Command {
  execute(): void;
  undo(): void;
}

/**
 * Command for updating properties of a single track.
 */
export class UpdateTrackCommand implements Command {
  private readonly dawEngine: DAWEngine;
  private readonly trackId: string;
  private readonly oldProperties: Partial<Track>;
  private readonly newProperties: Partial<Track>;

  constructor(dawEngine: DAWEngine, trackId: string, oldProperties: Partial<Track>, newProperties: Partial<Track>) {
    this.dawEngine = dawEngine;
    this.trackId = trackId;
    this.oldProperties = oldProperties;
    this.newProperties = newProperties;
  }

  execute(): void {
    this.dawEngine.updateTrack(this.trackId, this.newProperties);
  }

  undo(): void {
    this.dawEngine.updateTrack(this.trackId, this.oldProperties);
  }
}

/**
 * Command for adding a new track.
 */
export class AddTrackCommand implements Command {
  private readonly dawEngine: DAWEngine;
  private readonly trackName: string;
  private readonly trackType: 'audio' | 'midi';
  private createdTrack: Track | null = null;

  constructor(dawEngine: DAWEngine, trackName: string, trackType: 'audio' | 'midi') {
    this.dawEngine = dawEngine;
    this.trackName = trackName;
    this.trackType = trackType;
  }

  execute(): void {
    this.createdTrack = this.dawEngine.createTrack(this.trackName, this.trackType);
  }

  undo(): void {
    if (this.createdTrack) {
      this.dawEngine.deleteTrack(this.createdTrack.id);
    }
  }
}

/**
 * Command for deleting a track.
 */
export class DeleteTrackCommand implements Command {
  private readonly dawEngine: DAWEngine;
  private readonly trackId: string;
  private deletedTrack: Track | null = null;

  constructor(dawEngine: DAWEngine, trackId: string) {
    this.dawEngine = dawEngine;
    this.trackId = trackId;
  }

  execute(): void {
    this.deletedTrack = this.dawEngine.getTrack(this.trackId);
    this.dawEngine.deleteTrack(this.trackId);
  }

  undo(): void {
    if (this.deletedTrack) {
      this.dawEngine.addTrack(this.deletedTrack);
    }
  }
}
