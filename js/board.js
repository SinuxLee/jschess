"use strict";


import { Search, LIMIT_DEPTH } from "./search.js";
import {
    Position, isChessOnBoard, getSrcPosFromMotion,
    getDstPosFromMotion, WIN_VALUE
} from "./position.js";
import { WAV } from "./audio.js";

// 开局
const normalFen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"

// 对局结果
const Result = Object.freeze({
    INIT: 0,    // 初始值
    WIN: 1,     // 赢
    DRAW: 2,    // 平
    LOSS: 3,    // 输
})

// 棋盘状态
const State = Object.freeze({
    IDLE: 0,        // 空闲，等待玩家操作
    ANIMATING: 1,   // 走子动画播放中
    THINKING: 2,    // AI 搜索中
})

/**
 * @class Board
 * @classdesc 棋盘
 */
export class Board {
    constructor({audio, uiBoard, getAnimated}) {
        this._audio = audio;
        this._uiBoard = uiBoard;
        this._getAnimated = getAnimated;

        this.pos = new Position();
        this.pos.fromFen(normalFen);

        this.search = null;
        this.sqSelected = 0; // 被选中的棋子
        this.millis = 0; // 思考的时间
        this.computer = -1; // 机器人开关, -1 - 不用机器, 0 - 机器人红方, 1 - 机器人黑方
        this._state = State.IDLE;
    }

    get busy() {
        return this._state !== State.IDLE;
    }

    initBoard(thinking = 10, computer = 1) {
        this.millis = thinking;
        this.computer = computer;
        this.lastMotion = 0; // 最后一步棋
        this.result = Result.INIT; // 对局结果
        this.flushBoard();
    }

    isInit() {
        return this.result === Result.INIT
    }

    setSearch(hashLevel) {
        this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
    }

    // 翻转棋子位置
    flipped(sq) {
        return this.computer == 0 ? this.pos.flipPos(sq) : sq;
    }

    /**
     * 是否该机器人走棋了
     * @returns {bool} true - 是
     */
    computerMove() {
        return this.pos.sdPlayer == this.computer;
    }

    computerLastMove() {
        return 1 - this.pos.sdPlayer == this.computer;
    }

    /**
     * 走棋
     * @param {number} mv 着法
     * @param {bool} computerMove 当前是否机器人走棋
     */
    async addMove(mv, computerMove) {
        if (!this.pos.legalMove(mv)) {
            return;
        }

        // 判定是否长将/长捉
        if (!this.pos.makeMove(mv)) {
            this._audio.play(WAV.ILLEGAL);
            return;
        }

        this._state = State.ANIMATING;
        try {
            if (this._getAnimated()) {
                let posSrc = this.flipped(getSrcPosFromMotion(mv));
                let posDst = this.flipped(getDstPosFromMotion(mv));
                await this._uiBoard.fakeAnimation(posSrc, posDst);
            }
            await this.postAddMove(mv, computerMove);
        } catch (e) {
            this._state = State.IDLE;
            throw e;
        }
    }

