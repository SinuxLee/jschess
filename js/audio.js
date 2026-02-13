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
});

/**
 * @class GameAudio
 * @classdesc 游戏音效管理，预加载所有音频资源
 */
class GameAudio {
    /**
     * @param {string} soundPath - 音频文件目录路径
     * @param {Function} isEnabled - 返回是否启用音效的回调
     */
    constructor(soundPath, isEnabled) {
        this._soundPath = soundPath;
        this._isEnabled = isEnabled;
        this._cache = {};
        this._preload();
    }

    /**
     * @description 预加载全部音效文件到缓存
     */
    _preload() {
        for (let key in WAV) {
            let name = WAV[key];
            this._cache[name] = new Audio(this._soundPath + name + '.wav');
        }
    }

    /**
     * @description 播放指定音效
     * @param {string} name - WAV 枚举值
     */
    play(name) {
        if (!this._soundPath || !this._isEnabled()) {
            return;
        }

        let audio = this._cache[name];
        if (audio) {
            // 重置播放位置，支持快速连续播放
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    }
}

export { GameAudio, WAV };
