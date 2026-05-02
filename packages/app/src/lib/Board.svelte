<!--
  Board.svelte — 521×577 legacy coordinate system.
  Geometry constants mirror legacy/js/ui.js exactly; scale:1.37 is applied
  at the #container level in app.css, so all math here stays in 521×577.

  Per-piece reactivity: pieces are rendered as a keyed list so Svelte keeps
  the same <img> element across frames — this is required for fakeAnimation
  to translate one element smoothly; re-keying per tick would snap.

  Flip: when the human plays black (computer === 0), the board is rendered
  from black's perspective. All read/write of `squares` stays in the engine's
  frame; only display translation uses flipSq.
-->
<script lang="ts">
  import type { GameStore } from '@jschess/game';
  import {
    Position,
    fromFen,
    isChecked,
    makeCoord,
    getX,
    getY,
    flipSq,
    makeMove,
    moveSrc,
    moveDst,
    sideTag,
    type GameEvent,
  } from '@jschess/engine';

  const BOARD_W = 521;
  const BOARD_H = 577;
  const CELL = 57;
  const LEFT = (BOARD_W - CELL * 9) >> 1; // 4
  const TOP = (BOARD_H - CELL * 10) >> 1; // 3
  const THINK = 32;
  const THINK_LEFT = (BOARD_W - THINK) >> 1; // 244
  const THINK_TOP = (BOARD_H - THINK) >> 1; // 272
  const ANIM_STEPS = 8;
  const ANIM_FRAME_MS = 16;
  const MATE_STEPS = 8;
  const MATE_FRAME_MS = 50;

  const { store }: { store: GameStore } = $props();

  let fen = $state(store.state.fen);
  let computer = $state(store.state.computer);
  let animated = $state(store.state.animated);
  let phase = $state(store.state.phase);
  let sqSelected = $state(0);
  let lastMotion = $state(0);
  /** When non-null, piece at this sq is mid-animation; its img gets nudged. */
  let animSq = $state<number | null>(null);
  let animOffsetX = $state(0);
  let animOffsetY = $state(0);
  let animZ = $state(0);
  /** When non-null, swap piece at this sq to the mated-king sprite. */
  let mateSq = $state<number | null>(null);
  let mateSide = $state<'r' | 'b'>('r');

  $effect(() => {
    const off = store.subscribe((e: GameEvent) => onEvent(e));
    return off;
  });

  async function onEvent(e: GameEvent): Promise<void> {
    if (e.type === 'stateChanged') {
      phase = store.state.phase;
      computer = store.state.computer;
      animated = store.state.animated;
      return;
    }
    if (e.type === 'restart' || e.type === 'retract') {
      fen = store.state.fen;
      sqSelected = 0;
      lastMotion = 0;
      animSq = null;
      mateSq = null;
      return;
    }
    if (e.type === 'moveApplied') {
      if (e.mv === 0) {
        // Legacy retract sentinel — covered by 'retract' branch above.
        return;
      }
      if (animated) await runMoveAnimation(e.mv);
      fen = store.state.fen;
      lastMotion = e.mv;
      sqSelected = 0;
      return;
    }
    if (e.type === 'mate') {
      const pos = new Position();
      fromFen(pos, store.state.fen, isChecked);
      const sideToMate = store.state.sideToMove === 'RED' ? 0 : 1;
      const tag = sideTag(sideToMate);
      let found = 0;
      for (let y = 3; y <= 12; y++) {
        for (let x = 3; x <= 11; x++) {
          const sq = makeCoord(x, y);
          if ((pos.squares[sq] ?? 0) === tag) {
            found = sq;
            break;
          }
        }
        if (found !== 0) break;
      }
      if (animated && found !== 0) {
        await runMateAnimation(found, sideToMate === 0 ? 'r' : 'b');
      }
    }
  }

  async function runMoveAnimation(mv: number): Promise<void> {
    const src = moveSrc(mv);
    const dst = moveDst(mv);
    const dSrc = display(src);
    const dDst = display(dst);
    const xSrc = uiX(dSrc);
    const ySrc = uiY(dSrc);
    const xDst = uiX(dDst);
    const yDst = uiY(dDst);
    animSq = src;
    animZ = 256;
    for (let i = ANIM_STEPS - 1; i > 0; i--) {
      const nx = Math.floor((xSrc * i + xDst * (ANIM_STEPS - i)) / ANIM_STEPS + 0.5);
      const ny = Math.floor((ySrc * i + yDst * (ANIM_STEPS - i)) / ANIM_STEPS + 0.5);
      animOffsetX = nx - xSrc;
      animOffsetY = ny - ySrc;
      await sleep(ANIM_FRAME_MS);
    }
    animOffsetX = 0;
    animOffsetY = 0;
    animZ = 0;
    animSq = null;
  }

  async function runMateAnimation(sq: number, side: 'r' | 'b'): Promise<void> {
    const dSq = display(sq);
    animSq = sq;
    animZ = 256;
    for (let i = 0; i < MATE_STEPS; i++) {
      animOffsetX = (i & 1) === 0 ? i * 2 : -i * 2;
      await sleep(MATE_FRAME_MS);
    }
    animOffsetX = 0;
    animOffsetY = 0;
    animZ = 0;
    animSq = null;
    mateSq = dSq;
    mateSide = side;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  function display(sq: number): number {
    return computer === 0 ? flipSq(sq) : sq;
  }

  function uiX(dSq: number): number {
    return LEFT + (getX(dSq) - 3) * CELL;
  }
  function uiY(dSq: number): number {
    return TOP + (getY(dSq) - 3) * CELL;
  }

  const pos = $derived.by(() => {
    const p = new Position();
    fromFen(p, fen, isChecked);
    return p;
  });

  const boardSquares = $derived.by(() => {
    const cells: Array<{
      sq: number;
      pc: number;
      x: number;
      y: number;
      highlighted: boolean;
    }> = [];
    const motionSrc = lastMotion !== 0 ? moveSrc(lastMotion) : -1;
    const motionDst = lastMotion !== 0 ? moveDst(lastMotion) : -1;
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 11; x++) {
        const sq = makeCoord(x, y);
        const dSq = display(sq);
        cells.push({
          sq,
          pc: pos.squares[sq] ?? 0,
          x: uiX(dSq),
          y: uiY(dSq),
          highlighted: sq === sqSelected || sq === motionSrc || sq === motionDst,
        });
      }
    }
    return cells;
  });

  function pieceImgUrl(pc: number, sq: number): string {
    if (sq === mateSq) return `/jschess/images/${mateSide}km.gif`;
    if (pc === 0) return `/jschess/images/oo.gif`;
    const side = pc >= 16 ? 'b' : 'r';
    const types = ['k', 'a', 'b', 'n', 'r', 'c', 'p'];
    return `/jschess/images/${side}${types[pc & 7]}.gif`;
  }

  async function onCellClick(sq: number): Promise<void> {
    if (phase !== 'IDLE') return;
    // Dual-AI or it is computer's turn — humans may not interact.
    if (computer === 2) return;
    if (computer === pos.sdPlayer) return;

    const pc = pos.squares[sq] ?? 0;
    const selfTag = sideTag(pos.sdPlayer);
    const isOwnPiece = pc !== 0 && (pc & selfTag) !== 0;

    if (sqSelected === 0) {
      if (!isOwnPiece) return;
      sqSelected = sq;
      store.select(sq);
      return;
    }
    if (sqSelected === sq) {
      sqSelected = 0;
      return;
    }
    if (isOwnPiece) {
      sqSelected = sq;
      store.select(sq);
      return;
    }
    const mv = makeMove(sqSelected, sq);
    const ok = await store.applyHumanMove(mv);
    if (!ok) return;
    sqSelected = 0;
  }

  const showThink = $derived(phase === 'THINKING');
