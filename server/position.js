import { BOOK_DAT } from "./book.js";

// fen 格式化
const FEN_PIECE = "        KABNRCP kabnrcp "; // 8个字符一组，共3组。

// todo 暂时还不知道干啥的
export const MATE_VALUE = 10000;
export const BAN_VALUE = MATE_VALUE - 100;
export const WIN_VALUE = MATE_VALUE - 200;
const NULL_SAFE_MARGIN = 400;
const NULL_OKAY_MARGIN = 200;
const DRAW_VALUE = 20;
const ADVANCED_VALUE = 3;
const ADD_PIECE = false; // 添加棋子
const DEL_PIECE = true;  // 删除棋子

const KING_DELTA = [-16, -1, 1, 16]; // 老将的相对位移表
const ADVISOR_DELTA = [-17, -15, 15, 17]; // 士的相对位移表
const KNIGHT_DELTA = [[-33, -31], [-18, 14], [-14, 18], [31, 33]]; // 马的相对位移表
const KNIGHT_CHECK_DELTA = [[-33, -18], [-31, -14], [14, 31], [18, 33]]; // 马脚相对位移表

// 我方棋子给对方棋子产生的威胁值，依次为对方的 将 士 相 马 车 炮 卒 
const MVV_VALUE = [50, 10, 10, 30, 40, 30, 20];

