/**
 * 数据定义:
 * 1.棋子: 黑、红、空
 * 2.棋子估值
 * 3.棋子走位表
 * 4.位置:棋盘坐标系、点、线、悔棋
 * 5.棋盘
 * 6.玩家(player)
 * 7.房间
 * 8.录像
 * 9.走棋规则
 * 10.ai
 * 11.开局库
 * 12.玩法类型定义(常规、揭棋、翻翻棋)
 * 13.游戏模式定义(金币、比赛、elo棋力评测、残局闯关、人机、好友房、排位赛、观战、教学、推演工具)
 * 
 * 
 * 术语定义:
 * 1.Piece 棋子，不要用chess！chess是国际象棋的意思
 * 
 * Desk --> Player --> Board --> Piece      Rule    AI
 * |        |           |          |        |       |
 * 维持     保存        保存        走棋    附加    计算
 * 游戏     玩家        棋子        基本    规则    下一步棋
 * 流程     信息        走棋信息    规则
 */

"use strict";

import {GameAudio} from "./audio.js";
import {Board} from "./board.js";
import {UIBoard,alertDelay,STARTUP_FEN} from "./ui.js"
import * as constant from "./constant.js";

export class Game {
    static getInstance() {
        if (!Game.instance) {
            Game.instance = new Game();
        }

        return Game.instance;
    }

    constructor() {
        this.imagePath_ = "images/";
        this.soundPath_ = "sounds/";
        this.audio_ = new GameAudio(this, container, this.soundPath_);

        //初始化棋盘模型
        this.board_ = new Board(this, container, this.imagePath_, this.soundPath_);
        this.board_.setSearch(16);
        this.board_.millis = 10;
        this.board_.computer = 1;

        this.uiBoard_ = new UIBoard(this, container, this.imagePath_);

        this.sound = true; //声音开关
        this.animated = true; //动画开关
    }

    setMaxThinkTimeMs(millis) {
        this.board_.millis = millis;
    }

    restartGame(strFen) {
        this.board_.restart(strFen)
    }

    getBoard() {
        return this.board_;
    }

    onIllegalMove() {
        this.audio_.playIllegalSound();
    }

    /**
     * @method 输了
     * @param {number} reason 输的原因，0-正常打输了, 1-我方长将/长捉
     */
    onLose(reason) {
        this.audio_.playLoseSound();
        let rea = reason || 0; //默认为正常输
        if (1 == rea) {
            alertDelay("长打作负，请不要气馁！");
        }
    }

    /**
     * @method 赢了
     * @param {number} reason 0-正常打赢, 1-对方长捉/长将
     */
    onWin(reason) {
        this.audio_.playWinSound();
        let rea = reason || 0;
        if (1 == rea) {
            alertDelay("长打作负，祝贺你取得胜利！");
        }
    }

    /**
     * @method 平局
     * @param {number} reason,0-不变着法, 1-双方没有进攻棋子了
     */
    onDraw(reason) {
        this.audio_.playDrawSound();
        if (0 == reason) {
            alertDelay("双方不变作和，辛苦了！");
        } else if (1 == reason) {
            alertDelay("双方都没有进攻棋子了，辛苦了！");
        } else if (2 == reason) {
            alertDelay("超过自然限着作和，辛苦了！");
        }
    }

    onClickChess() {
        this.audio_.playClickSound();
    }

    onCheck() {
        this.audio_.playCheckSound();
    }

    onAICheck() {
        this.audio_.playAICheckSound();
    }

    onCapture() {
        this.audio_.playCaptureSound();
    }

    onAICapture() {
        this.audio_.playAIMoveSound();
    }

    onMove() {
        this.audio_.playMoveSound();
    }

    onAIMove() {
        this.audio_.playAIMoveSound();
    }

    onNewGame() {
        this.audio_.playNewGameSound();
    }

    setSound(sound) {
        this.sound = sound;
        if (sound) {
            this.audio_.playClickSound();
        }
    }

    getSound() {
        return this.sound;
    }

    setAnimated(animated) {
        this.animated = animated;
    }

    getAnimated() {
        return this.animated;
    }

    beginThinking() {
        this.uiBoard_.showThinkBox();
    }

    endThinking() {
        this.uiBoard_.hideThinkBox();
    }

    /**
     * @method 点击重新开始
     */
    onClickRestart() {
        selMoveList.options.length = 1;
        selMoveList.selectedIndex = 0;
        this.board_.computer = 1 - selMoveMode.selectedIndex;
        this.restartGame(STARTUP_FEN[selHandicap.selectedIndex]);
    }

    /**
     * @method 点击悔棋
     */
    onClickRetract() {
        for (let i = this.board_.pos.motionList.length; i < selMoveList.options.length; i++) {
            this.board_.pos.makeMove(parseInt(selMoveList.options[i].value));
        }
        this.board_.retract();
        selMoveList.options.length = this.board_.pos.motionList.length;
        selMoveList.selectedIndex = selMoveList.options.length - 1;
    }

    /**
     * @method 设置AI等级
     */
    onClickLevelChange() {
        let thinkTimeMs = Math.pow(10, selLevel.selectedIndex + 1);
        this.setMaxThinkTimeMs(thinkTimeMs);
    }

    /**
     * @method 走棋记录有变更
     */
    onRecordListChange() {
        let board = Game.getInstance().getBoard();
        if (board.result == constant.RESULT_INIT) {
            selMoveList.selectedIndex = selMoveList.options.length - 1;
            return;
        }
        let from = board.pos.motionList.length;
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
     * 刷新棋盘UI
     */
    onFlushBoard() {
        this.uiBoard_.flushBoard();
    }
}
export const game = Game.getInstance();
