/**
 * Wraps an AITransport with a Promise-based request/response API.
 * Correlates responses by their numeric id; rejects with typed GameError.
 */
import type { GameError } from '../errors';
import type { AIRequest, AIResponse } from './protocol';
import type { AITransport } from './transport';

type PendingEntry = {
  resolve: (mv: number) => void;
  reject: (err: GameError) => void;
  timer: ReturnType<typeof setTimeout>;
  millis: number;
};

export class AIWorkerClient {
  private readonly _transport: AITransport;
  private readonly _pending = new Map<number, PendingEntry>();
  private readonly _unsubscribe: () => void;
  private _nextId = 1;
  private _closed = false;

  constructor(transport: AITransport) {
    this._transport = transport;
    this._unsubscribe = transport.onMessage((resp) => this._onResponse(resp));
  }

  request(fen: string, millis: number): Promise<number> {
    if (this._closed) {
      const err: GameError = { kind: 'WorkerCrashed', message: 'transport closed' };
      return Promise.reject(err);
    }

    const id = this._nextId++;
    const req: AIRequest = { id, fen, millis };

    return new Promise<number>((resolve, reject) => {
      const timer = setTimeout(
        () => {
          this._pending.delete(id);
          const err: GameError = { kind: 'WorkerTimeout', millis };
          reject(err);
        },
        Math.max(millis + 1000, millis * 2),
      );

      this._pending.set(id, { resolve, reject, timer, millis });
      this._transport.send(req);
    });
  }

  close(): void {
    if (this._closed) return;
    this._closed = true;
    this._unsubscribe();
    for (const [, p] of this._pending) {
      clearTimeout(p.timer);
      p.reject({ kind: 'WorkerCrashed', message: 'transport closed' });
    }
    this._pending.clear();
    this._transport.close();
  }

  private _onResponse(resp: AIResponse): void {
    const p = this._pending.get(resp.id);
    if (p === undefined) return;

    this._pending.delete(resp.id);
    clearTimeout(p.timer);
    if ('mv' in resp) {
      p.resolve(resp.mv);
    } else {
      const err: GameError = { kind: 'WorkerCrashed', message: resp.error };
      p.reject(err);
    }
  }
}
