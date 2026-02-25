"use strict";

/**
 * @description AI 搜索 Web Worker（新架构版）
 *
 * 消息协议：
 *   初始化：{ hashLevel: number }   — hashLevel 仅用于向后兼容，新架构中不需要
 *   搜索：  { fen: string, millis: number }
 *   响应：  { mv: number } | { error: string }
 */

import { Position }  from './engine/position.js';
import { isChecked } from './engine/movegen.js';
import { fromFen }   from './engine/fen.js';
import { Search }    from './ai/search.js';

let _pos    = null;
let _search = null;

self.onmessage = function (e) {
    const { fen, millis, hashLevel } = e.data;

    if (hashLevel !== undefined) {
        // 初始化（hashLevel 在新架构中不影响搜索，仅用于兼容旧协议）
        _pos    = new Position();
        _search = new Search(_pos);
        return;
    }

    if (!_search) {
        self.postMessage({ error: '搜索引擎未初始化' });
        return;
    }

    // 加载局面并搜索
    fromFen(_pos, fen, isChecked);
    _search.searchMain(64, millis);
    self.postMessage({ mv: _search.bestMove });
};
