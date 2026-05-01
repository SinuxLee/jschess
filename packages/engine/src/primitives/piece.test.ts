import { describe, it, expect } from 'vitest';
import {
  sideTag,
  oppTag,
  pieceType,
  isSide,
  makePiece,
  charToPieceType,
} from './piece';
import { Color, PieceType } from './constants';

describe('piece', () => {
  it('sideTag: RED=8, BLACK=16', () => {
    expect(sideTag(Color.RED)).toBe(8);
    expect(sideTag(Color.BLACK)).toBe(16);
  });

  it('oppTag: RED→16, BLACK→8', () => {
    expect(oppTag(Color.RED)).toBe(16);
    expect(oppTag(Color.BLACK)).toBe(8);
  });

  it('pieceType extracts low 3 bits', () => {
    expect(pieceType(8)).toBe(PieceType.KING);
    expect(pieceType(14)).toBe(PieceType.PAWN);
    expect(pieceType(16)).toBe(PieceType.KING);
    expect(pieceType(22)).toBe(PieceType.PAWN);
  });

  it('isSide: red pieces 8..14, black pieces 16..22', () => {
    expect(isSide(10, Color.RED)).toBe(true);
    expect(isSide(10, Color.BLACK)).toBe(false);
    expect(isSide(20, Color.BLACK)).toBe(true);
    expect(isSide(0, Color.RED)).toBe(false);
  });

  it('makePiece composes (type, side)', () => {
    expect(makePiece(PieceType.ROOK, Color.RED)).toBe(12);
    expect(makePiece(PieceType.CANNON, Color.BLACK)).toBe(21);
  });

  it('charToPieceType maps FEN letters (case-insensitive)', () => {
    expect(charToPieceType('K')).toBe(PieceType.KING);
    expect(charToPieceType('k')).toBe(PieceType.KING);
    expect(charToPieceType('A')).toBe(PieceType.ADVISOR);
    expect(charToPieceType('B')).toBe(PieceType.BISHOP);
    expect(charToPieceType('E')).toBe(PieceType.BISHOP);
    expect(charToPieceType('N')).toBe(PieceType.KNIGHT);
    expect(charToPieceType('H')).toBe(PieceType.KNIGHT);
    expect(charToPieceType('R')).toBe(PieceType.ROOK);
    expect(charToPieceType('C')).toBe(PieceType.CANNON);
    expect(charToPieceType('P')).toBe(PieceType.PAWN);
    expect(charToPieceType('?')).toBe(PieceType.UNKNOWN);
  });
});
