"use strict";

/**
 * @description 棋子类型枚举
 */
export const PieceType = Object.freeze({
    KING:    0, // 将/帅
    ADVISOR: 1, // 士/仕
    BISHOP:  2, // 象/相
    KNIGHT:  3, // 马
    ROOK:    4, // 车
    CANNON:  5, // 炮
    PAWN:    6, // 卒/兵
    UNKNOWN: -1,
});

/**
 * @description 阵营枚举
 */
export const Side = Object.freeze({
    RED:   0, // 红方
    BLACK: 1, // 黑方
});

/**
 * @description 棋盘在16×16数组中的实际范围
 * 内部坐标系：sq = (y << 4) | x
 */
export const Range = Object.freeze({
    TOP:    3,  // 棋盘从第3行开始（含）
    BOTTOM: 12, // 棋盘到第12行结束（含）
    LEFT:   3,  // 棋盘从第3列开始（含）
    RIGHT:  11, // 棋盘到第11列结束（含）
});

// FEN 字符串棋子对照表（每8个字符为一组，共3组）
export const FEN_PIECE = "        KABNRCP kabnrcp ";

// ===== AI 搜索相关常量 =====

/** 将死分值（绝对分）*/
export const MATE_VALUE = 10000;

/** 禁手分值（长将/长打判负） */
export const BAN_VALUE = MATE_VALUE - 100;

/** 胜利分值下界（区分普通优势与将死） */
export const WIN_VALUE = MATE_VALUE - 200;

/** 空步裁剪：至少需要此优势才可执行空步 */
export const NULL_OKAY_MARGIN = 200;

/** 空步裁剪：双重验证所需的安全优势 */
export const NULL_SAFE_MARGIN = 400;

/** 平局分值（鼓励先手不选平局） */
export const DRAW_VALUE = 20;

/** 先手加成 */
export const ADVANCED_VALUE = 3;

// ===== 走法生成相关常量 =====

/** 老将/车的四方向位移（上下左右）*/
export const KING_DELTA = [-16, -1, 1, 16];

/** 士的对角线位移 */
export const ADVISOR_DELTA = [-17, -15, 15, 17];

/** 马的跳跃位移（每方向2个落点）*/
export const KNIGHT_DELTA = [[-33, -31], [-18, 14], [-14, 18], [31, 33]];

/** 马腿检测位移（判断马脚方向）*/
export const KNIGHT_CHECK_DELTA = [[-33, -18], [-31, -14], [14, 31], [18, 33]];

/**
 * @description MVV（Most Valuable Victim）威胁值
 * 对方棋子 将/帅、士、象/相、马、车、炮、卒/兵 对应的价值权重
 * 用于走法排序中优先吃高价值棋子
 */
export const MVV_VALUE = [50, 10, 10, 30, 40, 30, 20];
