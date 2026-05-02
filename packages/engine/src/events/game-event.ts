/**
 * WAV — identifiers for sound cues emitted by the game layer.
 * Values are stable strings so that `app/` can map them to asset URLs
 * without knowing the integer encoding.
 */
export const WAV = Object.freeze({
  MOVE:    'move',
  CAPTURE: 'capture',
  CHECK:   'check',
  MATE:    'mate',
  ILLEGAL: 'illegal',
} as const);

export type WavId = typeof WAV[keyof typeof WAV];

/**
 * Game events emitted by `GameStore` (see `@jschess/game`).
 * Consumers: UI (`app/`) subscribes for rendering; audio (`app/audio-player`) subscribes for sounds.
 *
 * Every event has a `type` discriminator. Exhaustive switches on `type`
 * must compile without a default branch — if you add a new variant here,
 * every consumer's switch breaks at typecheck time. That's intentional.
 */
export type GameEvent =
  | { readonly type: 'stateChanged'; readonly state: 'idle' | 'animating' | 'thinking' }
  | { readonly type: 'moveApplied'; readonly mv: number; readonly capture: boolean; readonly wav: WavId }
  | { readonly type: 'capture'; readonly mv: number; readonly wav: WavId }
  | { readonly type: 'check'; readonly side: 0 | 1; readonly wav: WavId }
  | { readonly type: 'mate'; readonly winner: 0 | 1; readonly wav: WavId }
  | { readonly type: 'draw'; readonly reason: 'repetition' | 'stalemate' }
  | { readonly type: 'illegalAttempt'; readonly reason: string; readonly wav: WavId };