    async postAddMove(mv, computerMove) {
        if (this.lastMotion > 0) {
            this.drawSquare(getSrcPosFromMotion(this.lastMotion), false);
            this.drawSquare(getDstPosFromMotion(this.lastMotion), false);
        }
        this.drawSquare(getSrcPosFromMotion(mv), true);
        this.drawSquare(getDstPosFromMotion(mv), true);
        this.sqSelected = 0;
        this.lastMotion = mv;

        if (this.pos.isMate()) {
            if (computerMove) {
                this.result = Result.LOSS;
                this._audio.play(WAV.LOSE);
            } else {
                this.result = Result.WIN;
                this._audio.play(WAV.WIN);
            }

            let pc = this.pos.getSelfSideTag(this.pos.sdPlayer);
            let sqMate = 0;
            for (let sq = 0; sq < 256; sq++) {
                if (this.pos.squares[sq] == pc) {
                    sqMate = sq;
                    break;
                }
            }

            if (!this._getAnimated() || sqMate == 0) {
                this.postMate(computerMove);
                return;
            }

            let sdPlayer = this.pos.sdPlayer == 0 ? "r" : "b"
            await this._uiBoard.onMate(this.flipped(sqMate), sdPlayer);

            this.postMate(computerMove);
            return;
        }

        let vlRep = this.pos.repStatus(3);
        if (vlRep > 0) {
            vlRep = this.pos.repValue(vlRep);
            if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
                this._audio.play(WAV.DRAW);
                this._uiBoard.alertDelay('双方不变作和，辛苦了！');
                this.result = Result.DRAW;
            } else if (computerMove == (vlRep < 0)) {
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

        if (this.pos.captured()) {
            let hasMaterial = false;
            for (let sq = 0; sq < 256; sq++) {
                if (isChessOnBoard(sq) && (this.pos.squares[sq] & 7) > 2) {
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
        } else if (this.pos.pcList.length > 100) {
            let captured = false;
            for (let i = 2; i <= 100; i++) {
                if (this.pos.pcList[this.pos.pcList.length - i] > 0) {
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

        if (this.pos.inCheck()) {
            if (computerMove) {
                this._audio.play(WAV.CHECK2);
            } else {
                this._audio.play(WAV.CHECK);
            }
        } else if (this.pos.captured()) {
            if (computerMove) {
                this._audio.play(WAV.CAPTURE2);
            } else {
                this._audio.play(WAV.CAPTURE);
            }
        } else {
            if (computerMove) {
                this._audio.play(WAV.MOVE2);
            } else {
                this._audio.play(WAV.MOVE);
            }
        }

        await this.onAddMove();
        this.response();
    }

    async postMate(computerMove) {
        this._uiBoard.alertDelay(computerMove ? '请再接再厉！' : '祝贺你取得胜利！');
        await this.onAddMove();
        this._state = State.IDLE;
    }

    /**
     * @method AI 计算做出响应
     */
    response() {
        if (this.search == null || !this.computerMove()) {
            this._state = State.IDLE;
            return;
        }

        this._uiBoard.showThinkBox();
        this._state = State.THINKING;
        setTimeout(async () => {
            try {
                await this.addMove(this.search.searchMain(LIMIT_DEPTH, this.millis), true);
            } catch (e) {
                this._state = State.IDLE;
                throw e;
            } finally {
                this._uiBoard.hideThinkBox();
            }
        }, 50); // TODO: 根据人类选手的响应时间，计算机器人的思考时间。模拟人类的情绪波动（盲目自信走错棋）
    }

    /**
     * @method 点击棋子
     * @param {number} pos 棋子坐标
     */
    async selectedSquare(pos) {
        if (this.busy || this.result != Result.INIT) return;

        let sq = this.flipped(pos);
        let pc = this.pos.squares[sq];
        if ((pc & this.pos.getSelfSideTag(this.pos.sdPlayer)) != 0) {
            this._audio.play(WAV.CLICK);
            if (this.lastMotion != 0) {
                this.drawSquare(getSrcPosFromMotion(this.lastMotion), false);
                this.drawSquare(getDstPosFromMotion(this.lastMotion), false);
            }
            if (this.sqSelected) {
                this.drawSquare(this.sqSelected, false);
            }
            this.drawSquare(sq, true);
            this.sqSelected = sq;
        } else if (this.sqSelected > 0) {
            await this.addMove(this.pos.makeMotionBySrcDst(this.sqSelected, sq), false);
        }
    }

    /**
     * @method 绘制棋子
     * @param {number} sq 棋子坐标
     * @param {boolean} selected 是否选中状态 0-未选中, 1-选中
     */
    drawSquare(sq, selected) {
        let piece = this.pos.squares[sq];
        sq = this.flipped(sq);
        this._uiBoard.drawSquare(sq, selected, piece)
    }

    /**
     * @method 刷新棋盘
     */
    flushBoard() {
        for (let sq = 0; sq < 256; sq++) {
            if (isChessOnBoard(sq)) {
                let selected = (sq == getSrcPosFromMotion(this.lastMotion) ||
                    sq == getDstPosFromMotion(this.lastMotion))
                this.drawSquare(sq, selected);
            }
        }
    }

    /**
     * @method 重新开始
     * @param {string} fen 
     */
    restart(fen) {
        if (this.busy) return;

        this.initBoard();
        this.pos.fromFen(fen);
        this.flushBoard();
        this._audio.play(WAV.NEWGAME);
        this.response();
    }

    /**
     * @method 悔棋
     */
    retract() {
        if (this.busy) {
            return;
        }
        this.result = Result.INIT;
        if (this.pos.motionList.length > 1) {
            this.pos.undoMakeMove();
        }
        if (this.pos.motionList.length > 1 && this.computerMove()) {
            this.pos.undoMakeMove();
        }

        this.lastMotion = this.pos.motionList[this.pos.motionList.length - 1];
        this.flushBoard();
        this.response();
    }

    /**
     * @method 显示着法
     */
    async onAddMove() {
        let counter = (this.pos.motionList.length >> 1);
        let space = (counter > 99 ? "    " : "   ");
        counter = (counter > 9 ? "" : " ") + counter + ".";
        let text = (this.pos.sdPlayer == 0 ? space : counter) +
            this.pos.move2Iccs(this.lastMotion);
        let value = "" + this.lastMotion;
        await this._uiBoard.addMove(text, value,)
    }
}
