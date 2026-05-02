/**
 * AI Web Worker entry. Must live in packages/app/src/workers/ so Vite can
 * statically resolve `new Worker(new URL('../workers/ai.worker.ts', import.meta.url))`
 * from lib/worker-transport.ts. Moving this file breaks the bundler.
 *
 * Wire protocol: @jschess/game's AIRequest/AIResponse.
 */
/// <reference lib="webworker" />
import { Position, fromFen, isChecked } from '@jschess/engine';
import { Search } from '@jschess/ai';
import type { AIRequest, AIResponse } from '@jschess/game';

const _pos = new Position();
const _search = new Search(_pos);

self.addEventListener('message', (event: MessageEvent<AIRequest>) => {
  const req = event.data;
  let resp: AIResponse;
  try {
    fromFen(_pos, req.fen, isChecked);
    _search.searchMain(64, req.millis);
    if (_search.bestMove === 0) {
      resp = { id: req.id, error: 'no best move' };
    } else {
      resp = { id: req.id, mv: _search.bestMove };
    }
  } catch (err) {
    resp = { id: req.id, error: err instanceof Error ? err.message : String(err) };
  }
  (self as unknown as Worker).postMessage(resp);
});
