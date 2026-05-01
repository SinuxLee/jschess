/**
 * Chess primitives and search constants.
 * Numeric values preserved bit-for-bit from legacy/js/core/constants.js.
 */

export enum PieceType {
  KING = 0,
  ADVISOR = 1,
  BISHOP = 2,
  KNIGHT = 3,
  ROOK = 4,
  CANNON = 5,
  PAWN = 6,
  UNKNOWN = -1,
}

export enum Color {
  RED = 0,
  BLACK = 1,
}

export const Range = Object.freeze({
  TOP: 3,
  BOTTOM: 12,
  LEFT: 3,
  RIGHT: 11,
}) satisfies { TOP: number; BOTTOM: number; LEFT: number; RIGHT: number };

// 24-char string; pieces sit at indices 8..14 (red) and 16..22 (black) to match
// piece codes (8-14 = red, 16-22 = black).
export const FEN_PIECE = '        KABNRCP kabnrcp ';

// Move-generation deltas.
export const KING_DELTA: readonly number[] = [-16, -1, 1, 16];
export const ADVISOR_DELTA: readonly number[] = [-17, -15, 15, 17];
export const KNIGHT_DELTA: readonly number[][] = [
  [-33, -31],
  [-18, 14],
  [-14, 18],
  [31, 33],
];
export const KNIGHT_CHECK_DELTA: readonly number[][] = [
  [-33, -18],
  [-31, -14],
  [14, 31],
  [18, 33],
];

// Search constants.
export const MATE_VALUE = 10000;
export const BAN_VALUE = MATE_VALUE - 100;
export const WIN_VALUE = MATE_VALUE - 200;
export const NULL_OKAY_MARGIN = 200;
export const NULL_SAFE_MARGIN = 400;
export const DRAW_VALUE = 20;
export const ADVANCED_VALUE = 3;

// MVV (most-valuable-victim) values indexed by PieceType.
export const MVV_VALUE: readonly number[] = [50, 10, 10, 30, 40, 30, 20];

/**
 * Square index (0..255) on the 16×16 internal board. Only cells where
 * `IN_BOARD[sq] === 1` are legal playable squares.
 */
export type Square = number;

/**
 * Packed 16-bit move: `src | (dst << 8)`. `0` means MOVE_NONE.
 */
export type Move = number;
