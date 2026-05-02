<script lang="ts">
  /**
   * Controls — right-side menu card (legacy #game_menu).
   *
   * UI inputs drive GameStore setters directly. The restart button goes
   * through the provided `onRestart` callback so App orchestrator can
   * trigger the first AI move if computer-plays-first.
   *
   * Wiring mirrors legacy game.js:
   *   selMoveMode/selHandicap changes call onClickRestart
   *   selLevel change updates AI thinking time (via store.setLevel)
   *   chkAnimated / chkSound toggle GameAudio / animation flags.
   */
  import type { GameStore, AIMode, Handicap, Level } from '@jschess/game';
  import type { GameEvent } from '@jschess/engine';

  const {
    store,
    onRestart,
    onToggleSound,
  }: {
    store: GameStore;
    onRestart: () => void;
    onToggleSound: (on: boolean) => void;
  } = $props();

  // Initial values mirror the store's snapshot.
  let moveMode = $state<AIMode>(store.state.mode);
  let handicap = $state<Handicap>(store.state.handicap);
  let level = $state<Level>(store.state.level);
  let animated = $state(store.state.animated);
  let sound = $state(true);

  // Track whether the user has interacted, so initial effects don't trigger
  // a restart when the component first mounts.
  let mounted = false;
  $effect(() => {
    // Touch values so Svelte registers deps; but also allow future changes.
    void moveMode;
    void handicap;
    if (!mounted) {
      mounted = true;
      return;
    }
    // Mode or handicap changed by the user -> mirror legacy onClickRestart.
    store.setMode(moveMode);
    store.setHandicap(handicap);
    onRestart();
  });
  $effect(() => {
    store.setLevel(level);
  });
  $effect(() => {
    store.setAnimated(animated);
  });
  $effect(() => {
    onToggleSound(sound);
  });

  // Keep local UI in sync if some other code path changes store settings.
  $effect(() => {
    const off = store.subscribe((_e: GameEvent) => {
      const s = store.state;
      if (moveMode !== s.mode) moveMode = s.mode;
      if (handicap !== s.handicap) handicap = s.handicap;
      if (level !== s.level) level = s.level;
      if (animated !== s.animated) animated = s.animated;
    });
    return off;
  });

  function restart(): void {
    onRestart();
  }
  function retract(): void {
    store.retract();
  }
</script>

<div id="game_menu">
  <div class="label">谁先走</div>
  <select id="selMoveMode" size="4" bind:value={moveMode}>
    <option value={0}>我先走</option>
    <option value={1}>电脑先走</option>
    <option value={2}>不用电脑</option>
    <option value={3}>双机对弈</option>
  </select>

  <div class="label">先走让子</div>
  <select id="selHandicap" bind:value={handicap}>
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
  <select id="selLevel" size="3" bind:value={level}>
    <option value={0}>入门</option>
    <option value={1}>业余</option>
    <option value={2}>专业</option>
  </select>

  <div class="game_space"></div>

  <div class="checkbox-container">
    <input type="checkbox" id="chkAnimated" bind:checked={animated} />
    <label for="chkAnimated">动画效果</label>
  </div>
  <div class="checkbox-container">
    <input type="checkbox" id="chkSound" bind:checked={sound} />
    <label for="chkSound">音效</label>
  </div>
</div>