// 动态棋子估值表
const DYNAMIC_CHESS_VALUE = [
    [ // 将
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 9, 9, 9, 11, 13, 11, 9, 9, 9, 0, 0, 0, 0,
        0, 0, 0, 19, 24, 34, 42, 44, 42, 34, 24, 19, 0, 0, 0, 0,
        0, 0, 0, 19, 24, 32, 37, 37, 37, 32, 24, 19, 0, 0, 0, 0,
        0, 0, 0, 19, 23, 27, 29, 30, 29, 27, 23, 19, 0, 0, 0, 0,
        0, 0, 0, 14, 18, 20, 27, 29, 27, 20, 18, 14, 0, 0, 0, 0,
        0, 0, 0, 7, 0, 13, 0, 16, 0, 13, 0, 7, 0, 0, 0, 0,
        0, 0, 0, 7, 0, 7, 0, 15, 0, 7, 0, 7, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 11, 15, 11, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 士
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 20, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 18, 0, 0, 20, 23, 20, 0, 0, 18, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 20, 20, 0, 20, 20, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 相
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 20, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 18, 0, 0, 20, 23, 20, 0, 0, 18, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 20, 20, 0, 20, 20, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 马
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 90, 90, 90, 96, 90, 96, 90, 90, 90, 0, 0, 0, 0,
        0, 0, 0, 90, 96, 103, 97, 94, 97, 103, 96, 90, 0, 0, 0, 0,
        0, 0, 0, 92, 98, 99, 103, 99, 103, 99, 98, 92, 0, 0, 0, 0,
        0, 0, 0, 93, 108, 100, 107, 100, 107, 100, 108, 93, 0, 0, 0, 0,
        0, 0, 0, 90, 100, 99, 103, 104, 103, 99, 100, 90, 0, 0, 0, 0,
        0, 0, 0, 90, 98, 101, 102, 103, 102, 101, 98, 90, 0, 0, 0, 0,
        0, 0, 0, 92, 94, 98, 95, 98, 95, 98, 94, 92, 0, 0, 0, 0,
        0, 0, 0, 93, 92, 94, 95, 92, 95, 94, 92, 93, 0, 0, 0, 0,
        0, 0, 0, 85, 90, 92, 93, 78, 93, 92, 90, 85, 0, 0, 0, 0,
        0, 0, 0, 88, 85, 90, 88, 90, 88, 90, 85, 88, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 车
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 206, 208, 207, 213, 214, 213, 207, 208, 206, 0, 0, 0, 0,
        0, 0, 0, 206, 212, 209, 216, 233, 216, 209, 212, 206, 0, 0, 0, 0,
        0, 0, 0, 206, 208, 207, 214, 216, 214, 207, 208, 206, 0, 0, 0, 0,
        0, 0, 0, 206, 213, 213, 216, 216, 216, 213, 213, 206, 0, 0, 0, 0,
        0, 0, 0, 208, 211, 211, 214, 215, 214, 211, 211, 208, 0, 0, 0, 0,
        0, 0, 0, 208, 212, 212, 214, 215, 214, 212, 212, 208, 0, 0, 0, 0,
        0, 0, 0, 204, 209, 204, 212, 214, 212, 204, 209, 204, 0, 0, 0, 0,
        0, 0, 0, 198, 208, 204, 212, 212, 212, 204, 208, 198, 0, 0, 0, 0,
        0, 0, 0, 200, 208, 206, 212, 200, 212, 206, 208, 200, 0, 0, 0, 0,
        0, 0, 0, 194, 206, 204, 212, 200, 212, 204, 206, 194, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 炮
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 100, 100, 96, 91, 90, 91, 96, 100, 100, 0, 0, 0, 0,
        0, 0, 0, 98, 98, 96, 92, 89, 92, 96, 98, 98, 0, 0, 0, 0,
        0, 0, 0, 97, 97, 96, 91, 92, 91, 96, 97, 97, 0, 0, 0, 0,
        0, 0, 0, 96, 99, 99, 98, 100, 98, 99, 99, 96, 0, 0, 0, 0,
        0, 0, 0, 96, 96, 96, 96, 100, 96, 96, 96, 96, 0, 0, 0, 0,
        0, 0, 0, 95, 96, 99, 96, 100, 96, 99, 96, 95, 0, 0, 0, 0,
        0, 0, 0, 96, 96, 96, 96, 96, 96, 96, 96, 96, 0, 0, 0, 0,
        0, 0, 0, 97, 96, 100, 99, 101, 99, 100, 96, 97, 0, 0, 0, 0,
        0, 0, 0, 96, 97, 98, 98, 98, 98, 98, 97, 96, 0, 0, 0, 0,
        0, 0, 0, 96, 96, 97, 99, 99, 99, 97, 96, 96, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [ // 卒
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 9, 9, 9, 11, 13, 11, 9, 9, 9, 0, 0, 0, 0,
        0, 0, 0, 19, 24, 34, 42, 44, 42, 34, 24, 19, 0, 0, 0, 0,
        0, 0, 0, 19, 24, 32, 37, 37, 37, 32, 24, 19, 0, 0, 0, 0,
        0, 0, 0, 19, 23, 27, 29, 30, 29, 27, 23, 19, 0, 0, 0, 0,
        0, 0, 0, 14, 18, 20, 27, 29, 27, 20, 18, 14, 0, 0, 0, 0,
        0, 0, 0, 7, 0, 13, 0, 16, 0, 13, 0, 7, 0, 0, 0, 0,
        0, 0, 0, 7, 0, 7, 0, 15, 0, 7, 0, 7, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 11, 15, 11, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
];

// 九宫的范围
const IN_FORT = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

//  合法的间隔 1-将可走的间隔 2-士可走的间隔 3-相可走间隔
const LEGAL_SPAN = [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
];

// 马的相对可走点
const KNIGHT_PIN = [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, -16, 0, -16, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 16, 0, 16, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
];

/**
 * 所有为1的范围代表棋盘
 *  (0,0)
 *    -------------> X 数组的列
 *   |
 *   |
 *   |
 *   |
 *   |
 *   Y 数组的行
 *   因为一维数组的大小为16，
 *   所有board[Y][X] <==> board[Y<<4 + X]
 *   这样做是为了提高访问速度
 */
const IN_BOARD = [
    //  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 1
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 2
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 3
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 4
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 5
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 6
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 7
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 8
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 9
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 10
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 11
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, // 12
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 13
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 14
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 15
];

/**
 * 棋子标识定义
 */
const Piece = Object.freeze({
    UNKNOWN: -1,    //  未知棋子
    KING: 0,        //  将
    ADVISOR: 1,     //  士
    BISHOP: 2,      //  相
    KNIGHT: 3,      //  马
    ROOK: 4,        //  车
    CANNON: 5,      //  炮
    PAWN: 6,        //  卒
})

// 棋盘在数组中的边界
const Range = Object.freeze({
    TOP: 3,      // 棋盘在第三行开始(从0开始数)
    BOTTOM: 12,  // 棋盘在第十二行截止
    LEFT: 3,     // 棋盘在第三列开始
    RIGHT: 11,   // 棋盘在第十一列截止
})

/**
 * @method 棋子是否在棋盘上
 * @param {number} pos 棋子的坐标
 */
export function isChessOnBoard(pos) {
    return IN_BOARD[pos] != 0;
}

/**
 * @method 获取坐标中的列值X
 * @param {number} pos 棋子坐标X
 */
export function getChessPosX(pos) {
    return pos & 15;
}

/**
 * @method 获取坐标中的行值Y
 * @param {number} pos 棋子坐标Y
 * @description 坐标表示方式 YX(高4位位行值Y 低4位为列值X)
 */
export function getChessPosY(pos) {
    return pos >> 4;
}

/**
 * @method 从走棋着法中获取原位置
 * @param {number} motion 
 * @description motion(高8位标识目的位置，低8位标识原位置) => dest << 8 + src
 */
export function getSrcPosFromMotion(motion) {
    return motion & 255;
}

/**
 * @method 从走棋着法中获取目的位置
 * @param {number} motion 
 * @description motion(高8位标识目的位置，低8位标识原位置) => dest << 8 + src
 */
export function getDstPosFromMotion(motion) {
    return motion >> 8;
}

/**
 * @class RC4(Rivest Cipher 4)
 * @constructor 参数为密钥
 * @classdesc 对称加密算法
 */
class RC4 {
    constructor(key) {
        this.x = this.y = 0;
        this.state = [];

        // [0 .. 255]种状态
        for (let i = 0; i < 256; i++) {
            this.state.push(i);
        }

        // 初始排列
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + this.state[i] + key[i % key.length]) & 0xff;
            this.swap(i, j);
        }
    }

    swap(i, j) {
        let t = this.state[i];
        this.state[i] = this.state[j];
        this.state[j] = t;
    }

    //  产生密钥流
    //  密文第i字节=明文第i字节^密钥流第i字节
    //  明文 = 密文^密钥流
    nextByte() {
        this.x = (this.x + 1) & 0xff;
        this.y = (this.y + this.state[this.x]) & 0xff;
        this.swap(this.x, this.y);
        let t = (this.state[this.x] + this.state[this.y]) & 0xff;
        return this.state[t];
    }

    nextLong() {
        let n0 = this.nextByte();
        let n1 = this.nextByte();
        let n2 = this.nextByte();
        let n3 = this.nextByte();
        return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
    }
}

