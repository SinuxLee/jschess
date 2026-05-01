/**
 * Move encoding: packed 16-bit integer `src | (dst << 8)`.
 * 0 = MOVE_NONE (no move).
 * Ported from legacy/js/core/move.js.
 */
import { type Move, type Square } from './constants';
import { mirrorSq, sqToIccs } from './coords';

export const MOVE_NONE: Move = 0;

export function makeMove(src: Square, dst: Square): Move {
  return src | (dst << 8);
}

export function moveSrc(mv: Move): Square {
  return mv & 0xFF;
}

export function moveDst(mv: Move): Square {
  return mv >> 8;
}

export function mirrorMove(mv: Move): Move {
  return makeMove(mirrorSq(moveSrc(mv)), mirrorSq(moveDst(mv)));
}

export function moveToIccs(mv: Move): string {
  return sqToIccs(moveSrc(mv)) + sqToIccs(moveDst(mv));
}
