/*
board.js - Source Code for XiangQi Wizard Light, Part IV

XiangQi Wizard Light - a Chinese Chess Program for JavaScript
Designed by Morning Yellow, Version: 1.0, Last Modified: Sep. 2012
Copyright (C) 2004-2012 www.xqbase.com

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

"use strict";

/**
 * @class Board
 * @classdesc 棋盘
 */
class Board {
    constructor(game, container, images, sounds) {
        this.game_ = game;
        this.images = images;
        this.sounds = sounds;

        this.pos = new Position();
        this.pos.fromFen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");

        this.search = null;
        this.imgSquares = [];
        this.sqSelected = 0; //被选中的棋子
        this.lastMotion = 0; //最后一步棋
        this.millis = 0; //思考的时间
        this.computer = -1; //机器人开关, -1 - 不用机器, 0 - 机器人红方, 1 - 机器人黑方
        this.result = RESULT_INIT; //对局结果
        this.busy = false; //是否思考中

        let this_ = this;
        for (let sq = 0; sq < 256; sq++) {
            if (!isChessOnBoard(sq)) {
                this.imgSquares.push(null);
                continue;
            }
            let img = document.createElement("img");
            let style = img.style;
            style.position = "absolute";
            style.left = SQ_X(sq) + "px";
            style.top = SQ_Y(sq) + "px";
            style.width = UI_CCHESS_SIZE + "px";
            style.height = UI_CCHESS_SIZE + "px";
            style.zIndex = 0;
            img.onmousedown = function (sq_) {
                return () => {
                    this_.clickSquare(sq_);
                }
            }(sq);

            container.appendChild(img);
            this.imgSquares.push(img);
        }

        this.flushBoard();
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
        let xSrc = SQ_X(posSrc);
        let ySrc = SQ_Y(posSrc);
        let posDst = this.flipped(getDstPosFromMotion(mv));
        let xDst = SQ_X(posDst);
        let yDst = SQ_Y(posDst);

        let style = this.imgSquares[posSrc].style;
        style.zIndex = 256;
        let step = MAX_STEP - 1;
        let this_ = this;
        let timer = setInterval(function () {
            if (step == 0) {
                clearInterval(timer);
                style.left = xSrc + "px";
                style.top = ySrc + "px";
                style.zIndex = 0;
                this_.postAddMove(mv, computerMove);
            } else {
                style.left = MOVE_PX(xSrc, xDst, step);
                style.top = MOVE_PX(ySrc, yDst, step);
                step--;
            }
        }, 16);
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
                this.result = RESULT_LOSS;
                this.game_.onLose();
            } else {
                this.result = RESULT_WIN;
                this.game_.onWin();
            }

            let pc = getSelfSideTag(this.pos.sdPlayer) + PIECE_KING;
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
            let xMate = SQ_X(sqMate);
            let step = MAX_STEP;
            let this_ = this;
            let timer = setInterval(function () {
                if (step == 0) {
                    clearInterval(timer);
                    style.left = xMate + "px";
                    style.zIndex = 0;
                    this_.imgSquares[sqMate].src = this_.images +
                        (this_.pos.sdPlayer == 0 ? "r" : "b") + "km.gif";
                    this_.postMate(computerMove);
                } else {
                    style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2) + "px";
                    step--;
                }
            }, 50);
            return;
        }

        let vlRep = this.pos.repStatus(3);
        if (vlRep > 0) {
            vlRep = this.pos.repValue(vlRep);
            if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
                this.game_.onDraw(0);
                this.result = RESULT_DRAW;
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
                this.result = RESULT_DRAW;
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
        let this_ = this;
        this.busy = true;
        setTimeout(function () {
            this_.addMove(this_.search.searchMain(LIMIT_DEPTH, this_.millis), true);
            this_.game_.endThinking();
        }, 250);
    }

    /**
     * @method 点击棋子
     * @param {number} pos 棋子坐标
     */
    clickSquare(pos) {
        if (this.busy || this.result != RESULT_INIT) {
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
        img.src = this.images + PIECE_NAME[this.pos.squares[sq]] + ".gif";
        img.style.backgroundImage = selected ? "url(" + this.images + "oos.gif)" : "";
    }

    /**
     * @method 刷新棋盘
     */
    flushBoard() {
        this.lastMotion = this.pos.motionList[this.pos.motionList.length - 1];
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
        this.result = RESULT_INIT;
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
        this.result = RESULT_INIT;
        if (this.pos.motionList.length > 1) {
            this.pos.undoMakeMove();
        }
        if (this.pos.motionList.length > 1 && this.computerMove()) {
            this.pos.undoMakeMove();
        }
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
        return getCharFromByteCode(getCodeFromChar("A") + getChessPosX(posSrc) - FILE_LEFT) +
            getCharFromByteCode(getCodeFromChar("9") - getChessPosY(posSrc) + RANK_TOP) + "-" +
            getCharFromByteCode(getCodeFromChar("A") + getChessPosX(posDst) - FILE_LEFT) +
            getCharFromByteCode(getCodeFromChar("9") - getChessPosY(posDst) + RANK_TOP);
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