/**
 * 棋盘上的局面
 */
export class Position {
    constructor() {
        this.sdPlayer = 0;
        this.squares = [];
        this.zobristKey = this.zobristLock = 0;
        this.vlWhite = this.vlBlack = 0;
        this.motionList = [0]; // 走棋列表
        this.pcList = [0];
        this.keyList = [0];
        this.chkList = [];
        this.distance = 0;

        const rc4 = new RC4([0]);
        this.zobristKeyPlayer = rc4.nextLong();rc4.nextLong();
        this.zobristLockPlayer = rc4.nextLong();

        /**
         * Zobrist 哈希是以Albert L.Zobrist的名字命名。它是一种特殊的置换表。
         * 是一种专门针对棋类游戏而提出来的编码方式，判断历史局面是否存在的算法。
         * 按位异或
         */
        this.zobristKeyTable = [];
        this.zobristLockTable = [];

        for (let i = 0; i < 14; i++) {
            let keys = [];
            let locks = [];
            for (let j = 0; j < 256; j++) {
                keys.push(rc4.nextLong());
                rc4.nextLong();
                locks.push(rc4.nextLong());
            }
            this.zobristKeyTable.push(keys);
            this.zobristLockTable.push(locks);
        }
    }

    /**
     * @method 将字符转换成对应的棋子标识
     * @param {char} char 字符值
     */
    getChessIdFromChar(char) {
        switch (char) {
            case "K":
                return Piece.KING;
            case "A":
                return Piece.ADVISOR;
            case "B":
            case "E":
                return Piece.BISHOP;
            case "H":
            case "N":
                return Piece.KNIGHT;
            case "R":
                return Piece.ROOK;
            case "C":
                return Piece.CANNON;
            case "P":
                return Piece.PAWN;
            default:
                return Piece.UNKNOWN;
        }
    }

    /**
     * @method 清空棋盘
     */
    clearBoard() {
        this.sdPlayer = 0;
        this.squares = new Array(256).fill(0);
        this.zobristKey = this.zobristLock = 0;
        this.vlWhite = this.vlBlack = 0;
    }

    /**
     * 虚拟结构
     */
    setIrrev() {
        this.motionList = [0]; // 走棋列表
        this.pcList = [0];
        this.keyList = [0];
        this.chkList = [this.checked()];
        this.distance = 0;
    }

    /**
     * 
     * @param {number} sq 棋子坐标
     * @param {number} pc play color
     * @param {boolean} bDel 被删除
     */
    addPiece(sq, pc, bDel) {
        let pcAdjust;
        this.squares[sq] = bDel ? 0 : pc;
        if (pc < 16) {
            pcAdjust = pc - 8;
            this.vlWhite += bDel ? -DYNAMIC_CHESS_VALUE[pcAdjust][sq] :
                DYNAMIC_CHESS_VALUE[pcAdjust][sq];
        } else {
            pcAdjust = pc - 16;
            this.vlBlack += bDel ? -DYNAMIC_CHESS_VALUE[pcAdjust][this.flipPos(sq)] :
                DYNAMIC_CHESS_VALUE[pcAdjust][this.flipPos(sq)];
            pcAdjust += 7;
        }
        this.zobristKey ^= this.zobristKeyTable[pcAdjust][sq];
        this.zobristLock ^= this.zobristLockTable[pcAdjust][sq];
    }

