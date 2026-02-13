"use strict";

/**
 * 音频处理
 */

const WAV = Object.freeze({
    DRAW: "draw",
    CHECK: "check",
    CAPTURE: "capture",
    MOVE: "move",
    CLICK: "click",
    NEWGAME: "newgame",
    ILLEGAL: "illegal",
    LOSS: "loss",
    WIN: "win",
    CHECK2: "check2",
    CAPTURE2: "capture2",
    MOVE2: "move2",
})

export class GameAudio extends EventTarget{
    constructor(game, soundPath) {
        super()

        this._game = game;
        this._soundPath = soundPath;
        this.dummy = document.createElement("div");
        this.dummy.style.position = "absolute";
        document.body.appendChild(this.dummy);
    }

    playDrawSound() {
        this.playSound(WAV.DRAW);
    }

    playCheckSound() {
        this.playSound(WAV.CHECK);
    }

    playCaptureSound() {
        this.playSound(WAV.CAPTURE);
    }

    playMoveSound() {
        this.playSound(WAV.MOVE);
    }

    playClickSound() {
        this.playSound(WAV.CLICK);
    }

    playNewGameSound() {
        this.playSound(WAV.NEWGAME);
    }

    playIllegalSound() {
        this.playSound(WAV.ILLEGAL);
    }

    playLoseSound() {
        this.playSound(WAV.LOSS);
    }

    playWinSound() {
        this.playSound(WAV.WIN);
    }

    playAICheckSound() {
        this.playSound(WAV.CHECK2);
    }

    playAICaptureSound() {
        this.playSound(WAV.CAPTURE2);
    }

    playAIMoveSound() {
        this.playSound(WAV.MOVE2);
    }

    playSound(soundFile) {
        if (!this._soundPath || !this._game.getSound()) {
            return;
        }
        
        try {
            new Audio(this._soundPath + soundFile + ".wav").play();
        } catch (e) {
            this.dummy.innerHTML =
                `<embed src="${this._soundPath + soundFile}.wav" hidden="true" autostart="true" loop="false"/>`;
        }
    }
}
