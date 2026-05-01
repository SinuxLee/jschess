"use strict";

import { Position }                      from './engine/position.js';
import { generateMoves, isChecked }      from './engine/movegen.js';
import { repValue }                      from './engine/evaluate.js';
import { fromFen, toFen, moveToIccs }   from './engine/fen.js';
import { isOnBoard }                     from './core/coords.js';
import { sideTag }                       from './core/piece.js';
import { moveSrc, moveDst, makeMove }    from './core/move.js';
import { flipSq }                        from './core/coords.js';
import { WIN_VALUE }                     from './core/constants.js';
import { WAV }                           from './audio.js';

// 走法合法性缓存（每次轮到玩家时重建）
let _legalMovesCache = null;
let _legalMovesCachePlayer = -1;

// 开局 FEN
const NORMAL_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

// 对局结果
const Result = Object.freeze({
    INIT: 0,
    WIN:  1,
    DRAW: 2,
    LOSS: 3,
});

// 棋盘状态
const State = Object.freeze({
    IDLE:      0,
    ANIMATING: 1,
    THINKING:  2,
});

/**
 * @class Board
 * @classdesc 棋盘控制器
 *
 * 依赖新分层架构：engine/position + engine/movegen + engine/evaluate + engine/fen
 * 不再依赖旧版 position.js。
 */
export class Board {
    constructor({ audio, uiBoard, getAnimated }) {
        this._audio      = audio;
        this._uiBoard    = uiBoard;
        this._getAnimated = getAnimated;

        this.pos = new Position();
        fromFen(this.pos, NORMAL_FEN, isChecked);

        this._worker    = null;
        this.sqSelected = 0;
        this.millis     = 0;
        this.computer   = -1; // -1=不用电脑, 0=电脑执红, 1=电脑执黑
        this._state     = State.IDLE;
        this.lastMotion = 0;
        this.result     = Result.INIT;
    }

    get busy() {
        return this._state !== State.IDLE;
    }

    // ─────────────────────────────────────────────────────────────
    // 公共接口
    // ─────────────────────────────────────────────────────────────

    initBoard(thinking = 10, computer = 1) {
        this.millis     = thinking;
        this.computer   = computer;
        this.lastMotion = 0;
        this.result     = Result.INIT;
        this.flushBoard();
    }

    isInit() {
        return this.result === Result.INIT;
    }

    setSearch(hashLevel) {
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }

        if (hashLevel === 0) {
            return;
        }