</script>

<div id="container">
  <img class="board-bg" src="/jschess/images/board.jpg" alt="board" />
  {#each boardSquares as cell (cell.sq)}
    {@const isAnim = animSq === cell.sq}
    <button
      class="cell"
      class:highlighted={cell.highlighted}
      style:left="{cell.x + (isAnim ? animOffsetX : 0)}px"
      style:top="{cell.y + (isAnim ? animOffsetY : 0)}px"
      style:z-index={isAnim ? animZ : 0}
      aria-label="cell-{cell.sq}"
      onclick={() => onCellClick(cell.sq)}
    >
      <img src={pieceImgUrl(cell.pc, cell.sq)} alt="piece" />
    </button>
  {/each}
  {#if showThink}
    <img
      class="thinking"
      src="/jschess/images/thinking.gif"
      alt="thinking"
      style:left="{THINK_LEFT}px"
      style:top="{THINK_TOP}px"
    />
  {/if}
</div>

<style>
  .board-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 521px;
    height: 577px;
    pointer-events: none;
  }
  .cell {
    position: absolute;
    width: 57px;
    height: 57px;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .cell img {
    width: 57px;
    height: 57px;
    display: block;
  }
  .cell.highlighted img {
    background-image: url('/jschess/images/oos.gif');
    background-size: 57px 57px;
  }
  .thinking {
    position: absolute;
    width: 32px;
    height: 32px;
    pointer-events: none;
  }
</style>
