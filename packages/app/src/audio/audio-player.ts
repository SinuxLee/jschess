/**
 * AudioPlayer: bridges GameStore's GameEvent stream to browser audio.
 * Subscribes in constructor, unsubscribes in close(). Playback failures
 * (autoplay policy, missing file) are swallowed — audio is cosmetic.
 *
 * Event → sound mapping mirrors legacy game.js / board.js:
 *   moveApplied (mv!=0)  capture ? CAPTURE : MOVE
 *   moveApplied (mv==0)  (retract sentinel — handled by 'retract' event)
 *   capture              CAPTURE
 *   check                CHECK
 *   mate                 MATE
 *   draw                 DRAW
 *   illegalAttempt       ILLEGAL
 *   restart              NEWGAME
 *   select               CLICK
 *   retract              MOVE     (short feedback cue)
 *   stateChanged         (silent)
 */
import { WAV, type GameEvent, type WavId } from '@jschess/engine';
import type { GameStore } from '@jschess/game';
import { SOUND_URLS } from './sounds';

export class AudioPlayer {
  private readonly _unsub: () => void;
  private _enabled = true;

  constructor(store: GameStore) {
    this._unsub = store.subscribe((e) => this._onEvent(e));
  }

  setEnabled(on: boolean): void {
    this._enabled = on;
  }

  close(): void {
    this._unsub();
  }

  private _onEvent(e: GameEvent): void {
    if (!this._enabled) return;
    switch (e.type) {
      case 'moveApplied':
        if (e.mv === 0) return; // retract sentinel handled via 'retract' event
        this._play(e.capture ? WAV.CAPTURE : WAV.MOVE);
        return;
      case 'capture':
        this._play(WAV.CAPTURE);
        return;
      case 'check':
        this._play(WAV.CHECK);
        return;
      case 'mate':
        this._play(WAV.MATE);
        return;
      case 'draw':
        this._play(WAV.DRAW);
        return;
      case 'illegalAttempt':
        this._play(WAV.ILLEGAL);
        return;
      case 'restart':
        this._play(WAV.NEWGAME);
        return;
      case 'select':
        this._play(WAV.CLICK);
        return;
      case 'retract':
        this._play(WAV.MOVE);
        return;
      case 'stateChanged':
        return;
    }
  }

  private _play(wav: WavId): void {
    try {
      const audio = new Audio(SOUND_URLS[wav]);
      void audio.play().catch(() => {});
    } catch {
      // swallow synchronous failures (e.g. quota); audio is cosmetic
    }
  }
}
