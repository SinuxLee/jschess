"use strict";


import * as constant from "./constant.js";
import * as util from "./util.js";
import { Search, LIMIT_DEPTH } from "./search.js";

// todo: search 和 board 共用一套棋盘模型，search 用于计算，board用于存储
import {
    Position, isChessOnBoard, getSrcPosFromMotion,
    getDstPosFromMotion, getSelfSideTag, makeMotionBySrcDst,
    getChessPosX, getChessPosY, flipPos
} from "./position.js";

const normalFen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"

/**
 * @class Board
 * @classdesc 棋盘
 */
export class Board {
    constructor(game) {
        this.game_ = game;

        this.pos = new Position();
        this.pos.fromFen(normalFen);

        this.search = null;
        this.sqSelected = 0; // 被选中的棋子
        this.millis = 0; // 思考的时间
        this.computer = -1; // 机器人开关, -1 - 不用机器, 0 - 机器人红方, 1 - 机器人黑方
        this.busy = false; // 是否思考中
    }

    initBoard() {
        this.lastMotion = 0; // 最后一步棋
        this.result = constant.RESULT_INIT; // 对局结果
        this.flushBoard();
    }

    setSearch(hashLevel) {
        this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
    }

    // 翻转棋子位置
    flipped(sq) {
        return this.computer == 0 ? flipPos(sq) : sq;
    }

    computerMove() {
        return this.pos.sdPlayer == this.computer;
    }

    computerLastMove() {
        return 1 - this.pos.sdPlayer == this.computer;
    }

    async addMove(mv, computerMove) {
        if (!this.pos.legalMove(mv)) {
            return;
        }
        if (!this.pos.makeMove(mv)) {
            this.game_.onIllegalMove();
            return;
        }
        this.busy = true;
        if (!this.game_.getAnimated()) {
            await this.postAddMove(mv, computerMove);
            return;
        }

        let posSrc = this.flipped(getSrcPosFromMotion(mv));
        let posDst = this.flipped(getDstPosFromMotion(mv));
        await this.game_.onMovePiece(posSrc, posDst)

        await this.postAddMove(mv, computerMove);
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
                this.result = constant.RESULT_LOSS;
                this.game_.onLose();
            } else {
                this.result = constant.RESULT_WIN;
                this.game_.onWin();
            }

            let pc = getSelfSideTag(this.pos.sdPlayer) + constant.PIECE_KING;
            let sqMate = 0;
            for (let sq = 0; sq < 256; sq++) {
                if (this.pos.squares[sq] == pc) {
                    sqMate = sq;
                    break;
                }
            }
            if (!this.game_.getAnimated() || sqMate == 0) {
                this.postMate(computerMove);
                return;
            }

            let sdPlayer = this.pos.sdPlayer == 0 ? "r" : "b"
            await this.game_.onMate(this.flipped(sqMate), sdPlayer);

            this.postMate(computerMove);
            return;
        }

        let vlRep = this.pos.repStatus(3);
        if (vlRep > 0) {
            vlRep = this.pos.repValue(vlRep);
            if (vlRep > -constant.WIN_VALUE && vlRep < constant.WIN_VALUE) {
                this.game_.onDraw(0);
                this.result = constant.RESULT_DRAW;
            } else if (computerMove == (vlRep < 0)) {
                this.game_.onLose(1);
                this.result = RESULT_LOSS;
            } else {
                this.game_.onWin(1);
                this.result = RESULT_WIN;
            }
            await this.onAddMove();
            this.busy = false;
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
                this.game_.onDraw(1);
                this.result = RESULT_DRAW;
                await this.onAddMove();
                this.busy = false;
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
                this.game_.onDraw(2);
                this.result = constant.RESULT_DRAW;
                await this.onAddMove();
                this.busy = false;
                return;
            }
        }

        if (this.pos.inCheck()) {
            if (computerMove) {
                this.game_.onAICheck();
            } else {
                this.game_.onCheck();
            }
        } else if (this.pos.captured()) {
            if (computerMove) {
                this.game_.onAICapture();
            } else {
                this.game_.onCapture();
            }
        } else {
            if (computerMove) {
                this.game_.onAIMove();
            } else {
                this.game_.onMove();
            }
        }

        await this.onAddMove();
        this.response();
    }

    async postMate(computerMove) {
        this.game_.onOver(computerMove)
        await this.onAddMove();
        this.busy = false;
    }

    /**
     * @method AI 计算做出响应
     */
    response() {
        if (this.search == null || !this.computerMove()) {
            this.busy = false;
            return;
        }
        this.game_.beginThinking();
        this.busy = true;
        setTimeout(async function () {
            await this.addMove(this.search.searchMain(LIMIT_DEPTH, this.millis), true);
            this.game_.endThinking();
        }.bind(this), 100);
    }

    /**
     * @method 点击棋子
     * @param {number} pos 棋子坐标
     */
    async selectedSquare(pos) {
        if (this.busy || this.result != constant.RESULT_INIT) {
            return;
        }
        let sq = this.flipped(pos);
        let pc = this.pos.squares[sq];
        if ((pc & getSelfSideTag(this.pos.sdPlayer)) != 0) {
            this.game_.onClickChess();
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
            await this.addMove(makeMotionBySrcDst(this.sqSelected, sq), false);
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
        this.game_.onDrawSquare(sq, selected, piece)
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
        if (this.busy) {
            return;
        }
        this.initBoard();
        this.pos.fromFen(fen);
        this.flushBoard();
        this.game_.onNewGame();
        this.response();
    }

    /**
     * @method 悔棋
     */
    retract() {
        if (this.busy) {
            return;
        }
        this.result = constant.RESULT_INIT;
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
     * @method 走棋着法转换成ICCS坐标格式，即着法表示成起点和终点的坐标。
     * @param {number} mv 
     */
    move2Iccs(mv) {
        let posSrc = getSrcPosFromMotion(mv);
        let posDst = getDstPosFromMotion(mv);
        return util.getCharFromByteCode(util.getCodeFromChar("A") + getChessPosX(posSrc) - constant.FILE_LEFT) +
            util.getCharFromByteCode(util.getCodeFromChar("9") - getChessPosY(posSrc) + constant.RANK_TOP) + "-" +
            util.getCharFromByteCode(util.getCodeFromChar("A") + getChessPosX(posDst) - constant.FILE_LEFT) +
            util.getCharFromByteCode(util.getCodeFromChar("9") - getChessPosY(posDst) + constant.RANK_TOP);
    }

    /**
     * @method 显示着法
     */
    async onAddMove() {
        let counter = (this.pos.motionList.length >> 1);
        let space = (counter > 99 ? "    " : "   ");
        counter = (counter > 9 ? "" : " ") + counter + ".";
        let text = (this.pos.sdPlayer == 0 ? space : counter) +
            this.move2Iccs(this.lastMotion);
        let value = "" + this.lastMotion;
        await this.game_.onAddMove(text, value,)
    }
}