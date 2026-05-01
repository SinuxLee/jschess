import { describe, it, expect } from 'vitest';
import {
  MOVE_NONE,
  makeMove,
  moveSrc,
  moveDst,
  mirrorMove,
  moveToIccs,
} from './move';
import { makeCoord } from './coords';

describe('move', () => {
  it('MOVE_NONE is 0', () => {
    expect(MOVE_NONE).toBe(0);
  });

  it('makeMove packs src | (dst << 8)', () => {
    const src = makeCoord(3, 3);
    const dst = makeCoord(9, 10);
    const mv = makeMove(src, dst);
    expect(mv & 0xFF).toBe(src);
    expect(mv >> 8).toBe(dst);
  });

  it('moveSrc / moveDst unpack', () => {
    const mv = makeMove(0x33, 0xCB);
    expect(moveSrc(mv)).toBe(0x33);
    expect(moveDst(mv)).toBe(0xCB);
  });

  it('mirrorMove mirrors both endpoints across col 7', () => {
    const src = makeCoord(3, 5);    // x=3
    const dst = makeCoord(3, 10);   // x=3
    const mv = makeMove(src, dst);
    const mirrored = mirrorMove(mv);
    expect((mirrored & 0xFF) & 0xF).toBe(11);
    expect((mirrored >> 8) & 0xF).toBe(11);
  });

  it('moveToIccs returns a 4-char ICCS string', () => {
    const mv = makeMove(makeCoord(4, 12), makeCoord(4, 10));
    const s = moveToIccs(mv);
    expect(typeof s).toBe('string');
    expect(s.length).toBe(4);
  });
});
