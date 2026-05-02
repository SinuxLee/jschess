<script lang="ts">
  import type { GameStore } from '@jschess/game';
  import type { GameEvent } from '@jschess/engine';
  import { moveToIccs } from '@jschess/engine';

  const { store }: { store: GameStore } = $props();
  let moves = $state<string[]>([]);

  $effect(() => {
    const off = store.subscribe((e: GameEvent) => {
      if (e.type === 'moveApplied' && e.mv !== 0) {
        moves = [...moves, moveToIccs(e.mv)];
      } else if (e.type === 'moveApplied' && e.mv === 0) {
        moves = moves.slice(0, -1);
      }
    });
    return off;
  });
</script>

<div class="moves">
  <div class="label">步骤</div>
  <ol>
    {#each moves as mv, i}
      <li>{i + 1}. {mv}</li>
    {/each}
  </ol>
</div>

<style>
  .moves {
    padding: 8px;
    min-width: 120px;
    background: #f9f5ea;
  }
  .label {
    font-weight: bold;
    margin-bottom: 4px;
  }
  ol {
    font-family: monospace;
    padding-left: 24px;
    margin: 0;
  }
</style>
