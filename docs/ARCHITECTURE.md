# JSChess Architecture

## Packages

```
app ─► game ─► ai ─► engine
```

| Package | Single question it answers | DOM? | Framework? |
|---|---|---|---|
| `@jschess/engine` | "What are the legal moves? How is this position valued?" | no | no |
| `@jschess/ai` | "Given a position, what's the best move?" | no | no |
| `@jschess/game` | "How is a match played — state, history, AI coordination?" | no | no |
| `@jschess/app` | "How does the user see and interact with the game?" | yes | Svelte 5 |

## Inviolable Rules

1. **Dependencies flow downward only.** An arrow in the diagram above means "may import from". Upward or sideways imports are CI failures.
2. **The Worker boundary is plain-data only.** Only `string`, `number`, `boolean`, and plain-object payloads cross `AITransport`. `Position` class instances never cross. Use `PositionSnapshot` or a FEN string.
3. **Reactivity in `game/` is `EventTarget`**, not Svelte runes, not external signal libraries. Keeps `game/` framework-independent.
4. **The Web Worker entry file lives in `@jschess/app`.** Vite's worker resolution needs `new Worker(new URL(...))` to be statically resolvable from the importing source. The worker code itself is trivial — it just loads `@jschess/ai` and handles one message type.
5. **Audio is event-driven.** `GameStore` emits `move`, `capture`, `check`, `mate`. `app/audio-player.ts` subscribes and plays WAV files. Muting = unsubscribe.

## Boundaries Enforcement (4 layers)

1. `package.json` `dependencies` — compile-time gate (workspace protocol).
2. `exports` field — hides internals not meant for other packages.
3. `eslint-plugin-import` + `no-restricted-imports` — pattern rules on top of 1+2.
4. `scripts/check-boundaries.sh` in CI — plain grep that can't be silenced by `eslint-disable`.
