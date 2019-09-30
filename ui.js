"use strict";

const STARTUP_FEN = [
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w", //不让子
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w", //让左马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w", //让双马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w", //让九子
];

/**
 * 修改AI等级
 */
function level_change() {
    let thinkTimeMs = Math.pow(10, selLevel.selectedIndex + 1);
    Game.getInstance().setMaxThinkTimeMs(thinkTimeMs);
}

/**
 * 重新开始
 */
function restart_click() {
    selMoveList.options.length = 1;
    selMoveList.selectedIndex = 0;
    Game.getInstance().getBoard().computer = 1 - selMoveMode.selectedIndex;
    Game.getInstance().restartGame(STARTUP_FEN[selHandicap.selectedIndex]);
}

/**
 * 悔棋
 */
function retract_click() {
    let board = Game.getInstance().getBoard();
    for (let i = board.pos.mvList.length; i < selMoveList.options.length; i++) {
        board.pos.makeMove(parseInt(selMoveList.options[i].value));
    }
    board.retract();
    selMoveList.options.length = board.pos.mvList.length;
    selMoveList.selectedIndex = selMoveList.options.length - 1;
}

/**
 * 走棋列表有改变
 */
function moveList_change() {
    let board = Game.getInstance().getBoard();
    if (board.result == RESULT_INIT) {
        selMoveList.selectedIndex = selMoveList.options.length - 1;
        return;
    }
    let from = board.pos.mvList.length;
    let to = selMoveList.selectedIndex;
    if (from == to + 1) {
        return;
    }
    if (from > to + 1) {
        for (let i = to + 1; i < from; i++) {
            board.pos.undoMakeMove();
        }
    } else {
        for (let i = from; i <= to; i++) {
            board.pos.makeMove(parseInt(selMoveList.options[i].value));
        }
    }
    board.flushBoard();
}

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
    return UI_BOARD_LEFT_LINE_POS + (FILE_X(sq) - 3) * UI_CCHESS_SIZE;
}

/**
 * @method 获取棋子在界面中的Y坐标
 * @param {number} sq 
 */
function SQ_Y(sq) {
    return UI_BOARD_TOP_LINE_POS + (RANK_Y(sq) - 3) * UI_CCHESS_SIZE;
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

    }
}