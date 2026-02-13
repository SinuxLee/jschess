# AGENTS.md — jschess (Chinese Chess / 中国象棋)

## Project Overview

Browser-based Chinese Chess (Xiangqi) game with AI opponent. Pure JavaScript ES modules, no framework, no bundler, no TypeScript. Client runs in browser via Live Server; server module provides parallel test runner using `worker_threads`.

### Architecture

```
js/            # Client-side ES modules (browser)
  game.js      # Entry point — Game singleton, orchestrates board + UI + audio
  position.js  # Core engine — board representation, move generation, FEN parsing
  search.js    # AI — alpha-beta search, hash tables, iterative deepening
  board.js     # Game controller — move logic, computer response, undo
  ui.js        # DOM rendering — piece images, animation, alerts
  audio.js     # Sound effects via Audio API
  book.js      # Opening book (dat file loader)
  test.js      # Test runner — move generation correctness tests

server/        # Server-side (Node.js worker_threads)
  main.js      # Parallel test runner — distributes FEN puzzles across workers
  worker.js    # Individual worker thread
  workerpool.js# Worker pool manager
  position.js  # Server copy of position engine (identical API)
  search.js    # Server copy of search engine
  book.js      # Server copy of opening book
```

## Build / Lint / Test Commands

```bash
# Run tests (move generation correctness across puzzle positions)
node ./js/test.js

# Run parallel server-side tests (6 worker threads)
node ./server/main.js

# Lint (JSHint — config in .jshintrc)
npx jshint js/*.js

# Serve locally (use VSCode Live Server plugin, port 5000)
# Or any static HTTP server:
npx serve -p 5000
```

There is no build step. No compilation. No bundling. Files are served directly.

### Running a Single Test

There is no test framework. `js/test.js` runs all puzzles sequentially. To test a single FEN position, modify the `puzzleList` array in `test.js` to contain only the desired FEN string, then run `node ./js/test.js`.

## Code Style Guidelines

### Module System

- **ES Modules** (`"type": "module"` in package.json)
- Use `import`/`export` — never `require()`
- Named exports preferred: `export { Position, MATE_VALUE, isChessOnBoard }`
- Namespace imports used for large modules: `import * as position from './position.js'`
- Always include `.js` extension in import paths

### Strict Mode

- Every file MUST start with `"use strict";` (only exception: `audio.js`)

### Naming Conventions

| Entity | Convention | Examples |
|--------|-----------|----------|
| Classes | PascalCase | `Position`, `Search`, `UIBoard`, `GameAudio` |
| Constants | UPPER_SNAKE_CASE | `MATE_VALUE`, `LIMIT_DEPTH`, `UI_BOARD_WIDTH` |
| Functions/methods | camelCase | `makeMove`, `searchFull`, `drawSquare` |
| Enum-like objects | PascalCase key, UPPER values | `Piece.KING`, `Range.TOP`, `WAV.DRAW` |
| Private-ish fields | `_` prefix on `this` | `this._board`, `this._game`, `this._images` |
| Local variables | camelCase | `sqSrc`, `pcMoved`, `vlBest` |

### Variable Declarations

- Use `let` — never `var`
- Use `const` for module-level constants and frozen objects
- Enums: `const MyEnum = Object.freeze({ KEY: value, ... })`

### Classes and Patterns

- Singleton: `static getInstance()` pattern (see `Game`)
- No `#private` fields — use `_` prefix convention
- Constructor initializes all instance fields explicitly
- Inheritance via `extends` (e.g., `GameAudio extends EventTarget`)

### Formatting

- **Indentation**: 4 spaces
- **Semicolons**: Required (JSHint `asi` is on but codebase uses them)
- **Braces**: Required for all control structures (`curly: true` in JSHint)
- **Equality**: Strict only — `===` / `!==` (never `==` / `!=`, JSHint `eqeqeq`)
- **String literals**: Single quotes `'...'` or template literals `` `...` `` — no double quotes in JS
- **Line length**: No hard limit; long lookup tables are acceptable

### Comments

- **Language**: Chinese (中文) for explanatory comments, matching the domain
- **JSDoc**: Use `@class`, `@classdesc`, `@description`, `@method`, `@param`, `@returns`
- **Inline**: `//` for short notes; `/* */` for multi-line or section headers
- **Intentional fall-through**: Mark with `// No Break` comment in switch statements

### Functions and Methods

- Default parameters: `initBoard(thinking = 10, computer = 1)`
- Async/await for UI operations (animation, alerts, delays)
- `sleepMS(ms)` returns `new Promise(resolve => setTimeout(resolve, ms))`
- Callbacks via method references: `this.onAddMove = callback`

### Error Handling

- Minimal — this is a game, not a service
- No try/catch blocks in client code
- No custom error classes
- Validation via boolean checks and early returns
- Server workers: errors propagate naturally through Promise rejection

### Bitwise Operations

- Extensively used for position encoding: `sq = (y << 4) | x`
- Extract coordinates: `x = sq & 15`, `y = sq >> 4`
- Move encoding: `mv = src | (dst << 8)`
- This is intentional and performance-critical — do NOT refactor to arithmetic

### Chess-Specific Conventions

- Board is 16x16 internally (only 10x9 used), indexed by single integer `sq`
- Pieces encoded as integers: 8-14 = red pieces, 16-22 = black pieces
- Side: 0 = red, 1 = black; flip side with `1 - side`
- FEN strings use standard Xiangqi notation
- Move notation: ICCS format (e.g., "h2e2") for interchange

### DOM / UI Patterns

- Direct DOM manipulation — `document.createElement`, `element.style.*`
- Event handlers: inline HTML `onclick="game.method()"` for menu buttons
- IIFE closures for loop-bound event handlers
- Image paths: `'images/' + name + '.gif'`
- No CSS framework — single `layout.css` file

### Key Domain Objects

```
Game          — singleton, top-level orchestrator
Board         — game state controller (position + search + UI coordination)
Position      — chess position (board array, move gen, make/unmake, FEN, Zobrist hash)
Search        — AI engine (alpha-beta, hash table, killer/history heuristics)
UIBoard       — DOM rendering, piece images, animation
GameAudio     — sound playback
MoveSort      — internal to search, move ordering helper
RC4           — internal to position, pseudo-random stream for Zobrist keys
WorkerPool    — server-side thread pool for parallel computation
```

## JSHint Configuration (.jshintrc)

Key rules enforced:
- `esversion: 6` — ES6 syntax allowed
- `strict: true` — require `"use strict"`
- `curly: true` — braces required
- `eqeqeq: true` — strict equality required
- `bitwise: true` — bitwise ops explicitly allowed
- `undef: true` — no undefined variables
- `newcap: true` — constructors must be capitalized

## Development Setup

1. Open project in VSCode
2. Install Live Server extension
3. Launch with Live Server (serves on port 5000, Chrome)
4. Entry point: `index.html` → imports `js/game.js` → `Game.getInstance()`

## Known TODOs (from README)

- Rewrite UI with Vue + ElementUI
- Move search to Web Worker for non-blocking UI
- Rename: board → desk, position → board, search → ai
