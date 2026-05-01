"use strict";

/**
 * @description Zobrist 哈希基础设施
 *
 * Zobrist 哈希：专门用于棋类游戏的位置指纹算法。
 * 每个（棋子类型 × 位置）组合对应一个随机数，
 * 局面哈希 = 所有棋子哈希的异或（XOR）。
 * 走子时只需对移动/吃子的棋子做 XOR 增量更新，效率极高。
 *
 * 使用 RC4 伪随机流生成哈希密钥，保证分布均匀。
 *
 * 字段说明：
 *   - key：用于置换表的主键（低32位）
 *   - lock：用于置换表的校验锁（独立随机数，降低碰撞率）
 */

// ===== RC4 伪随机流生成器 =====

/**
 * @class RC4
 * @classdesc RC4（Rivest Cipher 4）对称流密码，此处仅用于生成 Zobrist 随机数序列
 */
class RC4 {
    constructor(key) {
        this.x = this.y = 0;
        this.state = [];
        for (let i = 0; i < 256; i++) {
            this.state.push(i);
        }
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + this.state[i] + key[i % key.length]) & 0xFF;
            this._swap(i, j);
        }
    }

    _swap(i, j) {
        let t = this.state[i];
        this.state[i] = this.state[j];
        this.state[j] = t;
    }

    nextByte() {
        this.x = (this.x + 1) & 0xFF;
        this.y = (this.y + this.state[this.x]) & 0xFF;
        this._swap(this.x, this.y);
        return this.state[(this.state[this.x] + this.state[this.y]) & 0xFF];
    }

    nextLong() {
        let n0 = this.nextByte();
        let n1 = this.nextByte();
        let n2 = this.nextByte();
        let n3 = this.nextByte();
        return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xFFFFFFFF);
    }
}

// ===== Zobrist 哈希表 =====

/**
 * @description 生成 Zobrist 哈希表
 * 返回：
 *   {
 *     playerKey,   playerLock,        // 行棋方切换时 XOR 的随机数
 *     keyTable,                       // keyTable[pcIdx][sq]   → 走法 key 增量
 *     lockTable,                      // lockTable[pcIdx][sq]  → 走法 lock 增量
 *   }
 *
 * pcIdx 对应关系：
 *   0-6   → 红方 将士相马车炮卒（pc - 8）
 *   7-13  → 黑方 将士相马车炮卒（pc - 16 + 7）
 */
function buildZobristTables() {
    const rc4 = new RC4([0]);

    const playerKey  = rc4.nextLong(); rc4.nextLong(); // 跳过一个，和原始代码行为一致
    const playerLock = rc4.nextLong();

    const keyTable  = [];
    const lockTable = [];

    for (let i = 0; i < 14; i++) {
        const keys  = [];
        const locks = [];
        for (let j = 0; j < 256; j++) {
            keys.push(rc4.nextLong());
            rc4.nextLong(); // 跳过，和原始代码行为一致
            locks.push(rc4.nextLong());
        }
        keyTable.push(keys);
        lockTable.push(locks);
    }

    return { playerKey, playerLock, keyTable, lockTable };
}

// 单例：模块加载时初始化一次，所有 Position 实例共享同一张哈希表
export const ZOBRIST = buildZobristTables();

/**
 * @method 计算棋子对应的 Zobrist 表索引
 * @param {number} pc 棋子编码（8-14 红方，16-22 黑方）
 * @returns {number} 0-13
 */
export function zobristPcIdx(pc) {
    return pc < 16 ? pc - 8 : pc - 16 + 7;
}
