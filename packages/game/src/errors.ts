/**
 * All errors the game layer can surface to presentation code.
 * Every failure mode has its own variant so the UI can render a specific message
 * without string-matching.
 */
export type GameError =
  | { readonly kind: 'IllegalMove'; readonly mv: number; readonly reason: string }
  | { readonly kind: 'FenParseError'; readonly fen: string; readonly reason: string }
  | { readonly kind: 'WorkerCrashed'; readonly message: string }
  | { readonly kind: 'WorkerTimeout'; readonly millis: number };

const VALID_KINDS = new Set<string>([
  'IllegalMove',
  'FenParseError',
  'WorkerCrashed',
  'WorkerTimeout',
]);

export function isGameError(value: unknown): value is GameError {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return typeof kind === 'string' && VALID_KINDS.has(kind);
}
