"use strict";

import { DYNAMIC_CHESS_VALUE } from '../core/tables.js';
import { ZOBRIST, zobristPcIdx } from '../core/zobrist.js';
import { flipSq } from '../core/coords.js';

/**
 * @class Position
 * @classdesc 棋盘局面核心数据模型
 *
 * 职责（精简后）：
 *   1. 棋盘状态存储（squares、sdPlayer、估值累加器）
 *   2. 棋子的增删（addPiece）及 Zobrist/估值增量维护
 *   3. 走法执行（makeMove）与撤销（undoMakeMove）
 *   4. 空步（nullMove / undoNullMove）
 *   5. 历史栈管理（结构化 moveStack，替代原来 4 个平行数组）
 *
 * 不包含：走法生成、合法性校验、局面评估、FEN 序列化、开局库
 * 这些功能分别由 engine/movegen.js、engine/evaluate.js、
 * engine/fen.js、engine/book.js 提供。
 */
export class Position {
    constructor() {
        /** 当前行棋方：0=红方，1=黑方 */
        this.sdPlayer = 0;

        /** 棋盘格子数组，256 个元素（16×16），有效范围见 IN_BOARD */
        this.squares = new Array(256).fill(0);

        /** 红方棋子的位置估值累加（动态估值表之和）*/
        this.vlRed = 0;

        /** 黑方棋子的位置估值累加 */
        this.vlBlack = 0;

        /** Zobrist 主键（用于置换表查找）*/
        this.zobristKey = 0;

        /** Zobrist 校验锁（降低哈希碰撞率）*/
        this.zobristLock = 0;

        /**
         * 历史走法栈（每次 makeMove / nullMove 压入一项）
         * 结构：{ mv, captured, prevKey, prevLock, inCheck }
         *   mv        - 走法编码（0 表示空步）
         *   captured  - 被吃棋子编码（0 表示无）
         *   prevKey   - 走棋前的 zobristKey
         *   prevLock  - 走棋前的 zobristLock
         *   inCheck   - 走棋后当前方是否被将军
         */
        this._moveStack = [
            // 初始哨兵项：距离 0，无走法，无将军
            { mv: 0, captured: 0, prevKey: 0, prevLock: 0, inCheck: false }
        ];

        /** 当前搜索深度（距离根节点的步数）*/
        this.distance = 0;
    }

    // ─────────────────────────────────────────────────────────────
    // 棋子操作
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 在指定格子添加或删除棋子，同步更新估值和 Zobrist
     * @param {number} sq 坐标
     * @param {number} pc 棋子编码
     * @param {boolean} isDel true=删除，false=添加
     */
    addPiece(sq, pc, isDel) {
        this.squares[sq] = isDel ? 0 : pc;
        const pcIdx = zobristPcIdx(pc);

        if (pc < 16) {
            // 红方棋子
            const typeIdx = pc - 8;
            this.vlRed += isDel
                ? -DYNAMIC_CHESS_VALUE[typeIdx][sq]
                :  DYNAMIC_CHESS_VALUE[typeIdx][sq];
        } else {
            // 黑方棋子（使用翻转坐标查表）
            const typeIdx = pc - 16;
            this.vlBlack += isDel
                ? -DYNAMIC_CHESS_VALUE[typeIdx][flipSq(sq)]
                :  DYNAMIC_CHESS_VALUE[typeIdx][flipSq(sq)];
        }

        // 增量更新 Zobrist
        this.zobristKey  ^= ZOBRIST.keyTable[pcIdx][sq];
        this.zobristLock ^= ZOBRIST.lockTable[pcIdx][sq];
    }

    // ─────────────────────────────────────────────────────────────
    // 行棋方切换
    // ─────────────────────────────────────────────────────────────

    changeSide() {
        this.sdPlayer = 1 - this.sdPlayer;
        this.zobristKey  ^= ZOBRIST.playerKey;
        this.zobristLock ^= ZOBRIST.playerLock;
    }

