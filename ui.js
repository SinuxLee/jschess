"use strict";

const STARTUP_FEN = [
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w", //������
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w", //������
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w", //��˫��
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w", //�þ���
];

/**
 * �޸�AI�ȼ�
 */
function level_change() {
    let thinkTimeMs = Math.pow(10, selLevel.selectedIndex + 1);
    Game.getInstance().setMaxThinkTimeMs(thinkTimeMs);
}

/**
 * ���¿�ʼ
 */
function restart_click() {
    selMoveList.options.length = 1;
    selMoveList.selectedIndex = 0;
    Game.getInstance().getBoard().computer = 1 - selMoveMode.selectedIndex;
    Game.getInstance().restartGame(STARTUP_FEN[selHandicap.selectedIndex]);
}

/**
 * ����
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
 * �����б��иı�
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
 * ��ui����������ŷ�
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
 * @method ��Ϣ��
 * @param {string} message 
 */
function alertDelay(message, time) {    
    let delay = time || 250;
    setTimeout(function () {
        alert(message);
    }, delay);
}

/**
 * @method ��ȡ�����ڽ����е�X����
 * @param {number} sq 
 */
function SQ_X(sq) {
    return UI_BOARD_LEFT_LINE_POS + (FILE_X(sq) - 3) * UI_CCHESS_SIZE;
}

/**
 * @method ��ȡ�����ڽ����е�Y����
 * @param {number} sq 
 */
function SQ_Y(sq) {
    return UI_BOARD_TOP_LINE_POS + (RANK_Y(sq) - 3) * UI_CCHESS_SIZE;
}

/**
 * @method ���㶯��ÿ�ε�ƫ����
 * @param {number} src 
 * @param {number} dst 
 * @param {number} step ����,Խ��ԽС���γ��˴�src��dst�Ķ���
 */
function MOVE_PX(src, dst, step) {
    return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + 0.5) + "px";
}

class UIBoard {
    constructor(game, container, images) {
        this.game_ = game;
        this.container_ = container;
        this.images_ = images;

        //���ñ���ͼƬ
        let style = container.style;
        style.position = "relative";
        style.width = UI_BOARD_WIDTH + "px";
        style.height = UI_BOARD_HEIGHT + "px";
        style.background = "url(" + images + "board.jpg)";

    }
}