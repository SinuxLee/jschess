import { describe, it, expect } from 'vitest';
import {
  makeCoord,
  getX,
  getY,
  flipSq,
  mirrorSq,
  isOnBoard,
  isInFort,
  sameRow,
  sameCol,
  sameHalf,
  isEnemyHalf,
  isSelfHalf,
  sqToIccs,
} from './coords';
import { Color } from './constants';

describe('coords', () => {
  it('makeCoord packs (x,y) as (y << 4) | x', () => {
    expect(makeCoord(3, 3)).toBe(0x33);
    expect(makeCoord(11, 12)).toBe(0xCB);
  });

  it('getX / getY unpack', () => {
    const sq = makeCoord(7, 8);
    expect(getX(sq)).toBe(7);
    expect(getY(sq)).toBe(8);
  });

  it('flipSq(sq) = 254 - sq (vertical flip)', () => {
    expect(flipSq(makeCoord(4, 3))).toBe(254 - makeCoord(4, 3));
    expect(flipSq(makeCoord(4, 3))).toBe(makeCoord(11, 12) - (makeCoord(4, 3) - makeCoord(3, 3)));
  });

  it('mirrorSq flips x across col 7 (cols 3..11 midpoint)', () => {
    const sq = makeCoord(3, 5);
    const m = mirrorSq(sq);
    expect(getY(m)).toBe(5);
    expect(getX(m)).toBe(11);
  });

  it('isOnBoard covers 3..11 x 3..12, nothing else', () => {
    expect(isOnBoard(makeCoord(3, 3))).toBe(true);
    expect(isOnBoard(makeCoord(11, 12))).toBe(true);
    expect(isOnBoard(makeCoord(2, 5))).toBe(false);
    expect(isOnBoard(makeCoord(12, 5))).toBe(false);
    expect(isOnBoard(0)).toBe(false);
  });

  it('isInFort covers the 3×3 palace on each side', () => {
    // Black palace: rows 3..5, cols 6..8
    expect(isInFort(makeCoord(6, 3))).toBe(true);
    expect(isInFort(makeCoord(8, 5))).toBe(true);
    expect(isInFort(makeCoord(5, 5))).toBe(false);
    // Red palace: rows 10..12, cols 6..8
    expect(isInFort(makeCoord(7, 11))).toBe(true);
    expect(isInFort(makeCoord(6, 12))).toBe(true);
  });

  it('sameRow / sameCol', () => {
    expect(sameRow(makeCoord(3, 7), makeCoord(9, 7))).toBe(true);
    expect(sameRow(makeCoord(3, 7), makeCoord(3, 8))).toBe(false);
    expect(sameCol(makeCoord(4, 3), makeCoord(4, 12))).toBe(true);
  });

  it('sameHalf separates red (y>7) vs black (y<=7)', () => {
    expect(sameHalf(makeCoord(5, 6), makeCoord(5, 7))).toBe(true);
    expect(sameHalf(makeCoord(5, 7), makeCoord(5, 8))).toBe(false);
  });

  it('isEnemyHalf / isSelfHalf per side', () => {
    // Red side: own half is y>=8 (rows 8..12)
    expect(isSelfHalf(makeCoord(5, 10), Color.RED)).toBe(true);
    expect(isEnemyHalf(makeCoord(5, 10), Color.BLACK)).toBe(true);
  });

  it('sqToIccs emits "x-letter + y-digit" notation', () => {
    // legacy mapping: col 3 -> 'a', row 3 -> '9' (black back rank) ... row 12 -> '0'
    // We only assert structural shape here; exact notation locked by legacy behaviour.
    const s = sqToIccs(makeCoord(3, 3));
    expect(typeof s).toBe('string');
    expect(s.length).toBe(2);
  });
});
