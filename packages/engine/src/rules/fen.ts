/**
 * FEN serialization and ICCS helpers (dashed form).
 * Sample FEN:
 *   rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1
 * Piece letters (upper=red, lower=black):
 *   K=King  A=Advisor  B|E=Bishop  N|H=Knight  R=Rook  C=Cannon  P=Pawn
 */
import { Range } from '../primitives/constants';
import { makeCoord } from '../primitives/coords';
import { makePiece } from '../primitives/piece';
import type { Position, CheckedFn } from './position';

interface FenPieceInfo {
  readonly side: 0 | 1;
  readonly type: number;
}

const FEN_CHAR_MAP: Readonly<Record<string, FenPieceInfo>> = {
  k: { side: 1, type: 0 }, K: { side: 0, type: 0 },
  a: { side: 1, type: 1 }, A: { side: 0, type: 1 },
  b: { side: 1, type: 2 }, B: { side: 0, type: 2 },
  e: { side: 1, type: 2 }, E: { side: 0, type: 2 },
  n: { side: 1, type: 3 }, N: { side: 0, type: 3 },
  h: { side: 1, type: 3 }, H: { side: 0, type: 3 },
  r: { side: 1, type: 4 }, R: { side: 0, type: 4 },
  c: { side: 1, type: 5 }, C: { side: 0, type: 5 },
  p: { side: 1, type: 6 }, P: { side: 0, type: 6 },
};

const PIECE_TO_FEN: readonly string[] = ['K', 'A', 'B', 'N', 'R', 'C', 'P'];

export function fromFen(pos: Position, fen: string, checkedFn: CheckedFn): void {
  pos.clearBoard();

  const parts = fen.trim().split(/\s+/);
  const ranks = parts[0]!.split('/');

  for (let rank = 0; rank < ranks.length && rank < 10; rank++) {
    const row = rank + Range.TOP;
    let col = Range.LEFT;
    for (const ch of ranks[rank]!) {
      if (ch >= '1' && ch <= '9') {
        col += parseInt(ch, 10);
      } else {
        const info = FEN_CHAR_MAP[ch];
        if (info) {
          const sq = makeCoord(col, row);
          pos.addPiece(sq, makePiece(info.type, info.side), false);
          col++;
        }
      }
    }
  }

  if (parts.length > 1 && parts[1] === 'b') {
    pos.changeSide();
  }

  pos.setIrrev(checkedFn(pos));
}

export function toFen(pos: Position): string {
  let fen = '';

  for (let rank = 0; rank < 10; rank++) {
    const row = rank + Range.TOP;
    let empty = 0;

    for (let col = 0; col < 9; col++) {
      const sq = makeCoord(col + Range.LEFT, row);
      const pc = pos.squares[sq]!;
      if (pc === 0) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        const type = pc & 7;
        const side = pc < 16 ? 0 : 1;
        const ch = PIECE_TO_FEN[type]!;
        fen += side === 0 ? ch : ch.toLowerCase();
      }
    }

    if (empty > 0) fen += empty;
    if (rank < 9) fen += '/';
  }

  fen += ' ' + (pos.sdPlayer === 0 ? 'w' : 'b');
  fen += ' - - 0 1';

  return fen;
}

export function moveToIccsDashed(mv: number): string {
  const src = mv & 0xFF;
  const dst = mv >> 8;
  const srcX = src & 15;
  const srcY = src >> 4;
  const dstX = dst & 15;
  const dstY = dst >> 4;
  return (
    String.fromCharCode('A'.charCodeAt(0) + srcX - Range.LEFT) +
    String.fromCharCode('9'.charCodeAt(0) - srcY + Range.TOP) +
    '-' +
    String.fromCharCode('A'.charCodeAt(0) + dstX - Range.LEFT) +
    String.fromCharCode('9'.charCodeAt(0) - dstY + Range.TOP)
  );
}

export function iccsToMove(iccs: string): number {
  const clean = (iccs ?? '').replace('-', '').toUpperCase();
  if (clean.length < 4) return 0;
  const srcX = clean.charCodeAt(0) - 'A'.charCodeAt(0) + Range.LEFT;
  const srcY = Range.TOP + 9 - (clean.charCodeAt(1) - '0'.charCodeAt(0));
  const dstX = clean.charCodeAt(2) - 'A'.charCodeAt(0) + Range.LEFT;
  const dstY = Range.TOP + 9 - (clean.charCodeAt(3) - '0'.charCodeAt(0));
  const src = makeCoord(srcX, srcY);
  const dst = makeCoord(dstX, dstY);
  return src | (dst << 8);
}
