<script lang="ts">
  import { onMount } from 'svelte';
  import { GameStore, AIWorkerClient } from '@jschess/game';
  import { WorkerTransport } from './lib/worker-transport';
  import { AudioPlayer } from './audio/audio-player';
  import Board from './lib/Board.svelte';
  import MoveList from './lib/MoveList.svelte';
  import Controls from './lib/Controls.svelte';

  let store = $state<GameStore | null>(null);
  let audio = $state<AudioPlayer | null>(null);

  onMount(() => {
    const transport = new WorkerTransport();
    const ai = new AIWorkerClient(transport);
    const s = new GameStore({ ai });
    store = s;
    audio = new AudioPlayer(s);
    return () => {
      ai.close();
    };
  });

  function onRestart(): void {
    window.location.reload();
  }
  function onToggleSound(on: boolean): void {
    audio?.setEnabled(on);
  }
</script>

<div id="game_title">中国象棋</div>
<div id="game_zone">
  {#if store}
    <MoveList {store} />
    <Board {store} />
    <Controls {store} {onRestart} {onToggleSound} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>
