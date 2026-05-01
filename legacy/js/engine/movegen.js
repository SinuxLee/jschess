"use strict";

import { IN_BOARD, LEGAL_SPAN, KNIGHT_PIN } from '../core/tables.js';
import { KING_DELTA, ADVISOR_DELTA, KNIGHT_DELTA, KNIGHT_CHECK_DELTA } from '../core/constants.js';
import { sideTag, oppTag, pieceType } from '../core/piece.js';
import { makeMove } from '../core/move.js';
import { isInFort } from '../core/coords.js';

/**
 * @description 走法生成模块（纯函数，无副作用）
 *
 * 生成一个 Position 下所有合法（伪合法）走法，
 * 合法性校验（自将）由 position.makeMove 内部完成。
 *
 * 生成顺序：将 → 士 → 象 → 马 → 车 → 炮 → 卒
 * 吃子走法和不吃子走法均混合生成（后续由 MoveSort 排序）。
 *
 * @param {Position} pos 当前局面
 * @returns {number[]} 走法数组（每个元素为 mv 编码）
 */
export function generateMoves(pos) {
    const moves = [];
    const sqSelf = sideTag(pos.sdPlayer);
    const sqOpp  = oppTag(pos.sdPlayer);

    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
        const pc = pos.squares[sqSrc];
        if ((pc & sqSelf) === 0) {
            continue; // 不是己方棋子
        }

        const type = pc & 7; // 棋子类型（0-6）

        switch (type) {
            case 0: { // 将/帅
                for (const delta of KING_DELTA) {
                    const sqDst = sqSrc + delta;
                    if (!IN_BOARD[sqDst] || !isInFort(sqDst)) {
                        continue;
                    }
                    const target = pos.squares[sqDst];
                    if ((target & sqSelf) === 0) {
                        moves.push(makeMove(sqSrc, sqDst));
                    }
                }
                break;
            }
            case 1: { // 士/仕
                for (const delta of ADVISOR_DELTA) {
                    const sqDst = sqSrc + delta;
                    if (!IN_BOARD[sqDst] || !isInFort(sqDst)) {
                        continue;
                    }
                    const target = pos.squares[sqDst];
                    if ((target & sqSelf) === 0) {
                        moves.push(makeMove(sqSrc, sqDst));
                    }
                }
                break;
            }
            case 2: { // 象/相
                for (const delta of ADVISOR_DELTA) {
                    const sqMid = sqSrc + delta;    // 象眼
                    const sqDst = sqSrc + delta * 2; // 落点
                    if (!IN_BOARD[sqDst]) {
                        continue;
                    }
                    // 象/相不能过河
                    if (((sqDst ^ sqSrc) & 0x80) !== 0) {
                        continue;
                    }
                    // 象眼不能有子
                    if (pos.squares[sqMid] !== 0) {
                        continue;
                    }
                    const target = pos.squares[sqDst];
                    if ((target & sqSelf) === 0) {
                        moves.push(makeMove(sqSrc, sqDst));
                    }
                }
                break;
            }
            case 3: { // 马
                for (let dir = 0; dir < 4; dir++) {
                    const sqMid = sqSrc + KING_DELTA[dir]; // 马腿格
                    if (!IN_BOARD[sqMid] || pos.squares[sqMid] !== 0) {
                        continue; // 马腿被堵
                    }
                    for (const delta of KNIGHT_DELTA[dir]) {
                        const sqDst = sqSrc + delta;
                        if (!IN_BOARD[sqDst]) {
                            continue;
                        }
                        const target = pos.squares[sqDst];
                        if ((target & sqSelf) === 0) {
                            moves.push(makeMove(sqSrc, sqDst));
                        }
                    }
                }
                break;
            }
            case 4: { // 车
                for (const delta of KING_DELTA) {
                    let sqDst = sqSrc + delta;
                    while (IN_BOARD[sqDst]) {
                        const target = pos.squares[sqDst];
                        if (target === 0) {
                            moves.push(makeMove(sqSrc, sqDst));
                        } else {
                            if ((target & sqOpp) !== 0) {
                                moves.push(makeMove(sqSrc, sqDst));
                            }
                            break;
                        }
                        sqDst += delta;
                    }
                }
                break;
            }
            case 5: { // 炮
                for (const delta of KING_DELTA) {
                    let sqDst = sqSrc + delta;
                    // 炮的非吃子移动（沿途无子）
                    while (IN_BOARD[sqDst]) {
                        if (pos.squares[sqDst] === 0) {
                            moves.push(makeMove(sqSrc, sqDst));
                        } else {
                            break;
                        }
                        sqDst += delta;
                    }
                    // 炮的吃子移动（跨过一个炮架）
                    sqDst += delta;
                    while (IN_BOARD[sqDst]) {
                        const target = pos.squares[sqDst];
                        if (target !== 0) {
                            if ((target & sqOpp) !== 0) {
                                moves.push(makeMove(sqSrc, sqDst));
                            }
                            break;
                        }
                        sqDst += delta;
                    }
                }
                break;
            }
            case 6: { // 卒/兵
                // 前进方向（红方向上 -16，黑方向下 +16）
                const forward = pos.sdPlayer === 0 ? -16 : 16;
                const sqFwd = sqSrc + forward;
                if (IN_BOARD[sqFwd]) {
                    const target = pos.squares[sqFwd];
                    if ((target & sqSelf) === 0) {
                        moves.push(makeMove(sqSrc, sqFwd));
                    }
                }
                // 过河后可以左右移动
                // 红方(sdPlayer=0)本阵 y>=8 即 sq&0x80!=0；过河后 sq&0x80==0
                // 黑方(sdPlayer=1)本阵 y< 8 即 sq&0x80==0；过河后 sq&0x80!=0
                // 统一：过河 = (sqSrc & 0x80) === (pos.sdPlayer === 0 ? 0 : 0x80)
                //            = ((sqSrc ^ (pos.sdPlayer === 0 ? 0x80 : 0)) & 0x80) !== 0
                if (((sqSrc ^ (pos.sdPlayer === 0 ? 0x80 : 0)) & 0x80) !== 0) {
                    for (const delta of [-1, 1]) {
                        const sqLR = sqSrc + delta;
                        if (IN_BOARD[sqLR]) {
                            const target = pos.squares[sqLR];
                            if ((target & sqSelf) === 0) {
                                moves.push(makeMove(sqSrc, sqLR));
                            }
                        }
                    }
                }
                break;
            }
            default:
                break;
        }
    }
    return moves;
}

