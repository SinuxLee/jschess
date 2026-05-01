/**
 * Piece encoding.
 * 0 = empty, 8..14 = red pieces, 16..22 = black pieces.
 * Low 3 bits = PieceType. Side tag = 8 (red) or 16 (black).
 * Ported from legacy/js/core/piece.js.
 */
import { Color, PieceType } from './constants';

export function sideTag(side: Color): number {
  return 8 + (side << 3);
}

export function oppTag(side: Color): number {
  return 16 - (side << 3);
}

export function pieceType(pc: number): PieceType {
  return (pc & 7) as PieceType;
}

export function isSide(pc: number, side: Color): boolean {
  return (pc & sideTag(side)) !== 0;
}

export function makePiece(type: PieceType, side: Color): number {
  return sideTag(side) + type;
}

export function charToPieceType(ch: string): PieceType {
  switch (ch.toUpperCase()) {
    case 'K': return PieceType.KING;
    case 'A': return PieceType.ADVISOR;
    case 'B':
    case 'E': return PieceType.BISHOP;
    case 'N':
    case 'H': return PieceType.KNIGHT;
    case 'R': return PieceType.ROOK;
    case 'C': return PieceType.CANNON;
    case 'P': return PieceType.PAWN;
    default:  return PieceType.UNKNOWN;
  }
}
