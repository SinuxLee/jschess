"use strict";

const STARTUP_FEN = [
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w", //不让子
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w", //让左马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w", //让双马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w", //让九子
];

/**
 * 在ui中添加走棋着法
 */
function createOption(text, value, ie8) {
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
function alertDelay(message, time) {
    let delay = time || 250;
    setTimeout(function () {
        alert(message);
    }, delay);
}

/**
 * @method 获取棋子在界面中的X坐标
 * @param {number} sq 
 */
function SQ_X(sq) {
    return UI_BOARD_LEFT_LINE_POS + (getChessPosX(sq) - 3) * UI_CCHESS_SIZE;
}

/**
 * @method 获取棋子在界面中的Y坐标
 * @param {number} sq 
 */
function SQ_Y(sq) {
    return UI_BOARD_TOP_LINE_POS + (getChessPosY(sq) - 3) * UI_CCHESS_SIZE;
}

/**
 * @method 计算动画每次的偏移量
 * @param {number} src 
 * @param {number} dst 
 * @param {number} step 步长,越来越小就形成了从src到dst的动画
 */
function MOVE_PX(src, dst, step) {
    return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + 0.5) + "px";
}

class UIBoard {
    constructor(game, container, images) {
        this.game_ = game;
        this.container_ = container;
        this.images_ = images;

        //设置背景图片
        let style = container.style;
        style.position = "relative";
        style.width = UI_BOARD_WIDTH + "px";
        style.height = UI_BOARD_HEIGHT + "px";
        style.background = "url(" + images + "board.jpg)";

        //思考缓冲图
        this.thinking = document.createElement("img");
        this.thinking.src = images + "thinking.gif";
        let imgStyle = this.thinking.style;
        imgStyle.visibility = "hidden";
        imgStyle.position = "absolute";
        imgStyle.left = UI_THINKING_POS_LEFT + "px";
        imgStyle.top = UI_THINKING_POS_TOP + "px";
        container.appendChild(this.thinking);

        //棋子
        this.imgSquares = [];

        /*
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
                    //this_.clickSquare(sq_);
                }
            }(sq);

            container.appendChild(img);
            this.imgSquares.push(img);
        }*/
    }

    showThinkBox() {
        this.thinking.style.visibility = "visible";
    }

    hideThinkBox() {
        this.thinking.style.visibility = "hidden";
    }
}