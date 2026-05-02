import { describe, it, expect } from 'vitest';
import { GamePhase, canTransition } from './state';

describe('GameState', () => {
  it('IDLE can transition to ANIMATING or THINKING', () => {
    expect(canTransition(GamePhase.IDLE, GamePhase.ANIMATING)).toBe(true);
    expect(canTransition(GamePhase.IDLE, GamePhase.THINKING)).toBe(true);
    expect(canTransition(GamePhase.IDLE, GamePhase.IDLE)).toBe(false);
  });

  it('ANIMATING can transition to IDLE or THINKING', () => {
    expect(canTransition(GamePhase.ANIMATING, GamePhase.IDLE)).toBe(true);
    expect(canTransition(GamePhase.ANIMATING, GamePhase.THINKING)).toBe(true);
    expect(canTransition(GamePhase.ANIMATING, GamePhase.ANIMATING)).toBe(false);
  });

  it('THINKING can transition to ANIMATING only', () => {
    expect(canTransition(GamePhase.THINKING, GamePhase.ANIMATING)).toBe(true);
    expect(canTransition(GamePhase.THINKING, GamePhase.IDLE)).toBe(false);
    expect(canTransition(GamePhase.THINKING, GamePhase.THINKING)).toBe(false);
  });
});
