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
 * 维持     保存        保存        走棋      附加    计算
 * 游戏     玩家        棋子        基本      规则    下一步棋
 * 流程     信息        走棋信息     规则
 */

"use strict";

import { GameAudio, WAV } from './audio.js';
import { Board }          from './board.js';
import { UIBoard }        from './ui.js';
import { isChecked }      from './engine/movegen.js';

const STARTUP_FEN = [
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w", // 不让子
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w", // 让左马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w", // 让双马
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w", // 让九子
];

export class Game {
    static getInstance() {
        if (!Game.instance) {
            Game.instance = new Game();
        }

        return Game.instance;
    }

    constructor() {
        this._imagePath = "images/";
        this._soundPath = "sounds/";

        this.sound = true;
        this.animated = true;

        // 创建音频和 UI
        this._audio = new GameAudio(this._soundPath, () => this.sound);
        let selMoveList = document.getElementById('selMoveList');
        this._uiBoard = new UIBoard(
            document.getElementById('container'),
            this._imagePath,
            selMoveList,
            (sq) => this._board.selectedSquare(sq)
        );

        // 创建棋盘控制器，注入 UI 和音频依赖
        this._board = new Board({
            audio: this._audio,
            uiBoard: this._uiBoard,
            getAnimated: () => this.animated
        });

        // 缓存 DOM 元素引用
        this._selMoveList = selMoveList;
        this._selMoveMode = document.getElementById('selMoveMode');
        this._selHandicap = document.getElementById('selHandicap');
        this._selLevel = document.getElementById('selLevel');

        // 绑定 DOM 事件
        this._selMoveList.addEventListener('change', () => this.onRecordListChange());
        this._selLevel.addEventListener('change', () => this.onClickLevelChange());
        this._selMoveMode.addEventListener('change', () => this.onClickRestart());
        this._selHandicap.addEventListener('change', () => this.onClickRestart());
        document.getElementById('btnRestart').addEventListener('click', () => this.onClickRestart());
        document.getElementById('btnRetract').addEventListener('click', () => this.onClickRetract());
        document.getElementById('chkAnimated').addEventListener('change', (e) => this.setAnimated(e.target.checked));
        document.getElementById('chkSound').addEventListener('change', (e) => this.setSound(e.target.checked));

        // 初始化棋盘（computer 由 selMoveMode 初始选项决定）
        this._board.initBoard(10, this._computerFromMode());
        this._board.setSearch(16);
    }

    setMaxThinkTimeMs(millis) {
        this._board.millis = millis;
    }

    restartGame(strFen) {
        this._board.restart(strFen);
    }

    getBoard() {
        return this._board;
    }

    setSound(sound) {
        this.sound = sound;
        if (sound) {
            this._audio.play(WAV.CLICK);
        }
    }

    setAnimated(animated) {
        this.animated = animated;
    }

    /**
     * @method 根据 selMoveMode 计算 computer 值
     *   0=我先走   → computer=1（电脑执黑）
     *   1=电脑先走 → computer=0（电脑执红）
     *   2=不用电脑 → computer=-1
     *   3=双机对弈 → computer=2（红黑皆电脑）
     */
    _computerFromMode() {
        const idx = this._selMoveMode.selectedIndex;
        if (idx === 3) return 2;          // 双机对弈
        return 1 - idx;                   // 0→1, 1→0, 2→-1
    }

    /**
     * @method 点击重新开始（或"谁先走"选项变更时）
     */
    onClickRestart() {
        this._selMoveList.options.length = 1;
        this._selMoveList.selectedIndex = 0;
        this._board.computer = this._computerFromMode();
        this.restartGame(STARTUP_FEN[this._selHandicap.selectedIndex]);
    }

    /**
     * @method 点击悔棋
     */
    onClickRetract() {
        // moveStack 长度 = 历史步数 + 1（初始哨兵项）；selMoveList 第0项是"=== 开始 ==="
        const stackLen = this._board.pos.moveStack.length;
        for (let i = stackLen - 1; i < this._selMoveList.options.length - 1; i++) {
            this._board.pos.makeMove(
                parseInt(this._selMoveList.options[i + 1].value),
                isChecked
            );
        }
        this._board.retract();
        // moveStack.length - 1 = 实际走棋步数，对应 selMoveList 中的选项数（不含"开始"）
        this._selMoveList.options.length = this._board.pos.moveStack.length;
        this._selMoveList.selectedIndex = this._selMoveList.options.length - 1;
    }

    /**
     * @method 设置AI等级
     */
    onClickLevelChange() {
        let thinkTimeMs = Math.pow(10, this._selLevel.selectedIndex + 1);
        this.setMaxThinkTimeMs(thinkTimeMs);
    }

    /**
     * @method 走棋记录有变更（点击棋谱列表跳转局面）
     *
     * moveStack.length - 1 = 当前实际步数
     * selMoveList.selectedIndex = 目标步数（0 = 开局，1 = 第1步，...）
     */
    onRecordListChange() {
        const board = this.getBoard();
        if (board.isInit()) {
            this._selMoveList.selectedIndex = this._selMoveList.options.length - 1;
            return;
        }

        // 当前步数（moveStack 有哨兵项，-1 得到实际步数）
        const from = board.pos.moveStack.length - 1;
        const to   = this._selMoveList.selectedIndex;
        if (from === to) {
            return;
        }

        if (from > to) {
            // 需要撤销
            for (let i = 0; i < from - to; i++) {
                board.pos.undoMakeMove();
            }
        } else {
            // 需要前进（从 selMoveList 重放走法）
            for (let i = from + 1; i <= to; i++) {
                board.pos.makeMove(
                    parseInt(this._selMoveList.options[i].value),
                    isChecked
                );
            }
        }
        board.flushBoard();
    }
}
