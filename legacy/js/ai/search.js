"use strict";

import { MATE_VALUE, BAN_VALUE, WIN_VALUE, DRAW_VALUE, NULL_OKAY_MARGIN, NULL_SAFE_MARGIN } from '../core/constants.js';
import { HashTable, HistoryTable, MoveSort } from './index.js';
import { HASH_ALPHA, HASH_BETA, HASH_EXACT } from './hashtable.js';
import { generateMoves, isChecked } from '../engine/movegen.js';
import { evaluate, repValue, mateValue } from '../engine/evaluate.js';

/**
 * @class Search
 * @classdesc 象棋 AI 搜索引擎
 *
 * 算法：迭代加深 + Alpha-Beta 剪枝 + 多项优化
 *
 * 优化列表：
 *   - 置换表（Transposition Table）        ── 避免重复搜索
 *   - 空步裁剪（Null Move Pruning）        ── 快速排除明显劣势局面
 *   - 历史启发（History Heuristic）        ── 优先搜索历史上好的走法
 *   - 杀手走法（Killer Heuristic）         ── 记录同层中导致截断的走法
 *   - MVV/LVA 吃子排序                    ── 优先搜索吃高价值子的走法
 *   - 迭代加深（Iterative Deepening）      ── 渐进加深，更好地利用时间
 *
 * 搜索框架：PVS（Principal Variation Search）+ NegaMax
 */
export class Search {
    /**
     * @param {Position} pos 当前局面（搜索过程中会修改，完成后恢复原状）
     */
    constructor(pos) {
        this._pos     = pos;
        this._hash    = new HashTable();
        this._history = new HistoryTable();

        /** 最大搜索层数（64 层足够所有实用深度）*/
        this._LIMIT_DEPTH = 64;

        /** 每层的杀手走法（2个槽位）*/
        this._killers = [];
        for (let i = 0; i < this._LIMIT_DEPTH; i++) {
            this._killers.push([0, 0]);
        }

        /** 本次搜索返回的最佳走法 */
        this.bestMove = 0;
    }

    // ─────────────────────────────────────────────────────────────
    // 公开接口
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 搜索最佳走法（迭代加深，受时间或深度限制）
     * @param {number} maxDepth  最大搜索深度（默认 64）
     * @param {number} [millis]  时间限制（毫秒），省略则只受深度限制
     * @returns {number} 本次搜索的最终估值
     */
    searchMain(maxDepth, millis) {
        this.bestMove = 0;
        let vl = 0;
        const limit = maxDepth || this._LIMIT_DEPTH;
        const deadline = (millis > 0) ? (Date.now() + millis) : Infinity;

        // 每次搜索重置辅助表
        this._hash.clear();
        this._history.clear();
        for (let i = 0; i < this._LIMIT_DEPTH; i++) {
            this._killers[i][0] = this._killers[i][1] = 0;
        }
        this._pos.distance = 0;

        // 迭代加深：从 1 层开始逐步加深到 limit
        for (let depth = 1; depth <= limit; depth++) {
            vl = this._searchRoot(depth);

            // 已找到将死，无需继续加深
            if (vl > WIN_VALUE || vl < -WIN_VALUE) {
                break;
            }

            // 超时退出
            if (Date.now() >= deadline) {
                break;
            }

            // 历史分衰减（避免浅层历史主导深层排序）
            this._history.decay();
        }

        return vl;
    }

    // ─────────────────────────────────────────────────────────────
    // 根节点搜索
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 根节点搜索（单次固定深度）
     * @param {number} depth
     * @returns {number} 当前根节点的最佳估值
     */
    _searchRoot(depth) {
        const pos = this._pos;
        let alpha = -MATE_VALUE;
        const beta = MATE_VALUE;

        // 查询置换表（根节点也查，主要为了获取最佳走法提示）
        const hashResult = this._hash.get(
            pos.zobristKey, pos.zobristLock,
            depth, alpha, beta, pos.distance
        );

        const moves = generateMoves(pos);
        const sort  = new MoveSort(
            moves, pos,
            hashResult.mv,
            this._killers[pos.distance],
            this._history.table
        );

        let bestMove = 0;
        let mv;

        while ((mv = sort.next()) !== -1) {
            if (!pos.makeMove(mv, isChecked)) {
                continue;
            }
            const vl = -this._searchFull(-beta, -alpha, depth - 1, false);
            pos.undoMakeMove();

            if (vl > alpha) {
                alpha    = vl;
                bestMove = mv;
                if (alpha >= beta) {
                    break;
                }
            }
        }

        if (bestMove !== 0) {
            this.bestMove = bestMove;
            this._hash.set(
                pos.zobristKey, pos.zobristLock,
                depth, HASH_EXACT, alpha, bestMove, pos.distance
            );
        }

        return alpha;
    }

