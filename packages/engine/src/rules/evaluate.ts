/**
 * Position evaluation and game-theoretic terminals.
 * All values are from the side-to-move's perspective:
 *   positive = advantage to side-to-move; negative = disadvantage.
 */
import { MATE_VALUE, DRAW_VALUE, ADVANCED_VALUE, WIN_VALUE } from '../primitives/constants';
import type { Position } from './position';

export function evaluate(pos: Position): number {
  const vl =
    (pos.sdPlayer === 0 ? pos.vlRed - pos.vlBlack : pos.vlBlack - pos.vlRed) + ADVANCED_VALUE;
  return vl === 0 ? DRAW_VALUE : vl;
}

export function repValue(pos: Position, recur = 1): number {
  const stack = pos.moveStack;
  const len = stack.length;

  let selfSide = true;
  let repSelf = 0;
  let repOpp = 0;
  let rep = 0;

  for (let i = len - 1; i >= 1; i--) {
    const entry = stack[i]!;
    if (entry.captured > 0 || entry.mv === 0) break;

    if (entry.prevKey === pos.zobristKey && entry.prevLock === pos.zobristLock) {
      rep++;
      if (rep >= recur) {
        return pos.sdPlayer === 0 ? _repScore(repSelf, repOpp) : _repScore(repOpp, repSelf);
      }
    }

    if (selfSide) {
      repSelf += entry.inCheck ? 2 : 0;
    } else {
      repOpp += entry.inCheck ? 2 : 0;
    }
    selfSide = !selfSide;
  }

  return 0;
}

function _repScore(s: number, o: number): number {
  if (s > o) return -WIN_VALUE;
  if (o > s) return WIN_VALUE;
  return -DRAW_VALUE;
}

export function mateValue(pos: Position): number {
  return pos.inCheck() ? pos.distance - MATE_VALUE : -DRAW_VALUE;
}
