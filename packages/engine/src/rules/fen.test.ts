import { describe, it, expect } from 'vitest';
import { Position } from './position';
import { fromFen, toFen, iccsToMove, moveToIccsDashed } from './fen';
import { isChecked } from './movegen';
import { makeMove } from '../primitives/move';
import { makeCoord } from '../primitives/coords';

const INIT_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

describe('fen', () => {
  it('fromFen → toFen roundtrip on initial position', () => {
    const p = new Position();
    fromFen(p, INIT_FEN, isChecked);
    expect(toFen(p)).toBe(INIT_FEN);
  });

  it('fromFen parses side-to-move "b"', () => {
    const p = new Position();
    fromFen(p, INIT_FEN.replace(' w ', ' b '), isChecked);
    expect(p.sdPlayer).toBe(1);
  });

  it('iccsToMove / moveToIccsDashed roundtrip', () => {
    const src = makeCoord(7, 12);
    const dst = makeCoord(7, 10);
    const mv = makeMove(src, dst);
    const iccs = moveToIccsDashed(mv);
    expect(iccs).toMatch(/^[A-I]\d-[A-I]\d$/);
    const recovered = iccsToMove(iccs.replace('-', ''));
    expect(recovered).toBe(mv);
  });

  it('iccsToMove returns 0 on bad input', () => {
    expect(iccsToMove('')).toBe(0);
    expect(iccsToMove('xy')).toBe(0);
  });
});
