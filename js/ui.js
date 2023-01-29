"use strict";

import * as constant from "./constant.js";
import * as util from "./util.js";
import { getChessPosX, getChessPosY, isChessOnBoard } from "./position.js";

export const STARTUP_FEN = [
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w", // 不让子
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w", // 让左马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w", // 让双马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w", // 让九子
];
export class UIBoard {
    constructor(game, container, images) {
        this.game_ = game;
        this.container_ = container;
        this.images_ = images;

        // 设置背景图片
        let style = container.style;
        style.position = "relative";
        style.width = constant.UI_BOARD_WIDTH + "px";
        style.height = constant.UI_BOARD_HEIGHT + "px";
        style.background = "url(" + images + "board.jpg)";

        // 思考缓冲图
        this.thinking = document.createElement("img");
        this.thinking.src = images + "thinking.gif";
        let imgStyle = this.thinking.style;
        imgStyle.visibility = "hidden";
        imgStyle.position = "absolute";
        imgStyle.left = constant.UI_THINKING_POS_LEFT + "px";
        imgStyle.top = constant.UI_THINKING_POS_TOP + "px";
        container.appendChild(this.thinking);

        // 棋子
        this.imgSquares = [];

        for (let sq = 0; sq < 256; sq++) {
            if (!isChessOnBoard(sq)) {
                this.imgSquares.push(null);
                continue;
            }
            let img = document.createElement("img");
            let style = img.style;
            style.position = "absolute";
            style.left = this.getUiXFromPos(sq) + "px";
            style.top = this.getUiYFromPos(sq) + "px";
            style.width = constant.UI_CCHESS_SIZE + "px";
            style.height = constant.UI_CCHESS_SIZE + "px";
            style.zIndex = 0;
            let that = this;
            img.onmousedown = function (sq_) {
                return () => {
                    that.game_.onSelectSquare(sq_);
                }
            }(sq);

            container.appendChild(img);
            this.imgSquares.push(img);
        }

    }

    showThinkBox() {
        this.thinking.style.visibility = "visible";
    }

    hideThinkBox() {
        this.thinking.style.visibility = "hidden";
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
     * 绘制棋子
     * @param {*} sq 棋子位置
     * @param {*} selected 选中状态
     */
    drawSquare(sq, selected, piece) {
        let img = this.imgSquares[sq];
        img.src = `${this.images_ + constant.PIECE_NAME[piece]}.gif`;
        img.style.backgroundImage = selected ? `url(${this.images_}oos.gif)` : "";
        if (piece > 0) {
            // await util.sleepMS(20)
        }
    }

    // 添加着法
    async addMove(text, value,) {
        try {
            selMoveList.add(this.createOption(text, value, false));
        } catch (e) {
            selMoveList.add(this.createOption(text, value, true));
        }
        selMoveList.scrollTop = selMoveList.scrollHeight;
    }

    // 模拟动画
    async fakeAnimation(posSrc, posDst) {
        let xSrc = this.getUiXFromPos(posSrc);
        let ySrc = this.getUiYFromPos(posSrc);

        let xDst = this.getUiXFromPos(posDst);
        let yDst = this.getUiYFromPos(posDst);

        let style = this.imgSquares[posSrc].style;
        style.zIndex = 256;
        let step = constant.MAX_STEP - 1;
        for (let i = 0; i < step; i++) {
            await util.sleepMS(16)
            style.left = this.getMotionPixelByStep(xSrc, xDst, step);
            style.top = this.getMotionPixelByStep(ySrc, yDst, step);
        }

        style.left = xSrc + "px";
        style.top = ySrc + "px";
        style.zIndex = 0;
    }

    async onMate(sqMate,sdPlayer) {
        let style = this.imgSquares[sqMate].style;
        style.zIndex = 256;
        let xMate = this.getUiXFromPos(sqMate);
        let step = constant.MAX_STEP;
        for (let i = 0; i < step; i++) {
            await util.sleepMS(50);
            style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2) + "px";
        }
        style.left = xMate + "px";
        style.zIndex = 0;
        this.imgSquares[sqMate].src = this.images_ + sdPlayer + "km.gif";
    }

    /**
     * 在ui中添加走棋着法
     */
    createOption(text, value, ie8) {
        let opt = document.createElement("option");
        opt.selected = true;
        opt.value = value;
        if (ie8) {
            opt.text = text;
        } else {
            opt.innerHTML = text.replace(/ /g, "&nbsp;");
        }
        return opt;
    }

    /**
     * @method 消息窗
     * @param {string} message 
     */
    async alertDelay(message, time) {
        let delay = time || 100;
        setTimeout(function () {
            alert(message);
        }, delay);
    }

    /**
     * @method 获取棋子在界面中的X坐标
     * @param {number} pos 
     */
    getUiXFromPos(pos) {
        return constant.UI_BOARD_LEFT_LINE_POS + (getChessPosX(pos) - 3) * constant.UI_CCHESS_SIZE;
    }

    /**
     * @method 获取棋子在界面中的Y坐标
     * @param {number} pos 
     */
    getUiYFromPos(pos) {
        return constant.UI_BOARD_TOP_LINE_POS + (getChessPosY(pos) - 3) * constant.UI_CCHESS_SIZE;
    }

    /**
     * @method 计算动画每次的偏移量
     * @param {number} src 
     * @param {number} dst 
     * @param {number} step 步长,越来越小就形成了从src到dst的动画
     */
    async getMotionPixelByStep(src, dst, step) {
        return Math.floor((src * step + dst * (constant.MAX_STEP - step)) / constant.MAX_STEP + 0.5) + "px";
    }
}