/**
 * Book probing: weighted-random move selection.
 *
 * The legacy engine didn't use the zobristLock at all (collisions on the low
 * 32 bits are rare but possible). Our port is strict: we require the caller
 * to have loaded the book via loadBook() keyed by zobristKey only. A future
 * enhancement can promote the book format to 64-bit keys; for now we match
 * legacy behaviour exactly so the parity test passes.
 */
import { MOVE_NONE, type Position } from '@jschess/engine';
import { loadBook } from './loader';

let _state = (Date.now() ^ 0x9e3779b9) >>> 0;

export function resetProbeRng(seed: number): void {
  _state = (seed >>> 0) || 1;
}

function _rand(): number {
  let x = _state;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  _state = x >>> 0;
  return _state;
}

export async function probeBook(pos: Position): Promise<number> {
  const book = await loadBook();
  const entries = book.get(pos.zobristKey);
  if (entries === undefined || entries.length === 0) return MOVE_NONE;

  let total = 0;
  for (const e of entries) total += e.weight;
  if (total <= 0) return MOVE_NONE;

  let pick = _rand() % total;
  for (const e of entries) {
    if (pick < e.weight) return e.mv;
    pick -= e.weight;
  }
  return entries[entries.length - 1]!.mv;
}
