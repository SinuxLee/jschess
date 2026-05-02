import type { GameEvent } from '@jschess/engine';

const EVENT_NAME = 'jschess:event';

export type GameEventHandler = (ev: GameEvent) => void;

/**
 * EventBus — thin typed wrapper over EventTarget + CustomEvent.
 * Deliberately does not depend on a reactive framework so that
 * `@jschess/game` stays framework-agnostic; see docs/ARCHITECTURE.md.
 */
export class EventBus {
  private readonly _target = new EventTarget();

  on(handler: GameEventHandler): () => void {
    const listener = (raw: Event): void => {
      handler((raw as CustomEvent<GameEvent>).detail);
    };
    this._target.addEventListener(EVENT_NAME, listener);
    return () => {
      this._target.removeEventListener(EVENT_NAME, listener);
    };
  }

  emit(ev: GameEvent): void {
    this._target.dispatchEvent(new CustomEvent<GameEvent>(EVENT_NAME, { detail: ev }));
  }
}
