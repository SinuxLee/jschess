import { describe, it, expect } from 'vitest';
import { HashTable, HASH_ALPHA, HASH_BETA, HASH_EXACT } from './hashtable';

describe('HashTable', () => {
  it('get on empty slot returns hit=false', () => {
    const h = new HashTable();
    const r = h.get(1, 1, 10, -100, 100, 0);
    expect(r.hit).toBe(false);
    expect(r.mv).toBe(0);
  });

  it('set then get returns stored entry when depth is sufficient', () => {
    const h = new HashTable();
    h.set(42, 7, 10, HASH_EXACT, 500, 0x1234, 0);
    const r = h.get(42, 7, 10, -1000, 1000, 0);
    expect(r.hit).toBe(true);
    expect(r.vl).toBe(500);
    expect(r.mv).toBe(0x1234);
  });

  it('get returns hit=false when depth is insufficient, but still provides mv hint', () => {
    const h = new HashTable();
    h.set(42, 7, 5, HASH_EXACT, 500, 0x1234, 0);
    const r = h.get(42, 7, 10, -1000, 1000, 0);
    expect(r.hit).toBe(false);
    expect(r.mv).toBe(0x1234);
  });

  it('HASH_ALPHA only hits when stored vl <= alpha window', () => {
    const h = new HashTable();
    h.set(42, 7, 10, HASH_ALPHA, -50, 0, 0);
    const okHit = h.get(42, 7, 10, -50, 100, 0);
    expect(okHit.hit).toBe(true);
    expect(okHit.vl).toBe(-50);
    const noHit = h.get(42, 7, 10, -100, 100, 0);
    expect(noHit.hit).toBe(false);
  });

  it('HASH_BETA only hits when stored vl >= beta window', () => {
    const h = new HashTable();
    h.set(42, 7, 10, HASH_BETA, 150, 0, 0);
    const okHit = h.get(42, 7, 10, -100, 100, 0);
    expect(okHit.hit).toBe(true);
    expect(okHit.vl).toBe(100);
    const noHit = h.get(42, 7, 10, -100, 200, 0);
    expect(noHit.hit).toBe(false);
  });

  it('depth-preferred replacement: do not overwrite deeper entry', () => {
    const h = new HashTable();
    h.set(42, 7, 10, HASH_EXACT, 500, 0x1111, 0);
    h.set(42, 7, 5, HASH_EXACT, 999, 0x2222, 0);
    const r = h.get(42, 7, 10, -1000, 1000, 0);
    expect(r.vl).toBe(500);
    expect(r.mv).toBe(0x1111);
  });

  it('clear empties the table', () => {
    const h = new HashTable();
    h.set(42, 7, 10, HASH_EXACT, 500, 0x1234, 0);
    h.clear();
    const r = h.get(42, 7, 10, -1000, 1000, 0);
    expect(r.hit).toBe(false);
    expect(r.mv).toBe(0);
  });
});
