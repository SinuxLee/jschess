/**
 * Headless self-play harness. Drives @jschess/ai Search on both sides
 * of a fresh board until checkmate, stalemate, or ply limit. Validates
 * end-to-end wiring (Position + movegen + Search + make/undo) without
 * any DOM dependency.
 *
 * Not a parity proof vs the legacy engine: neither engine is
 * deterministic (no seeded RNG in the search), so games may diverge.
 * Perft (Task 21) and the Phase 5 line-for-line review give us parity;
 * this harness is the sanity gate that the full stack runs.
 */
import { Position, fromFen, toFen, isChecked, generateMoves } from '@jschess/engine';
import { Search } from '@jschess/ai';

const INITIAL_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

export interface BattleResult {
  readonly plies: number;
  readonly finalFen: string;
  readonly terminated: 'checkmate' | 'stalemate' | 'ply-limit';
}

export async function playGame(maxPlies = 200, millisPerMove = 200): Promise<BattleResult> {
  const pos = new Position();
  fromFen(pos, INITIAL_FEN, isChecked);
  const search = new Search(pos);

  for (let ply = 0; ply < maxPlies; ply++) {
    const moves = generateMoves(pos);
    let anyLegal = false;
    for (const mv of moves) {
      if (pos.makeMove(mv, isChecked)) {
        pos.undoMakeMove();
        anyLegal = true;
        break;
      }
    }
    if (!anyLegal) {
      return {
        plies: ply,
        finalFen: toFen(pos),
        terminated: pos.inCheck() ? 'checkmate' : 'stalemate',
      };
    }
    search.searchMain(64, millisPerMove);
    if (search.bestMove === 0) {
      return { plies: ply, finalFen: toFen(pos), terminated: 'stalemate' };
    }
    const ok = pos.makeMove(search.bestMove, isChecked);
    if (!ok) throw new Error(`AI returned illegal move ${search.bestMove} at ply ${ply}`);
  }
  return { plies: maxPlies, finalFen: toFen(pos), terminated: 'ply-limit' };
}

if (import.meta.main) {
  const N = Number(process.env['BATTLE_GAMES'] ?? '5');
  for (let i = 0; i < N; i++) {
    // eslint-disable-next-line no-console
    console.log(`--- game ${i + 1}/${N} ---`);
    const r = await playGame(80, 100);
    // eslint-disable-next-line no-console
    console.log(r);
  }
}
