import { describe, it, expect } from 'vitest';
import { loadBook } from './loader';

describe('loadBook', () => {
  it('returns a non-empty Map keyed by zobristLow32', async () => {
    const book = await loadBook();
    expect(book.size).toBeGreaterThan(0);

    const entries = book.get(203040);
    expect(entries).toBeDefined();
    expect(entries!.some((e) => e.mv === 34229 && e.weight === 6)).toBe(true);
  });

  it('is memoised (subsequent calls return the same instance)', async () => {
    const a = await loadBook();
    const b = await loadBook();
    expect(a).toBe(b);
  });
});
