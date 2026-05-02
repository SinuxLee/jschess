/**
 * State machine phases for a match. Matches the legacy state machine in
 * legacy/js/board.js exactly.
 *
 *   IDLE       — waiting for human to select a piece and a destination
 *   ANIMATING  — a move is currently being animated
 *   THINKING   — the AI is searching
 *
 * Legal transitions:
 *   IDLE      → ANIMATING (human picks a move)
 *   IDLE      → THINKING  (AI to move)
 *   ANIMATING → IDLE      (animation finished; human turn)
 *   ANIMATING → THINKING  (animation finished; AI's turn)
 *   THINKING  → ANIMATING (AI chose a move)
 *   THINKING  → IDLE      (AI request failed / returned illegal move — rollback)
 */
export const GamePhase = Object.freeze({
  IDLE: 'IDLE',
  ANIMATING: 'ANIMATING',
  THINKING: 'THINKING',
} as const);
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export interface GameState {
  readonly phase: GamePhase;
  readonly fen: string;
  readonly sideToMove: 'RED' | 'BLACK';
  readonly plies: number;
}

const LEGAL_TRANSITIONS: ReadonlySet<string> = new Set([
  `${GamePhase.IDLE}->${GamePhase.ANIMATING}`,
  `${GamePhase.IDLE}->${GamePhase.THINKING}`,
  `${GamePhase.ANIMATING}->${GamePhase.IDLE}`,
  `${GamePhase.ANIMATING}->${GamePhase.THINKING}`,
  `${GamePhase.THINKING}->${GamePhase.ANIMATING}`,
  `${GamePhase.THINKING}->${GamePhase.IDLE}`,
]);

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return LEGAL_TRANSITIONS.has(`${from}->${to}`);
}
