/**
 * Wire protocol between @jschess/game and the AI worker. Every request
 * carries an id that the game layer uses to correlate with a response.
 *
 * This module deliberately has NO runtime code that depends on @jschess/ai
 * so that @jschess/game stays decoupled from the search engine.
 */
export interface AIRequest {
  readonly id: number;
  readonly fen: string;
  readonly millis: number;
}

export type AIResponse =
  | { readonly id: number; readonly mv: number }
  | { readonly id: number; readonly error: string };

export function isAIResponse(value: unknown): value is AIResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { id?: unknown; mv?: unknown; error?: unknown };
  if (typeof v.id !== 'number') return false;
  return typeof v.mv === 'number' || typeof v.error === 'string';
}
