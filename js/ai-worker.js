"use strict";

/**
 * @description AI 搜索 Web Worker
 * 接收 FEN 和搜索参数，返回最佳着法（ICCS 格式不适用，直接返回 mv 数值）
 */

import { Position, MATE_VALUE } from './position.js';
import { Search, LIMIT_DEPTH } from './search.js';

let search = null;

self.onmessage = function (e) {
    let { fen, millis, hashLevel } = e.data;

    if (hashLevel !== undefined) {
        // 初始化搜索引擎
        let pos = new Position();
        search = new Search(pos, hashLevel);
        return;
    }

    if (!search) {
        self.postMessage({ error: '搜索引擎未初始化' });
        return;
    }

    // 加载局面并搜索
    search.pos.fromFen(fen);
    let mv = search.searchMain(LIMIT_DEPTH, millis);
    self.postMessage({ mv: mv });
};
