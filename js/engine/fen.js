"use strict";

import { Range, FEN_PIECE } from '../core/constants.js';
import { makeCoord } from '../core/coords.js';
import { makePiece, sideTag } from '../core/piece.js';

/**
 * @description FEN 序列化/反序列化模块（纯函数）
 *
 * 象棋 FEN 格式示例：
 *   rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1
 *
 * 棋子字符对照（大写=红方，小写=黑方）：
 *   K/k=将帅  A/a=士仕  B(E)/b(e)=象相  H(N)/h(n)=马  R/r=车  C/c=炮  P/p=卒兵
 */

// FEN 棋子字符 → 阵营 + 类型映射
const FEN_CHAR_MAP = {
    'k': { side: 1, type: 0 }, 'K': { side: 0, type: 0 },
    'a': { side: 1, type: 1 }, 'A': { side: 0, type: 1 },
    'b': { side: 1, type: 2 }, 'B': { side: 0, type: 2 },
    'e': { side: 1, type: 2 }, 'E': { side: 0, type: 2 },
    'n': { side: 1, type: 3 }, 'N': { side: 0, type: 3 },
    'h': { side: 1, type: 3 }, 'H': { side: 0, type: 3 },
    'r': { side: 1, type: 4 }, 'R': { side: 0, type: 4 },
    'c': { side: 1, type: 5 }, 'C': { side: 0, type: 5 },
    'p': { side: 1, type: 6 }, 'P': { side: 0, type: 6 },
};

// 棋子类型 → FEN 字符（大写=红方）
const PIECE_TO_FEN = ['K', 'A', 'B', 'N', 'R', 'C', 'P'];

/**
 * @method 从 FEN 字符串加载局面到 Position
 * @param {Position} pos   目标局面对象（会被清空重置）
 * @param {string}   fen   FEN 字符串
 * @param {function} checkedFn 将军检测函数 (pos) => boolean
 */
export function fromFen(pos, fen, checkedFn) {
    pos.clearBoard();

    const parts = fen.trim().split(/\s+/);
    const ranks = parts[0].split('/');

    // 解析棋盘部分（FEN 从黑方底线 row=3 开始向下）
    for (let rank = 0; rank < ranks.length && rank < 10; rank++) {
        const row = rank + Range.TOP;
        let col = Range.LEFT;
        for (const ch of ranks[rank]) {
            if (ch >= '1' && ch <= '9') {
                col += parseInt(ch, 10);
            } else {
                const info = FEN_CHAR_MAP[ch];
                if (info) {
                    const sq = makeCoord(col, row);
                    pos.addPiece(sq, makePiece(info.type, info.side), false);
                    col++;
                }
            }
        }
    }

    // 解析行棋方（'w'=红方=0，'b'=黑方=1）
    if (parts.length > 1 && parts[1] === 'b') {
        pos.changeSide();
    }

    // 重置历史栈
    const inCheck = checkedFn(pos);
    pos.setIrrev(inCheck);
}

/**
 * @method 将当前局面导出为 FEN 字符串
 * @param {Position} pos
 * @returns {string} FEN 字符串
 */
export function toFen(pos) {
    let fen = '';

    for (let rank = 0; rank < 10; rank++) {
        const row = rank + Range.TOP;
        let empty = 0;

        for (let col = 0; col < 9; col++) {
            const sq = makeCoord(col + Range.LEFT, row);
            const pc = pos.squares[sq];
            if (pc === 0) {
                empty++;
            } else {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                const type = pc & 7;
                const side = pc < 16 ? 0 : 1;
                const ch = PIECE_TO_FEN[type];
                fen += side === 0 ? ch : ch.toLowerCase();
            }
        }

        if (empty > 0) {
            fen += empty;
        }
        if (rank < 9) {
            fen += '/';
        }
    }

    // 行棋方标识
    fen += ' ' + (pos.sdPlayer === 0 ? 'w' : 'b');
    fen += ' - - 0 1'; // 标准后缀

    return fen;
}

/**
 * @method 将走法编码转换为 ICCS 显示字符串（用于棋谱列表）
 * 格式：如 "H2-E2"（起点-终点）
 * @param {number} mv
 * @returns {string}
 */
export function moveToIccs(mv) {
    const src = mv & 0xFF;
    const dst = mv >> 8;
    const srcX = src & 15;
    const srcY = src >> 4;
    const dstX = dst & 15;
    const dstY = dst >> 4;
    return String.fromCharCode('A'.charCodeAt(0) + srcX - Range.LEFT) +
        String.fromCharCode('9'.charCodeAt(0) - srcY + Range.TOP) + '-' +
        String.fromCharCode('A'.charCodeAt(0) + dstX - Range.LEFT) +
        String.fromCharCode('9'.charCodeAt(0) - dstY + Range.TOP);
}

/**
 * @method 从 ICCS 走法字符串解析出走法编码
 * 格式：两个坐标拼合，如 "h2e2" 或 "H2E2"
 * @param {string} iccs
 * @returns {number} mv 编码，0 表示解析失败
 */
export function iccsToMove(iccs) {
    if (!iccs || iccs.length < 4) {
        return 0;
    }
    const str = iccs.toUpperCase();
    const srcX = str.charCodeAt(0) - 'A'.charCodeAt(0) + Range.LEFT;
    const srcY = Range.TOP + 9 - (str.charCodeAt(1) - '0'.charCodeAt(0));
    const dstX = str.charCodeAt(2) - 'A'.charCodeAt(0) + Range.LEFT;
    const dstY = Range.TOP + 9 - (str.charCodeAt(3) - '0'.charCodeAt(0));
    const src = makeCoord(srcX, srcY);
    const dst = makeCoord(dstX, dstY);
    return src | (dst << 8);
}
