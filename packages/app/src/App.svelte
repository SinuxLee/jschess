<script lang="ts">
  /**
   * App — top-level orchestrator. Owns the GameStore/AI/AudioPlayer lifecycle
   * and glues Controls ↔ Store ↔ Board/MoveList/Toast together.
   *
   * Key behaviors beyond simple mounting:
   *   - onRestart() calls store.restart() (no window.reload) so state, FEN,
   *     and history clear without reloading Vite/worker.
   *   - After each human move, if the store says it's AI's turn, trigger
   *     AI reply (matches legacy board.response()).
   *   - After restart, if computer plays first (red or dual-AI), kick off
   *     first AI move on IDLE transition.
   */
  import { onMount } from 'svelte';
  import { GameStore, AIWorkerClient } from '@jschess/game';
  import type { GameEvent } from '@jschess/engine';
  import { WorkerTransport } from './lib/worker-transport';
  import { AudioPlayer } from './audio/audio-player';
  import Board from './lib/Board.svelte';
  import MoveList from './lib/MoveList.svelte';
  import Controls from './lib/Controls.svelte';
  import Toast from './lib/Toast.svelte';

  let store = $state<GameStore | null>(null);
  let audio = $state<AudioPlayer | null>(null);

  onMount(() => {
    const transport = new WorkerTransport();
    const ai = new AIWorkerClient(transport);
    const s = new GameStore({ ai });
    store = s;
    audio = new AudioPlayer(s);

    // AI response orchestration: whenever the store returns to IDLE and the
    // current side matches `computer` (or dual-AI), request the next move.
    const off = s.subscribe((e: GameEvent) => {
      if (e.type === 'stateChanged' && e.state === 'idle') {
        if (s.shouldAIMove()) {
          // Fire-and-forget; errors already roll state back to IDLE.
          void s.triggerAIResponse();
        }
      }
    });

    return () => {
      off();
      audio?.close();
      ai.close();
    };
  });

  function onRestart(): void {
    store?.restart();
  }
  function onToggleSound(on: boolean): void {
    audio?.setEnabled(on);
  }
</script>

<div id="game_title">中国象棋</div>
<div id="game_zone">
  {#if store}
    <MoveList {store} />
    <div id="game_board">
      <div id="container">
        <Board {store} />
      </div>
    </div>
    <Controls {store} {onRestart} {onToggleSound} />
    <Toast {store} />
  {:else}
    <div>Loading…</div>
  {/if}
</div>
