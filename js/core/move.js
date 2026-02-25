"use strict";

import { mirrorSq, sqToIccs } from './coords.js';

/**
 * @description 走法编解码工具（纯函数）
 *
 * 走法编码：mv = src | (dst << 8)
 *   - 低 8 位：起始坐标 src
 *   - 高 8 位：目标坐标 dst
 */

/** 空走法（无效着法占位符）*/
export const MOVE_NONE = 0;

/**
 * @method 由起点和终点构造走法
 * @param {number} src 起始坐标
 * @param {number} dst 目标坐标
 * @returns {number} mv
 */
export function makeMove(src, dst) {
    return src | (dst << 8);
}

/**
 * @method 从走法中提取起始坐标
 * @param {number} mv
 * @returns {number} src
 */
export function moveSrc(mv) {
    return mv & 0xFF;
}

/**
 * @method 从走法中提取目标坐标
 * @param {number} mv
 * @returns {number} dst
 */
export function moveDst(mv) {
    return mv >> 8;
}

/**
 * @method 获取走法的左右镜像走法
 * @param {number} mv
 * @returns {number} 镜像走法
 */
export function mirrorMove(mv) {
    return makeMove(mirrorSq(moveSrc(mv)), mirrorSq(moveDst(mv)));
}

/**
 * @method 将走法转换为 ICCS 字符串表示
 * ICCS 格式示例："H2-E2"（起点-终点）
 * @param {number} mv
 * @returns {string}
 */
export function moveToIccs(mv) {
    return sqToIccs(moveSrc(mv)) + '-' + sqToIccs(moveDst(mv));
}
