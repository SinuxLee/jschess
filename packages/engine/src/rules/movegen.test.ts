import { describe, it, expect } from 'vitest';
import { Position } from './position';
import { generateMoves, isChecked } from './movegen';
import { makeCoord } from '../primitives/coords';
import { makePiece } from '../primitives/piece';
import { PieceType, Color } from '../primitives/constants';
import { moveSrc } from '../primitives/move';

describe('generateMoves — pseudo-legal moves', () => {
  it('lone red rook in empty board: nonzero ray moves, all from source', () => {
    const p = new Position();
    p.addPiece(makeCoord(7, 7), makePiece(PieceType.ROOK, Color.RED), false);
    const moves = generateMoves(p);
    expect(moves.length).toBeGreaterThan(10);
    for (const mv of moves) {
      expect(moveSrc(mv)).toBe(makeCoord(7, 7));
    }
  });

  it('red king in palace: limited to fort-legal destinations', () => {
    const p = new Position();
    p.addPiece(makeCoord(7, 12), makePiece(PieceType.KING, Color.RED), false);
    const moves = generateMoves(p);
    expect(moves.length).toBe(3);
  });
});

describe('isChecked — king safety', () => {
  it('red king attacked by black rook on same file → in check', () => {
    const p = new Position();
    p.addPiece(makeCoord(4, 12), makePiece(PieceType.KING, Color.RED), false);
    p.addPiece(makeCoord(4, 3),  makePiece(PieceType.ROOK, Color.BLACK), false);
    expect(isChecked(p)).toBe(true);
  });

  it('red king not attacked when ally blocks → not in check', () => {
    const p = new Position();
    p.addPiece(makeCoord(4, 12), makePiece(PieceType.KING, Color.RED), false);
    p.addPiece(makeCoord(4, 3),  makePiece(PieceType.ROOK, Color.BLACK), false);
    p.addPiece(makeCoord(4, 7),  makePiece(PieceType.PAWN, Color.RED),   false);
    expect(isChecked(p)).toBe(false);
  });

  it('flying kings (same file, no pieces between) → red in check', () => {
    const p = new Position();
    p.addPiece(makeCoord(7, 12), makePiece(PieceType.KING, Color.RED),   false);
    p.addPiece(makeCoord(7, 3),  makePiece(PieceType.KING, Color.BLACK), false);
    expect(isChecked(p)).toBe(true);
  });
});
