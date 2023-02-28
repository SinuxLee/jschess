"use strict";

import { getChessPosX, getChessPosY, isChessOnBoard } from "./position.js";

/**
 * UI中棋盘大小定义
 */
const UI_BOARD_WIDTH = 521; // 棋盘宽(px)
const UI_BOARD_HEIGHT = 577; // 棋盘高

/**
 * UI中棋子大小定义
 */
const UI_CCHESS_SIZE = 57; // 棋子大小

/**
 * 棋盘四周空余大小
 */
const UI_BOARD_LEFT_LINE_POS = (UI_BOARD_WIDTH - UI_CCHESS_SIZE * 9) >> 1; // 最左侧线的位置
const UI_BOARD_TOP_LINE_POS = (UI_BOARD_HEIGHT - UI_CCHESS_SIZE * 10) >> 1; // 最上方线的位置

/**
 * Loading 图大小及位置
 */
const UI_THINKING_SIZE = 32; // 菊花图片的大小
const UI_THINKING_POS_LEFT = (UI_BOARD_WIDTH - UI_THINKING_SIZE) >> 1;
const UI_THINKING_POS_TOP = (UI_BOARD_HEIGHT - UI_THINKING_SIZE) >> 1;

// 动画最多拆分为8次移动
const MAX_STEP = 8;

/**
 * 图片资源名字: r-车、n-马、b-相、a-士、c-炮、p-卒
 */
const PIECE_NAME = [
    "oo", null, null, null, null, null, null, null, // [0, 7]
    "rk", "ra", "rb", "rn", "rr", "rc", "rp", null, // [8, 15] 红方
    "bk", "ba", "bb", "bn", "br", "bc", "bp", null, // [16, 24] 黑方
    // 将,  士,   相,   马,   车,    炮,    卒
];

export class UIBoard {
    constructor(game, container, images) {
        this._game = game;
        this._images = images;

        // 设置背景图片
        let style = container.style;
        style.position = "relative";
        style.width = UI_BOARD_WIDTH + "px";
        style.height = UI_BOARD_HEIGHT + "px";
        style.background = "url(" + images + "board.jpg)";

        // 思考缓冲图
        this.thinking = document.createElement("img");
        this.thinking.src = images + "thinking.gif";
        let imgStyle = this.thinking.style;
        imgStyle.visibility = "hidden";
        imgStyle.position = "absolute";
        imgStyle.left = UI_THINKING_POS_LEFT + "px";
        imgStyle.top = UI_THINKING_POS_TOP + "px";
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
            style.width = UI_CCHESS_SIZE + "px";
            style.height = UI_CCHESS_SIZE + "px";
            style.zIndex = 0;
            let that = this;
            img.onmousedown = function (sq_) {
                return () => {
                    that._game.onSelectSquare(sq_);
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
        img.src = `${this._images + PIECE_NAME[piece]}.gif`;
        img.style.backgroundImage = selected ? `url(${this._images}oos.gif)` : "";
        if (piece > 0) {
            // await this.sleepMS(20)
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
        let step = MAX_STEP - 1;
        for (let i = 0; i < step; i++) {
            await this.sleepMS(16)
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
        let step = MAX_STEP;
        for (let i = 0; i < step; i++) {
            await this.sleepMS(50);
            style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2) + "px";
        }
        style.left = xMate + "px";
        style.zIndex = 0;
        this.imgSquares[sqMate].src = this._images + sdPlayer + "km.gif";
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

    async sleepMS(ms){
        return new Promise(function(resolve){
            setTimeout(resolve,ms)
        })
    }

    /**
     * @method 获取棋子在界面中的X坐标
     * @param {number} pos 
     */
    getUiXFromPos(pos) {
        return UI_BOARD_LEFT_LINE_POS + (getChessPosX(pos) - 3) * UI_CCHESS_SIZE;
    }

    /**
     * @method 获取棋子在界面中的Y坐标
     * @param {number} pos 
     */
    getUiYFromPos(pos) {
        return UI_BOARD_TOP_LINE_POS + (getChessPosY(pos) - 3) * UI_CCHESS_SIZE;
    }

    /**
     * @method 计算动画每次的偏移量
     * @param {number} src 
     * @param {number} dst 
     * @param {number} step 步长,越来越小就形成了从src到dst的动画
     */
    async getMotionPixelByStep(src, dst, step) {
        return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + 0.5) + "px";
    }
}