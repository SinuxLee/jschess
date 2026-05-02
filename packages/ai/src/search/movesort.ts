/**
 * Move ordering for alpha-beta search.
 * Ported from legacy/js/ai/movesort.js.
 *
 * Priority (high → low):
 *   1. hashMove         — transposition-table best
 *   2. captures (MVV)   — most-valuable-victim
 *   3. killer 0, 1      — non-captures that caused beta cutoff at same ply
 *   4. history heuristic
 *   5. everything else
 */
import { MVV_VALUE, oppTag, moveDst, type Position } from '@jschess/engine';

export class MoveSort {
  private readonly _scores: Int32Array;
  private readonly _moves: number[];

  constructor(
    moves: number[],
    pos: Position,
    hashMove: number,
    killers: readonly [number, number] | number[],
    history: Int32Array,
  ) {
    this._scores = new Int32Array(moves.length);
    this._moves = moves;

    const sqOpp = oppTag(pos.sdPlayer);

    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]!;
      const dst = moveDst(mv);

      if (mv === hashMove) {
        this._scores[i] = 0x7fffffff;
      } else {
        const target = pos.squares[dst]!;
        if ((target & sqOpp) !== 0) {
          this._scores[i] = 0x100000 + MVV_VALUE[target & 7]!;
        } else if (mv === killers[0]) {
          this._scores[i] = 0x80000;
        } else if (mv === killers[1]) {
          this._scores[i] = 0x40000;
        } else {
          this._scores[i] = history[mv & 0xffff] ?? 0;
        }
      }
    }
  }

  next(): number {
    if (this._moves.length === 0) return -1;

    let bestIdx = 0;
    for (let i = 1; i < this._moves.length; i++) {
      if (this._scores[i]! > this._scores[bestIdx]!) bestIdx = i;
    }

    const mv = this._moves[bestIdx]!;
    const lastIdx = this._moves.length - 1;
    this._moves[bestIdx] = this._moves[lastIdx]!;
    this._scores[bestIdx] = this._scores[lastIdx]!;
    this._moves.length--;

    return mv;
  }
}

export class HistoryTable {
  private readonly _table = new Int32Array(65536);

  clear(): void {
    this._table.fill(0);
  }

  decay(): void {
    for (let i = 0; i < this._table.length; i++) {
      this._table[i] = this._table[i]! >> 1;
    }
  }

  add(mv: number, depth: number): void {
    const idx = mv & 0xffff;
    this._table[idx] = this._table[idx]! + (1 << depth);
  }

  get(mv: number): number {
    return this._table[mv & 0xffff]!;
  }

  get table(): Int32Array {
    return this._table;
  }
}
