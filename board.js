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
        this.images = images;
        this.sounds = sounds;

        this.pos = new Position();
        this.pos.fromFen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");

        this.animated = true;
        this.sound = true;
        this.search = null;
        this.imgSquares = [];

        this.sqSelected = 0;
        this.mvLast = 0;
        this.millis = 0;
        this.computer = -1;
        this.result = RESULT_INIT;
        this.busy = false;


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

        this.thinking = document.createElement("img");
        this.thinking.src = images + "thinking.gif";
        let style = this.thinking.style;
        style.visibility = "hidden";
        style.position = "absolute";
        style.left = UI_THINKING_POS_LEFT + "px";
        style.top = UI_THINKING_POS_TOP + "px";
        container.appendChild(this.thinking);

        this.dummy = document.createElement("div");
        this.dummy.style.position = "absolute";
        container.appendChild(this.dummy);

        this.flushBoard();
    }

    playSound(soundFile) {
        if (!this.sound) {
            return;
        }
        try {
            new Audio(this.sounds + soundFile + ".wav").play();
        } catch (e) {
            this.dummy.innerHTML = "<embed src=\"" + this.sounds + soundFile +
                ".wav\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
        }
    }

    setSearch(hashLevel) {
        this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
    }

    flipped(sq) {
        return this.computer == 0 ? SQUARE_FLIP(sq) : sq;
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
            this.playSound("illegal");
            return;
        }
        this.busy = true;
        if (!this.animated) {
            this.postAddMove(mv, computerMove);
            return;
        }

        var sqSrc = this.flipped(SRC(mv));
        var xSrc = SQ_X(sqSrc);
        var ySrc = SQ_Y(sqSrc);
        var sqDst = this.flipped(DST(mv));
        var xDst = SQ_X(sqDst);
        var yDst = SQ_Y(sqDst);
        var style = this.imgSquares[sqSrc].style;
        style.zIndex = 256;
        var step = MAX_STEP - 1;
        var this_ = this;
        var timer = setInterval(function () {
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
        if (this.mvLast > 0) {
            this.drawSquare(SRC(this.mvLast), false);
            this.drawSquare(DST(this.mvLast), false);
        }
        this.drawSquare(SRC(mv), true);
        this.drawSquare(DST(mv), true);
        this.sqSelected = 0;
        this.mvLast = mv;

        if (this.pos.isMate()) {
            this.playSound(computerMove ? "loss" : "win");
            this.result = computerMove ? RESULT_LOSS : RESULT_WIN;

            var pc = SIDE_TAG(this.pos.sdPlayer) + PIECE_KING;
            var sqMate = 0;
            for (var sq = 0; sq < 256; sq++) {
                if (this.pos.squares[sq] == pc) {
                    sqMate = sq;
                    break;
                }
            }
            if (!this.animated || sqMate == 0) {
                this.postMate(computerMove);
                return;
            }

            sqMate = this.flipped(sqMate);
            var style = this.imgSquares[sqMate].style;
            style.zIndex = 256;
            var xMate = SQ_X(sqMate);
            var step = MAX_STEP;
            var this_ = this;
            var timer = setInterval(function () {
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

        var vlRep = this.pos.repStatus(3);
        if (vlRep > 0) {
            vlRep = this.pos.repValue(vlRep);
            if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
                this.playSound("draw");
                this.result = RESULT_DRAW;
                alertDelay("双方不变作和，辛苦了！");
            } else if (computerMove == (vlRep < 0)) {
                this.playSound("loss");
                this.result = RESULT_LOSS;
                alertDelay("长打作负，请不要气馁！");
            } else {
                this.playSound("win");
                this.result = RESULT_WIN;
                alertDelay("长打作负，祝贺你取得胜利！");
            }
            this.postAddMove2();
            this.busy = false;
            return;
        }

        if (this.pos.captured()) {
            var hasMaterial = false;
            for (var sq = 0; sq < 256; sq++) {
                if (isChessOnBoard(sq) && (this.pos.squares[sq] & 7) > 2) {
                    hasMaterial = true;
                    break;
                }
            }
            if (!hasMaterial) {
                this.playSound("draw");
                this.result = RESULT_DRAW;
                alertDelay("双方都没有进攻棋子了，辛苦了！");
                this.postAddMove2();
                this.busy = false;
                return;
            }
        } else if (this.pos.pcList.length > 100) {
            var captured = false;
            for (var i = 2; i <= 100; i++) {
                if (this.pos.pcList[this.pos.pcList.length - i] > 0) {
                    captured = true;
                    break;
                }
            }
            if (!captured) {
                this.playSound("draw");
                this.result = RESULT_DRAW;
                alertDelay("超过自然限着作和，辛苦了！");
                this.postAddMove2();
                this.busy = false;
                return;
            }
        }

        if (this.pos.inCheck()) {
            this.playSound(computerMove ? "check2" : "check");
        } else if (this.pos.captured()) {
            this.playSound(computerMove ? "capture2" : "capture");
        } else {
            this.playSound(computerMove ? "move2" : "move");
        }

        this.postAddMove2();
        this.response();
    }

    postAddMove2() {
        if (typeof this.onAddMove == "function") {
            this.onAddMove();
        }
    }

    postMate(computerMove) {
        alertDelay(computerMove ? "请再接再厉！" : "祝贺你取得胜利！");
        this.postAddMove2();
        this.busy = false;
    }

    response() {
        if (this.search == null || !this.computerMove()) {
            this.busy = false;
            return;
        }
        this.thinking.style.visibility = "visible";
        var this_ = this;
        this.busy = true;
        setTimeout(function () {
            this_.addMove(Game.getInstance().getBoard().search.searchMain(LIMIT_DEPTH,
                Game.getInstance().getBoard().millis), true);
            this_.thinking.style.visibility = "hidden";
        }, 250);
    }

    clickSquare(sq_) {
        if (this.busy || this.result != RESULT_INIT) {
            return;
        }
        var sq = this.flipped(sq_);
        var pc = this.pos.squares[sq];
        if ((pc & SIDE_TAG(this.pos.sdPlayer)) != 0) {
            this.playSound("click");
            if (this.mvLast != 0) {
                this.drawSquare(SRC(this.mvLast), false);
                this.drawSquare(DST(this.mvLast), false);
            }
            if (this.sqSelected) {
                this.drawSquare(this.sqSelected, false);
            }
            this.drawSquare(sq, true);
            this.sqSelected = sq;
        } else if (this.sqSelected > 0) {
            this.addMove(MOVE(this.sqSelected, sq), false);
        }
    }

    drawSquare(sq, selected) {
        var img = this.imgSquares[this.flipped(sq)];
        img.src = this.images + PIECE_NAME[this.pos.squares[sq]] + ".gif";
        img.style.backgroundImage = selected ? "url(" + this.images + "oos.gif)" : "";
    }

    flushBoard() {
        this.mvLast = this.pos.mvList[this.pos.mvList.length - 1];
        for (var sq = 0; sq < 256; sq++) {
            if (isChessOnBoard(sq)) {
                this.drawSquare(sq, sq == SRC(this.mvLast) || sq == DST(this.mvLast));
            }
        }
    }

    restart(fen) {
        if (this.busy) {
            return;
        }
        this.result = RESULT_INIT;
        this.pos.fromFen(fen);
        this.flushBoard();
        this.playSound("newgame");
        this.response();
    }

    retract() {
        if (this.busy) {
            return;
        }
        this.result = RESULT_INIT;
        if (this.pos.mvList.length > 1) {
            this.pos.undoMakeMove();
        }
        if (this.pos.mvList.length > 1 && this.computerMove()) {
            this.pos.undoMakeMove();
        }
        this.flushBoard();
        this.response();
    }

    setSound(sound) {
        this.sound = sound;
        if (sound) {
            this.playSound("click");
        }
    }

    /**
     * @method 走棋着法转换成ICCS坐标格式，即着法表示成起点和终点的坐标。
     * @param {number} mv 
     */
    move2Iccs(mv) {
        let sqSrc = SRC(mv);
        let sqDst = DST(mv);
        return CHR(ASC("A") + FILE_X(sqSrc) - FILE_LEFT) +
            CHR(ASC("9") - RANK_Y(sqSrc) + RANK_TOP) + "-" +
            CHR(ASC("A") + FILE_X(sqDst) - FILE_LEFT) +
            CHR(ASC("9") - RANK_Y(sqDst) + RANK_TOP);
    }

    onAddMove() {
        let counter = (Game.getInstance().getBoard().pos.mvList.length >> 1);
        let space = (counter > 99 ? "    " : "   ");
        counter = (counter > 9 ? "" : " ") + counter + ".";
        let text = (Game.getInstance().getBoard().pos.sdPlayer == 0 ? space : counter) +
            this.move2Iccs(Game.getInstance().getBoard().mvLast);
        let value = "" + Game.getInstance().getBoard().mvLast;
        try {
            selMoveList.add(createOption(text, value, false));
        } catch (e) {
            selMoveList.add(createOption(text, value, true));
        }
        selMoveList.scrollTop = selMoveList.scrollHeight;
    }
}