    // ─────────────────────────────────────────────────────────────
    // 走法执行 / 撤销
    // ─────────────────────────────────────────────────────────────

    /**
     * @method 执行走法（不校验合法性，由 makeMove 负责校验）
     * @param {number} mv
     * @returns {number} 被吃棋子编码
     */
    _movePiece(mv) {
        const src = mv & 0xFF;
        const dst = mv >> 8;
        const captured = this.squares[dst];
        if (captured > 0) {
            this.addPiece(dst, captured, true);
        }
        const moving = this.squares[src];
        this.addPiece(src, moving, true);
        this.addPiece(dst, moving, false);
        return captured;
    }

    /**
     * @method 撤销走法（配合 _moveStack 恢复现场）
     */
    _undoMovePiece(mv, captured) {
        const src = mv & 0xFF;
        const dst = mv >> 8;
        const moving = this.squares[dst];
        this.addPiece(dst, moving, true);
        this.addPiece(src, moving, false);
        if (captured > 0) {
            this.addPiece(dst, captured, false);
        }
    }

    /**
     * @method 执行走法（含将军校验）
     * @param {number} mv 走法编码
     * @param {function} checkedFn 将军检测函数 (pos) => boolean
     * @returns {boolean} false 表示走法导致己方被将，不合法
     */
    makeMove(mv, checkedFn) {
        const prevKey  = this.zobristKey;
        const prevLock = this.zobristLock;
        const captured = this._movePiece(mv);

        // 走后若己方被将，撤销并返回 false
        if (checkedFn(this)) {
            this._undoMovePiece(mv, captured);
            return false;
        }

        this.changeSide();
        const inCheck = checkedFn(this);

        this._moveStack.push({ mv, captured, prevKey, prevLock, inCheck });
        this.distance++;
        return true;
    }

    /**
     * @method 撤销上一步走法
     */
    undoMakeMove() {
        this.distance--;
        const { mv, captured, prevKey, prevLock } = this._moveStack.pop();
        this.changeSide();
        this._undoMovePiece(mv, captured);
        // 恢复 Zobrist（changeSide 会改变 key/lock，但原始 key 包含了走棋前的状态）
        this.zobristKey  = prevKey;
        this.zobristLock = prevLock;
    }

    /**
     * @method 执行空步（不走棋，直接切换行棋方，用于空步裁剪）
     * @param {function} checkedFn 将军检测函数
     */
    nullMove(checkedFn) {
        const prevKey  = this.zobristKey;
        const prevLock = this.zobristLock;
        this.changeSide();
        this._moveStack.push({ mv: 0, captured: 0, prevKey, prevLock, inCheck: false });
        this.distance++;
    }

    /**
     * @method 撤销空步
     */
    undoNullMove() {
        this.distance--;
        const { prevKey, prevLock } = this._moveStack.pop();
        this.changeSide();
        this.zobristKey  = prevKey;
        this.zobristLock = prevLock;
    }

    // ─────────────────────────────────────────────────────────────
    // 历史栈查询
    // ─────────────────────────────────────────────────────────────

    /** 当前局面是否处于将军状态 */
    inCheck() {
        return this._moveStack[this._moveStack.length - 1].inCheck;
    }

    /** 上一步是否吃子 */
    captured() {
        return this._moveStack[this._moveStack.length - 1].captured > 0;
    }

    /** 返回历史栈（外部只读，用于重复检测等） */
    get moveStack() {
        return this._moveStack;
    }

    /**
     * @method 重置历史栈（新局/加载 FEN 后调用）
     * @param {boolean} inCheck 初始局面是否被将
     */
    setIrrev(inCheck) {
        this._moveStack = [{ mv: 0, captured: 0, prevKey: 0, prevLock: 0, inCheck: !!inCheck }];
        this.distance = 0;
    }

    /**
     * @method 清空棋盘
     */
    clearBoard() {
        this.sdPlayer = 0;
        this.squares.fill(0);
        this.vlRed = this.vlBlack = 0;
        this.zobristKey = this.zobristLock = 0;
    }
}