    /**
     * @method 卒(兵) 前进一步后的坐标
     * @param {number} pos 棋子坐标
     * @param {number} side 棋子属于哪一方
     * @description 0-黑方, 1-红
     */
    getForwardPosForPawn(pos, side) {
        return pos - 16 + (side << 5);
    }

    /**
     * @method 判断老将是否合法走棋
     * @param {number} posSrc 原位置 
     * @param {number} posDst 目的位置
     */
    isKingSpan(posSrc, posDst) {
        return LEGAL_SPAN[posDst - posSrc + 256] == 1;
    }

    /**
     * 
     * @method 判断士是否合法走棋
     * @param {number} posSrc 原位置 
     * @param {number} posDst 目的位置 
     */
    isAdvisorSpan(posSrc, posDst) {
        return LEGAL_SPAN[posDst - posSrc + 256] == 2;
    }

    /**
     * 
     * @method 判断相是否合法走棋
     * @param {number} posSrc 原位置 
     * @param {number} posDst 目的位置 
     */
    isBishopSpan(posSrc, posDst) {
        return LEGAL_SPAN[posDst - posSrc + 256] == 3;
    }

    /**
     * @method 判断是否存在象眼
     * @param {number} posSrc 原位置
     * @param {number} posDst 目的位置
     */
    isExistBishopPin(posSrc, posDst) {
        return (posSrc + posDst) >> 1;
    }

    /**
     * @method 判断是否存在马脚
     * @param {number} posSrc 原位置
     * @param {number} posDst 目的位置
     */
    isExistKnightPin(posSrc, posDst) {
        return posSrc + KNIGHT_PIN[posDst - posSrc + 256];
    }

    /**
     * @method 判断棋子是否在敌方这一侧
     * @param {number} pos 棋子坐标
     * @param {number} side 棋子属于哪一方
     * @description 0-黑方, 1-红
     */
    isEnemyHalf(pos, side) {
        return (pos & 0x80) == (side << 7);
    }

    /**
     * @method 判断棋子是否在己方这一侧
     * @param {number} pos 棋子坐标
     * @param {number} side 棋子属于哪一方
     * @description 0-黑方, 1-红
     */
    isSelfHalf(pos, side) {
        return (pos & 0x80) != (side << 7);
    }

    /**
     * @method 判断走棋前后是否在同一侧
     * @param {number} posSrc 原位置
     * @param {number} posDst 目的位置
     */
    isSameHalf(posSrc, posDst) {
        return ((posSrc ^ posDst) & 0x80) == 0;
    }

    /**
     * @method 判断走棋前后是否在同一行
     * @param {number} posSrc 原位置
     * @param {number} posDst 目的位置
     */
    isSamePoxY(posSrc, posDst) {
        return ((posSrc ^ posDst) & 0xf0) == 0;
    }

    /**
     * @method 判断走棋前后是否在同一列
     * @param {number} posSrc 原位置
     * @param {number} posDst 目的位置
     */
    isSamePoxX(posSrc, posDst) {
        return ((posSrc ^ posDst) & 0x0f) == 0;
    }

    /**
     * @method 己方标识
     * @param {number} side
     * @description 0-黑方, 1-红
     */
    getSelfSideTag(side) {
        return 8 + (side << 3);
    }

    /**
     * @method 敌方标识
     * @param {number} side 
     * @description 0-黑方, 1-红
     */
    getEnemySideTag(side) {
        return 16 - (side << 3);
    }

    /**
     * @method 翻转坐标
     * @param {number} sq 
     */
    flipPos(pos) {
        return 254 - pos;
    }

    /**
     * @method 翻转X坐标
     * @param {number} x 
     */
    flipPosX(x) {
        return 14 - x;
    }

    /**
     * @method 翻转Y坐标
     * @param {number} y 
     */
    flipPosY(y) {
        return 15 - y;
    }

    /**
     * @method 将原位置和目的位置组合成着法
     * @param {number} posSrc 
     * @param {number} posDst 
     */
    makeMotionBySrcDst(posSrc, posDst) {
        return posSrc + (posDst << 8);
    }

    /**
     * @method 组合X、Y为一个值，作为数组的访问下标
     * @param {number} x 
     * @param {number} y 
     */
    MakeCoordWithXY(x, y) {
        return x + (y << 4);
    }

    /**
     * @method 获取镜像着法
     * @param {number} motion 
     */
    getMirrorMotionByX(motion) {
        return this.makeMotionBySrcDst(this.getMirrorPosByX(getSrcPosFromMotion(motion)), 
            this.getMirrorPosByX(getDstPosFromMotion(motion)));
    }

