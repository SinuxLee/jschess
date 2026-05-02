import { describe, it, expect } from 'vitest';
import { Position } from './position';
import { fromFen } from './fen';
import { generateMoves, isChecked } from './movegen';

const INIT_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

/**
 * Count all pseudo-legal-then-legal leaves at `depth`.
 * This is the classic chess-engine regression harness.
 *
 * Reference values captured 2026-04-30 from legacy Node v22 against
 * `legacy/js/engine/*.js`. If these three numbers ever diverge, move
 * generation or check filtering has drifted from the legacy baseline.
 */
function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  let n = 0;
  for (const mv of generateMoves(pos)) {
    if (pos.makeMove(mv, isChecked)) {
      n += perft(pos, depth - 1);
      pos.undoMakeMove();
    }
  }
  return n;
}

describe('perft — initial position', () => {
  const p = new Position();
  fromFen(p, INIT_FEN, isChecked);

  it('depth 1 matches reference', () => {
    expect(perft(p, 1)).toBe(44);
  });

  it('depth 2 matches reference', () => {
    expect(perft(p, 2)).toBe(1920);
  });

  it(
    'depth 3 matches reference',
    () => {
      expect(perft(p, 3)).toBe(79666);
    },
    /* timeout ms */ 30_000,
  );
});
