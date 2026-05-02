/**
 * Transport abstraction between the game layer and an AI backend.
 *
 * Implementations:
 *   - WorkerTransport (@jschess/app)       — real Web Worker
 *   - InProcessTransport (tools/…)         — same-thread, for CLI/headless
 *   - FakeTransport (tests)                — deterministic responses
 *
 * The 10-line shape below is all game/ knows about the backend.
 */
import type { AIRequest, AIResponse } from './protocol';

export interface AITransport {
  send(req: AIRequest): void;
  onMessage(handler: (resp: AIResponse) => void): () => void;
  close(): void;
}
