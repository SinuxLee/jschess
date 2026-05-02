import { describe, it, expect } from 'vitest';
import { WAV, type GameEvent } from './game-event';

describe('WAV enum', () => {
  it('has a distinct identifier per sound', () => {
    const values = Object.values(WAV).filter((v) => typeof v === 'string');
    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain(WAV.MOVE);
    expect(values).toContain(WAV.CAPTURE);
    expect(values).toContain(WAV.CHECK);
    expect(values).toContain(WAV.MATE);
    expect(values).toContain(WAV.ILLEGAL);
  });
});

describe('GameEvent union is exhaustively switchable', () => {
  it('type-narrowing works via discriminator', () => {
    const ev: GameEvent = { type: 'moveApplied', mv: 0x4433, capture: false, wav: WAV.MOVE };
    // Compile-time check: this block must typecheck.
    switch (ev.type) {
      case 'moveApplied':  expect(ev.mv).toBe(0x4433); break;
      case 'capture':      expect(ev).toBeDefined(); break;
      case 'check':        expect(ev).toBeDefined(); break;
      case 'mate':         expect(ev).toBeDefined(); break;
      case 'draw':         expect(ev).toBeDefined(); break;
      case 'illegalAttempt': expect(ev).toBeDefined(); break;
      case 'stateChanged': expect(ev).toBeDefined(); break;
      default: {
        const _exhaustive: never = ev;
        void _exhaustive;
      }
    }
  });
});
