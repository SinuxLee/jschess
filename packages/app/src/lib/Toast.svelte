<script lang="ts">
  /**
   * Toast — ephemeral fixed-centre notifications. Subscribes to GameStore
   * events and surfaces check/mate/draw/illegal attempts, matching legacy
   * showToast() behavior from ui.js.
   *
   * Visual contract: .toast-notification + .show classes styled in app.css
   * (200ms transitions; fixed at 50/50; z-index 9999).
   */
  import type { GameStore } from '@jschess/game';
  import type { GameEvent } from '@jschess/engine';

  const { store }: { store: GameStore } = $props();

  let message = $state('');
  let show = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  const DRAW_REASON_TEXT: Record<string, string> = {
    repetition: '长打判和',
    stalemate: '无棋可走，和棋',
    insufficient: '子力不足，和棋',
    'fifty-move': '50 回合未吃子，和棋',
  };

  function trigger(text: string, ms: number = 2000): void {
    if (hideTimer) clearTimeout(hideTimer);
    if (clearTimer) clearTimeout(clearTimer);
    message = text;
    show = true;
    hideTimer = setTimeout(() => {
      show = false;
      clearTimer = setTimeout(() => {
        message = '';
      }, 300);
    }, ms);
  }

  $effect(() => {
    const off = store.subscribe((e: GameEvent) => {
      if (e.type === 'check') {
        trigger('将军！', 1200);
      } else if (e.type === 'mate') {
        trigger(e.winner === 0 ? '红方胜！' : '黑方胜！', 3500);
      } else if (e.type === 'draw') {
        trigger(DRAW_REASON_TEXT[e.reason] ?? '和棋', 2500);
      } else if (e.type === 'illegalAttempt') {
        trigger('此步不合法', 1200);
      }
    });
    return off;
  });
</script>

{#if message}
  <div class="toast-notification" class:show>{message}</div>
{/if}
