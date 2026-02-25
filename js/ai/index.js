"use strict";

/**
 * @description ai 层统一入口
 *
 * ai 层封装 Alpha-Beta 搜索引擎及其配套数据结构，依赖 core + engine 层。
 * ─────────────────────────────────────────────────────────────────────────────
 * hashtable.js  ── HashTable：置换表（Transposition Table）
 * movesort.js   ── MoveSort：走法排序；HistoryTable：历史启发表
 * search.js     ── Search：迭代加深 + Alpha-Beta + 空步裁剪 + 静态搜索
 */

export { HashTable, HASH_ALPHA, HASH_BETA, HASH_EXACT } from './hashtable.js';
export { MoveSort, HistoryTable }                        from './movesort.js';
export { Search }                                        from './search.js';
