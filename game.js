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
 */

"use strict";

class Game {
    static getInstance() {
        if (!Game.instance) {
            Game.instance = new Game();
        }

        return Game.instance;
    }

    constructor() {
        //初始化棋盘模型
        this.board_ = new Board(this, container, "images/", "sounds/");
        this.board_.setSearch(16);
        this.board_.millis = 10;
        this.board_.computer = 1;
        this.imagePath_ = "images/";
        this.soundPath_ = "sounds/";
        this.uiBoard_ = new UIBoard(this, container, "images/");
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
}

let game = Game.getInstance();