    // ─────────────────────────────────────────────────────────────
    // 完整搜索（alpha-beta + 空步裁剪）
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 完整 alpha-beta 搜索
     * @param {number}  alpha
     * @param {number}  beta
     * @param {number}  depth
     * @param {boolean} nullOk  是否允许空步裁剪
     * @returns {number} 当前节点估值（当前方视角）
     */
    _searchFull(alpha, beta, depth, nullOk) {
        const pos = this._pos;

        // 1. 叶节点：静态搜索
        if (depth <= 0) {
            return this._searchQuiet(alpha, beta);
        }

        // 2. 重复检测
        const rep = repValue(pos);
        if (rep !== 0) {
            return rep;
        }

        // 3. 置换表查询
        const hashResult = this._hash.get(
            pos.zobristKey, pos.zobristLock,
            depth, alpha, beta, pos.distance
        );
        if (hashResult.hit) {
            return hashResult.vl;
        }

        // 4. 空步裁剪（不在将军状态下才可用）
        if (nullOk && !pos.inCheck() && pos.distance > 0) {
            const vlNull = evaluate(pos);
            if (vlNull >= beta + NULL_OKAY_MARGIN) {
                pos.nullMove(isChecked);
                const vl = -this._searchFull(-beta, 1 - beta, depth - 3, false);
                pos.undoNullMove();
                if (vl >= beta) {
                    if (vl >= WIN_VALUE) {
                        return beta; // 避免虚假将死
                    }
                    // 双重验证（降低深度再次验证）
                    if (vlNull >= beta + NULL_SAFE_MARGIN) {
                        return vl;
                    }
                    depth--;
                }
            }
        }

        // 5. 走法生成 + 排序
        const moves = generateMoves(pos);
        const sort  = new MoveSort(
            moves, pos,
            hashResult.mv,
            this._killers[pos.distance],
            this._history.table
        );

        let hashFlag = HASH_ALPHA;
        let bestMove = 0;
        let bestVl   = -MATE_VALUE;
        let mv;

        while ((mv = sort.next()) !== -1) {
            if (!pos.makeMove(mv, isChecked)) {
                continue;
            }
            const vl = -this._searchFull(-beta, -alpha, depth - 1, true);
            pos.undoMakeMove();

            if (vl > bestVl) {
                bestVl = vl;
                if (vl >= beta) {
                    // Beta 截断
                    hashFlag = HASH_BETA;
                    bestMove = mv;
                    // 更新杀手走法（非吃子）
                    if (pos.squares[mv >> 8] === 0) {
                        const killers = this._killers[pos.distance];
                        if (killers[0] !== mv) {
                            killers[1] = killers[0];
                            killers[0] = mv;
                        }
                    }
                    // 更新历史分
                    this._history.add(mv, depth);
                    break;
                }
                if (vl > alpha) {
                    hashFlag = HASH_EXACT;
                    alpha    = vl;
                    bestMove = mv;
                }
            }
        }

        // 6. 无合法走法 → 将死或困毙
        if (bestVl === -MATE_VALUE) {
            return mateValue(pos);
        }

        // 7. 写入置换表
        this._hash.set(
            pos.zobristKey, pos.zobristLock,
            depth, hashFlag, bestVl, bestMove, pos.distance
        );

        return bestVl;
    }

    // ─────────────────────────────────────────────────────────────
    // 静态搜索（Quiescence Search）
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 静态搜索（只搜索吃子走法，消除水平线效应）
     * @param {number} alpha
     * @param {number} beta
     * @returns {number} 估值
     */
    _searchQuiet(alpha, beta) {
        const pos = this._pos;

        // 重复检测
        const rep = repValue(pos);
        if (rep !== 0) {
            return rep;
        }

        // 静态估值
        let vl = evaluate(pos);
        if (vl >= beta) {
            return vl;
        }
        if (vl > alpha) {
            alpha = vl;
        }

        // 只生成吃子走法（伪合法）
        const allMoves = generateMoves(pos);
        const capMoves = allMoves.filter(mv => pos.squares[mv >> 8] !== 0);

        // 按 MVV 排序吃子走法
        capMoves.sort((a, b) => {
            const va = pos.squares[a >> 8] & 7;
            const vb = pos.squares[b >> 8] & 7;
            return vb - va; // 高价值子优先
        });

        for (const mv of capMoves) {
            if (!pos.makeMove(mv, isChecked)) {
                continue;
            }
            const childVl = -this._searchQuiet(-beta, -alpha);
            pos.undoMakeMove();

            if (childVl > vl) {
                vl = childVl;
                if (vl >= beta) {
                    return vl;
                }
                if (vl > alpha) {
                    alpha = vl;
                }
            }
        }

        return vl;
    }
}
