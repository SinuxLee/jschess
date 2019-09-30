/**
 * ���ݶ���:
 * 1.����: �ڡ��졢��
 * 2.���ӹ�ֵ
 * 3.������λ��
 * 4.λ��:��������ϵ���㡢�ߡ�����
 * 5.����
 * 6.���(player)
 * 7.����
 * 8.¼��
 * 9.�������
 * 10.ai
 * 11.���ֿ�
 * 12.�淨���Ͷ���(���桢���塢������)
 * 13.��Ϸģʽ����(��ҡ�������elo�������⡢�оִ��ء��˻������ѷ�����λ������ս����ѧ�����ݹ���)
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
        //��ʼ������ģ��
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