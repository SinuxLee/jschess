import { describe, it, expect } from 'vitest';
import { Position } from './position';
import { evaluate, repValue, mateValue } from './evaluate';
import { MATE_VALUE, DRAW_VALUE, ADVANCED_VALUE } from '../primitives/constants';
import { makeCoord } from '../primitives/coords';
import { makePiece } from '../primitives/piece';
import { PieceType, Color } from '../primitives/constants';

describe('evaluate', () => {
  it('empty board: returns ADVANCED_VALUE (tempo bonus)', () => {
    const p = new Position();
    expect(evaluate(p)).toBe(ADVANCED_VALUE);
  });

  it('extra red rook: positive when RED to move', () => {
    const p = new Position();
    p.addPiece(makeCoord(7, 10), makePiece(PieceType.ROOK, Color.RED), false);
    expect(evaluate(p)).toBeGreaterThan(0);
  });

  it('symmetry: mirrored kings score ADVANCED_VALUE', () => {
    const p = new Position();
    p.addPiece(makeCoord(4, 10), makePiece(PieceType.KING, Color.RED), false);
    p.addPiece(makeCoord(4, 5),  makePiece(PieceType.KING, Color.BLACK), false);
    expect(p.vlRed).toBe(p.vlBlack);
    expect(evaluate(p)).toBe(ADVANCED_VALUE);
  });

  it('mateValue: in check at distance 0 returns -MATE_VALUE', () => {
    const p = new Position();
    p.setIrrev(true);
    expect(mateValue(p)).toBe(-MATE_VALUE);
  });

  it('mateValue: stalemate (not in check) returns -DRAW_VALUE', () => {
    const p = new Position();
    p.setIrrev(false);
    expect(mateValue(p)).toBe(-DRAW_VALUE);
  });

  it('repValue: no history → 0', () => {
    const p = new Position();
    expect(repValue(p)).toBe(0);
  });
});
