"use strict";

import { getX, getY, isOnBoard } from './core/coords.js';

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
    constructor(container, images, selMoveList, onSelect) {
        this._images = images;
        this._selMoveList = selMoveList;
        this._onSelect = onSelect;

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
            if (!isOnBoard(sq)) {
                this.imgSquares.push(null);
                continue;
            }
            let img = document.createElement("img");
            img.dataset.sq = sq;
            let style = img.style;
            style.position = "absolute";
            style.left = this.getUiXFromPos(sq) + "px";
            style.top = this.getUiYFromPos(sq) + "px";
            style.width = UI_CCHESS_SIZE + "px";
            style.height = UI_CCHESS_SIZE + "px";
            style.zIndex = 0;

            container.appendChild(img);
            this.imgSquares.push(img);
        }

        container.addEventListener('mousedown', (e) => {
            let img = e.target;
            if (img.tagName === 'IMG' && img.dataset.sq !== undefined) {
                this._onSelect(Number(img.dataset.sq));
            }
        });

    }

    showThinkBox() {
        this.thinking.style.visibility = "visible";
    }

    hideThinkBox() {
        this.thinking.style.visibility = "hidden";
    }

    /**
     * @method 刷新棋盘
     * @description 暂未使用，保留接口
     */
    flushBoard(pos, lastMotion) {
        for (let sq = 0; sq < 256; sq++) {
            if (isOnBoard(sq)) {
                let selected = (lastMotion > 0) &&
                    (sq === (lastMotion & 0xFF) || sq === ((lastMotion >> 8) & 0xFF));
                this.drawSquare(sq, selected, pos.squares[sq]);
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
    async addMove(text, value) {
        let opt = document.createElement('option');
        opt.selected = true;
        opt.value = value;
        opt.innerHTML = text.replace(/ /g, '&nbsp;');
        this._selMoveList.add(opt);
        this._selMoveList.scrollTop = this._selMoveList.scrollHeight;
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
        for (let i = step; i > 0; i--) {
            await this.sleepMS(16);
            style.left = this.getMotionPixelByStep(xSrc, xDst, i);
            style.top = this.getMotionPixelByStep(ySrc, yDst, i);
        }

        // 动画结束后，将源格图片位置重置回源格坐标，
        // 避免 img 元素永久留在目标位置导致事件遮挡
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
            style.left = (xMate + ((i & 1) === 0 ? i : -i) * 2) + "px";
        }
        style.left = xMate + "px";
        style.zIndex = 0;
        this.imgSquares[sqMate].src = this._images + sdPlayer + "km.gif";
    }

    /**
     * @method 消息窗
     * @param {string} message 
     */
    showToast(message, duration) {
        let ms = duration || 2000;
        let el = document.createElement('div');
        el.className = 'toast-notification';
        el.textContent = message;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, ms);
    }

    async alertDelay(message) {
        this.showToast(message);
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
        return UI_BOARD_LEFT_LINE_POS + (getX(pos) - 3) * UI_CCHESS_SIZE;
    }

    /**
     * @method 获取棋子在界面中的Y坐标
     * @param {number} pos 
     */
    getUiYFromPos(pos) {
        return UI_BOARD_TOP_LINE_POS + (getY(pos) - 3) * UI_CCHESS_SIZE;
    }

    /**
     * @method 计算动画每次的偏移量
     * @param {number} src 
     * @param {number} dst 
     * @param {number} step 步长,越来越小就形成了从src到dst的动画
     */
    getMotionPixelByStep(src, dst, step) {
        return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + 0.5) + "px";
    }
}