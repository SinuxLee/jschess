"use strict";

import { PieceType } from './constants.js';

/**
 * @description 棋子编解码工具（纯函数）
 *
 * 棋子编码规则：
 *   - 0：空格（无子）
 *   - 8 ~ 14：红方棋子（8 + PieceType）
 *   - 16 ~ 22：黑方棋子（16 + PieceType）
 *
 * 阵营标签（sideTag）：
 *   - 红方：8  （0b00001000）
 *   - 黑方：16 （0b00010000）
 * 用于快速判断棋子所属阵营：pc & sideTag(side) != 0
 */

/**
 * @method 获取指定阵营的己方标签
 * @param {number} side 0=红方, 1=黑方
 * @returns {number} 8（红）或 16（黑）
 */
export function sideTag(side) {
    return 8 + (side << 3);
}

/**
 * @method 获取指定阵营的敌方标签
 * @param {number} side 0=红方, 1=黑方
 * @returns {number} 16（红方的敌方=黑方）或 8（黑方的敌方=红方）
 */
export function oppTag(side) {
    return 16 - (side << 3);
}

/**
 * @method 提取棋子类型（0-6）
 * @param {number} pc 棋子编码
 * @returns {number} PieceType 枚举值
 */
export function pieceType(pc) {
    return pc & 7;
}

/**
 * @method 判断棋子是否属于指定阵营
 * @param {number} pc 棋子编码
 * @param {number} side 0=红方, 1=黑方
 * @returns {boolean}
 */
export function isSide(pc, side) {
    return (pc & sideTag(side)) !== 0;
}

/**
 * @method 构造棋子编码
 * @param {number} type PieceType 枚举值
 * @param {number} side 0=红方, 1=黑方
 * @returns {number} 棋子编码
 */
export function makePiece(type, side) {
    return sideTag(side) + type;
}

/**
 * @method 将 FEN 字符映射为棋子类型
 * 大写字母为红方，小写为黑方（此函数只返回类型，不区分阵营）
 * @param {string} ch 单个字符（大写）
 * @returns {number} PieceType 或 PieceType.UNKNOWN(-1)
 */
export function charToPieceType(ch) {
    switch (ch) {
        case 'K': return PieceType.KING;
        case 'A': return PieceType.ADVISOR;
        case 'B':
        case 'E': return PieceType.BISHOP;
        case 'H':
        case 'N': return PieceType.KNIGHT;
        case 'R': return PieceType.ROOK;
        case 'C': return PieceType.CANNON;
        case 'P': return PieceType.PAWN;
        default:  return PieceType.UNKNOWN;
    }
}