    /**
     * @method 获取左右镜像位置
     * @param {number} pos 
     */
    getMirrorPosByX(pos) {
        return this.MakeCoordWithXY(this.flipPosX(getChessPosX(pos)), getChessPosY(pos));
    }

    /**
     * @method 走动棋子
     * @param {number} motion 走棋着法 
     */
    movePiece(motion) {
        let posSrc = getSrcPosFromMotion(motion);
        let posDst = getDstPosFromMotion(motion);
        let pc = this.squares[posDst];
        this.pcList.push(pc);
        if (pc > 0) {
            this.addPiece(posDst, pc, DEL_PIECE);
        }
        pc = this.squares[posSrc];
        this.addPiece(posSrc, pc, DEL_PIECE);
        this.addPiece(posDst, pc, ADD_PIECE);
        this.motionList.push(motion);
    }

    undoMovePiece() {
        let mv = this.motionList.pop();
        let posSrc = getSrcPosFromMotion(mv);
        let posDst = getDstPosFromMotion(mv);
        let pc = this.squares[posDst];
        this.addPiece(posDst, pc, DEL_PIECE);
        this.addPiece(posSrc, pc, ADD_PIECE);
        pc = this.pcList.pop();
        if (pc > 0) {
            this.addPiece(posDst, pc, ADD_PIECE);
        }
    }

    changeSide() {
        this.sdPlayer = 1 - this.sdPlayer;
        this.zobristKey ^= this.zobristKeyPlayer;
        this.zobristLock ^= this.zobristLockPlayer;
    }

    makeMove(mv) {
        let zobristKey = this.zobristKey;
        this.movePiece(mv);
        if (this.checked()) {
            this.undoMovePiece(mv);
            return false;
        }
        this.keyList.push(zobristKey);
        this.changeSide();
        this.chkList.push(this.checked());
        this.distance++;
        return true;
    }

    undoMakeMove() {
        this.distance--;
        this.chkList.pop();
        this.changeSide();
        this.keyList.pop();
        this.undoMovePiece();
    }

    nullMove() {
        this.motionList.push(0);
        this.pcList.push(0);
        this.keyList.push(this.zobristKey);
        this.changeSide();
        this.chkList.push(false);
        this.distance++;
    }

    undoNullMove() {
        this.distance--;
        this.chkList.pop();
        this.changeSide();
        this.keyList.pop();
        this.pcList.pop();
        this.motionList.pop();
    }

    /**
     * @method 走棋着法转换成ICCS坐标格式，即着法表示成起点和终点的坐标。
     * @param {number} mv 
     */
    move2Iccs(mv) {
        let posSrc = getSrcPosFromMotion(mv);
        let posDst = getDstPosFromMotion(mv);
        return String.fromCharCode("A".charCodeAt(0) + getChessPosX(posSrc) - Range.LEFT) +
            String.fromCharCode("9".charCodeAt(0) - getChessPosY(posSrc) + Range.TOP) + "-" +
            String.fromCharCode("A".charCodeAt(0) + getChessPosX(posDst) - Range.LEFT) +
            String.fromCharCode("9".charCodeAt(0) - getChessPosY(posDst) + Range.TOP);
    }

    fromFen(fen) {
        this.clearBoard();
        let y = Range.TOP;
        let x = Range.LEFT;
        let index = 0;
        if (index == fen.length) {
            this.setIrrev();
            return;
        }
        let c = fen.charAt(index);
        while (c != " ") {
            if (c == "/") {
                x = Range.LEFT;
                y++;
                if (y > Range.BOTTOM) {
                    break;
                }
            } else if (c >= "1" && c <= "9") {
                const len = c.charCodeAt(0) - "0".charCodeAt(0)
                for (let k = 0; k < len; k++) {
                    if (x >= Range.RIGHT) {
                        break;
                    }
                    x++;
                }
            } else if (c >= "A" && c <= "Z") {
                if (x <= Range.RIGHT) {
                    let pt = this.getChessIdFromChar(c);
                    if (pt >= 0) {
                        this.addPiece(this.MakeCoordWithXY(x, y), pt + 8);
                    }
                    x++;
                }
            } else if (c >= "a" && c <= "z") {
                if (x <= Range.RIGHT) {
                    const code = c.charCodeAt(0) + "A".charCodeAt(0) - "a".charCodeAt(0)
                    let pt = this.getChessIdFromChar(String.fromCharCode(code));
                    if (pt >= 0) {
                        this.addPiece(this.MakeCoordWithXY(x, y), pt + 16);
                    }
                    x++;
                }
            }
            index++;
            if (index == fen.length) {
                this.setIrrev();
                return;
            }
            c = fen.charAt(index);
        }
        index++;
        if (index == fen.length) {
            this.setIrrev();
            return;
        }
        if (this.sdPlayer == (fen.charAt(index) == "b" ? 0 : 1)) {
            this.changeSide();
        }
        this.setIrrev();
    }

