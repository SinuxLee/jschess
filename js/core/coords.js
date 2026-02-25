"use strict";

import { IN_BOARD, IN_FORT } from './tables.js';
import { Range } from './constants.js';

/**
 * @description 棋盘坐标工具（纯函数，无副作用）
 *
 * 内部坐标编码：sq = (y << 4) | x
 *   - y：行号（0-15），棋盘有效行 3-12
 *   - x：列号（0-15），棋盘有效列 3-11
 * 坐标原点在左上角，y 向下增大，x 向右增大
 */

/**
 * @method 由 x、y 构造坐标值
 * @param {number} x 列
 * @param {number} y 行
 * @returns {number} sq
 */
export function makeCoord(x, y) {
    return x | (y << 4);
}

/**
 * @method 从坐标中提取列值 x
 * @param {number} sq
 * @returns {number} x（0-15）
 */
export function getX(sq) {
    return sq & 0xF;
}

/**
 * @method 从坐标中提取行值 y
 * @param {number} sq
 * @returns {number} y（0-15）
 */
export function getY(sq) {
    return sq >> 4;
}

/**
 * @method 棋盘上下翻转坐标（红黑视角互换）
 * @param {number} sq
 * @returns {number} 翻转后的坐标
 */
export function flipSq(sq) {
    return 254 - sq;
}

/**
 * @method 棋盘左右镜像坐标（X轴翻转）
 * @param {number} sq
 * @returns {number} 镜像坐标
 */
export function mirrorSq(sq) {
    return makeCoord(14 - getX(sq), getY(sq));
}

/**
 * @method 判断坐标是否在棋盘有效范围内
 * @param {number} sq
 * @returns {boolean}
 */
export function isOnBoard(sq) {
    return IN_BOARD[sq] !== 0;
}

/**
 * @method 判断坐标是否在九宫格内（将、士合法区域）
 * @param {number} sq
 * @returns {boolean}
 */
export function isInFort(sq) {
    return IN_FORT[sq] !== 0;
}

/**
 * @method 判断两个坐标是否在同一行（Y 相同）
 * @param {number} sqA
 * @param {number} sqB
 * @returns {boolean}
 */
export function sameRow(sqA, sqB) {
    return ((sqA ^ sqB) & 0xF0) === 0;
}

/**
 * @method 判断两个坐标是否在同一列（X 相同）
 * @param {number} sqA
 * @param {number} sqB
 * @returns {boolean}
 */
export function sameCol(sqA, sqB) {
    return ((sqA ^ sqB) & 0x0F) === 0;
}

/**
 * @method 判断两个坐标是否在同一半（同属红方区或黑方区）
 * 棋盘上半（黑方）：y < 8，即 sq & 0x80 == 0
 * 棋盘下半（红方）：y >= 8，即 sq & 0x80 != 0
 * @param {number} sqA
 * @param {number} sqB
 * @returns {boolean}
 */
export function sameHalf(sqA, sqB) {
    return ((sqA ^ sqB) & 0x80) === 0;
}

/**
 * @method 判断坐标是否在指定方的敌方阵地
 * @param {number} sq
 * @param {number} side 0=红方, 1=黑方
 * @returns {boolean} true 表示在敌方阵地
 */
export function isEnemyHalf(sq, side) {
    return (sq & 0x80) === (side << 7);
}

/**
 * @method 判断坐标是否在指定方的己方阵地
 * @param {number} sq
 * @param {number} side 0=红方, 1=黑方
 * @returns {boolean} true 表示在己方阵地
 */
export function isSelfHalf(sq, side) {
    return (sq & 0x80) !== (side << 7);
}

/**
 * @method 将棋盘坐标转换为 ICCS 字符（列字母 + 行数字）
 * ICCS 格式：列用 A-I 表示，行用 0-9 表示（从黑方底线 0 开始）
 * @param {number} sq
 * @returns {string} 如 "E0"、"H9"
 */
export function sqToIccs(sq) {
    return String.fromCharCode('A'.charCodeAt(0) + getX(sq) - Range.LEFT) +
           String.fromCharCode('9'.charCodeAt(0) - getY(sq) + Range.TOP);
}
