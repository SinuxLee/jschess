/**
 * Position — core board state.
 *
 * Responsibilities (kept minimal to retain high cohesion):
 *   1. Square storage (`squares: Uint8Array(256)`) + side to move.
 *   2. Incremental evaluation (`vlRed`, `vlBlack`) and Zobrist maintenance.
 *   3. Move execution / undo (with self-check validation via injected `checkedFn`).
 *   4. Null move support for search.
 *   5. Structured history stack for repetition detection.
 *
 * Non-responsibilities (handled elsewhere):
 *   - Move generation   → `../rules/movegen`
 *   - Evaluation scalar → `../rules/evaluate`
 *   - FEN I/O           → `../rules/fen`
 *
 * Ported from legacy/js/engine/position.js. The only semantic change is
 * `squares` being a `Uint8Array(256)` instead of `number[]`; piece codes
 * never exceed 22, which fits in a single byte.
 */
import { DYNAMIC_CHESS_VALUE } from '../primitives/tables';
import { ZOBRIST, zobristPcIdx } from '../primitives/zobrist';
import { flipSq } from '../primitives/coords';
import { moveSrc, moveDst } from '../primitives/move';

export interface MoveStackEntry {
  readonly mv: number;
  readonly captured: number;
  readonly prevKey: number;
  readonly prevLock: number;
  readonly inCheck: boolean;
}

export type CheckedFn = (pos: Position) => boolean;

export class Position {
  sdPlayer: 0 | 1 = 0;
  readonly squares: Uint8Array = new Uint8Array(256);
  vlRed = 0;
  vlBlack = 0;
  zobristKey = 0;
  zobristLock = 0;
  distance = 0;

  private _moveStack: MoveStackEntry[] = [
    { mv: 0, captured: 0, prevKey: 0, prevLock: 0, inCheck: false },
  ];

  addPiece(sq: number, pc: number, isDel: boolean): void {
    this.squares[sq] = isDel ? 0 : pc;
    const pcIdx = zobristPcIdx(pc);

    if (pc < 16) {
      const typeIdx = pc - 8;
      const tbl = DYNAMIC_CHESS_VALUE[typeIdx]!;
      this.vlRed += isDel ? -tbl[sq]! : tbl[sq]!;
    } else {
      const typeIdx = pc - 16;
      const tbl = DYNAMIC_CHESS_VALUE[typeIdx]!;
      const flipped = flipSq(sq);
      this.vlBlack += isDel ? -tbl[flipped]! : tbl[flipped]!;
    }

    this.zobristKey ^= ZOBRIST.keyTable[pcIdx]![sq]!;
    this.zobristLock ^= ZOBRIST.lockTable[pcIdx]![sq]!;
  }

  changeSide(): void {
    this.sdPlayer = (1 - this.sdPlayer) as 0 | 1;
    this.zobristKey ^= ZOBRIST.playerKey;
    this.zobristLock ^= ZOBRIST.playerLock;
  }

  private _movePiece(mv: number): number {
    const src = moveSrc(mv);
    const dst = moveDst(mv);
    const captured = this.squares[dst]!;
    if (captured > 0) {
      this.addPiece(dst, captured, true);
    }
    const moving = this.squares[src]!;
    this.addPiece(src, moving, true);
    this.addPiece(dst, moving, false);
    return captured;
  }

  private _undoMovePiece(mv: number, captured: number): void {
    const src = moveSrc(mv);
    const dst = moveDst(mv);
    const moving = this.squares[dst]!;
    this.addPiece(dst, moving, true);
    this.addPiece(src, moving, false);
    if (captured > 0) {
      this.addPiece(dst, captured, false);
    }
  }

  /**
   * Execute a move; returns `false` and leaves the Position untouched if
   * executing the move would leave the moving side in check.
   */
  makeMove(mv: number, checkedFn: CheckedFn): boolean {
    const prevKey = this.zobristKey;
    const prevLock = this.zobristLock;
    const captured = this._movePiece(mv);

    if (checkedFn(this)) {
      this._undoMovePiece(mv, captured);
      return false;
    }

    this.changeSide();
    const inCheck = checkedFn(this);

    this._moveStack.push({ mv, captured, prevKey, prevLock, inCheck });
    this.distance++;
    return true;
  }

  undoMakeMove(): void {
    this.distance--;
    const top = this._moveStack.pop()!;
    this.changeSide();
    this._undoMovePiece(top.mv, top.captured);
    this.zobristKey = top.prevKey;
    this.zobristLock = top.prevLock;
  }

  nullMove(_checkedFn: CheckedFn): void {
    const prevKey = this.zobristKey;
    const prevLock = this.zobristLock;
    this.changeSide();
    this._moveStack.push({ mv: 0, captured: 0, prevKey, prevLock, inCheck: false });
    this.distance++;
  }

  undoNullMove(): void {
    this.distance--;
    const top = this._moveStack.pop()!;
    this.changeSide();
    this.zobristKey = top.prevKey;
    this.zobristLock = top.prevLock;
  }

  inCheck(): boolean {
    return this._moveStack[this._moveStack.length - 1]!.inCheck;
  }

  captured(): boolean {
    return this._moveStack[this._moveStack.length - 1]!.captured > 0;
  }

  get moveStack(): readonly MoveStackEntry[] {
    return this._moveStack;
  }

  setIrrev(inCheck: boolean): void {
    this._moveStack = [{ mv: 0, captured: 0, prevKey: 0, prevLock: 0, inCheck }];
    this.distance = 0;
  }

  clearBoard(): void {
    this.sdPlayer = 0;
    this.squares.fill(0);
    this.vlRed = 0;
    this.vlBlack = 0;
    this.zobristKey = 0;
    this.zobristLock = 0;
  }
}
