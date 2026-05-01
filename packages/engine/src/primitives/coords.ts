/**
 * Board coordinate helpers.
 * Internal board is a 16×16 array. Legal squares: y in [3..12], x in [3..11].
 * sq = (y << 4) | x.
 * Ported verbatim from legacy/js/core/coords.js.
 */
import { Range, Color, type Square } from './constants';

export function makeCoord(x: number, y: number): Square {
  return (y << 4) | x;
}

export function getX(sq: Square): number {
  return sq & 0xF;
}

export function getY(sq: Square): number {
  return sq >> 4;
}

export function flipSq(sq: Square): Square {
  return 254 - sq;
}

export function mirrorSq(sq: Square): Square {
  // Flip x around col 7: new_x = (Range.LEFT + Range.RIGHT) - x = 14 - x
  return (sq & 0xF0) | ((Range.LEFT + Range.RIGHT) - (sq & 0xF));
}

export function isOnBoard(sq: Square): boolean {
  const x = sq & 0xF;
  const y = sq >> 4;
  return x >= Range.LEFT && x <= Range.RIGHT && y >= Range.TOP && y <= Range.BOTTOM;
}

export function isInFort(sq: Square): boolean {
  const x = sq & 0xF;
  const y = sq >> 4;
  // Black palace: y in [3..5], x in [6..8]
  if (x >= 6 && x <= 8 && y >= 3 && y <= 5) return true;
  // Red palace: y in [10..12], x in [6..8]
  if (x >= 6 && x <= 8 && y >= 10 && y <= 12) return true;
  return false;
}

export function sameRow(a: Square, b: Square): boolean {
  return (a & 0xF0) === (b & 0xF0);
}

export function sameCol(a: Square, b: Square): boolean {
  return (a & 0xF) === (b & 0xF);
}

export function sameHalf(a: Square, b: Square): boolean {
  // Divide at mid: y<=7 is black half, y>=8 is red half.
  return ((a >> 4) < 8) === ((b >> 4) < 8);
}

export function isEnemyHalf(sq: Square, side: Color): boolean {
  const y = sq >> 4;
  return side === Color.RED ? y < 8 : y >= 8;
}

export function isSelfHalf(sq: Square, side: Color): boolean {
  const y = sq >> 4;
  return side === Color.RED ? y >= 8 : y < 8;
}

export function sqToIccs(sq: Square): string {
  // Legacy notation: col 3..11 → 'a'..'i'; row 3..12 → '9'..'0' (top=9, bottom=0).
  const x = sq & 0xF;
  const y = sq >> 4;
  const file = String.fromCharCode('a'.charCodeAt(0) + (x - Range.LEFT));
  const rank = String.fromCharCode('0'.charCodeAt(0) + (Range.BOTTOM - y));
  return file + rank;
}
