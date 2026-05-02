import { describe, it, expect } from 'vitest';
import { type GameError, isGameError } from './errors';

describe('GameError', () => {
  it('IllegalMove carries the attempted move', () => {
    const err: GameError = { kind: 'IllegalMove', mv: 0x1234, reason: 'self-check' };
    expect(isGameError(err)).toBe(true);
    if (err.kind === 'IllegalMove') {
      expect(err.mv).toBe(0x1234);
    }
  });

  it('WorkerTimeout carries the timeout in ms', () => {
    const err: GameError = { kind: 'WorkerTimeout', millis: 5000 };
    expect(isGameError(err)).toBe(true);
  });

  it('isGameError rejects plain objects', () => {
    expect(isGameError({})).toBe(false);
    expect(isGameError(null)).toBe(false);
    expect(isGameError(undefined)).toBe(false);
    expect(isGameError({ kind: 'Unknown' })).toBe(false);
  });
});
