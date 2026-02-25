"use strict";

import { MATE_VALUE, DRAW_VALUE, ADVANCED_VALUE, WIN_VALUE } from '../core/constants.js';

/**
 * @description 局面静态估值模块（纯函数）
 *
 * 所有估值均以「当前行棋方」为正方向：
 *   - 正值 → 对当前行棋方有利
 *   - 负值 → 对当前行棋方不利
 *
 * 估值由两部分组成：
 *   1. 位置估值（動態棋子表）：在 Position.addPiece 中增量维护
 *      pos.vlRed / pos.vlBlack 保存红/黑双方的位置累加值
 *   2. 先手加成：鼓励先手一方争取优势
 *
 * 该模块还提供：
 *   - 历史重复检测（长将/长打 → 输棋；一般重复 → 平局）
 *   - 将死/绝路检测（无法走棋 → 输棋）
 */

/**
 * @method 计算当前局面的静态估值
 * @param {Position} pos
 * @returns {number} 当前行棋方视角的估值
 */
export function evaluate(pos) {
    const vl = (pos.sdPlayer === 0 ? pos.vlRed - pos.vlBlack : pos.vlBlack - pos.vlRed)
        + ADVANCED_VALUE;
    return vl === 0 ? DRAW_VALUE : vl;
}

/**
 * @method 历史重复检测
 *
 * 检查当前局面是否在历史中出现过，并判断是否构成"长将"或"长打"。
 * 规则：
 *   - 长将（单方连续将军导致重复）→ 该方判负（BAN_VALUE）
 *   - 一般重复（双方均有非强制性重复）→ 平局（DRAW_VALUE）
 *
 * @param {Position} pos
 * @param {number} [recur=1] 允许重复几次（1 = 首次重复即检测）
 * @returns {number} 0=无重复；否则返回相应评分（从当前方视角）
 */
export function repValue(pos, recur = 1) {
    const stack = pos.moveStack;
    const len = stack.length;

    // 沿历史向上查找，每两步为一组（双方各一步）
    let selfSide = true;  // 轮流检查自己和对方
    let repSelf  = 0;
    let repOpp   = 0;
    let rep      = 0;

    // 从栈顶（最新一步）向下搜索，找到连续未吃子的序列
    for (let i = len - 1; i >= 1; i--) {
        const entry = stack[i];

        // 遇到吃子或不可逆走法，停止回溯
        if (entry.captured > 0 || entry.mv === 0) {
            break;
        }

        // 检查 Zobrist 是否匹配当前局面
        if (entry.prevKey === pos.zobristKey && entry.prevLock === pos.zobristLock) {
            rep++;
            if (rep >= recur) {
                // 分析这次重复的性质
                return pos.sdPlayer === 0
                    ? _repScore(repSelf, repOpp)
                    : _repScore(repOpp, repSelf);
            }
        }

        if (selfSide) {
            repSelf += entry.inCheck ? 2 : 0; // 将军加权
        } else {
            repOpp  += entry.inCheck ? 2 : 0;
        }
        selfSide = !selfSide;
    }

    return 0;
}

/**
 * @description 根据双方将军次数确定重复惩罚分
 * @param {number} s 己方将军权重
 * @param {number} o 对方将军权重
 * @returns {number} 估值调整量（从红方视角）
 */
function _repScore(s, o) {
    if (s > o) {
        // 己方长将 → 己方输
        return -WIN_VALUE;
    }
    if (o > s) {
        // 对方长将 → 己方赢
        return WIN_VALUE;
    }
    // 双方都没将 / 将军次数相同 → 平局
    return -DRAW_VALUE;
}

/**
 * @method 将死/困毙评分
 * 当一方走法为空时调用，返回输棋分（由当前方视角）。
 * 越早被将死，惩罚越重（鼓励 AI 尽快将死对方）。
 *
 * @param {Position} pos
 * @returns {number} 负分（越大绝对值越快输）
 */
export function mateValue(pos) {
    return pos.inCheck()
        ? pos.distance - MATE_VALUE // 被将死（distance 越大扣分越少）
        : -DRAW_VALUE;               // 困毙（无子可走但未被将，按平局处理）
}
