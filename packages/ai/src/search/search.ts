/**
 * Alpha-beta search engine.
 * Ported from legacy/js/ai/search.js.
 *
 * Uses iterative deepening, transposition table, null-move pruning,
 * move ordering (hashMove > MVV captures > killers > history), and
 * quiescence search on captures only. Stateless between calls — the
 * caller holds the Position; the Search only owns its hash + history.
 */
import {
  MATE_VALUE,
  WIN_VALUE,
  NULL_OKAY_MARGIN,
  NULL_SAFE_MARGIN,
  generateMoves,
  isChecked,
  evaluate,
  repValue,
  mateValue,
  type Position,
} from '@jschess/engine';
import { HashTable, HASH_ALPHA, HASH_BETA, HASH_EXACT } from './hashtable';
import { MoveSort, HistoryTable } from './movesort';

const LIMIT_DEPTH = 64;

export class Search {
  private readonly _pos: Position;
  private readonly _hash = new HashTable();
  private readonly _history = new HistoryTable();
  private readonly _killers: Array<[number, number]>;
  bestMove = 0;

  constructor(pos: Position) {
    this._pos = pos;
    this._killers = [];
    for (let i = 0; i < LIMIT_DEPTH; i++) this._killers.push([0, 0]);
  }

  searchMain(maxDepth: number, millis?: number): number {
    this.bestMove = 0;
    let vl = 0;
    const limit = maxDepth || LIMIT_DEPTH;
    const deadline = millis !== undefined && millis > 0 ? Date.now() + millis : Infinity;
    this._hash.clear();
    this._history.clear();
    for (let i = 0; i < LIMIT_DEPTH; i++) {
      this._killers[i]![0] = 0;
      this._killers[i]![1] = 0;
    }
    this._pos.distance = 0;
    for (let depth = 1; depth <= limit; depth++) {
      vl = this._searchRoot(depth);
      if (vl > WIN_VALUE || vl < -WIN_VALUE) break;
      if (Date.now() >= deadline) break;
      this._history.decay();
    }
    return vl;
  }

  private _searchRoot(depth: number): number {
    const pos = this._pos;
    let alpha = -MATE_VALUE;
    const beta = MATE_VALUE;
    const hashResult = this._hash.get(
      pos.zobristKey,
      pos.zobristLock,
      depth,
      alpha,
      beta,
      pos.distance,
    );
    const moves = generateMoves(pos);
    const sort = new MoveSort(
      moves,
      pos,
      hashResult.mv,
      this._killers[pos.distance]!,
      this._history.table,
    );
    let bestMove = 0;
    let mv: number;
    while ((mv = sort.next()) !== -1) {
      if (!pos.makeMove(mv, isChecked)) continue;
      const vl = -this._searchFull(-beta, -alpha, depth - 1, false);
      pos.undoMakeMove();
      if (vl > alpha) {
        alpha = vl;
        bestMove = mv;
        if (alpha >= beta) break;
      }
    }
    if (bestMove !== 0) {
      this.bestMove = bestMove;
      this._hash.set(
        pos.zobristKey,
        pos.zobristLock,
        depth,
        HASH_EXACT,
        alpha,
        bestMove,
        pos.distance,
      );
    }
    return alpha;
  }

  private _searchFull(alphaIn: number, beta: number, depthIn: number, nullOk: boolean): number {
    const pos = this._pos;
    let alpha = alphaIn;
    let depth = depthIn;
    if (depth <= 0) return this._searchQuiet(alpha, beta);
    const rep = repValue(pos);
    if (rep !== 0) return rep;
    const hashResult = this._hash.get(
      pos.zobristKey,
      pos.zobristLock,
      depth,
      alpha,
      beta,
      pos.distance,
    );
    if (hashResult.hit) return hashResult.vl;
    if (nullOk && !pos.inCheck() && pos.distance > 0) {
      const vlNull = evaluate(pos);
      if (vlNull >= beta + NULL_OKAY_MARGIN) {
        pos.nullMove(isChecked);
        const vl = -this._searchFull(-beta, 1 - beta, depth - 3, false);
        pos.undoNullMove();
        if (vl >= beta) {
          if (vl >= WIN_VALUE) return beta;
          if (vlNull >= beta + NULL_SAFE_MARGIN) return vl;
          depth--;
        }
      }
    }
    const moves = generateMoves(pos);
    const sort = new MoveSort(
      moves,
      pos,
      hashResult.mv,
      this._killers[pos.distance]!,
      this._history.table,
    );
    let hashFlag = HASH_ALPHA;
    let bestMove = 0;
    let bestVl = -MATE_VALUE;
    let mv: number;
    while ((mv = sort.next()) !== -1) {
      if (!pos.makeMove(mv, isChecked)) continue;
      const vl = -this._searchFull(-beta, -alpha, depth - 1, true);
      pos.undoMakeMove();
      if (vl > bestVl) {
        bestVl = vl;
        if (vl >= beta) {
          hashFlag = HASH_BETA;
          bestMove = mv;
          if (pos.squares[mv >> 8]! === 0) {
            const k = this._killers[pos.distance]!;
            if (k[0] !== mv) {
              k[1] = k[0]!;
              k[0] = mv;
            }
          }
          this._history.add(mv, depth);
          break;
        }
        if (vl > alpha) {
          hashFlag = HASH_EXACT;
          alpha = vl;
          bestMove = mv;
        }
      }
    }
    if (bestVl === -MATE_VALUE) return mateValue(pos);
    this._hash.set(
      pos.zobristKey,
      pos.zobristLock,
      depth,
      hashFlag,
      bestVl,
      bestMove,
      pos.distance,
    );
    return bestVl;
  }

  private _searchQuiet(alphaIn: number, beta: number): number {
    const pos = this._pos;
    let alpha = alphaIn;
    const rep = repValue(pos);
    if (rep !== 0) return rep;
    let vl = evaluate(pos);
    if (vl >= beta) return vl;
    if (vl > alpha) alpha = vl;
    const allMoves = generateMoves(pos);
    const capMoves = allMoves.filter((mv) => pos.squares[mv >> 8]! !== 0);
    capMoves.sort((a, b) => (pos.squares[b >> 8]! & 7) - (pos.squares[a >> 8]! & 7));
    for (const mv of capMoves) {
      if (!pos.makeMove(mv, isChecked)) continue;
      const childVl = -this._searchQuiet(-beta, -alpha);
      pos.undoMakeMove();
      if (childVl > vl) {
        vl = childVl;
        if (vl >= beta) return vl;
        if (vl > alpha) alpha = vl;
      }
    }
    return vl;
  }
}
