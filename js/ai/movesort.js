"use strict";

import { MVV_VALUE } from '../core/constants.js';
import { oppTag } from '../core/piece.js';
import { moveDst } from '../core/move.js';

/**
 * @description 走法排序模块
 *
 * 好的走法排序是 alpha-beta 剪枝效率的关键：
 * 优先搜索"可能更好"的走法，可以尽早触发 beta 截断。
 *
 * 排序优先级（从高到低）：
 *   1. 置换表走法（hashMove）  ── 通常是已搜索过的最佳走法
 *   2. 吃子走法（MVV/LVA）    ── 吃高价值子的走法排前面
 *   3. 杀手走法（killer）      ── 同层中导致 beta 截断的非吃子走法
 *   4. 历史表走法（history）   ── 过去搜索中表现好的走法
 *   5. 其余走法（无排序）
 *
 * @class MoveSort
 */
export class MoveSort {
    /**
     * @param {number[]} moves     原始走法列表（由 generateMoves 产生）
     * @param {Position} pos       当前局面（用于判断吃子）
     * @param {number}   hashMove  置换表中的最佳走法（0 表示无）
     * @param {number[]} killers   杀手走法数组（[killer0, killer1]）
     * @param {Int32Array} history 历史表（[mvIdx] → 历史分）
     */
    constructor(moves, pos, hashMove, killers, history) {
        this._scores = new Int32Array(moves.length);
        this._moves  = moves;
        this._sorted = false;

        const sqOpp = oppTag(pos.sdPlayer);

        for (let i = 0; i < moves.length; i++) {
            const mv  = moves[i];
            const dst = moveDst(mv);

            if (mv === hashMove) {
                // 1. 置换表走法：最高优先级
                this._scores[i] = 0x7FFFFFFF;
            } else {
                const target = pos.squares[dst];
                if ((target & sqOpp) !== 0) {
                    // 2. 吃子走法：MVV（Most Valuable Victim）
                    this._scores[i] = 0x100000 + MVV_VALUE[target & 7];
                } else if (mv === killers[0]) {
                    // 3a. 杀手走法 0
                    this._scores[i] = 0x80000;
                } else if (mv === killers[1]) {
                    // 3b. 杀手走法 1
                    this._scores[i] = 0x40000;
                } else {
                    // 4. 历史表分
                    this._scores[i] = history[mv & 0xFFFF] || 0;
                }
            }
        }
    }

    /**
     * @method 每次调用返回当前得分最高的走法（选择排序，不全排）
     * 对于 alpha-beta 来说，只要找到截断，剩余走法不需要排序，
     * 选择排序比全排序更高效。
     * @returns {number} 走法编码，-1 表示走法已全部返回
     */
    next() {
        if (this._moves.length === 0) {
            return -1;
        }

        // 找出得分最高的走法（选择排序单步）
        let bestIdx = 0;
        for (let i = 1; i < this._moves.length; i++) {
            if (this._scores[i] > this._scores[bestIdx]) {
                bestIdx = i;
            }
        }

        const mv = this._moves[bestIdx];
        // 将已选走法移到末尾并缩短数组
        const lastIdx = this._moves.length - 1;
        this._moves[bestIdx]  = this._moves[lastIdx];
        this._scores[bestIdx] = this._scores[lastIdx];
        this._moves.length--;

        return mv;
    }
}

/**
 * @description 历史表（走法历史启发）
 *
 * 历史表记录搜索中每个走法的"表现分"：
 *   - 走法引发 beta 截断时，历史分 += 2^depth（深度越深权重越高）
 *   - 历史表按 (src << 8 | dst) 索引，大小为 65536
 *
 * 每次新搜索开始时，历史分右移 1 位（衰减），避免过时信息主导排序。
 */
export class HistoryTable {
    constructor() {
        this._table = new Int32Array(65536);
    }

    /** 清空历史表（新局开始时调用） */
    clear() {
        this._table.fill(0);
    }

    /** 历史分衰减（每次迭代加深前调用） */
    decay() {
        for (let i = 0; i < this._table.length; i++) {
            this._table[i] >>= 1;
        }
    }

    /**
     * @method 增加走法的历史分
     * @param {number} mv    走法编码
     * @param {number} depth 当前搜索深度（分值权重）
     */
    add(mv, depth) {
        this._table[mv & 0xFFFF] += 1 << depth;
    }

    /**
     * @method 获取走法的历史分
     * @param {number} mv
     * @returns {number}
     */
    get(mv) {
        return this._table[mv & 0xFFFF];
    }

    /** 返回底层数组（供 MoveSort 直接访问，避免函数调用开销） */
    get table() {
        return this._table;
    }
}
