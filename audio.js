/**
 * 音频处理
 */

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
        this.playSound("draw");
    }

    playCheckSound() {
        this.playSound("check");
    }

    playCaptureSound() {
        this.playSound("capture");
    }

    playMoveSound() {
        this.playSound("move");
    }

    playClickSound() {
        this.playSound("click");
    }

    playNewGameSound() {
        this.playSound("newgame");
    }

    playIllegalSound() {
        this.playSound("illegal");
    }

    playLoseSound() {
        this.playSound("loss");
    }

    playWinSound() {
        this.playSound("win");
    }

    playAICheckSound() {
        this.playSound("check2");
    }

    playAICaptureSound() {
        this.playSound("capture2");
    }

    playAIMoveSound() {
        this.playSound("move2");
    }

    playSound(soundFile) {
        if (!this.soundPath_ || !this.game_.getSound()) {
            return;
        }
        try {
            new Audio(this.soundPath_ + soundFile + ".wav").play();
        } catch (e) {
            this.dummy.innerHTML = "<embed src=\"" + this.soundPath_ + soundFile +
                ".wav\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
        }
    }
}