## Migration In Progress (TypeScript Refactor)

The legacy vanilla-JS codebase has moved to `legacy/`. It remains runnable — open `legacy/index.html` with a local web server (e.g. VSCode Live Server) to play the old version while the TypeScript rewrite is under way.

New code lives in `packages/`:

- `@jschess/engine` — chess primitives + rules
- `@jschess/ai` — search + opening book
- `@jschess/game` — match state + AI client (framework-agnostic)
- `@jschess/app` — Svelte 5 + Vite UI (the deployable artifact)

See `docs/ARCHITECTURE.md` and `docs/superpowers/specs/2026-04-30-jschess-typescript-refactor-design.md`.

---

## 实体

1. 棋子

2. 桌子(棋盘)

3. 玩家

4. 房间
    房间管理玩家、棋局、开局规则、棋局录像
    一个房间只能开一盘棋局，但可以容纳多个人(选手和观众)

5. 匹配队列

## 算法

1. Zobrist 哈希算法
2. Rivest Cipher 4 加密算法
3. 希尔排序
4. 二叉搜索

## 前端使用ES6语法

开发时，运行依赖于VSCode中"Live Server"插件

## TODO LIST

- [x] split board.js and position.js
- [x] ui.js and position.js
- [x] 内聚 position.js 和 search.js
- [ ] 用 Vue + Element-UI 重构界面
- [ ] 用脚本自动生成 book.js
- [ ] board -> desk, position -> board
- [ ] search -> ai, 可以启动多个AI。左右互搏，哈哈
- [ ] 使用 Web Worker 计算最佳着法
