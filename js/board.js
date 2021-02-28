"use strict";


import * as constant from "./constant.js";
import * as util from "./util.js";
import { Search, LIMIT_DEPTH } from "./search.js";

// todo: 不应该和UI耦合
import {
    getUiXFromPos, getUiYFromPos, getMotionPixelByStep,
    createOption, alertDelay
} from "./ui.js";

// todo: search 和 board 共用一套棋盘模型，search 用于计算，board用于存储
import {
    Position, isChessOnBoard, getSrcPosFromMotion,
    getDstPosFromMotion, getSelfSideTag, makeMotionBySrcDst,
    getChessPosX, getChessPosY, flipPos
} from "./position.js";

/**
 * @class Board
 * @classdesc 棋盘
 */
export class Board {
    constructor(game, container, images, sounds) {
        this.game_ = game;
        this.images = images;
        this.sounds = sounds;

        this.pos = new Position();
        this.pos.fromFen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");

        this.search = null;
        this.imgSquares = [];
        this.sqSelected = 0; // 被选中的棋子

        this.initBoard();

        this.millis = 0; // 思考的时间
        this.computer = -1; // 机器人开关, -1 - 不用机器, 0 - 机器人红方, 1 - 机器人黑方
        this.busy = false; // 是否思考中
        for (let sq = 0; sq < 256; sq++) {
            if (!isChessOnBoard(sq)) {
                this.imgSquares.push(null);
                continue;
            }

            let img = document.createElement("img");

            let style = img.style;
            style.position = "absolute";
            style.left = getUiXFromPos(sq) + "px";
            style.top = getUiYFromPos(sq) + "px";
            style.width = constant.UI_CCHESS_SIZE + "px";
            style.height = constant.UI_CCHESS_SIZE + "px";
            style.zIndex = 0;
            img.onmousedown = function (sq_) {
                return () => {
                    this.clickSquare(sq_);
                }
            }.bind(this)(sq);

            container.appendChild(img);
            this.imgSquares.push(img);
        }

        this.flushBoard();
    }

    initBoard() {
        this.lastMotion = 0; // 最后一步棋
        this.result = constant.RESULT_INIT; // 对局结果
    }

    setSearch(hashLevel) {
        this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
    }

    flipped(sq) {
        return this.computer == 0 ? flipPos(sq) : sq;
    }

    computerMove() {
        return this.pos.sdPlayer == this.computer;
    }

    computerLastMove() {
        return 1 - this.pos.sdPlayer == this.computer;
    }

    addMove(mv, computerMove) {
        if (!this.pos.legalMove(mv)) {
            return;
        }
        if (!this.pos.makeMove(mv)) {
            this.game_.onIllegalMove();
            return;
        }
        this.busy = true;
        if (!this.game_.getAnimated()) {
            this.postAddMove(mv, computerMove);
            return;
        }

        let posSrc = this.flipped(getSrcPosFromMotion(mv));
        let xSrc = getUiXFromPos(posSrc);
        let ySrc = getUiYFromPos(posSrc);
        let posDst = this.flipped(getDstPosFromMotion(mv));
        let xDst = getUiXFromPos(posDst);
        let yDst = getUiYFromPos(posDst);

        let style = this.imgSquares[posSrc].style;
        style.zIndex = 256;
        let step = constant.MAX_STEP - 1;
        let timer = setInterval(function () {
            if (step == 0) {
                clearInterval(timer);
                style.left = xSrc + "px";
                style.top = ySrc + "px";
                style.zIndex = 0;
                this.postAddMove(mv, computerMove);
            } else {
                style.left = getMotionPixelByStep(xSrc, xDst, step);
                style.top = getMotionPixelByStep(ySrc, yDst, step);
                step--;
            }
        }.bind(this), 16);
    }

    postAddMove(mv, computerMove) {
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

            sqMate = this.flipped(sqMate);
            let style = this.imgSquares[sqMate].style;
            style.zIndex = 256;
            let xMate = getUiXFromPos(sqMate);
            let step = constant.MAX_STEP;
            let timer = setInterval(function () {
                if (step == 0) {
                    clearInterval(timer);
                    style.left = xMate + "px";
                    style.zIndex = 0;
                    this.imgSquares[sqMate].src = this.images +
                        (this.pos.sdPlayer == 0 ? "r" : "b") + "km.gif";
                    this.postMate(computerMove);
                } else {
                    style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2) + "px";
                    step--;
                }
            }.bind(this), 50);
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
            this.onAddMove();
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
                this.onAddMove();
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
                this.onAddMove();
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

        this.onAddMove();
        this.response();
    }

    postMate(computerMove) {
        alertDelay(computerMove ? "请再接再厉！" : "祝贺你取得胜利！");
        this.onAddMove();
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
        setTimeout(function () {
            this.addMove(this.search.searchMain(LIMIT_DEPTH, this.millis), true);
            this.game_.endThinking();
        }.bind(this), 250);
    }

    /**
     * @method 点击棋子
     * @param {number} pos 棋子坐标
     */
    clickSquare(pos) {
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
            this.addMove(makeMotionBySrcDst(this.sqSelected, sq), false);
        }
    }

    /**
     * @method 绘制棋子
     * @param {number} sq 棋子坐标 
     * @param {boolean} selected 是否选中状态 0-未选中, 1-选中
     */
    drawSquare(sq, selected) {
        let img = this.imgSquares[this.flipped(sq)];
        img.src = this.images + constant.PIECE_NAME[this.pos.squares[sq]] + ".gif";
        img.style.backgroundImage = selected ? "url(" + this.images + "oos.gif)" : "";
    }

    /**
     * @method 刷新棋盘
     */
    flushBoard() {
        for (let sq = 0; sq < 256; sq++) {
            if (isChessOnBoard(sq)) {
                this.drawSquare(sq, sq == getSrcPosFromMotion(this.lastMotion) || sq == getDstPosFromMotion(this.lastMotion));
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
    onAddMove() {
        let counter = (this.pos.motionList.length >> 1);
        let space = (counter > 99 ? "    " : "   ");
        counter = (counter > 9 ? "" : " ") + counter + ".";
        let text = (this.pos.sdPlayer == 0 ? space : counter) +
            this.move2Iccs(this.lastMotion);
        let value = "" + this.lastMotion;
        try {
            selMoveList.add(createOption(text, value, false));
        } catch (e) {
            selMoveList.add(createOption(text, value, true));
        }
        selMoveList.scrollTop = selMoveList.scrollHeight;
    }
}