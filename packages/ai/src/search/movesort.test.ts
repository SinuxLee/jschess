import { describe, it, expect } from 'vitest';
import { MoveSort, HistoryTable } from './movesort';
import { Position, makeCoord, makePiece, PieceType, Color, makeMove } from '@jschess/engine';

describe('HistoryTable', () => {
  it('add / get / clear / decay', () => {
    const h = new HistoryTable();
    const mv = 0x1234;
    h.add(mv, 4);
    expect(h.get(mv)).toBe(16);
    h.decay();
    expect(h.get(mv)).toBe(8);
    h.clear();
    expect(h.get(mv)).toBe(0);
  });
});

describe('MoveSort', () => {
  function sample(): Position {
    const p = new Position();
    p.addPiece(makeCoord(7, 12), makePiece(PieceType.ROOK, Color.RED), false);
    p.addPiece(makeCoord(7, 3), makePiece(PieceType.ROOK, Color.BLACK), false);
    p.addPiece(makeCoord(4, 12), makePiece(PieceType.KING, Color.RED), false);
    p.addPiece(makeCoord(4, 3), makePiece(PieceType.KING, Color.BLACK), false);
    return p;
  }

  it('hashMove is returned first', () => {
    const p = sample();
    const h = new HistoryTable();
    const hashMove = makeMove(makeCoord(7, 12), makeCoord(7, 3));
    const moves = [
      makeMove(makeCoord(7, 12), makeCoord(6, 12)),
      hashMove,
      makeMove(makeCoord(7, 12), makeCoord(8, 12)),
    ];
    const s = new MoveSort(moves.slice(), p, hashMove, [0, 0], h.table);
    expect(s.next()).toBe(hashMove);
  });

  it('captures sorted before quiet when no hashMove', () => {
    const p = sample();
    const h = new HistoryTable();
    const cap = makeMove(makeCoord(7, 12), makeCoord(7, 3));
    const quiet = makeMove(makeCoord(7, 12), makeCoord(6, 12));
    const s = new MoveSort([quiet, cap], p, 0, [0, 0], h.table);
    expect(s.next()).toBe(cap);
  });

  it('next() returns -1 when exhausted', () => {
    const p = sample();
    const h = new HistoryTable();
    const s = new MoveSort([], p, 0, [0, 0], h.table);
    expect(s.next()).toBe(-1);
  });
});
