import { describe, it, expect } from 'vitest';
import { Position, type MoveStackEntry } from './position';
import { makeCoord } from '../primitives/coords';
import { makePiece } from '../primitives/piece';
import { PieceType, Color } from '../primitives/constants';
import { makeMove } from '../primitives/move';

describe('Position', () => {
  it('constructor: empty board, RED to move, zero evaluation', () => {
    const p = new Position();
    expect(p.sdPlayer).toBe(0);
    expect(p.squares).toBeInstanceOf(Uint8Array);
    expect(p.squares.length).toBe(256);
    expect(p.vlRed).toBe(0);
    expect(p.vlBlack).toBe(0);
    expect(p.zobristKey).toBe(0);
    expect(p.zobristLock).toBe(0);
    expect(p.distance).toBe(0);
    expect(p.moveStack.length).toBe(1);
    expect(p.inCheck()).toBe(false);
  });

  it('addPiece places the encoded piece on the board', () => {
    const p = new Position();
    const sq = makeCoord(7, 12);
    p.addPiece(sq, makePiece(PieceType.KING, Color.RED), false);
    expect(p.squares[sq]).toBe(makePiece(PieceType.KING, Color.RED));
    expect(p.vlRed).not.toBe(0);
  });

  it('addPiece with isDel=true removes the piece and undoes evaluation', () => {
    const p = new Position();
    const sq = makeCoord(7, 12);
    const pc = makePiece(PieceType.KING, Color.RED);
    p.addPiece(sq, pc, false);
    const redAfterAdd = p.vlRed;
    p.addPiece(sq, pc, true);
    expect(p.squares[sq]).toBe(0);
    expect(p.vlRed).toBe(redAfterAdd - (redAfterAdd - 0));
    expect(p.vlRed).toBe(0);
  });

  it('changeSide toggles sdPlayer and flips player Zobrist bits', () => {
    const p = new Position();
    const k = p.zobristKey;
    const l = p.zobristLock;
    p.changeSide();
    expect(p.sdPlayer).toBe(1);
    expect(p.zobristKey).not.toBe(k);
    expect(p.zobristLock).not.toBe(l);
    p.changeSide();
    expect(p.sdPlayer).toBe(0);
    expect(p.zobristKey).toBe(k);
    expect(p.zobristLock).toBe(l);
  });

  it('makeMove → undoMakeMove is a round-trip: identity on squares/zobrist/evaluation', () => {
    const p = new Position();
    const src = makeCoord(4, 12);
    const dst = makeCoord(4, 10);
    const rook = makePiece(PieceType.ROOK, Color.RED);
    p.addPiece(src, rook, false);
    const snap = {
      squares: new Uint8Array(p.squares),
      vlRed: p.vlRed,
      vlBlack: p.vlBlack,
      zobristKey: p.zobristKey,
      zobristLock: p.zobristLock,
      sdPlayer: p.sdPlayer,
      distance: p.distance,
    };
    const neverChecked = () => false;
    const ok = p.makeMove(makeMove(src, dst), neverChecked);
    expect(ok).toBe(true);
    expect(p.squares[src]).toBe(0);
    expect(p.squares[dst]).toBe(rook);
    expect(p.distance).toBe(1);

    p.undoMakeMove();
    expect(p.sdPlayer).toBe(snap.sdPlayer);
    expect(p.zobristKey).toBe(snap.zobristKey);
    expect(p.zobristLock).toBe(snap.zobristLock);
    expect(p.vlRed).toBe(snap.vlRed);
    expect(p.vlBlack).toBe(snap.vlBlack);
    expect(p.distance).toBe(snap.distance);
    expect(Array.from(p.squares)).toEqual(Array.from(snap.squares));
  });

  it('makeMove returns false and does not mutate if checkedFn reports self-check', () => {
    const p = new Position();
    const src = makeCoord(4, 12);
    const dst = makeCoord(4, 10);
    p.addPiece(src, makePiece(PieceType.ROOK, Color.RED), false);
    const snapKey = p.zobristKey;
    const alwaysChecked = () => true;
    const ok = p.makeMove(makeMove(src, dst), alwaysChecked);
    expect(ok).toBe(false);
    expect(p.zobristKey).toBe(snapKey);
    expect(p.squares[src]).not.toBe(0);
    expect(p.distance).toBe(0);
  });

  it('nullMove / undoNullMove round-trip', () => {
    const p = new Position();
    const snapKey = p.zobristKey;
    const snapLock = p.zobristLock;
    p.nullMove(() => false);
    expect(p.distance).toBe(1);
    expect(p.sdPlayer).toBe(1);
    p.undoNullMove();
    expect(p.distance).toBe(0);
    expect(p.sdPlayer).toBe(0);
    expect(p.zobristKey).toBe(snapKey);
    expect(p.zobristLock).toBe(snapLock);
  });

  it('setIrrev resets stack and distance', () => {
    const p = new Position();
    p.nullMove(() => false);
    expect(p.distance).toBe(1);
    p.setIrrev(true);
    expect(p.distance).toBe(0);
    expect(p.moveStack.length).toBe(1);
    expect(p.inCheck()).toBe(true);
  });

  it('MoveStackEntry shape is exported', () => {
    const entry: MoveStackEntry = { mv: 0, captured: 0, prevKey: 0, prevLock: 0, inCheck: false };
    expect(entry.mv).toBe(0);
  });
});
