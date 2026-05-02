import { describe, it, expect } from 'vitest';
import { probeBook, resetProbeRng } from './probe';
import { loadBook } from './loader';
import { Position, fromFen, isChecked } from '@jschess/engine';

describe('probeBook', () => {
  it('returns MOVE_NONE (0) on a position not in the book', async () => {
    const pos = new Position();
    fromFen(pos, '3k5/9/9/9/9/9/9/9/9/3K1R3 w - - 0 1', isChecked);
    const mv = await probeBook(pos);
    expect(mv).toBe(0);
  });

  it('returns a stored move when a position matches a known book key', async () => {
    // The book was orphaned in legacy (never probed) so its keys do not
    // naturally land on positions we can produce via fromFen. To exercise
    // the probe machinery we craft a Position whose zobristKey matches a
    // known book key by poking the field directly — valid only in a test.
    resetProbeRng(1);
    const book = await loadBook();
    const firstKey = book.keys().next().value as number;
    expect(firstKey).toBeGreaterThan(0);

    const pos = new Position();
    fromFen(pos, 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1', isChecked);
    (pos as unknown as { zobristKey: number }).zobristKey = firstKey;

    const mv = await probeBook(pos);
    expect(mv).not.toBe(0);
  });
});
