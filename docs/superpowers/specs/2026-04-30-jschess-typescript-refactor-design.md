# JSChess TypeScript Refactor — Design Spec

> Status: Final design for user approval. Implementation plan follows via writing-plans skill.
> Project: Chinese Chess (中国象棋) SPA rewrite from vanilla ES6 JS to TypeScript.
> Reviewed by: Oracle (architectural critique) + Explore (codebase coupling map), 2026-04-30.

---

## 0. Context

### Existing Project

Chinese Chess game, ~15.6K LOC total, currently vanilla ES6 modules. Already decently layered:
```
js/core/    primitives: constants, coords, piece, zobrist, tables, move (~950 LOC, pure)
js/engine/  rules: position, movegen, fen, evaluate (~820 LOC, pure)
js/ai/      search: search, hashtable, movesort (~640 LOC, pure)
js/board.js state machine (IDLE/ANIMATING/THINKING) + game controller (460 LOC)
js/ui.js    DOM rendering (231 LOC)
js/audio.js browser Audio wrapper (66 LOC)
js/game.js  Game singleton entry (204 LOC)
js/ai-worker.js Web Worker entry (39 LOC)
js/book.js  orphaned opening book data (12,092 LOC — currently imported by NOTHING)
server/     headless AI battle harness — imports js/engine + js/ai directly
```

**Ground-truth facts established by explore agent:**
- `ai/`, `engine/`, `core/` are 100% DOM-free (grep verified).
- Worker protocol is already clean: `{ fen: string, millis: number }` → `{ mv: number }`. Move crosses the boundary as a packed 16-bit integer. Position never serialized.
- Worker is stateless between calls; each call receives full FEN.
- `server/` proves headless reuse works — imports only `engine` + `ai` + one `core` constant.
- `js/book.js` exports `BOOK_DAT` but **zero files import it** — it is currently dead code.
- `board.js` only imports `WAV` enum (not `GameAudio`) from `audio.js`; audio is constructor-injected.
- `game.js:33` has a minor leak: imports `isChecked` from `engine/movegen` directly to implement `onClickRetract`. Port must encapsulate retract logic inside Board.

### User Decisions (locked in)

| Decision | Choice |
|---|---|
| UI framework | Svelte 5 + Vite |
| Project structure | Monorepo via Bun workspaces |
| Rewrite scope | Port + targeted refactors |
| Deploy trigger | GitHub Actions on tag push (`v*`) |
| CI checks | Type-check + tests block deploy |
| Migration | Parallel (legacy/ folder), swap when verified |
| book.js | **Activate** and port (wire into AI search) |
| WAV enum | Move to shared location; audio becomes event-driven |
| Engineering bar | Core practices (strict TS, ESLint, Prettier, Vitest, conventional commits) |
| AI location | Web Worker, typed protocol |

---

## 1. Package Architecture

### 4 runtime packages + tools/ in workspace

```
jschess/
├── package.json                (Bun workspace root)
├── bunfig.toml
├── tsconfig.base.json          (shared strict TS config)
├── .github/workflows/deploy.yml
│
├── packages/
│   ├── engine/                 chess rules + primitives (merged current core + engine)
│   │                           Position, Move, generateMoves, makeMove, evaluate,
│   │                           parseFEN/toFEN, Zobrist, coords, tables, WAV enum,
│   │                           GameEvent types, PositionSnapshot
│   │                           Pure functions. Runs in Node / Worker / Browser.
│   │                           Zero runtime dependencies.
│   │
│   ├── ai/                     search + opening book
│   │                           Search class, search(pos, level, time) → SearchResult,
│   │                           loadBook() → Promise<BookIndex>, book-extractor script
│   │                           Depends on engine only. Pure computation.
│   │
│   ├── game/                   match orchestration (renamed from "shell")
│   │                           GameStore (state machine: IDLE/ANIMATING/THINKING,
│   │                             move history, retract, handicap, event emitter),
│   │                           AIWorkerClient (transport-agnostic),
│   │                           AITransport interface,
│   │                           AIRequest / AIResponse protocol types,
│   │                           GameError typed union
│   │                           Framework-agnostic TypeScript. NO DOM. NO Svelte. NO Worker.
│   │                           Uses plain EventTarget for reactivity.
│   │
│   └── app/                    Svelte 5 + Vite application (the deployable artifact)
│                               App.svelte, Board.svelte, MoveList.svelte, Controls.svelte,
│                               src/audio.ts (browser Audio + WAV playback),
│                               src/workers/ai.worker.ts (worker entry),
│                               src/lib/worker-transport.ts (new Worker + transport impl)
│                               Only package that knows DOM, Svelte, audio, animation.
│
└── tools/                      IN workspace, "private": true, excluded from default build
    ├── book-extractor/         reads legacy/js/book.js → writes packages/ai/src/book.json
    ├── book-parity-test/       golden test: compares new book lookup vs legacy binary-equal
    └── headless-battle/        AI self-play test harness (port of server/battle.js)
```

