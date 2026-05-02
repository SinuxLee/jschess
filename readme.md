# jschess · 中国象棋

A Chinese Chess (象棋) single-page app. Built in TypeScript with Svelte 5, with the search engine running in a Web Worker.

## Monorepo layout

- `packages/engine` — board rules, FEN, Zobrist, piece-square tables (pure; no DOM, no network).
- `packages/ai`     — alpha-beta search + opening book.
- `packages/game`   — match orchestration (GameStore, state machine, AI transport protocol).
- `packages/app`    — Svelte 5 + Vite frontend; owns the Web Worker entry and audio.
- `tools/*`         — dev-only utilities (headless self-play harness).

Dependency DAG: `app → game → ai → engine`. See `docs/ARCHITECTURE.md`.

## Develop

```bash
bun install
bun run --filter @jschess/app dev
```

## Deploy

Push a tag `vX.Y.Z`; GitHub Actions typechecks, tests, builds, and deploys to GitHub Pages.