    toFen() {
        let fen = "";
        for (let y = Range.TOP; y <= Range.BOTTOM; y++) {
            let k = 0;
            for (let x = Range.LEFT; x <= Range.RIGHT; x++) {
                let pc = this.squares[this.MakeCoordWithXY(x, y)];
                if (pc > 0) {
                    if (k > 0) {
                        fen += String.fromCharCode("0".charCodeAt(0) + k);
                        k = 0;
                    }
                    fen += FEN_PIECE.charAt(pc);
                } else {
                    k++;
                }
            }
            if (k > 0) {
                fen += String.fromCharCode("0".charCodeAt(0) + k);
            }
            fen += "/";
        }
        return fen.substring(0, fen.length - 1) + " " +
            (this.sdPlayer == 0 ? 'w' : 'b');
    }

    /**
     * @method 计算我方产生威胁值
     * @description 比如我方兵 威胁 对方老将，则用将的威胁值减去我方兵的削弱值
     * @param {number} pc 对方棋子
     * @param {number} lva 我方棋子削弱值
     */
    MVV_LVA(pc, lva) {
        return MVV_VALUE[pc & 7] - lva;
    }

    generateMoves(vls) {
        let mvs = [];
        let pcSelfSide = this.getSelfSideTag(this.sdPlayer);
        let pcOppSide = this.getEnemySideTag(this.sdPlayer);
        for (let posSrc = 0; posSrc < 256; posSrc++) {
            let pcSrc = this.squares[posSrc];
            if ((pcSrc & pcSelfSide) == 0) {
                continue;
            }
            switch (pcSrc - pcSelfSide) {
                case Piece.KING:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + KING_DELTA[i];
                        if (!this.isInFort(posDst)) {
                            continue;
                        }
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            vls.push(this.MVV_LVA(pcDst, 5));
                        }
                    }
                    break;
                case Piece.ADVISOR:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + ADVISOR_DELTA[i];
                        if (!this.isInFort(posDst)) {
                            continue;
                        }
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            vls.push(this.MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case Piece.BISHOP:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + ADVISOR_DELTA[i];
                        if (!(isChessOnBoard(posDst) && this.isSelfHalf(posDst, this.sdPlayer) &&
                            this.squares[posDst] == 0)) {
                            continue;
                        }
                        posDst += ADVISOR_DELTA[i];
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            vls.push(this.MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case Piece.KNIGHT:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + KING_DELTA[i];
                        if (this.squares[posDst] > 0) {
                            continue;
                        }
                        for (let j = 0; j < 2; j++) {
                            posDst = posSrc + KNIGHT_DELTA[i][j];
                            if (!isChessOnBoard(posDst)) {
                                continue;
                            }
                            let pcDst = this.squares[posDst];
                            if (vls == null) {
                                if ((pcDst & pcSelfSide) == 0) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                }
                            } else if ((pcDst & pcOppSide) != 0) {
                                mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                vls.push(this.MVV_LVA(pcDst, 1));
                            }
                        }
                    }
                    break;
                case Piece.ROOK:
                    for (let i = 0; i < 4; i++) {
                        let delta = KING_DELTA[i];
                        let posDst = posSrc + delta;
                        while (isChessOnBoard(posDst)) {
                            let pcDst = this.squares[posDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                }
                            } else {
                                if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                    if (vls != null) {
                                        vls.push(this.MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            posDst += delta;
                        }
                    }
                    break;
                case Piece.CANNON:
                    for (let i = 0; i < 4; i++) {
                        let delta = KING_DELTA[i];
                        let posDst = posSrc + delta;
                        while (isChessOnBoard(posDst)) {
                            let pcDst = this.squares[posDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                }
                            } else {
                                break;
                            }
                            posDst += delta;
                        }
                        posDst += delta;
                        while (isChessOnBoard(posDst)) {
                            let pcDst = this.squares[posDst];
                            if (pcDst > 0) {
                                if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                    if (vls != null) {
                                        vls.push(this.MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            posDst += delta;
                        }
                    }
                    break;
                case Piece.PAWN:
                    let posDst = this.getForwardPosForPawn(posSrc, this.sdPlayer);
                    if (isChessOnBoard(posDst)) {
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                            vls.push(this.MVV_LVA(pcDst, 2));
                        }
                    }
                    if (this.isEnemyHalf(posSrc, this.sdPlayer)) {
                        for (let delta = -1; delta <= 1; delta += 2) {
                            posDst = posSrc + delta;
                            if (isChessOnBoard(posDst)) {
                                let pcDst = this.squares[posDst];
                                if (vls == null) {
                                    if ((pcDst & pcSelfSide) == 0) {
                                        mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                    }
                                } else if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(this.makeMotionBySrcDst(posSrc, posDst));
                                    vls.push(this.MVV_LVA(pcDst, 2));
                                }
                            }
                        }
                    }
                    break;
            }
        }
        return mvs;
    }

