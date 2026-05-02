/**
 * AudioPlayer: bridges GameStore's GameEvent stream to browser audio.
 * Subscribes in constructor, unsubscribes in close(). Playback failures
 * (autoplay policy, missing file) are swallowed — audio is cosmetic.
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
      case 'illegalAttempt':
        this._play(WAV.ILLEGAL);
        return;
      case 'stateChanged':
      case 'draw':
        return;
    }
  }

  private _play(wav: WavId): void {
    try {
      const audio = new Audio(SOUND_URLS[wav]);
      void audio.play().catch(() => {});
    } catch {}
  }
}