### Dependency Graph (strict single-direction DAG)

```
        app ───────┐
                   ▼
                 game ──► ai ──► engine
                                   ▲
tools/book-extractor  ─────────────┤ (also engine for FEN)
tools/book-parity-test ────────────┤
tools/headless-battle ─────────────┘ (ai + engine)
```

**Enforcement (4 layers):**
1. `package.json` `dependencies` — compile-time gate
2. `exports` field — hides internal modules (`engine/src/internal/*` not exported)
3. `eslint-plugin-import/no-restricted-paths` — pattern rules (no `document`/`window`/`HTMLElement` in engine/ai/game; no `svelte` in game; no direct ai/engine import in app components)
4. `scripts/check-boundaries.sh` run in CI — greps for forbidden imports (can't be silenced by ESLint disable comments)

### Package Responsibilities

| Package | Single question it answers |
|---|---|
| `engine` | "What are the legal moves? How is this position valued?" |
| `ai` | "Given a position and difficulty, what's the best move?" |
| `game` | "How is a match played — state, history, rules, AI coordination?" |
| `app` | "How does the user see and interact with the game?" |

---

## 2. Package Details

### 2.1 `@jschess/engine`

**Contents (merged current core + engine):**
```
src/
├── primitives/        (was core/)
│   ├── constants.ts   PieceType, Color, MATE_VALUE, WIN_VALUE, ...
│   ├── coords.ts      getX, getY, flipSq, mirrorSq, sqToIccs, makeCoord
│   ├── piece.ts       sideTag, oppTag, pieceType, makePiece
│   ├── move.ts        makeMove, moveSrc, moveDst, moveToIccs (Move = packed number)
│   ├── tables.ts      IN_BOARD, IN_FORT, LEGAL_SPAN, KNIGHT_PIN, DYNAMIC_CHESS_VALUE
│   └── zobrist.ts     ZOBRIST, zobristPcIdx (RC4-derived, chess-specific)
├── rules/             (was engine/)
│   ├── position.ts    Position class + squares: Uint8Array(256)
│   ├── make-move.ts   (split from position.ts if > ~250 LOC)
│   ├── movegen.ts     generateMoves, isChecked
│   ├── evaluate.ts    evaluate, repValue, mateValue
│   └── fen.ts         fromFen, toFen
├── events/
│   └── game-event.ts  WAV enum + GameEvent discriminated union (MoveApplied, Capture,
│                      Check, Mate, Draw, IllegalAttempt)
├── snapshot.ts        PositionSnapshot (plain-object type for serialization)
└── index.ts           barrel (public API)
```

**Targeted refactors:**
- **`Position.squares: Uint8Array(256)`** (was `number[]`). Sidesteps `noUncheckedIndexedAccess` pain (index access on `Uint8Array` always returns `number`, never `undefined`). Also faster in hot paths.
- **`Board` concept renamed to `Desk`** in future (per user TODO), but defer to post-port since Position is already well-named.
- **Golden-value Zobrist test** as the literal first test file: hash a known FEN, compare against pre-computed constant. Catches Node↔browser determinism bugs early.
- **WAV enum moves here** from audio.js. Game logic emits events referencing WAV names; app/ decides what sound (if any) plays.
- **`PositionSnapshot` plain-object type** — enforces that `Position` class instances never cross process/worker boundaries.

**Public API (barrel):** `Position`, `Move`, `Color`, `PieceType`, `Square`, `PositionSnapshot`, `GameEvent`, `WAV`, `generateMoves`, `makeMove`, `isChecked`, `evaluate`, `repValue`, `parseFEN`, `toFEN`, `Zobrist`.

### 2.2 `@jschess/ai`

**Contents:**
```
src/
├── search/
│   ├── search.ts      Search class (alpha-beta + iterative deepening)
│   ├── hashtable.ts   transposition table (HASH_ALPHA, HASH_BETA, HASH_EXACT)
│   └── movesort.ts    MVV-LVA + history heuristic
├── book/
│   ├── loader.ts      loadBook() → Promise<BookIndex>, dynamic import of book.json
│   └── book.json      (generated by tools/book-extractor — NOT hand-edited)
├── types.ts           SearchResult, BookIndex, BookMove
└── index.ts           barrel
```

**Activate book.js (new):**
- `tools/book-extractor/` reads `legacy/js/book.js`, parses `BOOK_DAT` array, writes `packages/ai/src/book.json`.
- `Search.searchNoBook()` (legacy behavior) AND `Search.searchWithBook()` (new): before descending into alpha-beta, check if current position's zobrist key is in the book; if yes, return a book move.
- Book loaded via `import('./book.json', { with: { type: 'json' } })` — lazy, not bundled into initial chunk.
- **Binary-parity test** in `tools/book-parity-test/`: loads both legacy JS book and new JSON book, walks 1000+ positions, asserts identical move returned. Non-negotiable before merge.

**Public API:** `Search`, `SearchResult`, `loadBook`, `BookIndex`.

### 2.3 `@jschess/game`

**Contents:**
```
src/
├── store/
│   ├── game-store.ts          GameStore class — state machine + move history + events
│   ├── state.ts               GameState = 'IDLE' | 'ANIMATING' | 'THINKING'
│   ├── events.ts              EventTarget-based subscription (plain TS, no framework)
│   └── errors.ts              GameError = IllegalMove | FenParseError | WorkerCrashed
│                              | WorkerTimeout (typed discriminated union)
├── ai-client/
│   ├── transport.ts           AITransport interface (send/onMessage/close)
│   ├── worker-client.ts       AIWorkerClient (takes AITransport in constructor)
│   └── protocol.ts            AIRequest / AIResponse types (ok/err discriminated)
└── index.ts                   barrel
```

**Key design points:**
- **Reactivity = plain `EventTarget`.** NOT Svelte runes. NOT `@preact/signals-core`. This keeps game/ framework-independent. Svelte components subscribe via `$effect(() => store.addEventListener(...))`.
- **`AITransport` interface:**
  ```ts
  interface AITransport {
    send(req: AIRequest): void;
    onMessage(handler: (res: AIResponse) => void): void;
    close(): void;
  }
  ```
  `AIWorkerClient` takes `AITransport` in constructor. Enables: fake transport for tests, Tauri IPC transport future, in-process transport for CLI debugger.
- **Worker protocol rule (explicit):** *"Only `string`, `number`, `boolean`, and plain-object payloads cross the AITransport. `Position` class instances NEVER cross. Use `PositionSnapshot` or FEN string."* Documented in ARCHITECTURE.md + enforced by type shape.
- **GameStore owns:** current Position, move history (for retract), terminal state detection, repetition/perpetual check rules, handicap setup. Emits `GameEvent` (from engine) on every state change.
- **Retract logic lives here**, not in app. Fixes the existing `game.js:33` leak where app-layer code imported `isChecked` from engine directly.

**Public API:** `GameStore`, `GameState`, `GameError`, `AITransport`, `AIWorkerClient`, `AIRequest`, `AIResponse`.

### 2.4 `@jschess/app`

**Contents:**
```
src/
├── App.svelte                  root, instantiates GameStore + WorkerTransport
├── components/
│   ├── Board.svelte            10×9 grid, click/drag, animations
│   ├── MoveList.svelte         move history (port of #selMoveList)
│   └── Controls.svelte         谁先走 / 让子 / 水平 / 动画 / 音效 buttons
├── audio/
│   ├── audio-player.ts         wraps Audio(); subscribes to GameStore events → plays WAV.*
│   └── sounds.ts               Map<WAV, string> filename mapping
├── workers/
│   └── ai.worker.ts            Worker entry — imports @jschess/ai + @jschess/game protocol
├── lib/
│   └── worker-transport.ts     implements AITransport over postMessage;
│                               owns the `new Worker(new URL('../workers/ai.worker.ts',
│                               import.meta.url), { type: 'module' })` call
├── main.ts                     entry point
└── app.css
```

**Why the worker entry lives in app/ (Oracle insight):**
Vite's `new Worker(new URL('./worker.ts', import.meta.url))` pattern requires the worker file statically resolvable from the importing source. If `AIWorkerEntry` lived in `@jschess/game` (a symlinked workspace package), Vite's bundler fights its own resolution. Solution: worker entry file lives in `app/src/workers/ai.worker.ts`, but it's just 10 lines — imports `@jschess/ai`'s `Search` + `@jschess/game`'s protocol types and runs the message loop. The contract remains atomic because sender (`AIWorkerClient` in game/) and receiver (worker in app/) both consume the same `AIRequest`/`AIResponse` types from `@jschess/game`.

**Audio is event-driven (Oracle + explore insight):**
`audio-player.ts` subscribes to `GameStore` events:
```ts
store.addEventListener('move', () => player.play(WAV.MOVE));
store.addEventListener('capture', () => player.play(WAV.CAPTURE));
store.addEventListener('check', () => player.play(WAV.CHECK));
store.addEventListener('mate', (e) => player.play(e.detail.winner === myColor ? WAV.WIN : WAV.LOSE));
```
GameStore has zero audio dependency. Muting sound = unsubscribe audio-player.

---

## 3. Data Flow

```
User clicks square on Board.svelte
       │
       ▼
GameStore.handleClick(sq)
       │  validates via @jschess/engine.generateMoves()
       ▼
GameStore.applyMove(move)
       │  updates Position, history, state machine
       │
       ├─► emits GameEvent ────► Board.svelte re-renders (via $effect)
       │                     └─► audio-player plays sound
       │
       └─► if computer's turn:
           AIWorkerClient.request({ id, fen, level, timeMs })
                │  serialized via AITransport.send
                ▼
           (WorkerTransport posts to Worker)
                │
                ▼
           ai.worker.ts receives → @jschess/ai.search()
                │
                ▼
           posts { id, ok: true, move, score, depth, nodes }
                │
                ▼
           AIWorkerClient resolves Promise<AIResponse>
                │
                ▼
           GameStore.applyMove(response.move)  ← (back to the top loop)
```

**Key properties:**
- GameStore is the single source of truth for game state.
- UI never blocks on AI — all worker calls are Promise-based.
- Engine and AI have zero knowledge of UI existence — fully testable in Node.
- Swapping Svelte for another framework requires rewriting only `app/components/*.svelte` + `App.svelte`. GameStore stays untouched.

---

## 4. Error Handling

### GameError union (typed in `game/`)
```ts
type GameError =
  | { kind: 'IllegalMove'; attempted: Move; reason: string }
  | { kind: 'FenParseError'; input: string; detail: string }
  | { kind: 'WorkerCrashed'; transport: AITransport }
  | { kind: 'WorkerTimeout'; elapsedMs: number };
```

### Recovery strategies
- `IllegalMove` → reject + highlight square briefly (shouldn't happen with UI validation).
- `FenParseError` → toast + revert to initial position.
- `WorkerCrashed` → recreate transport, retry last request once, else surface to user.
- `WorkerTimeout` → return lower-depth best move if any, else surface error.

App consumes via exhaustive `switch` — TypeScript enforces handling every variant.

---

## 5. Testing Strategy

Vitest in every package and tool.

| Target | Tests |
|---|---|
| `engine/primitives/zobrist` | **Golden value test FIRST** — hash fixed FEN, compare to pre-computed constant (catches Node↔browser determinism bugs) |
| `engine/rules` | Perft tests (move-gen correctness), FEN round-trip, evaluation smoke tests |
| `ai/search` | Mate-in-N puzzles, depth/time limit respect |
| `ai/book` | Load + lookup, structured correctness |
| `game/store` | State transitions, retract correctness, handicap setup, event emission |
| `game/ai-client` | Fake AITransport → contract tests for request/response pairing |
| `app/components` | Minimal smoke tests (avoid heavy UI testing) |
| `tools/book-parity-test` | **Binary-equal** legacy-JS vs new-JSON book lookup over 1000+ positions |
| `tools/headless-battle` | AI self-play parity: legacy engine vs new engine, 20 games, assert result distribution within tolerance |

First concrete work step: port existing `js/test.js` cases into `engine/` Vitest suite to preserve the current safety net before changing anything.

---

## 6. Deployment Pipeline

`.github/workflows/deploy.yml` triggers on `v*` tag push:

```
1. actions/checkout
2. oven-sh/setup-bun@v1
3. bun install --frozen-lockfile
4. bun run typecheck          # tsc --build across all packages
5. bun run test               # vitest run across all packages
6. bun run build              # vite build inside packages/app only
7. actions/upload-pages-artifact (dist/)
8. actions/deploy-pages
```

**Vite config** in `packages/app/vite.config.ts`:
- `base: '/jschess/'` so assets resolve on `https://<user>.github.io/jschess/`.
- Worker bundling via `{ format: 'es', plugins: [] }` — Vite emits a separate chunk for `ai.worker.ts`.

Workflow fails fast on any typecheck/test failure. Tag format: semver `v1.2.3`.

---

## 7. Engineering Practices

- **Strict TS:** `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `exactOptionalPropertyTypes: true`. Zero `any`. Zero `@ts-ignore`.
- **Linting:** ESLint + Prettier at repo root. `eslint-plugin-import` for boundaries.
- **CI-enforced boundaries:** `scripts/check-boundaries.sh` greps for forbidden cross-package imports. Fails CI if violated.
- **Conventional commits** matching existing git style (`feat:`, `fix:`, `refactor:`, `perf:`, `chore:`).
- **Docs:** `docs/ARCHITECTURE.md` (one-page layer diagram + dependency rules + the "Worker boundary is plain-data only" rule).
- **No git hooks** (user chose core practices, not production-grade).

---

## 8. Migration Phases (detailed plan from writing-plans skill follows)

1. **Scaffold:** Bun workspace, tsconfig base, lint/format config, CI skeleton.
2. **Archive:** move `js/`, `index.html`, `css/`, `server/` → `legacy/`. Verify legacy game still runs locally.
3. **Port engine/primitives:** core → new structure; Zobrist golden-value test as acceptance gate.
4. **Port engine/rules:** position (with `Uint8Array`), movegen, evaluate, fen; perft tests.
5. **Port ai/search:** search, hashtable, movesort.
6. **Activate ai/book:** `tools/book-extractor` generates book.json; wire into search; binary-parity test must pass.
7. **Build game/:** GameStore (port board.js state machine + retract from game.js), AITransport, AIWorkerClient, protocol types.
8. **Build app/:** Svelte components, worker entry, WorkerTransport, audio-player (event-subscriber pattern).
9. **CI/CD:** configure deploy.yml, test via pre-release tag `v0.1.0-rc.1`.
10. **Parity verification:** `tools/headless-battle` runs legacy-vs-new AI self-play; book-parity-test passes.
11. **Swap:** delete `legacy/`, update README, tag `v1.0.0`.

---

## 9. Risks & Mitigations (implementation phase)

| Risk | Mitigation |
|---|---|
| Zobrist tables differ between Node and browser (RC4 + `\| 0` semantics) | Golden-value test on day 1; if diverges, lock to a pre-computed JSON table |
| `noUncheckedIndexedAccess` forces `!` pollution in hot paths | Switch `squares` to `Uint8Array(256)` (also faster) |
| Book extraction loses fidelity | Binary-parity test is a merge blocker, not an aspiration |
| Vite worker bundling with `base: '/jschess/'` works in dev but breaks in prod | Test `vite build` output locally + pre-release tag before `v1.0.0` |
| Svelte 5 runes leak into `game/` package | CI greps for `$state`/`$derived`/`$effect` inside `packages/game/src/**/*.ts`, fails if found |
| Worker structured-clone cost for large book | Worker loads `book.json` via its own dynamic import, not via postMessage from main thread |
| `@jschess/game` reactivity choice drifts later | `EventTarget` pattern documented in ARCHITECTURE.md; package.json of `game` declares zero framework/signal deps |
