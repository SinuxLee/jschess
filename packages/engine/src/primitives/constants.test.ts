import { describe, it, expect } from 'vitest';
import {
  PieceType,
  Color,
  Range,
  MATE_VALUE,
  BAN_VALUE,
  WIN_VALUE,
  DRAW_VALUE,
  NULL_OKAY_MARGIN,
  NULL_SAFE_MARGIN,
  ADVANCED_VALUE,
  FEN_PIECE,
  KING_DELTA,
  ADVISOR_DELTA,
  KNIGHT_DELTA,
  KNIGHT_CHECK_DELTA,
  MVV_VALUE,
} from './constants';

describe('constants', () => {
  it('PieceType enum matches legacy numeric encoding', () => {
    expect(PieceType.KING).toBe(0);
    expect(PieceType.ADVISOR).toBe(1);
    expect(PieceType.BISHOP).toBe(2);
    expect(PieceType.KNIGHT).toBe(3);
    expect(PieceType.ROOK).toBe(4);
    expect(PieceType.CANNON).toBe(5);
    expect(PieceType.PAWN).toBe(6);
  });

  it('Color enum: RED=0, BLACK=1', () => {
    expect(Color.RED).toBe(0);
    expect(Color.BLACK).toBe(1);
  });

  it('Range covers rows 3..12 and cols 3..11', () => {
    expect(Range.TOP).toBe(3);
    expect(Range.BOTTOM).toBe(12);
    expect(Range.LEFT).toBe(3);
    expect(Range.RIGHT).toBe(11);
  });

  it('MATE_VALUE / BAN_VALUE / WIN_VALUE / DRAW_VALUE match legacy', () => {
    expect(MATE_VALUE).toBe(10000);
    expect(BAN_VALUE).toBe(9900);
    expect(WIN_VALUE).toBe(9800);
    expect(DRAW_VALUE).toBe(20);
  });

  it('null-move margins', () => {
    expect(NULL_OKAY_MARGIN).toBe(200);
    expect(NULL_SAFE_MARGIN).toBe(400);
  });

  it('ADVANCED_VALUE', () => {
    expect(ADVANCED_VALUE).toBe(3);
  });

  it('FEN_PIECE is 24 chars with piece letters at the expected slots', () => {
    expect(FEN_PIECE.length).toBe(24);
    expect(FEN_PIECE[8]).toBe('K');
    expect(FEN_PIECE[9]).toBe('A');
    expect(FEN_PIECE[10]).toBe('B');
    expect(FEN_PIECE[11]).toBe('N');
    expect(FEN_PIECE[12]).toBe('R');
    expect(FEN_PIECE[13]).toBe('C');
    expect(FEN_PIECE[14]).toBe('P');
    expect(FEN_PIECE[16]).toBe('k');
  });

  it('move-generation deltas are the legacy values', () => {
    expect(KING_DELTA).toEqual([-16, -1, 1, 16]);
    expect(ADVISOR_DELTA).toEqual([-17, -15, 15, 17]);
    expect(KNIGHT_DELTA).toEqual([
      [-33, -31],
      [-18, 14],
      [-14, 18],
      [31, 33],
    ]);
    expect(KNIGHT_CHECK_DELTA).toEqual([
      [-33, -18],
      [-31, -14],
      [14, 31],
      [18, 33],
    ]);
  });

  it('MVV_VALUE table indexed by PieceType', () => {
    expect(MVV_VALUE).toEqual([50, 10, 10, 30, 40, 30, 20]);
  });
});
