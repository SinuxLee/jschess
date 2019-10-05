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
 * 
 * 
 * ���ﶨ��:
 * 1.Piece ���ӣ���Ҫ��chess��chess�ǹ����������˼
 * 
 * Desk --> Player --> Board --> Piece      Rule    AI
 * |        |           |          |        |       |
 * ά��     ����        ����        ����    ����    ����
 * ��Ϸ     ���        ����        ����    ����    ��һ����
 * ����     ��Ϣ        ������Ϣ    ����
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
        this.imagePath_ = "images/";
        this.soundPath_ = "sounds/";
        this.audio_ = new GameAudio(this, container, this.soundPath_);

        //��ʼ������ģ��
        this.board_ = new Board(this, container, this.imagePath_, this.soundPath_);
        this.board_.setSearch(16);
        this.board_.millis = 10;
        this.board_.computer = 1;

        this.uiBoard_ = new UIBoard(this, container, this.imagePath_);

        this.sound = true; //��������
        this.animated = true; //��������
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
     * @method ����
     * @param {number} reason ���ԭ��0-����������, 1-�ҷ�����/��׽
     */
    onLose(reason) {
        this.audio_.playLoseSound();
        let rea = reason || 0; //Ĭ��Ϊ������
        if (1 == rea) {
            alertDelay("�����������벻Ҫ���٣�");
        }
    }

    /**
     * @method Ӯ��
     * @param {number} reason 0-������Ӯ, 1-�Է���׽/����
     */
    onWin(reason) {
        this.audio_.playWinSound();
        let rea = reason || 0;
        if (1 == rea) {
            alertDelay("����������ף����ȡ��ʤ����");
        }
    }

    /**
     * @method ƽ��
     * @param {number} reason,0-�����ŷ�, 1-˫��û�н���������
     */
    onDraw(reason) {
        this.audio_.playDrawSound();
        if (0 == reason) {
            alertDelay("˫���������ͣ������ˣ�");
        } else if (1 == reason) {
            alertDelay("˫����û�н��������ˣ������ˣ�");
        } else if (2 == reason) {
            alertDelay("������Ȼ�������ͣ������ˣ�");
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
     * @method ������¿�ʼ
     */
    onClickRestart() {
        selMoveList.options.length = 1;
        selMoveList.selectedIndex = 0;
        this.board_.computer = 1 - selMoveMode.selectedIndex;
        this.restartGame(STARTUP_FEN[selHandicap.selectedIndex]);
    }

    /**
     * @method �������
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
     * @method ����AI�ȼ�
     */
    onClickLevelChange() {
        let thinkTimeMs = Math.pow(10, selLevel.selectedIndex + 1);
        this.setMaxThinkTimeMs(thinkTimeMs);
    }

    /**
     * @method �����¼�б��
     */
    onRecordListChange() {
        let board = Game.getInstance().getBoard();
        if (board.result == RESULT_INIT) {
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
     * ˢ������UI
     */
    onFlushBoard() {
        this.uiBoard_.flushBoard();
    }
}

let game = Game.getInstance();