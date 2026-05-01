"use strict";

import { MATE_VALUE } from '../core/constants.js';

/**
 * @description 置换表（Transposition Table）模块
 *
 * 置换表是 alpha-beta 搜索最重要的加速结构之一：
 *   - 对已搜索过的局面记录其搜索结果（深度、分值、走法、类型）
 *   - 当再次遇到相同局面时直接返回缓存结果，避免重复搜索
 *
 * 使用 Zobrist 哈希（key + lock 双重校验）标识局面，降低碰撞概率。
 *
 * ─────────────────────────────────────────────────────────────
 * 表项类型（hashFlag）：
 *   EXACT  - 精确分（PV 节点：分值在 alpha-beta 窗口内）
 *   ALPHA  - 上界分（All 节点：实际分 ≤ alpha，搜索被截断）
 *   BETA   - 下界分（Cut 节点：实际分 ≥ beta，发生 beta 截断）
 * ─────────────────────────────────────────────────────────────
 */

/** 置换表条目类型标志 */
export const HASH_ALPHA = 1;
export const HASH_BETA  = 2;
export const HASH_EXACT = 3;

/** 置换表大小（条目数，必须是 2 的幂）*/
const HASH_SIZE = 1 << 20; // 约 100 万条目
const HASH_MASK = HASH_SIZE - 1;

/**
 * @class HashTable
 * @classdesc 置换表（平铺数组实现，避免对象创建开销）
 *
 * 每个条目由 5 个并行数组中的同一下标对应的元素组成：
 *   _key[i]    - Zobrist 主键（低32位）
 *   _lock[i]   - Zobrist 校验锁
 *   _depth[i]  - 搜索深度（越深越可信）
 *   _flag[i]   - 条目类型（HASH_ALPHA / HASH_BETA / HASH_EXACT）
 *   _vl[i]     - 存储的估值
 *   _mv[i]     - 最佳走法（0 表示无）
 */
export class HashTable {
    constructor() {
        this._key   = new Int32Array(HASH_SIZE);
        this._lock  = new Int32Array(HASH_SIZE);
        this._depth = new Int8Array(HASH_SIZE);
        this._flag  = new Int8Array(HASH_SIZE);
        this._vl    = new Int16Array(HASH_SIZE);
        this._mv    = new Int32Array(HASH_SIZE);
    }

    /**
     * @method 清空置换表（新局开始时调用）
     */
    clear() {
        this._key.fill(0);
        this._lock.fill(0);
        this._depth.fill(0);
        this._flag.fill(0);
        this._vl.fill(0);
        this._mv.fill(0);
    }

    /**
     * @method 写入置换表
     * @param {number} key   Zobrist 主键
     * @param {number} lock  Zobrist 校验锁
     * @param {number} depth 当前搜索深度
     * @param {number} flag  HASH_ALPHA / HASH_BETA / HASH_EXACT
     * @param {number} vl    估值（需用 _adjustVlStore 修正将死距离）
     * @param {number} mv    最佳走法（0 表示无）
     * @param {number} distance 当前搜索距离（用于将死分修正）
     */
    set(key, lock, depth, flag, vl, mv, distance) {
        const idx = key & HASH_MASK;
        // 深度优先替换策略：只有新条目深度 ≥ 已有条目时才覆盖
        if (this._depth[idx] > depth) {
            return;
        }
        this._key[idx]   = key;
        this._lock[idx]  = lock;
        this._depth[idx] = depth;
        this._flag[idx]  = flag;
        this._mv[idx]    = mv;
        this._vl[idx]    = _adjustVlStore(vl, distance);
    }

    /**
     * @method 查询置换表
     * @param {number} key      Zobrist 主键
     * @param {number} lock     Zobrist 校验锁
     * @param {number} depth    要求的搜索深度
     * @param {number} alpha    当前 alpha 窗口
     * @param {number} beta     当前 beta 窗口
     * @param {number} distance 当前搜索距离（用于将死分修正）
     * @returns {{ hit: boolean, vl: number, mv: number }}
     *   hit=true 时 vl 可直接用于剪枝/返回，mv 是置换表中的最佳走法（可能为 0）
     */
    get(key, lock, depth, alpha, beta, distance) {
        const idx = key & HASH_MASK;
        if (this._key[idx] !== key || this._lock[idx] !== lock) {
            return { hit: false, vl: 0, mv: 0 };
        }

        const mv   = this._mv[idx];
        const flag = this._flag[idx];
        const vl   = _adjustVlLoad(this._vl[idx], distance);

        if (this._depth[idx] >= depth) {
            if (flag === HASH_EXACT) {
                return { hit: true, vl, mv };
            }
            if (flag === HASH_ALPHA && vl <= alpha) {
                return { hit: true, vl: alpha, mv };
            }
            if (flag === HASH_BETA && vl >= beta) {
                return { hit: true, vl: beta, mv };
            }
        }

        // 深度不足，仅提供最佳走法提示（不能用于剪枝）
        return { hit: false, vl: 0, mv };
    }
}

// ───────────────────────────────────────────────
// 将死距离修正（置换表存储时消除 distance 偏差）
// ───────────────────────────────────────────────

/**
 * 存储前：将死分转换为"绝对分"（消除当前搜索距离的偏差）
 * 目的：同一将死局面在不同搜索深度下存储的分值保持一致
 */
function _adjustVlStore(vl, distance) {
    if (vl > MATE_VALUE - 100) {
        return vl + distance;
    }
    if (vl < -(MATE_VALUE - 100)) {
        return vl - distance;
    }
    return vl;
}

/**
 * 读取时：绝对将死分还原为相对距离的分
 */
function _adjustVlLoad(vl, distance) {
    if (vl > MATE_VALUE - 100) {
        return vl - distance;
    }
    if (vl < -(MATE_VALUE - 100)) {
        return vl + distance;
    }
    return vl;
}
