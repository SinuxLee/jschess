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
  CLICK:   'click',
  NEWGAME: 'newgame',
  LOSS:    'loss',
  DRAW:    'draw',
} as const);

export type WavId = typeof WAV[keyof typeof WAV];

/**
 * Game events emitted by `GameStore` (see `@jschess/game`).
 * Consumers: UI (`app/`) subscribes for rendering; audio (`app/audio-player`) subscribes for sounds.
 *
 * Every event has a `type` discriminator. Exhaustive switches on `type`
 * must compile without a default branch — if you add a new variant here,
 * every consumer's switch breaks at typecheck time. That's intentional.
 *
 * `restart` is emitted after a fresh FEN is loaded (plays NEWGAME cue).
 * `select` is emitted when the human clicks a friendly piece (plays CLICK cue).
 * `retract` is emitted when a move is undone; consumers pop move list entries.
 * `thinking` marks AI-search start so the UI can show the thinking indicator;
 * the `stateChanged` event already tracks the state machine phase but `thinking`
 * is a simpler signal for UI components that don't want to track phase.
 * `moveApplied` still carries `mv=0` as a legacy retract sentinel for backward
 * compat, but new code should prefer `retract`.
 */
export type GameEvent =
  | { readonly type: 'stateChanged'; readonly state: 'idle' | 'animating' | 'thinking' }
  | { readonly type: 'moveApplied'; readonly mv: number; readonly capture: boolean; readonly wav: WavId }
  | { readonly type: 'capture'; readonly mv: number; readonly wav: WavId }
  | { readonly type: 'check'; readonly side: 0 | 1; readonly wav: WavId }
  | { readonly type: 'mate'; readonly winner: 0 | 1; readonly wav: WavId }
  | { readonly type: 'draw'; readonly reason: 'repetition' | 'stalemate' | 'insufficient' | 'fifty-move' }
  | { readonly type: 'illegalAttempt'; readonly reason: string; readonly wav: WavId }
  | { readonly type: 'restart'; readonly fen: string; readonly wav: WavId }
  | { readonly type: 'select'; readonly sq: number; readonly wav: WavId }
  | { readonly type: 'retract'; readonly plies: number };
