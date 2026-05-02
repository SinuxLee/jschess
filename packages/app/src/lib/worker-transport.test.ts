import { describe, it, expect, vi } from 'vitest';
import type { AIRequest, AIResponse } from '@jschess/game';
import { WorkerTransport } from './worker-transport';

class FakeWorker {
  posted: AIRequest[] = [];
  listeners = new Set<(e: MessageEvent) => void>();
  terminated = false;
  addEventListener(kind: string, fn: (e: MessageEvent) => void): void {
    if (kind !== 'message') throw new Error(`unexpected kind: ${kind}`);
    this.listeners.add(fn);
  }
  removeEventListener(kind: string, fn: (e: MessageEvent) => void): void {
    if (kind !== 'message') throw new Error(`unexpected kind: ${kind}`);
    this.listeners.delete(fn);
  }
  postMessage(req: AIRequest): void {
    this.posted.push(req);
  }
  terminate(): void {
    this.terminated = true;
  }
  dispatch(resp: AIResponse): void {
    const ev = { data: resp } as MessageEvent;
    for (const fn of this.listeners) fn(ev);
  }
}

describe('WorkerTransport', () => {
  it('forwards send and delivers responses to subscribers', () => {
    const worker = new FakeWorker();
    const t = new WorkerTransport(worker as unknown as Worker);
    const handler = vi.fn();
    const unsub = t.onMessage(handler);

    t.send({ id: 1, fen: 'F', millis: 10 });
    expect(worker.posted).toEqual([{ id: 1, fen: 'F', millis: 10 }]);

    worker.dispatch({ id: 1, mv: 42 });
    expect(handler).toHaveBeenCalledWith({ id: 1, mv: 42 });

    unsub();
    worker.dispatch({ id: 2, mv: 99 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('close() terminates worker and clears handlers', () => {
    const worker = new FakeWorker();
    const t = new WorkerTransport(worker as unknown as Worker);
    const handler = vi.fn();
    t.onMessage(handler);

    t.close();
    expect(worker.terminated).toBe(true);
    expect(worker.listeners.size).toBe(0);

    worker.dispatch({ id: 1, mv: 1 });
    expect(handler).not.toHaveBeenCalled();
  });
});
