/**
 * 音频处理
 */

const WAV_DRAW = "draw";
const WAV_CHECK = "check";
const WAV_CAPTURE = "capture";
const WAV_MOVE = "move";
const WAV_CLICK = "click";
const WAV_NEWGAME = "newgame";
const WAV_ILLEGAL = "illegal";
const WAV_LOSS = "loss";
const WAV_WIN = "win";
const WAV_CHECK2 = "check2";
const WAV_CAPTURE2 = "capture2";
const WAV_MOVE2 = "move2";


export class GameAudio {
    constructor(game, container, soundPath) {
        this.game_ = game;
        this.soundPath_ = soundPath;
        this.container_ = container;
        this.dummy = document.createElement("div");
        this.dummy.style.position = "absolute";
        container.appendChild(this.dummy);
    }

    playDrawSound() {
        this.playSound(WAV_DRAW);
    }

    playCheckSound() {
        this.playSound(WAV_CHECK);
    }

    playCaptureSound() {
        this.playSound(WAV_CAPTURE);
    }

    playMoveSound() {
        this.playSound(WAV_MOVE);
    }

    playClickSound() {
        this.playSound(WAV_CLICK);
    }

    playNewGameSound() {
        this.playSound(WAV_NEWGAME);
    }

    playIllegalSound() {
        this.playSound(WAV_ILLEGAL);
    }

    playLoseSound() {
        this.playSound(WAV_LOSS);
    }

    playWinSound() {
        this.playSound(WAV_WIN);
    }

    playAICheckSound() {
        this.playSound(WAV_CHECK2);
    }

    playAICaptureSound() {
        this.playSound(WAV_CAPTURE2);
    }

    playAIMoveSound() {
        this.playSound(WAV_MOVE2);
    }

    playSound(soundFile) {
        if (!this.soundPath_ || !this.game_.getSound()) {
            return;
        }
        try {
            new Audio(this.soundPath_ + soundFile + ".wav").play();
        } catch (e) {
            this.dummy.innerHTML =
                `<embed src="${this.soundPath_ + soundFile}.wav" hidden="true" autostart="true" loop="false"/>`;
        }
    }
}
