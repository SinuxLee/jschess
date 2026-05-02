/**
 * GameStore — central match orchestrator.
 *
 * Responsibilities:
 *   - Own a mutable Position.
 *   - Maintain the state machine phase (IDLE / ANIMATING / THINKING).
 *   - Track ply count + full move history (for jump-to-ply).
 *   - Emit GameEvents on every transition so presentation/audio
 *     layers react without reaching into internals.
 *   - Drive the AIWorkerClient when it's the AI's turn.
 *   - Own match-level preferences (mode / level / handicap / animated)
 *     so UI controls are purely declarative.
 *
 * NOT responsible for: rendering, audio playback, worker lifecycle,
 * view-specific coordinate transforms.
 */
import {
  Position,
  fromFen,
  toFen,
  isChecked,
  generateMoves,
  moveDst,
  moveSrc,
  WAV,
  type GameEvent,
} from '@jschess/engine';
import { EventBus } from './events';
import { GamePhase, canTransition, type GameState } from './state';
import { AIWorkerClient } from './ai-client/worker-client';

const INITIAL_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

/**
 * Four startup positions matching legacy's handicap menu.
 * Index aligns with Handicap enum: 0=none, 1=left-horse, 2=both-horses, 3=nine-piece.
 */
export const STARTUP_FEN: readonly [string, string, string, string] = [
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w - - 0 1',
];

export type AIMode = 0 | 1 | 2 | 3;
export type Level = 0 | 1 | 2;
export type Handicap = 0 | 1 | 2 | 3;

type StateLabel = 'idle' | 'animating' | 'thinking';

function phaseLabel(phase: GamePhase): StateLabel {
  return phase.toLowerCase() as StateLabel;
}

/**
 * Maps legacy mode index → `computer` (which side the AI plays):
 *   0 "我先走"   → 1 (AI plays black)
 *   1 "电脑先走" → 0 (AI plays red; board flips in UI)
 *   2 "不用电脑" → -1 (no AI)
 *   3 "双机对弈" → 2 (AI plays both sides)
 */
function computerFromMode(mode: AIMode): -1 | 0 | 1 | 2 {
  switch (mode) {
    case 0: return 1;
    case 1: return 0;
    case 2: return -1;
    case 3: return 2;
  }
}

export interface GameStoreOptions {
  readonly ai: AIWorkerClient;
  readonly initialFen?: string;
  readonly mode?: AIMode;
  readonly level?: Level;
  readonly handicap?: Handicap;
  readonly animated?: boolean;
}

export interface GameStoreSnapshot extends GameState {
  readonly mode: AIMode;
  readonly level: Level;
  readonly handicap: Handicap;
  readonly animated: boolean;
  /** -1 no-AI, 0 AI red, 1 AI black, 2 dual-AI. */
  readonly computer: -1 | 0 | 1 | 2;
}

export class GameStore {
  private readonly _pos = new Position();
  private readonly _ai: AIWorkerClient;
  private readonly _bus = new EventBus();
  private _phase: GamePhase = GamePhase.IDLE;
  private _plies = 0;
  /** Ordered move history (length === _plies after every stable point). */
  private _history: number[] = [];
  private _mode: AIMode = 0;
  private _level: Level = 0;
  private _handicap: Handicap = 0;
  private _animated = true;

  constructor(opts: GameStoreOptions) {
    this._ai = opts.ai;
    this._mode = opts.mode ?? 0;
    this._level = opts.level ?? 0;
    this._handicap = opts.handicap ?? 0;
    this._animated = opts.animated ?? true;
    fromFen(this._pos, opts.initialFen ?? INITIAL_FEN, isChecked);
  }

  get state(): GameStoreSnapshot {
    return {
      phase: this._phase,
      fen: toFen(this._pos),
      sideToMove: this._pos.sdPlayer === 0 ? 'RED' : 'BLACK',
      plies: this._plies,
      mode: this._mode,
      level: this._level,
      handicap: this._handicap,
      animated: this._animated,
      computer: this._computer,
    };
  }

