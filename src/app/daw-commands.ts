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
