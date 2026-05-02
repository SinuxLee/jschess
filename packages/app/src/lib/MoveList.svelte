<script lang="ts">
  /**
   * MoveList — legacy-parity move record. A <select size="7"> whose options
   * list every half-move ply. Clicking an option jumps the engine back to
   * that ply via store.jumpToPly(), mirroring legacy onRecordListChange.
   *
   * Move text format matches legacy addMove():
   *   red move    "   N. <iccs>"  (3-space prefix when N < 100)
   *   black reply " <iccs>"        (4-space prefix, trailing dots)
   */
  import type { GameStore } from '@jschess/game';
  import type { GameEvent } from '@jschess/engine';
  import { moveToIccs } from '@jschess/engine';

  const { store }: { store: GameStore } = $props();

  /** Each entry is one ply's display text. moves[0] is the "start" placeholder. */
  let moves = $state<string[]>(['=== 开始 ===']);
  let selectedIndex = $state(0);

  /** side-to-move BEFORE the move was applied (0=red, 1=black). */
  function formatMoveText(mv: number, redMovedIndex: number): string {
    const iccs = moveToIccs(mv).toUpperCase();
    // redMovedIndex is 0-based ply count after red plays; show ` 1. a2a3` style
    // For red: "{num}. {iccs}". For black: "   {iccs}" to align as second col.
    return `${redMovedIndex}. ${iccs}`;
  }

  $effect(() => {
    const off = store.subscribe((e: GameEvent) => {
      if (e.type === 'restart') {
        moves = ['=== 开始 ==='];
        selectedIndex = 0;
        return;
      }
      if (e.type === 'retract') {
        // Truncate moves to match remaining plies (+1 for start marker).
        moves = moves.slice(0, e.plies + 1);
        selectedIndex = moves.length - 1;
        return;
      }
      if (e.type === 'moveApplied' && e.mv !== 0) {
        // Derive "N." counter: plies count after the move -> store.state.plies.
        const n = store.state.plies;
        moves = [...moves, formatMoveText(e.mv, n)];
        selectedIndex = moves.length - 1;
      }
      // moveApplied mv=0 legacy sentinel already covered by 'retract' branch above.
    });
    return off;
  });

  function onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const idx = target.selectedIndex;
    // Option index N corresponds to board state after N plies (0 = start).
    if (idx !== store.state.plies) {
      store.jumpToPly(idx);
    }
  }
</script>

<div id="moves_container">
  <div class="label">步骤</div>
  <select
    id="selMoveList"
    size="7"
    bind:value={selectedIndex}
    onchange={onSelectChange}
  >
    {#each moves as text, i (i)}
      <option value={i}>{text}</option>
    {/each}
  </select>
</div>