  subscribe(handler: (event: GameEvent) => void): () => void {
    return this._bus.on(handler);
  }

  // --- match setup -------------------------------------------------------

  setMode(mode: AIMode): void { this._mode = mode; }
  setLevel(level: Level): void { this._level = level; }
  setHandicap(handicap: Handicap): void { this._handicap = handicap; }
  setAnimated(on: boolean): void { this._animated = on; }

  private get _computer(): -1 | 0 | 1 | 2 {
    return computerFromMode(this._mode);
  }

  /** True when the current side-to-move is the AI (including dual-AI). */
  shouldAIMove(): boolean {
    const c = this._computer;
    if (c === 2) return true;
    if (c === -1) return false;
    return this._pos.sdPlayer === c;
  }

  /** Thinking-time budget in ms derived from level (10 / 100 / 1000). */
  get aiMillis(): number {
    return Math.pow(10, this._level + 1);
  }

  // --- actions -----------------------------------------------------------

  /**
   * Restart the game. If `fen` omitted, uses the handicap startup FEN.
   * Emits `{type:'restart', fen, wav:NEWGAME}` for audio cueing.
   */
  restart(fen?: string): void {
    const startup = fen ?? STARTUP_FEN[this._handicap];
    fromFen(this._pos, startup, isChecked);
    this._plies = 0;
    this._history = [];
    this._phase = GamePhase.IDLE;
    this._bus.emit({ type: 'stateChanged', state: phaseLabel(this._phase) });
    this._bus.emit({ type: 'restart', fen: toFen(this._pos), wav: WAV.NEWGAME });
  }

  /** Play a CLICK cue + announce selection; no board mutation. */
  select(sq: number): void {
    this._bus.emit({ type: 'select', sq, wav: WAV.CLICK });
  }

  async applyHumanMove(mv: number): Promise<boolean> {
    if (this._phase !== GamePhase.IDLE) return false;

    if (!this._isLegal(mv)) {
      this._bus.emit({ type: 'illegalAttempt', reason: 'illegal move', wav: WAV.ILLEGAL });
      return false;
    }

    this._transition(GamePhase.ANIMATING);
    const captured = this._pos.squares[moveDst(mv)] ?? 0;
    const applied = this._pos.makeMove(mv, isChecked);
    if (!applied) {
      this._transition(GamePhase.IDLE);
      this._bus.emit({ type: 'illegalAttempt', reason: 'self-check', wav: WAV.ILLEGAL });
      return false;
    }

    this._plies++;
    this._history.push(mv);
    this._emitMoveEvents(mv, captured !== 0);
    this._transition(GamePhase.IDLE);
    return true;
  }

  async requestAiMove(millis: number): Promise<void> {
    if (this._phase !== GamePhase.IDLE) return;
    this._transition(GamePhase.THINKING);
    const fen = toFen(this._pos);
    let mv: number;
    try {
      mv = await this._ai.request(fen, millis);
    } catch (err) {
      this._transition(GamePhase.IDLE);
      throw err;
    }
    if (mv === 0 || !this._isLegal(mv)) {
      this._transition(GamePhase.IDLE);
      this._bus.emit({ type: 'illegalAttempt', reason: 'ai returned illegal move', wav: WAV.ILLEGAL });
      return;
    }

    this._transition(GamePhase.ANIMATING);
    const captured = this._pos.squares[moveDst(mv)] ?? 0;
    this._pos.makeMove(mv, isChecked);
    this._plies++;
    this._history.push(mv);
    this._emitMoveEvents(mv, captured !== 0);
    this._transition(GamePhase.IDLE);
  }

