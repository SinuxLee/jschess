"use strict";

/**
 * @description core 层统一入口
 *
 * core 层只包含纯数据和纯函数，零副作用，可在任意环境（浏览器/Node/Worker）复用。
 * ─────────────────────────────────────────────────────────────────────────────
 * constants.js  ── 枚举、搜索常量、位移向量
 * tables.js     ── 只读查找表（棋盘边界、九宫格、估值表、LEGAL_SPAN、KNIGHT_PIN）
 * coords.js     ── 坐标编解码纯函数（makeCoord / getX / flipSq / isOnBoard …）
 * move.js       ── 走法编解码纯函数（makeMove / moveSrc / moveDst / mirrorMove …）
 * piece.js      ── 棋子编解码纯函数（sideTag / oppTag / pieceType / makePiece …）
 * zobrist.js    ── Zobrist 哈希表单例（ZOBRIST）及棋子索引函数
 */

export * from './constants.js';
export * from './tables.js';
export * from './coords.js';
export * from './move.js';
export * from './piece.js';
export * from './zobrist.js';
