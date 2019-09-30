/**
 * “Ù∆µ¥¶¿Ì
 */

class GameAudio {
    constructor(soundPath) {
        this.soundPath_ = soundPath;
    }

    check2
    capture2
    move2




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

    playSound(soundFile) {
        if (!this.sound) {
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