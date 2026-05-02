/**
 * Lazy loader for the opening book. The JSON is imported dynamically so that
 * a consumer who never asks for book moves never pays the parse cost.
 *
 * The book is keyed by the low 32 bits of the position's Zobrist key
 * (Position.zobristKey). Matches must also be verified against zobristLock
 * by the caller — probe.ts does this.
 */

export interface BookEntry {
  readonly mv: number;
  readonly weight: number;
}

let _cache: Promise<ReadonlyMap<number, readonly BookEntry[]>> | null = null;

export function loadBook(): Promise<ReadonlyMap<number, readonly BookEntry[]>> {
  if (_cache !== null) return _cache;
  _cache = (async () => {
    const mod = (await import('../book.json', { with: { type: 'json' } })) as unknown as {
      default: { entries: Array<[number, number, number]> };
    };
    const rows = mod.default.entries;

    const map = new Map<number, BookEntry[]>();
    for (const [key, mv, weight] of rows) {
      let bucket = map.get(key);
      if (bucket === undefined) {
        bucket = [];
        map.set(key, bucket);
      }
      bucket.push({ mv, weight });
    }
    for (const [k, bucket] of map) {
      map.set(k, Object.freeze(bucket) as BookEntry[]);
    }
    return map as ReadonlyMap<number, readonly BookEntry[]>;
  })();
  return _cache;
}

/** @internal — tests only. */
export function _resetBookCache(): void {
  _cache = null;
}
