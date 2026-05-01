import { describe, it, expect } from 'vitest';
import { ZOBRIST, zobristPcIdx } from './zobrist';

/**
 * Zobrist golden-value test. Pins the RC4-derived hash tables bit-exactly
 * against what the legacy JS code generated. If this fails after any edit
 * to zobrist.ts, transposition-table identity between Node and browser has
 * been broken — do NOT ship.
 *
 * The values below come from running:
 *   node --input-type=module -e "
 *     import { ZOBRIST } from './legacy/js/core/zobrist.js';
 *     console.log(ZOBRIST.playerKey, ...);"
 * on macOS Node v22 — captured 2026-04-30.
 */
describe('zobrist — golden values (cross-runtime determinism)', () => {
  it('scalar keys', () => {
    expect(ZOBRIST.playerKey).toBe(1099503838);
    expect(ZOBRIST.playerLock).toBe(1730021002);
  });

  it('corner keyTable entries match', () => {
    expect(ZOBRIST.keyTable[0]![0]).toBe(1838313047);
    expect(ZOBRIST.keyTable[0]![51]).toBe(-2110139350);
    expect(ZOBRIST.keyTable[6]![195]).toBe(-353017946);
    expect(ZOBRIST.keyTable[13]![255]).toBe(-1669942053);
  });

  it('corner lockTable entries match', () => {
    expect(ZOBRIST.lockTable[0]![0]).toBe(-1746154256);
    expect(ZOBRIST.lockTable[13]![255]).toBe(-1039295328);
  });

  it('dimensions: 14 × 256 for both tables', () => {
    expect(ZOBRIST.keyTable.length).toBe(14);
    expect(ZOBRIST.lockTable.length).toBe(14);
    for (let i = 0; i < 14; i++) {
      expect(ZOBRIST.keyTable[i]!.length).toBe(256);
      expect(ZOBRIST.lockTable[i]!.length).toBe(256);
    }
  });

  it('zobristPcIdx: red 8..14 → 0..6, black 16..22 → 7..13', () => {
    expect(zobristPcIdx(8)).toBe(0);
    expect(zobristPcIdx(14)).toBe(6);
    expect(zobristPcIdx(16)).toBe(7);
    expect(zobristPcIdx(22)).toBe(13);
  });
});
