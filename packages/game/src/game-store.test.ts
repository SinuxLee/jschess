import { describe, it, expect } from 'vitest';
import { GameStore } from './game-store';
import { GamePhase } from './state';
import { AIWorkerClient } from './ai-client/worker-client';
import type { AITransport } from './ai-client/transport';
import type { AIRequest, AIResponse } from './ai-client/protocol';
import { makeCoord, makeMove } from '@jschess/engine';

class AlwaysMv implements AITransport {
  private _handler: ((r: AIResponse) => void) | null = null;
  constructor(private readonly _mv: number) {}
  send(req: AIRequest): void {
    queueMicrotask(() => this._handler?.({ id: req.id, mv: this._mv }));
  }
  onMessage(h: (r: AIResponse) => void): () => void {
    this._handler = h;
    return () => { this._handler = null; };
  }
  close(): void { this._handler = null; }
}

function buildStore(): { store: GameStore; transport: AlwaysMv } {
  const transport = new AlwaysMv(0);
  const client = new AIWorkerClient(transport);
  const store = new GameStore({ ai: client });
  return { store, transport };
}

describe('GameStore', () => {
  it('starts in IDLE on the initial FEN', () => {
    const { store } = buildStore();
    expect(store.state.phase).toBe(GamePhase.IDLE);
    expect(store.state.plies).toBe(0);
    expect(store.state.fen.startsWith('rnbakabnr')).toBe(true);
  });

  it('applyHumanMove on a legal move transitions IDLE → ANIMATING → IDLE and emits moveApplied', async () => {
    const { store } = buildStore();
    const types: string[] = [];
    store.subscribe((e) => types.push(e.type));

    const src = makeCoord(3, 9);
    const dst = makeCoord(3, 8);
    const ok = await store.applyHumanMove(makeMove(src, dst));
    expect(ok).toBe(true);
    expect(types).toContain('moveApplied');
    expect(store.state.phase).toBe(GamePhase.IDLE);
    expect(store.state.plies).toBe(1);
  });

  it('applyHumanMove rejects an illegal move and emits illegalAttempt', async () => {
    const { store } = buildStore();
    const types: string[] = [];
    store.subscribe((e) => types.push(e.type));

    const src = makeCoord(3, 9);
    const dst = makeCoord(3, 5);
    const ok = await store.applyHumanMove(makeMove(src, dst));
    expect(ok).toBe(false);
    expect(types).toContain('illegalAttempt');
  });

  it('retract undoes the last ply and reverts phase to IDLE', async () => {
    const { store } = buildStore();
    await store.applyHumanMove(makeMove(makeCoord(3, 9), makeCoord(3, 8)));
    expect(store.state.plies).toBe(1);
    store.retract();
    expect(store.state.plies).toBe(0);
    expect(store.state.phase).toBe(GamePhase.IDLE);
  });

  it('requestAiMove transitions IDLE → THINKING → ANIMATING → IDLE', async () => {
    const mv = 147 | (131 << 8);
    const transport = new AlwaysMv(mv);
    const client = new AIWorkerClient(transport);
    const store = new GameStore({ ai: client });

    const states: string[] = [];
    store.subscribe((e) => { if (e.type === 'stateChanged') states.push(e.state); });

    await store.requestAiMove(500);
    expect(states).toContain('thinking');
    expect(states).toContain('animating');
    expect(store.state.phase).toBe(GamePhase.IDLE);
    expect(store.state.plies).toBe(1);
  });

  it('sideToMove flips after a move', async () => {
    const { store } = buildStore();
    expect(store.state.sideToMove).toBe('RED');
    await store.applyHumanMove(makeMove(makeCoord(3, 9), makeCoord(3, 8)));
    expect(store.state.sideToMove).toBe('BLACK');
  });

  it('requestAiMove: transport error rolls back to IDLE and rethrows', async () => {
    class ErrorTransport implements AITransport {
      private _handler: ((r: AIResponse) => void) | null = null;
      send(req: AIRequest): void {
        queueMicrotask(() => this._handler?.({ id: req.id, error: 'worker crashed' }));
      }
      onMessage(h: (r: AIResponse) => void): () => void {
        this._handler = h;
        return () => { this._handler = null; };
      }
      close(): void { this._handler = null; }
    }
    const store = new GameStore({ ai: new AIWorkerClient(new ErrorTransport()) });
    await expect(store.requestAiMove(100)).rejects.toMatchObject({ kind: 'WorkerCrashed' });
    expect(store.state.phase).toBe(GamePhase.IDLE);
  });

  it('requestAiMove: AI returns mv=0 resolves, emits illegalAttempt, phase returns to IDLE', async () => {
    const store = new GameStore({ ai: new AIWorkerClient(new AlwaysMv(0)) });
    const types: string[] = [];
    store.subscribe((e) => types.push(e.type));
    await store.requestAiMove(100);
    expect(types).toContain('illegalAttempt');
    expect(store.state.phase).toBe(GamePhase.IDLE);
  });
});
