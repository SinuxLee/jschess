/**
 * MERGE BLOCKER: asserts packages/ai/src/book.json contains exactly the
 * same entries as legacy/js/book.js (after `BOOK_DAT.pop()`).
 *
 * If this test fails, we MUST NOT ship the new AI package — it would
 * silently play different opening book moves than the legacy engine.
 */
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('opening-book parity (legacy vs @jschess/ai)', () => {
  it('new book.json contains exactly the same multiset of entries as legacy BOOK_DAT', async () => {
    const legacyMod = (await import(
      resolve(__dirname, '../../../legacy/js/book.js')
    )) as unknown as { BOOK_DAT: Array<[number, number, number]> };
    const legacy = legacyMod.BOOK_DAT;

    const newMod = (await import(
      resolve(__dirname, '../../../packages/ai/src/book.json'),
      { with: { type: 'json' } }
    )) as unknown as { default: { entries: Array<[number, number, number]> } };
    const updated = newMod.default.entries;

    expect(updated.length).toBe(legacy.length);

    const legacyCounts = new Map<string, number>();
    for (const [k, m, w] of legacy) {
      const sig = `${k | 0}|${m | 0}|${w | 0}`;
      legacyCounts.set(sig, (legacyCounts.get(sig) ?? 0) + 1);
    }
    for (const [k, m, w] of updated) {
      const sig = `${k | 0}|${m | 0}|${w | 0}`;
      const c = legacyCounts.get(sig) ?? 0;
      if (c === 0) {
        throw new Error(`new entry missing in legacy: ${sig}`);
      }
      legacyCounts.set(sig, c - 1);
    }
    for (const [sig, c] of legacyCounts) {
      if (c > 0) throw new Error(`legacy entry missing in new: ${sig} (×${c})`);
    }
  });
});