/**
 * @description 判断当前行棋方的将/帅是否处于被将状态
 * @param {Position} pos
 * @returns {boolean}
 */
export function isChecked(pos) {
    const sqSelf = sideTag(pos.sdPlayer);
    const sqOpp  = oppTag(pos.sdPlayer);

    // 找到己方将/帅的位置
    let sqKing = -1;
    for (let sq = 0; sq < 256; sq++) {
        if (pos.squares[sq] === sqSelf) { // sqSelf + 0 = 将/帅编码
            sqKing = sq;
            break;
        }
    }
    if (sqKing < 0) {
        return true; // 将已被吃（不合法局面，视为被将）
    }

    // 1. 检查是否被对方将/帅"照面"（老将对脸）
    for (const delta of KING_DELTA) {
        let sq = sqKing + delta;
        while (IN_BOARD[sq]) {
            const pc = pos.squares[sq];
            if (pc !== 0) {
                if (pc === (sqOpp + 0)) { return true; } // 对方将
                break;
            }
            sq += delta;
        }
    }

    // 2. 检查是否被对方马攻击
    for (let dir = 0; dir < 4; dir++) {
        for (const delta of KNIGHT_CHECK_DELTA[dir]) {
            const sqSrc = sqKing + delta;
            if (!IN_BOARD[sqSrc]) {
                continue;
            }
            const pc = pos.squares[sqSrc];
            if (pc !== (sqOpp + 3)) {
                continue; // 不是对方马
            }
            // 验证马腿
            const pin = KNIGHT_PIN[sqKing - sqSrc + 256];
            if (pos.squares[sqSrc + pin] === 0) {
                return true;
            }
        }
    }

    // 3. 检查是否被对方车/炮攻击（行/列方向）
    for (const delta of KING_DELTA) {
        let sq = sqKing + delta;
        let cannon = false; // 是否已经跨过炮架
        while (IN_BOARD[sq]) {
            const pc = pos.squares[sq];
            if (pc !== 0) {
                if (!cannon) {
                    // 车的威胁（直接相邻或无遮挡）
                    if (pc === (sqOpp + 4)) { return true; }
                    cannon = true;
                } else {
                    // 炮的威胁（跨过一个炮架）
                    if (pc === (sqOpp + 5)) { return true; }
                    break;
                }
            }
            sq += delta;
        }
    }

    // 4. 检查是否被对方卒/兵攻击
    // 红方将被黑方卒攻击：黑方卒在前方或左右
    const oppPawn = sqOpp + 6;
    const fwdDelta = pos.sdPlayer === 0 ? -16 : 16;
    // 正前方
    let sqTest = sqKing + fwdDelta;
    if (IN_BOARD[sqTest] && pos.squares[sqTest] === oppPawn) {
        return true;
    }
    // 左右（对方卒过河后可横向攻击）
    for (const delta of [-1, 1]) {
        sqTest = sqKing + delta;
        if (IN_BOARD[sqTest] && pos.squares[sqTest] === oppPawn) {
            return true;
        }
    }

    return false;
}
