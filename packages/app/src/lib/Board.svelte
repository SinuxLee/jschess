<script lang="ts">
  import type { GameStore } from '@jschess/game';
  import { Position, fromFen, isChecked, makeCoord, makeMove } from '@jschess/engine';

  const { store }: { store: GameStore } = $props();
  let fen = $state(store.state.fen);
  let selectedSq = $state<number | null>(null);

  $effect(() => {
    const off = store.subscribe(() => {
      fen = store.state.fen;
    });
    return off;
  });

  const pos = $derived.by(() => {
    const p = new Position();
    fromFen(p, fen, isChecked);
    return p;
  });

  const boardSquares = $derived.by(() => {
    const cells: Array<{ sq: number; pc: number; x: number; y: number }> = [];
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 11; x++) {
        const sq = makeCoord(x, y);
        cells.push({ sq, pc: pos.squares[sq] ?? 0, x: x - 3, y: y - 3 });
      }
    }
    return cells;
  });

  function pieceImgUrl(pc: number): string | null {
    if (pc === 0) return null;
    const side = pc >= 16 ? 'b' : 'r';
    const types = ['k', 'a', 'b', 'n', 'r', 'c', 'p'];
    return `/jschess/images/${side}${types[pc & 7]}.gif`;
  }

  async function onCellClick(sq: number): Promise<void> {
    if (selectedSq === null) {
      selectedSq = sq;
    } else if (selectedSq === sq) {
      selectedSq = null;
    } else {
      const mv = makeMove(selectedSq, sq);
      const ok = await store.applyHumanMove(mv);
      if (ok) {
        selectedSq = null;
      }
    }
  }
</script>

<div class="board">
  <img class="board-bg" src="/jschess/images/board.jpg" alt="board" />
  {#each boardSquares as cell (cell.sq)}
    {@const img = pieceImgUrl(cell.pc)}
    <button
      class="cell"
      class:selected={selectedSq === cell.sq}
      style:--x={cell.x}
      style:--y={cell.y}
      aria-label={`cell-${cell.x}-${cell.y}`}
      onclick={() => onCellClick(cell.sq)}
    >
      {#if img}
        <img src={img} alt={`piece-${cell.pc}`} />
      {/if}
    </button>
  {/each}
</div>

<style>
  .board {
    position: relative;
    width: 450px;
    height: 500px;
    background-size: cover;
  }
  .board-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: none;
  }
  .cell {
    position: absolute;
    width: 50px;
    height: 50px;
    background: transparent;
    border: none;
    padding: 0;
    left: calc(var(--x) * 50px);
    top: calc(var(--y) * 50px);
    cursor: pointer;
  }
  .cell img {
    width: 100%;
    height: 100%;
  }
  .cell.selected {
    outline: 3px solid gold;
    outline-offset: -3px;
  }
</style>
