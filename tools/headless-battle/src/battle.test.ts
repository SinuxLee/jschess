import { describe, it, expect } from 'vitest';
import { playGame } from './battle';

describe('headless self-play', () => {
  it('completes a short game without crashing', async () => {
    const result = await playGame(40, 50);
    expect(result.plies).toBeGreaterThan(0);
    expect(typeof result.finalFen).toBe('string');
  }, 60_000);
});