  /**
   * If it's the AI's turn (per mode + side-to-move) and we're IDLE,
   * fire requestAiMove with the level-derived millis budget. No-op otherwise.
   * Safe to call after every applyHumanMove / restart.
   */
  async triggerAIResponse(): Promise<void> {
    if (this._phase !== GamePhase.IDLE) return;
    if (!this.shouldAIMove()) return;
    await this.requestAiMove(this.aiMillis);
  }

  /**
   * Retract the last human ply. If the AI is the next mover (i.e. the AI just
   * replied after the human's last move), undo BOTH plies so the human can
   * re-try their move. Mirrors legacy board.js retract().
   */
  retract(): void {
    if (this._plies === 0) return;
    if (this._phase !== GamePhase.IDLE) return;

    this._pos.undoMakeMove();
    this._plies--;
    this._history.pop();

    // If the AI was about to move next, that implies the AI just moved and
    // the turn has flipped back to the human. Undo the AI's move too.
    if (this._plies > 0 && this.shouldAIMove()) {
      this._pos.undoMakeMove();
      this._plies--;
      this._history.pop();
    }

    this._bus.emit({ type: 'retract', plies: this._plies });
    // Legacy mv=0 sentinel for MoveList consumers still using the old pattern.
    this._bus.emit({ type: 'moveApplied', mv: 0, capture: false, wav: WAV.MOVE });
  }

  /**
   * Jump to the board state after exactly `targetPlies` plies have been
   * played. Used by MoveList click-to-rewind. Undoes back to the start, then
   * replays the first `targetPlies` moves from history. Clamps to
   * [0, current plies] and no-ops outside IDLE.
   */
  jumpToPly(targetPlies: number): void {
    if (this._phase !== GamePhase.IDLE) return;
    const target = Math.max(0, Math.min(targetPlies, this._plies));
    if (target === this._plies) return;

    while (this._plies > 0) {
      this._pos.undoMakeMove();
      this._plies--;
    }
    const replay = this._history.slice(0, target);
    this._history = [];
    for (const mv of replay) {
      if (!this._pos.makeMove(mv, isChecked)) break;
      this._plies++;
      this._history.push(mv);
    }
    this._bus.emit({ type: 'retract', plies: this._plies });
    this._bus.emit({ type: 'moveApplied', mv: 0, capture: false, wav: WAV.MOVE });
  }

  // --- private -----------------------------------------------------------

  private _emitMoveEvents(mv: number, capture: boolean): void {
    const wav = capture ? WAV.CAPTURE : WAV.MOVE;
    this._bus.emit({ type: 'moveApplied', mv, capture, wav });
    if (capture) this._bus.emit({ type: 'capture', mv, wav: WAV.CAPTURE });
    if (this._pos.inCheck()) {
      const sideToMove = this._pos.sdPlayer as 0 | 1;
      if (this._isMated()) {
        const winner: 0 | 1 = sideToMove === 0 ? 1 : 0;
        this._bus.emit({ type: 'mate', winner, wav: WAV.MATE });
      } else {
        this._bus.emit({ type: 'check', side: sideToMove, wav: WAV.CHECK });
      }
    }
  }

  private _transition(next: GamePhase): void {
    if (this._phase === next) return;
    if (!canTransition(this._phase, next)) {
      throw new Error(`illegal transition ${this._phase} -> ${next}`);
    }
    this._phase = next;
    this._bus.emit({ type: 'stateChanged', state: phaseLabel(next) });
  }

  private _isLegal(mv: number): boolean {
    const src = moveSrc(mv);
    const dst = moveDst(mv);
    if (mv === 0 || src === dst) return false;
    const moves = generateMoves(this._pos);
    if (!moves.includes(mv)) return false;
    const ok = this._pos.makeMove(mv, isChecked);
    if (!ok) return false;
    this._pos.undoMakeMove();
    return true;
  }

  private _isMated(): boolean {
    const moves = generateMoves(this._pos);
    for (const mv of moves) {
      if (this._pos.makeMove(mv, isChecked)) {
        this._pos.undoMakeMove();
        return false;
      }
    }
    return true;
  }
}
