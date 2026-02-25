"use strict";

/**
 * @description engine 层统一入口
 *
 * engine 层封装完整的象棋引擎逻辑，依赖 core 层，对外提供：
 * ─────────────────────────────────────────────────────────────────────────────
 * position.js  ── Position 类：棋盘状态、增量维护、走法执行/撤销、历史栈
 * movegen.js   ── generateMoves()：走法生成；isChecked()：将军检测
 * evaluate.js  ── evaluate()：静态估值；repValue()：重复检测；mateValue()：将死分
 * fen.js       ── fromFen() / toFen()：FEN 序列化；iccsToMove()：ICCS 解析
 */

export { Position }                    from './position.js';
export { generateMoves, isChecked }    from './movegen.js';
export { evaluate, repValue, mateValue } from './evaluate.js';
export { fromFen, toFen, iccsToMove, moveToIccs } from './fen.js';