    /**
     * 是否合规着法
     * @param {number} mv 
     * @returns {bool} true-合规
     */
    legalMove(mv) {
        let posSrc = getSrcPosFromMotion(mv);
        let pcSrc = this.squares[posSrc];
        let pcSelfSide = this.getSelfSideTag(this.sdPlayer);
        if ((pcSrc & pcSelfSide) == 0) {
            return false;
        }

        let posDst = getDstPosFromMotion(mv);
        let pcDst = this.squares[posDst];
        if ((pcDst & pcSelfSide) != 0) {
            return false;
        }

        switch (pcSrc - pcSelfSide) {
            case Piece.KING:
                return this.isInFort(posDst) && this.isKingSpan(posSrc, posDst);
            case Piece.ADVISOR:
                return this.isInFort(posDst) && this.isAdvisorSpan(posSrc, posDst);
            case Piece.BISHOP:
                return this.isSameHalf(posSrc, posDst) && this.isBishopSpan(posSrc, posDst) &&
                    this.squares[this.isExistBishopPin(posSrc, posDst)] == 0;
            case Piece.KNIGHT: {
                let sqPin = this.isExistKnightPin(posSrc, posDst);
                return sqPin != posSrc && this.squares[sqPin] == 0;
            }
            case Piece.ROOK:
            case Piece.CANNON: {
                let delta;
                if (this.isSamePoxY(posSrc, posDst)) {
                    delta = (posDst < posSrc ? -1 : 1);
                } else if (this.isSamePoxX(posSrc, posDst)) {
                    delta = (posDst < posSrc ? -16 : 16);
                } else {
                    return false;
                }
                let sqPin = posSrc + delta;
                while (sqPin != posDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                if (sqPin == posDst) {
                    return pcDst == 0 || pcSrc - pcSelfSide == Piece.ROOK;
                }
                if (pcDst == 0 || pcSrc - pcSelfSide != Piece.CANNON) {
                    return false;
                }
                sqPin += delta;
                while (sqPin != posDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                return sqPin == posDst;
            }
            case Piece.PAWN:
                if (this.isEnemyHalf(posDst, this.sdPlayer) && (posDst == posSrc - 1 || posDst == posSrc + 1)) {
                    return true;
                }
                return posDst == this.getForwardPosForPawn(posSrc, this.sdPlayer);
            default:
                return false;
        }
    }

    checked() {
        let pcSelfSide = this.getSelfSideTag(this.sdPlayer);
        let pcOppSide = this.getEnemySideTag(this.sdPlayer);
        for (let posSrc = 0; posSrc < 256; posSrc++) {
            if (this.squares[posSrc] != pcSelfSide + Piece.KING) {
                continue;
            }

            if (this.squares[this.getForwardPosForPawn(posSrc, this.sdPlayer)] == pcOppSide + Piece.PAWN) {
                return true;
            }

            for (let delta = -1; delta <= 1; delta += 2) {
                if (this.squares[posSrc + delta] == pcOppSide + Piece.PAWN) {
                    return true;
                }
            }

            for (let i = 0; i < 4; i++) {
                if (this.squares[posSrc + ADVISOR_DELTA[i]] != 0) {
                    continue;
                }
                for (let j = 0; j < 2; j++) {
                    let pcDst = this.squares[posSrc + KNIGHT_CHECK_DELTA[i][j]];
                    if (pcDst == pcOppSide + Piece.KNIGHT) {
                        return true;
                    }
                }
            }

            for (let i = 0; i < 4; i++) {
                let delta = KING_DELTA[i];
                let posDst = posSrc + delta;
                while (isChessOnBoard(posDst)) {
                    let pcDst = this.squares[posDst];
                    if (pcDst > 0) {
                        if (pcDst == pcOppSide + Piece.ROOK || pcDst == pcOppSide + Piece.KING) {
                            return true;
                        }
                        break;
                    }
                    posDst += delta;
                }
                posDst += delta;
                while (isChessOnBoard(posDst)) {
                    let pcDst = this.squares[posDst];
                    if (pcDst > 0) {
                        if (pcDst == pcOppSide + Piece.CANNON) {
                            return true;
                        }
                        break;
                    }
                    posDst += delta;
                }
            }

            return false;
        }
        return false;
    }

    /**
     * @method 是否将死
     * @returns {bool} true-将死
     */
    isMate() {
        let mvs = this.generateMoves(null);
        for (let i = 0; i < mvs.length; i++) {
            if (this.makeMove(mvs[i])) {
                this.undoMakeMove();
                return false;
            }
        }
        return true;
    }

    /**
     * @method 棋子是否在九宫内
     * @param {number} pos 棋子的坐标
     */
    isInFort(pos) {
        return IN_FORT[pos] != 0;
    }

    mateValue() {
        return this.distance - MATE_VALUE;
    }

    banValue() {
        return this.distance - BAN_VALUE;
    }

    drawValue() {
        return (this.distance & 1) == 0 ? -DRAW_VALUE : DRAW_VALUE;
    }

    evaluate() {
        let vl = (this.sdPlayer == 0 ? this.vlWhite - this.vlBlack :
            this.vlBlack - this.vlWhite) + ADVANCED_VALUE;
        return vl == this.drawValue() ? vl - 1 : vl;
    }

    nullOkay() {
        return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > NULL_OKAY_MARGIN;
    }

    nullSafe() {
        return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > NULL_SAFE_MARGIN;
    }

    inCheck() {
        return this.chkList[this.chkList.length - 1];
    }

    captured() {
        return this.pcList[this.pcList.length - 1] > 0;
    }

    repValue(vlRep) {
        let vlReturn = ((vlRep & 2) == 0 ? 0 : this.banValue()) +
            ((vlRep & 4) == 0 ? 0 : -this.banValue());
        return vlReturn == 0 ? this.drawValue() : vlReturn;
    }

    repStatus(recur_) {
        let recur = recur_;
        let selfSide = false;
        let perpCheck = true;
        let oppPerpCheck = true;
        let index = this.motionList.length - 1;
        while (this.motionList[index] > 0 && this.pcList[index] == 0) {
            if (selfSide) {
                perpCheck = perpCheck && this.chkList[index];
                if (this.keyList[index] == this.zobristKey) {
                    recur--;
                    if (recur == 0) {
                        return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
                    }
                }
            } else {
                oppPerpCheck = oppPerpCheck && this.chkList[index];
            }
            selfSide = !selfSide;
            index--;
        }
        return 0;
    }

    mirror() {
        const pos = new Position();
        pos.clearBoard();
        for (let sq = 0; sq < 256; sq++) {
            const pc = this.squares[sq];
            if (pc > 0) {
                pos.addPiece(this.getMirrorPosByX(sq), pc);
            }
        }
        
        if (this.sdPlayer == 1) {
            pos.changeSide();
        }
        return pos;
    }

    bookMove() {
        if (typeof BOOK_DAT != "object" || BOOK_DAT.length == 0) return 0;

        let mirror = false;
        let lock = this.zobristLock >>> 1; //  Convert into Unsigned
        let index = this.binarySearch(BOOK_DAT, lock);
        if (index < 0) {
            mirror = true;
            lock = this.mirror().zobristLock >>> 1; //  Convert into Unsigned
            index = this.binarySearch(BOOK_DAT, lock);
        }

        if (index < 0) {
            return 0;
        }

        index--;
        while (index >= 0 && BOOK_DAT[index][0] == lock) {
            index--;
        }
        let mvs = [],vls = [];
        let value = 0;
        index++;
        while (index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
            let mv = BOOK_DAT[index][1];
            mv = (mirror ? this.getMirrorMotionByX(mv) : mv);
            if (this.legalMove(mv)) {
                mvs.push(mv);
                let vl = BOOK_DAT[index][2];
                vls.push(vl);
                value += vl;
            }
            index++;
        }
        if (value == 0) {
            return 0;
        }
        value = Math.floor(Math.random() * value);
        for (index = 0; index < mvs.length; index++) {
            value -= vls[index];
            if (value < 0) {
                break;
            }
        }
        return mvs[index];
    }

    historyIndex(mv) {
        return ((this.squares[getSrcPosFromMotion(mv)] - 8) << 8) + getDstPosFromMotion(mv);
    }

    /**
     * @method 二叉搜索
     * @param {array} vlss 要搜索的数组
     * @param {number} vl 目标元素
     */
    binarySearch(vlss, vl) {
        let low = 0;
        let high = vlss.length - 1;
        while (low <= high) {
            let mid = (low + high) >> 1;
            if (vlss[mid][0] < vl) {
                low = mid + 1;
            } else if (vlss[mid][0] > vl) {
                high = mid - 1;
            } else {
                return mid;
            }
        }
        return -1;
    }
}
