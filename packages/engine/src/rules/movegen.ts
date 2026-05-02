/**
 * Move generation & check detection (pure functions).
 * Ported from legacy/js/engine/movegen.js.
 *
 * `generateMoves` produces pseudo-legal moves; `Position.makeMove` filters
 * self-check. `isChecked` is used both for the self-check filter and for
 * puzzle/mate detection.
 */
import { IN_BOARD, KNIGHT_PIN } from '../primitives/tables';
import {
  KING_DELTA,
  ADVISOR_DELTA,
  KNIGHT_DELTA,
  KNIGHT_CHECK_DELTA,
} from '../primitives/constants';
import { sideTag, oppTag } from '../primitives/piece';
import { makeMove } from '../primitives/move';
import { isInFort } from '../primitives/coords';
import type { Position } from './position';

export function generateMoves(pos: Position): number[] {
  const moves: number[] = [];
  const sqSelf = sideTag(pos.sdPlayer);
  const sqOpp = oppTag(pos.sdPlayer);

  for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
    const pc = pos.squares[sqSrc]!;
    if ((pc & sqSelf) === 0) continue;

    const type = pc & 7;

    switch (type) {
      case 0: {
        for (const delta of KING_DELTA) {
          const sqDst = sqSrc + delta;
          if (!IN_BOARD[sqDst] || !isInFort(sqDst)) continue;
          const target = pos.squares[sqDst]!;
          if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqDst));
        }
        break;
      }
      case 1: {
        for (const delta of ADVISOR_DELTA) {
          const sqDst = sqSrc + delta;
          if (!IN_BOARD[sqDst] || !isInFort(sqDst)) continue;
          const target = pos.squares[sqDst]!;
          if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqDst));
        }
        break;
      }
      case 2: {
        for (const delta of ADVISOR_DELTA) {
          const sqMid = sqSrc + delta;
          const sqDst = sqSrc + delta * 2;
          if (!IN_BOARD[sqDst]) continue;
          if (((sqDst ^ sqSrc) & 0x80) !== 0) continue;
          if (pos.squares[sqMid]! !== 0) continue;
          const target = pos.squares[sqDst]!;
          if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqDst));
        }
        break;
      }
      case 3: {
        for (let dir = 0; dir < 4; dir++) {
          const sqMid = sqSrc + KING_DELTA[dir]!;
          if (!IN_BOARD[sqMid] || pos.squares[sqMid]! !== 0) continue;
          for (const delta of KNIGHT_DELTA[dir]!) {
            const sqDst = sqSrc + delta;
            if (!IN_BOARD[sqDst]) continue;
            const target = pos.squares[sqDst]!;
            if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqDst));
          }
        }
        break;
      }
      case 4: {
        for (const delta of KING_DELTA) {
          let sqDst = sqSrc + delta;
          while (IN_BOARD[sqDst]) {
            const target = pos.squares[sqDst]!;
            if (target === 0) {
              moves.push(makeMove(sqSrc, sqDst));
            } else {
              if ((target & sqOpp) !== 0) moves.push(makeMove(sqSrc, sqDst));
              break;
            }
            sqDst += delta;
          }
        }
        break;
      }
      case 5: {
        for (const delta of KING_DELTA) {
          let sqDst = sqSrc + delta;
          while (IN_BOARD[sqDst]) {
            if (pos.squares[sqDst]! === 0) {
              moves.push(makeMove(sqSrc, sqDst));
            } else {
              break;
            }
            sqDst += delta;
          }
          sqDst += delta;
          while (IN_BOARD[sqDst]) {
            const target = pos.squares[sqDst]!;
            if (target !== 0) {
              if ((target & sqOpp) !== 0) moves.push(makeMove(sqSrc, sqDst));
              break;
            }
            sqDst += delta;
          }
        }
        break;
      }
      case 6: {
        const forward = pos.sdPlayer === 0 ? -16 : 16;
        const sqFwd = sqSrc + forward;
        if (IN_BOARD[sqFwd]) {
          const target = pos.squares[sqFwd]!;
          if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqFwd));
        }
        if (((sqSrc ^ (pos.sdPlayer === 0 ? 0x80 : 0)) & 0x80) !== 0) {
          for (const delta of [-1, 1]) {
            const sqLR = sqSrc + delta;
            if (IN_BOARD[sqLR]) {
              const target = pos.squares[sqLR]!;
              if ((target & sqSelf) === 0) moves.push(makeMove(sqSrc, sqLR));
            }
          }
        }
        break;
      }
      default: break;
    }
  }

  return moves;
}

export function isChecked(pos: Position): boolean {
  const sqSelf = sideTag(pos.sdPlayer);
  const sqOpp = oppTag(pos.sdPlayer);

  let sqKing = -1;
  for (let sq = 0; sq < 256; sq++) {
    if (pos.squares[sq]! === sqSelf) {
      sqKing = sq;
      break;
    }
  }
  if (sqKing < 0) return true;

  for (const delta of KING_DELTA) {
    let sq = sqKing + delta;
    while (IN_BOARD[sq]) {
      const pc = pos.squares[sq]!;
      if (pc !== 0) {
        if (pc === sqOpp + 0) return true;
        break;
      }
      sq += delta;
    }
  }

  for (let dir = 0; dir < 4; dir++) {
    for (const delta of KNIGHT_CHECK_DELTA[dir]!) {
      const sqSrc = sqKing + delta;
      if (!IN_BOARD[sqSrc]) continue;
      const pc = pos.squares[sqSrc]!;
      if (pc !== sqOpp + 3) continue;
      const pin = KNIGHT_PIN[sqKing - sqSrc + 256]!;
      if (pos.squares[sqSrc + pin]! === 0) return true;
    }
  }

  for (const delta of KING_DELTA) {
    let sq = sqKing + delta;
    let cannon = false;
    while (IN_BOARD[sq]) {
      const pc = pos.squares[sq]!;
      if (pc !== 0) {
        if (!cannon) {
          if (pc === sqOpp + 4) return true;
          cannon = true;
        } else {
          if (pc === sqOpp + 5) return true;
          break;
        }
      }
      sq += delta;
    }
  }

  const oppPawn = sqOpp + 6;
  const fwdDelta = pos.sdPlayer === 0 ? -16 : 16;
  const sqFwd = sqKing + fwdDelta;
  if (IN_BOARD[sqFwd] && pos.squares[sqFwd]! === oppPawn) return true;
  for (const delta of [-1, 1]) {
    const sqTest = sqKing + delta;
    if (IN_BOARD[sqTest] && pos.squares[sqTest]! === oppPawn) return true;
  }

  return false;
}
