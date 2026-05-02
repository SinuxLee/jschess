import type { AIRequest, AIResponse, AITransport } from '@jschess/game';
import { isAIResponse } from '@jschess/game';

export class WorkerTransport implements AITransport {
  private readonly _worker: Worker;
  private readonly _handlers = new Set<(resp: AIResponse) => void>();
  private readonly _listener: (ev: MessageEvent) => void;
  private _closed = false;

  constructor(worker?: Worker) {
    this._worker =
      worker ??
      new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
        type: 'module',
      });
    this._listener = (ev: MessageEvent) => {
      const data: unknown = ev.data;
      if (!isAIResponse(data)) return;
      for (const h of this._handlers) h(data);
    };
    this._worker.addEventListener('message', this._listener);
  }

  send(req: AIRequest): void {
    if (this._closed) return;
    this._worker.postMessage(req);
  }

  onMessage(handler: (resp: AIResponse) => void): () => void {
    this._handlers.add(handler);
    return () => {
      this._handlers.delete(handler);
    };
  }

  close(): void {
    if (this._closed) return;
    this._closed = true;
    this._worker.removeEventListener('message', this._listener);
    this._handlers.clear();
    this._worker.terminate();
  }
}
