/**
 * Transposition table.
 * Ported from legacy/js/ai/hashtable.js.
 *
 * Design: six parallel typed arrays indexed by `key & HASH_MASK`, so each slot
 * is {key, lock, depth, flag, vl, mv}. Depth-preferred replacement keeps the
 * deeper (more expensive) entry when collisions occur. Mate-distance is
 * normalised on store and restored on load.
 */
import { MATE_VALUE } from '@jschess/engine';

export const HASH_ALPHA = 1;
export const HASH_BETA = 2;
export const HASH_EXACT = 3;

const HASH_SIZE = 1 << 20;
const HASH_MASK = HASH_SIZE - 1;

export interface HashGetResult {
  readonly hit: boolean;
  readonly vl: number;
  readonly mv: number;
}

export class HashTable {
  private readonly _key = new Int32Array(HASH_SIZE);
  private readonly _lock = new Int32Array(HASH_SIZE);
  private readonly _depth = new Int8Array(HASH_SIZE);
  private readonly _flag = new Int8Array(HASH_SIZE);
  private readonly _vl = new Int16Array(HASH_SIZE);
  private readonly _mv = new Int32Array(HASH_SIZE);

  clear(): void {
    this._key.fill(0);
    this._lock.fill(0);
    this._depth.fill(0);
    this._flag.fill(0);
    this._vl.fill(0);
    this._mv.fill(0);
  }

  set(
    key: number,
    lock: number,
    depth: number,
    flag: number,
    vl: number,
    mv: number,
    distance: number,
  ): void {
    const idx = key & HASH_MASK;
    if (this._depth[idx]! > depth) return;
    this._key[idx] = key;
    this._lock[idx] = lock;
    this._depth[idx] = depth;
    this._flag[idx] = flag;
    this._mv[idx] = mv;
    this._vl[idx] = _adjustVlStore(vl, distance);
  }

  get(
    key: number,
    lock: number,
    depth: number,
    alpha: number,
    beta: number,
    distance: number,
  ): HashGetResult {
    const idx = key & HASH_MASK;
    if (this._key[idx]! !== key || this._lock[idx]! !== lock) {
      return { hit: false, vl: 0, mv: 0 };
    }

    const mv = this._mv[idx]!;
    const flag = this._flag[idx]!;
    const vl = _adjustVlLoad(this._vl[idx]!, distance);

    if (this._depth[idx]! >= depth) {
      if (flag === HASH_EXACT) return { hit: true, vl, mv };
      if (flag === HASH_ALPHA && vl <= alpha) return { hit: true, vl: alpha, mv };
      if (flag === HASH_BETA && vl >= beta) return { hit: true, vl: beta, mv };
    }

    return { hit: false, vl: 0, mv };
  }
}

function _adjustVlStore(vl: number, distance: number): number {
  if (vl > MATE_VALUE - 100) return vl + distance;
  if (vl < -(MATE_VALUE - 100)) return vl - distance;
  return vl;
}

function _adjustVlLoad(vl: number, distance: number): number {
  if (vl > MATE_VALUE - 100) return vl - distance;
  if (vl < -(MATE_VALUE - 100)) return vl + distance;
  return vl;
}
