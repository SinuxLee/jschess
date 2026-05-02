import { describe, it, expect } from 'vitest';
import { Search } from './search';
import { Position, fromFen, isChecked, PUZZLE_FENS, moveDst } from '@jschess/engine';

describe('Search — smoke test against puzzle FENs', () => {
  for (let i = 0; i < 5; i++) {
    const fen = PUZZLE_FENS[i]!;
    it(`returns a legal move for puzzle FEN ${i + 1} within 100ms`, () => {
      const p = new Position();
      fromFen(p, fen, isChecked);
      const s = new Search(p);
      s.searchMain(8, 100);
      expect(s.bestMove).not.toBe(0);
      const applied = p.makeMove(s.bestMove, isChecked);
      expect(applied).toBe(true);
      p.undoMakeMove();
    }, 10_000);
  }
});

describe('Search — returns something on the initial position', () => {
  it('produces a legal opening move within the time budget', () => {
    const p = new Position();
    fromFen(
      p,
      'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      isChecked,
    );
    const s = new Search(p);
    s.searchMain(6, 1000);
    expect(s.bestMove).not.toBe(0);
    const applied = p.makeMove(s.bestMove, isChecked);
    expect(applied).toBe(true);
    expect(moveDst(s.bestMove)).toBeGreaterThan(0);
    p.undoMakeMove();
  });
});
