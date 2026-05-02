<script lang="ts">
  import type { GameStore } from '@jschess/game';

  const {
    store,
    onRestart,
    onToggleSound,
  }: {
    store: GameStore;
    onRestart: () => void;
    onToggleSound: (on: boolean) => void;
  } = $props();

  let moveMode = $state(0);
  let handicap = $state(0);
  let level = $state(0);
  let animated = $state(true);
  let sound = $state(true);

  function restart(): void {
    onRestart();
  }
  function retract(): void {
    store.retract();
  }

  $effect(() => {
    onToggleSound(sound);
  });
</script>

<div class="menu">
  <div class="label">谁先走</div>
  <select size="4" bind:value={moveMode}>
    <option value={0}>我先走</option>
    <option value={1}>电脑先走</option>
    <option value={2}>不用电脑</option>
    <option value={3}>双机对弈</option>
  </select>

  <div class="label">先走让子</div>
  <select bind:value={handicap}>
    <option value={0}>不让子</option>
    <option value={1}>让左马</option>
    <option value={2}>让双马</option>
    <option value={3}>让九子</option>
  </select>

  <div class="top_space">
    <input type="button" class="button" value="重新开始" onclick={restart} />
  </div>
  <div class="top_space">
    <input type="button" class="button" value="悔棋" onclick={retract} />
  </div>

  <div class="game_space"></div>

  <div class="label">电脑水平</div>
  <select size="3" bind:value={level}>
    <option value={0}>入门</option>
    <option value={1}>业余</option>
    <option value={2}>专业</option>
  </select>

  <div class="game_space"></div>

  <label><input type="checkbox" bind:checked={animated} /> 动画效果</label>
  <label><input type="checkbox" bind:checked={sound} /> 音效</label>
</div>

<style>
  .menu {
    padding: 8px;
    min-width: 160px;
    background: #f9f5ea;
  }
  .label {
    font-weight: bold;
    margin: 8px 0 4px;
  }
  .top_space {
    margin-top: 8px;
  }
  .game_space {
    height: 16px;
  }
  .button {
    width: 100%;
    padding: 4px;
  }
</style>
