/**
 * GameStore — central match orchestrator.
 *
 * Responsibilities:
 *   - Own a mutable Position.
 *   - Maintain the state machine phase (IDLE / ANIMATING / THINKING).
 *   - Track ply count for retract semantics.
 *   - Emit GameEvents (see @jschess/engine) on every transition so
 *     presentation/audio layers can react without reaching into internals.
 *   - Drive the AIWorkerClient when it's the AI's turn.
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

type StateLabel = 'idle' | 'animating' | 'thinking';

function phaseLabel(phase: GamePhase): StateLabel {
  return phase.toLowerCase() as StateLabel;
}

export interface GameStoreOptions {
  readonly ai: AIWorkerClient;
  readonly initialFen?: string;
}

export class GameStore {
  private readonly _pos = new Position();
  private readonly _ai: AIWorkerClient;
  private readonly _bus = new EventBus();
  private _phase: GamePhase = GamePhase.IDLE;
  private _plies = 0;

  constructor(opts: GameStoreOptions) {
    this._ai = opts.ai;
    fromFen(this._pos, opts.initialFen ?? INITIAL_FEN, isChecked);
  }

  get state(): GameState {
    return {
      phase: this._phase,
      fen: toFen(this._pos),
      sideToMove: this._pos.sdPlayer === 0 ? 'RED' : 'BLACK',
      plies: this._plies,
    };
  }

  subscribe(handler: (event: GameEvent) => void): () => void {
    return this._bus.on(handler);
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
    this._emitMoveEvents(mv, captured !== 0);
    this._transition(GamePhase.IDLE);
  }

  retract(): void {
    if (this._plies === 0) return;
    this._pos.undoMakeMove();
    this._plies--;
    this._transition(GamePhase.IDLE);
    this._bus.emit({ type: 'moveApplied', mv: 0, capture: false, wav: WAV.MOVE });
  }

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
