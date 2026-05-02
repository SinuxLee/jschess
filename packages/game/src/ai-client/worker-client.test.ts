import { describe, it, expect } from 'vitest';
import { AIWorkerClient } from './worker-client';
import type { AITransport } from './transport';
import type { AIRequest, AIResponse } from './protocol';

class FakeTransport implements AITransport {
  sent: AIRequest[] = [];
  private _handler: ((r: AIResponse) => void) | null = null;
  private _closed = false;

  send(req: AIRequest): void {
    if (this._closed) throw new Error('closed');
    this.sent.push(req);
  }

  onMessage(h: (r: AIResponse) => void): () => void {
    this._handler = h;
    return () => {
      if (this._handler === h) this._handler = null;
    };
  }

  close(): void {
    this._closed = true;
    this._handler = null;
  }

  emit(r: AIResponse): void {
    this._handler?.(r);
  }
}

describe('AIWorkerClient', () => {
  it('request(fen, millis) resolves with the matching mv', async () => {
    const t = new FakeTransport();
    const c = new AIWorkerClient(t);
    const p = c.request('start-fen', 500);

    expect(t.sent.length).toBe(1);
    expect(t.sent[0]!.fen).toBe('start-fen');
    expect(t.sent[0]!.millis).toBe(500);
    const id = t.sent[0]!.id;

    t.emit({ id, mv: 0xabcd });
    await expect(p).resolves.toBe(0xabcd);
  });

  it('request rejects with the worker-supplied error', async () => {
    const t = new FakeTransport();
    const c = new AIWorkerClient(t);
    const p = c.request('x', 100);
    const id = t.sent[0]!.id;
    t.emit({ id, error: 'boom' });
    await expect(p).rejects.toMatchObject({ kind: 'WorkerCrashed', message: 'boom' });
  });

  it('unrelated responses are ignored', async () => {
    const t = new FakeTransport();
    const c = new AIWorkerClient(t);
    const p = c.request('a', 100);
    const id = t.sent[0]!.id;
    t.emit({ id: id + 9999, mv: 0xdead });
    t.emit({ id, mv: 0xbeef });
    await expect(p).resolves.toBe(0xbeef);
  });

  it('request times out if no response arrives', async () => {
    const t = new FakeTransport();
    const c = new AIWorkerClient(t);
    const p = c.request('a', 50);
    await expect(p).rejects.toMatchObject({ kind: 'WorkerTimeout', millis: 50 });
  });

  it('close unsubscribes from transport and rejects pending requests', async () => {
    const t = new FakeTransport();
    const c = new AIWorkerClient(t);
    const p = c.request('a', 1000);
    c.close();
    await expect(p).rejects.toMatchObject({ kind: 'WorkerCrashed' });
  });
});