        this._worker = new Worker(
            new URL('./ai-worker.js', import.meta.url),
            { type: 'module' }
        );
        this._worker.postMessage({ hashLevel });
    }

    /** 翻转坐标（电脑执红时棋盘翻转；双机对弈不翻转） */
    flipped(sq) {
        return this.computer === 0 ? flipSq(sq) : sq;
    }

    /**
     * 是否该电脑走棋
     * computer=-1：不用电脑，始终 false
     * computer=0 ：电脑执红，轮到红方(sdPlayer=0)时 true
     * computer=1 ：电脑执黑，轮到黑方(sdPlayer=1)时 true
     * computer=2 ：双机对弈，始终 true
     */
    computerMove() {
        if (this.computer === 2) return true;
        return this.pos.sdPlayer === this.computer;
    }

    /** ─── 走棋入口 ─── */
    async addMove(mv, computerMove) {
        if (!this._isLegalMove(mv)) {
            return;
        }

        if (!this.pos.makeMove(mv, isChecked)) {
            this._audio.play(WAV.ILLEGAL);
            return;
        }

        this._state = State.ANIMATING;
        try {
            if (this._getAnimated()) {
                const posSrc = this.flipped(moveSrc(mv));
                const posDst = this.flipped(moveDst(mv));
                await this._uiBoard.fakeAnimation(posSrc, posDst);
            }
            await this._postAddMove(mv, computerMove);
        } catch (e) {
            this._state = State.IDLE;
            throw e;
        }
    }

    /** ─── 点击棋盘格子 ─── */
    async selectedSquare(pos) {
        if (this.busy || this.result !== Result.INIT) {
            return;
        }

        // 双机对弈或电脑回合时不允许玩家操作
        if (this._worker !== null && (this.computer === 2 || this.computerMove())) {
            return;
        }

        const sq = this.flipped(pos);
        const pc = this.pos.squares[sq];

        if ((pc & sideTag(this.pos.sdPlayer)) !== 0) {
            // 点击己方棋子：选中
            this._audio.play(WAV.CLICK);
            if (this.lastMotion !== 0) {
                this.drawSquare(moveSrc(this.lastMotion), false);
                this.drawSquare(moveDst(this.lastMotion), false);
            }
            if (this.sqSelected) {
                this.drawSquare(this.sqSelected, false);
            }
            this.drawSquare(sq, true);
            this.sqSelected = sq;
        } else if (this.sqSelected > 0) {
            // 点击目标格：尝试走棋
            await this.addMove(makeMove(this.sqSelected, sq), false);
        }
    }

    /** ─── 重新开始 ─── */
    restart(fen) {
        if (this.busy) {
            return;
        }

        // 保留调用方已设置的 computer，不传参数会重置为默认值
        this.initBoard(this.millis, this.computer);
        fromFen(this.pos, fen, isChecked);
        this.flushBoard();
        this._audio.play(WAV.NEWGAME);
        this.response();
    }

    /** ─── 悔棋 ─── */
    retract() {
        if (this.busy) {
            return;
        }

        this.result = Result.INIT;

        // 至少保留初始哨兵项（moveStack[0]）
        if (this.pos.moveStack.length > 1) {
            this.pos.undoMakeMove();
        }

        if (this.pos.moveStack.length > 1 && this.computerMove()) {
            this.pos.undoMakeMove();
        }

        this.lastMotion = this.pos.moveStack[this.pos.moveStack.length - 1].mv;
        this.flushBoard();
        this.response();
    }

    /** ─── AI 响应 ─── */
    response() {
        if (this._worker === null || !this.computerMove()) {
            this._state = State.IDLE;
            return;
        }

        // 双机对弈时使用 setTimeout 加一点延迟，避免 UI 卡死
        if (this.computer === 2) {
            setTimeout(() => this._doAiSearch(true), 1000);
            return;
        }

        this._doAiSearch(true);
    }

    /** ─── 实际触发 AI 搜索 ─── */
    _doAiSearch(isComputerMove) {

        this._uiBoard.showThinkBox();
        this._state = State.THINKING;

        this._worker.onmessage = async (e) => {
            try {
                if (e.data.error) {
                    console.error('AI Worker:', e.data.error);
                    this._state = State.IDLE;
                    return;
                }
                await this.addMove(e.data.mv, isComputerMove);
            } catch (err) {
                this._state = State.IDLE;
                throw err;
            } finally {
                this._uiBoard.hideThinkBox();
            }
        };

        this._worker.postMessage({
            fen:    toFen(this.pos),
            millis: this.millis,
        });
    }

    /** ─── 绘制单个格子 ─── */
    drawSquare(sq, selected) {
        const piece = this.pos.squares[sq];
        this._uiBoard.drawSquare(this.flipped(sq), selected, piece);
    }

    /** ─── 刷新整个棋盘 ─── */
    flushBoard() {
        for (let sq = 0; sq < 256; sq++) {
            if (isOnBoard(sq)) {
                const selected = (sq === moveSrc(this.lastMotion) ||
                                  sq === moveDst(this.lastMotion));
                this.drawSquare(sq, selected);
            }
        }
    }

    /** ─── 走棋记录显示 ─── */
    async onAddMove() {
        const stack   = this.pos.moveStack;
        const counter = (stack.length - 1) >> 1; // 当前回合数
        const space   = counter > 99 ? '    ' : '   ';
        const prefix  = (counter > 9 ? '' : ' ') + counter + '.';
        const text    = (this.pos.sdPlayer === 0 ? space : prefix) +
                        moveToIccs(this.lastMotion);
        const value   = '' + this.lastMotion;
        await this._uiBoard.addMove(text, value);
    }

    // ─────────────────────────────────────────────────────────────
    // 私有方法
    // ─────────────────────────────────────────────────────────────

    /**
     * 走法合法性检查：必须在 generateMoves 生成的走法列表里。
     * 这样可以拦截卒走多格、象过河等违规走法（不依赖 makeMove 做棋规检查）。
     */
    _isLegalMove(mv) {
        // 构建/复用合法走法缓存
        if (_legalMovesCache === null || _legalMovesCachePlayer !== this.pos.sdPlayer) {
            _legalMovesCache = new Set(generateMoves(this.pos));
            _legalMovesCachePlayer = this.pos.sdPlayer;
        }
        return _legalMovesCache.has(mv);
    }

    /** 走棋后使缓存失效 */
    _invalidateLegalMovesCache() {
        _legalMovesCache = null;
        _legalMovesCachePlayer = -1;
    }

    /** 走棋后处理（绘制、音效、胜负判断） */
    async _postAddMove(mv, computerMove) {
        // 走棋后使合法走法缓存失效（局面已变）
        this._invalidateLegalMovesCache();

        // 清除上一步高亮
        if (this.lastMotion > 0) {
            this.drawSquare(moveSrc(this.lastMotion), false);
            this.drawSquare(moveDst(this.lastMotion), false);
        }
        this.drawSquare(moveSrc(mv), true);
        this.drawSquare(moveDst(mv), true);
        this.sqSelected  = 0;
        this.lastMotion  = mv;

        // ── 将死检测 ──
        if (this._isMate()) {
            // 双机对弈时：当前行棋方（被将死方）= pos.sdPlayer
            // sdPlayer=0(红) 被将死 → 黑胜；sdPlayer=1(黑) 被将死 → 红胜
            if (this.computer === 2) {
                this.result = Result.LOSS; // 对观战者无所谓，统一记 LOSS
                const loser = this.pos.sdPlayer === 0 ? '红方' : '黑方';
                this._uiBoard.alertDelay(`${loser}被将死！`);
                this._audio.play(WAV.LOSE);
                await this.onAddMove();
                this._state = State.IDLE;
                return;
            }
            if (computerMove) {
                this.result = Result.LOSS;
                this._audio.play(WAV.LOSE);
            } else {
                this.result = Result.WIN;
                this._audio.play(WAV.WIN);
            }

            // 找到被将死一方的将/帅位置（用于死亡动画）
            const pc    = sideTag(this.pos.sdPlayer);
            let sqMate  = 0;
            for (let sq = 0; sq < 256; sq++) {
                if (this.pos.squares[sq] === pc) {
                    sqMate = sq;
                    break;
                }
            }

            if (!this._getAnimated() || sqMate === 0) {
                await this._postMate(computerMove);
                return;
            }
            const sdPlayer = this.pos.sdPlayer === 0 ? 'r' : 'b';
            await this._uiBoard.onMate(this.flipped(sqMate), sdPlayer);
            await this._postMate(computerMove);
            return;
        }

        // ── 重复局面检测 ──
        const vlRep = repValue(this.pos, 3);
        if (vlRep !== 0) {
            if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
                this._audio.play(WAV.DRAW);
                this._uiBoard.alertDelay('双方不变作和！');
                this.result = Result.DRAW;
            } else if (this.computer === 2) {
                // 双机对弈：vlRep < 0 表示当前方长打，即当前行棋方负
                const loser = this.pos.sdPlayer === 0 ? '红方' : '黑方';
                this._audio.play(WAV.LOSE);
                this._uiBoard.alertDelay(`${loser}长打作负！`);
                this.result = Result.LOSS;
            } else if (computerMove === (vlRep < 0)) {
                this._audio.play(WAV.LOSE);
                this._uiBoard.alertDelay('长打作负，请不要气馁！');
                this.result = Result.LOSS;
            } else {
                this._audio.play(WAV.WIN);
                this._uiBoard.alertDelay('长打作负，祝贺你取得胜利！');
                this.result = Result.WIN;
            }
            await this.onAddMove();
            this._state = State.IDLE;
            return;
        }

        // ── 无子可吃（素材不足）平局 ──
        if (this.pos.captured()) {
            let hasMaterial = false;
            for (let sq = 0; sq < 256; sq++) {
                if (isOnBoard(sq) && (this.pos.squares[sq] & 7) > 2) {
                    hasMaterial = true;
                    break;
                }
            }
            if (!hasMaterial) {
                this._audio.play(WAV.DRAW);
                this._uiBoard.alertDelay('双方都没有进攻棋子了，辛苦了！');
                this.result = Result.DRAW;
                await this.onAddMove();
                this._state = State.IDLE;
                return;
            }
        } else {
            // ── 超过自然限着（100 步未吃子）──
            const stack = this.pos.moveStack;
            if (stack.length > 100) {
                let captured = false;
                for (let i = 2; i <= 100; i++) {
                    if (stack[stack.length - i].captured > 0) {
                        captured = true;
                        break;
                    }
                }
                if (!captured) {
                    this._audio.play(WAV.DRAW);
                    this._uiBoard.alertDelay('超过自然限着作和，辛苦了！');
                    this.result = Result.DRAW;
                    await this.onAddMove();
                    this._state = State.IDLE;
                    return;
                }
            }
        }

        // ── 音效 ──
        if (this.pos.inCheck()) {
            this._audio.play(computerMove ? WAV.CHECK2 : WAV.CHECK);
        } else if (this.pos.captured()) {
            this._audio.play(computerMove ? WAV.CAPTURE2 : WAV.CAPTURE);
        } else {
            this._audio.play(computerMove ? WAV.MOVE2 : WAV.MOVE);
        }

        await this.onAddMove();
        this.response();
    }

    async _postMate(computerMove) {
        if (this.computer !== 2) {
            this._uiBoard.alertDelay(computerMove ? '请再接再厉！' : '祝贺你取得胜利！');
        }
        await this.onAddMove();
        this._state = State.IDLE;
    }

    /**
     * 判断当前局面是否将死（当前行棋方无合法走法）
     */
    _isMate() {
        const moves = generateMoves(this.pos);
        for (const mv of moves) {
            if (this.pos.makeMove(mv, isChecked)) {
                this.pos.undoMakeMove();
                return false;
            }
        }
        return true;
    }
}
