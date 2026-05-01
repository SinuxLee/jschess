import { describe, it, expect } from 'vitest';
import {
  IN_BOARD,
  IN_FORT,
  LEGAL_SPAN,
  KNIGHT_PIN,
  DYNAMIC_CHESS_VALUE,
} from './tables';
import { makeCoord } from './coords';
import { PieceType } from './constants';

describe('tables', () => {
  it('IN_BOARD lights up legal squares and zero elsewhere', () => {
    expect(IN_BOARD[makeCoord(3, 3)]).toBe(1);
    expect(IN_BOARD[makeCoord(11, 12)]).toBe(1);
    expect(IN_BOARD[makeCoord(2, 5)]).toBe(0);
    expect(IN_BOARD[0]).toBe(0);
    expect(IN_BOARD.length).toBe(256);
  });

  it('IN_FORT lights the 3×3 palace on each side only', () => {
    expect(IN_FORT[makeCoord(7, 4)]).toBe(1);    // black palace
    expect(IN_FORT[makeCoord(7, 11)]).toBe(1);   // red palace
    expect(IN_FORT[makeCoord(5, 4)]).toBe(0);
    expect(IN_FORT[makeCoord(7, 7)]).toBe(0);    // middle no-man's-land
    expect(IN_FORT.length).toBe(256);
  });

  it('LEGAL_SPAN length 512; king step = 1', () => {
    expect(LEGAL_SPAN.length).toBe(512);
    // king step of +1 (sideways): index = (1 - 0) + 256 = 257
    expect(LEGAL_SPAN[256 + 1]).toBe(1);
    expect(LEGAL_SPAN[256 - 1]).toBe(1);
    expect(LEGAL_SPAN[256 + 16]).toBe(1);
  });

  it('KNIGHT_PIN length 512 and has nonzero entries on legal knight deltas', () => {
    expect(KNIGHT_PIN.length).toBe(512);
    // A knight delta of -33 should have a pin offset defined.
    expect(KNIGHT_PIN[256 - 33]).not.toBe(0);
  });

  it('DYNAMIC_CHESS_VALUE is a 7×256 table (one per PieceType)', () => {
    expect(DYNAMIC_CHESS_VALUE.length).toBe(7);
    for (let i = 0; i < 7; i++) {
      expect(DYNAMIC_CHESS_VALUE[i]!.length).toBe(256);
    }
    // Spot-check: king value at its starting square is nonzero-ish in legacy tables.
    const kingTable = DYNAMIC_CHESS_VALUE[PieceType.KING]!;
    expect(typeof kingTable[makeCoord(7, 12)]).toBe('number');
  });
});
