import { describe, it, expect } from 'vitest';
import { EventBus } from './events';
import type { GameEvent } from '@jschess/engine';

describe('EventBus', () => {
  it('delivers emitted events to subscribers', () => {
    const bus = new EventBus();
    const received: GameEvent[] = [];
    bus.on((ev) => received.push(ev));
    bus.emit({ type: 'stateChanged', state: 'idle' });
    bus.emit({ type: 'moveApplied', mv: 1234, capture: false, wav: 'move' });
    expect(received.length).toBe(2);
    expect(received[0]!.type).toBe('stateChanged');
    expect(received[1]!.type).toBe('moveApplied');
  });

  it('unsubscribe stops delivery', () => {
    const bus = new EventBus();
    const received: GameEvent[] = [];
    const unsub = bus.on((ev) => received.push(ev));
    bus.emit({ type: 'stateChanged', state: 'animating' });
    unsub();
    bus.emit({ type: 'stateChanged', state: 'idle' });
    expect(received.length).toBe(1);
  });

  it('multiple subscribers each receive the event', () => {
    const bus = new EventBus();
    const a: GameEvent[] = [];
    const b: GameEvent[] = [];
    bus.on((ev) => a.push(ev));
    bus.on((ev) => b.push(ev));
    bus.emit({ type: 'draw', reason: 'stalemate' });
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
  });
});
