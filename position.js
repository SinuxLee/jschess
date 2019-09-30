/*
position.js - Source Code for XiangQi Wizard Light, Part I

XiangQi Wizard Light - a Chinese Chess Program for JavaScript
Designed by Morning Yellow, Version: 1.0, Last Modified: Sep. 2012
Copyright (C) 2004-2012 www.xqbase.com

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

"use strict";

//todo 暂时还不知道干啥的
const MATE_VALUE = 10000;
const BAN_VALUE = MATE_VALUE - 100;
const WIN_VALUE = MATE_VALUE - 200;
const NULL_SAFE_MARGIN = 400;
const NULL_OKAY_MARGIN = 200;
const DRAW_VALUE = 20;
const ADVANCED_VALUE = 3;

/**
 * @method 棋子是否在棋盘上
 * @param {number} sq 棋子的坐标
 */
function isChessOnBoard(sq) {
    return IN_BOARD_[sq] != 0;
}

/**
 * @method 棋子是否在九宫内
 * @param {number} sq 棋子的坐标
 */
function IN_FORT(sq) {
    return IN_FORT_[sq] != 0;
}

/**
 * @method 获取坐标中的行值Y
 * @param {number} sq 棋子坐标Y
 * @description 坐标表示方式 YX(高4位位行值Y 低4位为列值X)
 */
function RANK_Y(sq) {
    return sq >> 4;
}

/**
 * @method 获取坐标中的列值X
 * @param {number} sq 棋子坐标X
 */
function FILE_X(sq) {
    return sq & 15;
}

/**
 * @method 组合X、Y为一个值，作为数组的访问下标
 * @param {number} x 
 * @param {number} y 
 */
function COORD_XY(x, y) {
    return x + (y << 4);
}

/**
 * @method 翻转坐标
 * @param {number} sq 
 */
function SQUARE_FLIP(sq) {
    return 254 - sq;
}

/**
 * @method 翻转X坐标
 * @param {number} x 
 */
function FILE_FLIP(x) {
    return 14 - x;
}

/**
 * @method 翻转Y坐标
 * @param {number} y 
 */
function RANK_FLIP(y) {
    return 15 - y;
}

/**
 * @method 获取镜像位置
 * @param {number} sq 
 */
function MIRROR_SQUARE(sq) {
    return COORD_XY(FILE_FLIP(FILE_X(sq)), RANK_Y(sq));
}

/**
 * @method 卒(兵) 前进一步后的坐标
 * @param {number} sq 棋子坐标 
 * @param {number} sd 棋子属于哪一方
 * @description 0-黑方, 1-红
 */
function SQUARE_FORWARD(sq, sd) {
    return sq - 16 + (sd << 5);
}

/**
 * @method 判断老将是否合法走棋
 * @param {number} sqSrc 原位置 
 * @param {number} sqDst 目的位置
 */
function KING_SPAN(sqSrc, sqDst) {
    return LEGAL_SPAN[sqDst - sqSrc + 256] == 1;
}

/**
 * 
 * @method 判断士是否合法走棋
 * @param {number} sqSrc 原位置 
 * @param {number} sqDst 目的位置 
 */
function ADVISOR_SPAN(sqSrc, sqDst) {
    return LEGAL_SPAN[sqDst - sqSrc + 256] == 2;
}

/**
 * 
 * @method 判断相是否合法走棋
 * @param {number} sqSrc 原位置 
 * @param {number} sqDst 目的位置 
 */
function BISHOP_SPAN(sqSrc, sqDst) {
    return LEGAL_SPAN[sqDst - sqSrc + 256] == 3;
}

/**
 * @method 判断是否存在象眼
 * @param {number} sqSrc 原位置
 * @param {number} sqDst 目的位置
 */
function BISHOP_PIN(sqSrc, sqDst) {
    return (sqSrc + sqDst) >> 1;
}

/**
 * @method 判断是否存在马脚
 * @param {number} sqSrc 原位置
 * @param {number} sqDst 目的位置
 */
function KNIGHT_PIN(sqSrc, sqDst) {
    return sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256];
}

/**
 * @method 判断棋子是否在己方这一侧
 * @param {number} sq 棋子坐标
 * @param {number} sd 棋子属于哪一方
 * @description 0-黑方, 1-红
 */
function HOME_HALF(sq, sd) {
    return (sq & 0x80) != (sd << 7);
}

/**
 * @method 判断棋子是否在敌方这一侧
 * @param {number} sq 棋子坐标
 * @param {number} sd 棋子属于哪一方
 * @description 0-黑方, 1-红
 */
function AWAY_HALF(sq, sd) {
    return (sq & 0x80) == (sd << 7);
}

/**
 * @method 判断走棋前后是否在同一侧
 * @param {number} sqSrc 原位置
 * @param {number} sqDst 目的位置
 */
function SAME_HALF(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0x80) == 0;
}

/**
 * @method 判断走棋前后是否在同一行
 * @param {number} sqSrc 原位置
 * @param {number} sqDst 目的位置
 */
function SAME_RANK(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0xf0) == 0;
}

/**
 * @method 判断走棋前后是否在同一列
 * @param {number} sqSrc 原位置
 * @param {number} sqDst 目的位置
 */
function SAME_FILE(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0x0f) == 0;
}

/**
 * @method 己方标识
 * @param {number} sd 
 * @description 0-黑方, 1-红
 */
function SIDE_TAG(sd) {
    return 8 + (sd << 3);
}

/**
 * @method 敌方标识
 * @param {number} sd 
 * @description 0-黑方, 1-红
 */
function OPP_SIDE_TAG(sd) {
    return 16 - (sd << 3);
}

/**
 * @method 从走棋着法中获取原位置
 * @param {number} shift 
 * @description shift(高8位标识目的位置，低8位标识原位置) => dest << 8 + src
 */
function SRC(shift) {
    return shift & 255;
}

/**
 * @method 从走棋着法中获取目的位置
 * @param {number} shift 
 * @description shift(高8位标识目的位置，低8位标识原位置) => dest << 8 + src
 */
function DST(shift) {
    return shift >> 8;
}

/**
 * @method 将原位置和目的位置组合成着法
 * @param {number} sqSrc 
 * @param {number} sqDst 
 */
function MOVE(sqSrc, sqDst) {
    return sqSrc + (sqDst << 8);
}

/**
 * @method 获取镜像着法
 * @param {number} mv 
 */
function MIRROR_MOVE(mv) {
    return MOVE(MIRROR_SQUARE(SRC(mv)), MIRROR_SQUARE(DST(mv)));
}

//todo 不太懂
function MVV_LVA(pc, lva) {
    return MVV_VALUE[pc & 7] - lva;
}

/**
 * @method 从ASCII数值中获取对应的字符
 * @param {number} n ASCII值 
 */
function CHR(n) {
    return String.fromCharCode(n);
}

/**
 * @method 获取字符串中首字符的ASCII值
 * @param {string} c 字符串 
 */
function ASC(c) {
    return c.charCodeAt(0);
}

/**
 * @method 将字符转换成对应的棋子标识
 * @param {char} c 字符值
 */
function CHAR_TO_PIECE(c) {
    switch (c) {
        case "K":
            return PIECE_KING;
        case "A":
            return PIECE_ADVISOR;
        case "B":
        case "E":
            return PIECE_BISHOP;
        case "H":
        case "N":
            return PIECE_KNIGHT;
        case "R":
            return PIECE_ROOK;
        case "C":
            return PIECE_CANNON;
        case "P":
            return PIECE_PAWN;
        default:
            return -1;
    }
}

const rc4 = new RC4([0]);

let PreGen_zobristKeyPlayer = rc4.nextLong();
rc4.nextLong();
let PreGen_zobristLockPlayer = rc4.nextLong();

/**
 * Zobrist 哈希是以Albert L.Zobrist的名字命名。它是一种特殊的置换表。
 * 是一种专门针对棋类游戏而提出来的编码方式，判断历史局面是否存在的算法。
 * 按位异或
 */
let PreGen_zobristKeyTable = [],
    PreGen_zobristLockTable = [];

for (var i = 0; i < 14; i++) {
    let keys = [];
    let locks = [];
    for (let j = 0; j < 256; j++) {
        keys.push(rc4.nextLong());
        rc4.nextLong();
        locks.push(rc4.nextLong());
    }
    PreGen_zobristKeyTable.push(keys);
    PreGen_zobristLockTable.push(locks);
}

class Position {
    constructor() {

    }

    /**
     * @method 清空棋盘
     */
    clearBoard() {
        this.sdPlayer = 0;
        this.squares = [];
        for (var sq = 0; sq < 256; sq++) {
            this.squares.push(0);
        }
        this.zobristKey = this.zobristLock = 0;
        this.vlWhite = this.vlBlack = 0;
    }

    setIrrev() {
        this.mvList = [0];
        this.pcList = [0];
        this.keyList = [0];
        this.chkList = [this.checked()];
        this.distance = 0;
    }

    addPiece(sq, pc, bDel) {
        var pcAdjust;
        this.squares[sq] = bDel ? 0 : pc;
        if (pc < 16) {
            pcAdjust = pc - 8;
            this.vlWhite += bDel ? -chessDynamicValue[pcAdjust][sq] :
                chessDynamicValue[pcAdjust][sq];
        } else {
            pcAdjust = pc - 16;
            this.vlBlack += bDel ? -chessDynamicValue[pcAdjust][SQUARE_FLIP(sq)] :
                chessDynamicValue[pcAdjust][SQUARE_FLIP(sq)];
            pcAdjust += 7;
        }
        this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq];
        this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq];
    }

    movePiece(mv) {
        var sqSrc = SRC(mv);
        var sqDst = DST(mv);
        var pc = this.squares[sqDst];
        this.pcList.push(pc);
        if (pc > 0) {
            this.addPiece(sqDst, pc, DEL_PIECE);
        }
        pc = this.squares[sqSrc];
        this.addPiece(sqSrc, pc, DEL_PIECE);
        this.addPiece(sqDst, pc, ADD_PIECE);
        this.mvList.push(mv);
    }

    undoMovePiece() {
        var mv = this.mvList.pop();
        var sqSrc = SRC(mv);
        var sqDst = DST(mv);
        var pc = this.squares[sqDst];
        this.addPiece(sqDst, pc, DEL_PIECE);
        this.addPiece(sqSrc, pc, ADD_PIECE);
        pc = this.pcList.pop();
        if (pc > 0) {
            this.addPiece(sqDst, pc, ADD_PIECE);
        }
    }

    changeSide() {
        this.sdPlayer = 1 - this.sdPlayer;
        this.zobristKey ^= PreGen_zobristKeyPlayer;
        this.zobristLock ^= PreGen_zobristLockPlayer;
    }

    makeMove(mv) {
        var zobristKey = this.zobristKey;
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
        this.mvList.push(0);
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
        this.mvList.pop();
    }

    fromFen(fen) {
        this.clearBoard();
        var y = RANK_TOP;
        var x = FILE_LEFT;
        var index = 0;
        if (index == fen.length) {
            this.setIrrev();
            return;
        }
        var c = fen.charAt(index);
        while (c != " ") {
            if (c == "/") {
                x = FILE_LEFT;
                y++;
                if (y > RANK_BOTTOM) {
                    break;
                }
            } else if (c >= "1" && c <= "9") {
                for (var k = 0; k < (ASC(c) - ASC("0")); k++) {
                    if (x >= FILE_RIGHT) {
                        break;
                    }
                    x++;
                }
            } else if (c >= "A" && c <= "Z") {
                if (x <= FILE_RIGHT) {
                    var pt = CHAR_TO_PIECE(c);
                    if (pt >= 0) {
                        this.addPiece(COORD_XY(x, y), pt + 8);
                    }
                    x++;
                }
            } else if (c >= "a" && c <= "z") {
                if (x <= FILE_RIGHT) {
                    var pt = CHAR_TO_PIECE(CHR(ASC(c) + ASC("A") - ASC("a")));
                    if (pt >= 0) {
                        this.addPiece(COORD_XY(x, y), pt + 16);
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
        var fen = "";
        for (var y = RANK_TOP; y <= RANK_BOTTOM; y++) {
            var k = 0;
            for (var x = FILE_LEFT; x <= FILE_RIGHT; x++) {
                var pc = this.squares[COORD_XY(x, y)];
                if (pc > 0) {
                    if (k > 0) {
                        fen += CHR(ASC("0") + k);
                        k = 0;
                    }
                    fen += FEN_PIECE.charAt(pc);
                } else {
                    k++;
                }
            }
            if (k > 0) {
                fen += CHR(ASC("0") + k);
            }
            fen += "/";
        }
        return fen.substring(0, fen.length - 1) + " " +
            (this.sdPlayer == 0 ? 'w' : 'b');
    }

    generateMoves(vls) {
        var mvs = [];
        var pcSelfSide = SIDE_TAG(this.sdPlayer);
        var pcOppSide = OPP_SIDE_TAG(this.sdPlayer);
        for (var sqSrc = 0; sqSrc < 256; sqSrc++) {
            var pcSrc = this.squares[sqSrc];
            if ((pcSrc & pcSelfSide) == 0) {
                continue;
            }
            switch (pcSrc - pcSelfSide) {
                case PIECE_KING:
                    for (var i = 0; i < 4; i++) {
                        var sqDst = sqSrc + KING_DELTA[i];
                        if (!IN_FORT(sqDst)) {
                            continue;
                        }
                        var pcDst = this.squares[sqDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(MOVE(sqSrc, sqDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(MOVE(sqSrc, sqDst));
                            vls.push(MVV_LVA(pcDst, 5));
                        }
                    }
                    break;
                case PIECE_ADVISOR:
                    for (var i = 0; i < 4; i++) {
                        var sqDst = sqSrc + ADVISOR_DELTA[i];
                        if (!IN_FORT(sqDst)) {
                            continue;
                        }
                        var pcDst = this.squares[sqDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(MOVE(sqSrc, sqDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(MOVE(sqSrc, sqDst));
                            vls.push(MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case PIECE_BISHOP:
                    for (var i = 0; i < 4; i++) {
                        var sqDst = sqSrc + ADVISOR_DELTA[i];
                        if (!(isChessOnBoard(sqDst) && HOME_HALF(sqDst, this.sdPlayer) &&
                                this.squares[sqDst] == 0)) {
                            continue;
                        }
                        sqDst += ADVISOR_DELTA[i];
                        var pcDst = this.squares[sqDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(MOVE(sqSrc, sqDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(MOVE(sqSrc, sqDst));
                            vls.push(MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case PIECE_KNIGHT:
                    for (var i = 0; i < 4; i++) {
                        var sqDst = sqSrc + KING_DELTA[i];
                        if (this.squares[sqDst] > 0) {
                            continue;
                        }
                        for (var j = 0; j < 2; j++) {
                            sqDst = sqSrc + KNIGHT_DELTA[i][j];
                            if (!isChessOnBoard(sqDst)) {
                                continue;
                            }
                            var pcDst = this.squares[sqDst];
                            if (vls == null) {
                                if ((pcDst & pcSelfSide) == 0) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                }
                            } else if ((pcDst & pcOppSide) != 0) {
                                mvs.push(MOVE(sqSrc, sqDst));
                                vls.push(MVV_LVA(pcDst, 1));
                            }
                        }
                    }
                    break;
                case PIECE_ROOK:
                    for (var i = 0; i < 4; i++) {
                        var delta = KING_DELTA[i];
                        var sqDst = sqSrc + delta;
                        while (isChessOnBoard(sqDst)) {
                            var pcDst = this.squares[sqDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                }
                            } else {
                                if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                    if (vls != null) {
                                        vls.push(MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            sqDst += delta;
                        }
                    }
                    break;
                case PIECE_CANNON:
                    for (var i = 0; i < 4; i++) {
                        var delta = KING_DELTA[i];
                        var sqDst = sqSrc + delta;
                        while (isChessOnBoard(sqDst)) {
                            var pcDst = this.squares[sqDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                }
                            } else {
                                break;
                            }
                            sqDst += delta;
                        }
                        sqDst += delta;
                        while (isChessOnBoard(sqDst)) {
                            var pcDst = this.squares[sqDst];
                            if (pcDst > 0) {
                                if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                    if (vls != null) {
                                        vls.push(MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            sqDst += delta;
                        }
                    }
                    break;
                case PIECE_PAWN:
                    var sqDst = SQUARE_FORWARD(sqSrc, this.sdPlayer);
                    if (isChessOnBoard(sqDst)) {
                        var pcDst = this.squares[sqDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(MOVE(sqSrc, sqDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(MOVE(sqSrc, sqDst));
                            vls.push(MVV_LVA(pcDst, 2));
                        }
                    }
                    if (AWAY_HALF(sqSrc, this.sdPlayer)) {
                        for (var delta = -1; delta <= 1; delta += 2) {
                            sqDst = sqSrc + delta;
                            if (isChessOnBoard(sqDst)) {
                                var pcDst = this.squares[sqDst];
                                if (vls == null) {
                                    if ((pcDst & pcSelfSide) == 0) {
                                        mvs.push(MOVE(sqSrc, sqDst));
                                    }
                                } else if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(MOVE(sqSrc, sqDst));
                                    vls.push(MVV_LVA(pcDst, 2));
                                }
                            }
                        }
                    }
                    break;
            }
        }
        return mvs;
    }

    legalMove(mv) {
        var sqSrc = SRC(mv);
        var pcSrc = this.squares[sqSrc];
        var pcSelfSide = SIDE_TAG(this.sdPlayer);
        if ((pcSrc & pcSelfSide) == 0) {
            return false;
        }

        var sqDst = DST(mv);
        var pcDst = this.squares[sqDst];
        if ((pcDst & pcSelfSide) != 0) {
            return false;
        }

        switch (pcSrc - pcSelfSide) {
            case PIECE_KING:
                return IN_FORT(sqDst) && KING_SPAN(sqSrc, sqDst);
            case PIECE_ADVISOR:
                return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc, sqDst);
            case PIECE_BISHOP:
                return SAME_HALF(sqSrc, sqDst) && BISHOP_SPAN(sqSrc, sqDst) &&
                    this.squares[BISHOP_PIN(sqSrc, sqDst)] == 0;
            case PIECE_KNIGHT:
                var sqPin = KNIGHT_PIN(sqSrc, sqDst);
                return sqPin != sqSrc && this.squares[sqPin] == 0;
            case PIECE_ROOK:
            case PIECE_CANNON:
                var delta;
                if (SAME_RANK(sqSrc, sqDst)) {
                    delta = (sqDst < sqSrc ? -1 : 1);
                } else if (SAME_FILE(sqSrc, sqDst)) {
                    delta = (sqDst < sqSrc ? -16 : 16);
                } else {
                    return false;
                }
                var sqPin = sqSrc + delta;
                while (sqPin != sqDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                if (sqPin == sqDst) {
                    return pcDst == 0 || pcSrc - pcSelfSide == PIECE_ROOK;
                }
                if (pcDst == 0 || pcSrc - pcSelfSide != PIECE_CANNON) {
                    return false;
                }
                sqPin += delta;
                while (sqPin != sqDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                return sqPin == sqDst;
            case PIECE_PAWN:
                if (AWAY_HALF(sqDst, this.sdPlayer) && (sqDst == sqSrc - 1 || sqDst == sqSrc + 1)) {
                    return true;
                }
                return sqDst == SQUARE_FORWARD(sqSrc, this.sdPlayer);
            default:
                return false;
        }
    }

    checked() {
        var pcSelfSide = SIDE_TAG(this.sdPlayer);
        var pcOppSide = OPP_SIDE_TAG(this.sdPlayer);
        for (var sqSrc = 0; sqSrc < 256; sqSrc++) {
            if (this.squares[sqSrc] != pcSelfSide + PIECE_KING) {
                continue;
            }
            if (this.squares[SQUARE_FORWARD(sqSrc, this.sdPlayer)] == pcOppSide + PIECE_PAWN) {
                return true;
            }
            for (var delta = -1; delta <= 1; delta += 2) {
                if (this.squares[sqSrc + delta] == pcOppSide + PIECE_PAWN) {
                    return true;
                }
            }
            for (var i = 0; i < 4; i++) {
                if (this.squares[sqSrc + ADVISOR_DELTA[i]] != 0) {
                    continue;
                }
                for (var j = 0; j < 2; j++) {
                    var pcDst = this.squares[sqSrc + KNIGHT_CHECK_DELTA[i][j]];
                    if (pcDst == pcOppSide + PIECE_KNIGHT) {
                        return true;
                    }
                }
            }
            for (var i = 0; i < 4; i++) {
                var delta = KING_DELTA[i];
                var sqDst = sqSrc + delta;
                while (isChessOnBoard(sqDst)) {
                    var pcDst = this.squares[sqDst];
                    if (pcDst > 0) {
                        if (pcDst == pcOppSide + PIECE_ROOK || pcDst == pcOppSide + PIECE_KING) {
                            return true;
                        }
                        break;
                    }
                    sqDst += delta;
                }
                sqDst += delta;
                while (isChessOnBoard(sqDst)) {
                    var pcDst = this.squares[sqDst];
                    if (pcDst > 0) {
                        if (pcDst == pcOppSide + PIECE_CANNON) {
                            return true;
                        }
                        break;
                    }
                    sqDst += delta;
                }
            }
            return false;
        }
        return false;
    }

    isMate() {
        var mvs = this.generateMoves(null);
        for (var i = 0; i < mvs.length; i++) {
            if (this.makeMove(mvs[i])) {
                this.undoMakeMove();
                return false;
            }
        }
        return true;
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
        var vl = (this.sdPlayer == 0 ? this.vlWhite - this.vlBlack :
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
        var vlReturn = ((vlRep & 2) == 0 ? 0 : this.banValue()) +
            ((vlRep & 4) == 0 ? 0 : -this.banValue());
        return vlReturn == 0 ? this.drawValue() : vlReturn;
    }

    repStatus(recur_) {
        var recur = recur_;
        var selfSide = false;
        var perpCheck = true;
        var oppPerpCheck = true;
        var index = this.mvList.length - 1;
        while (this.mvList[index] > 0 && this.pcList[index] == 0) {
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
        var pos = new Position();
        pos.clearBoard();
        for (var sq = 0; sq < 256; sq++) {
            var pc = this.squares[sq];
            if (pc > 0) {
                pos.addPiece(MIRROR_SQUARE(sq), pc);
            }
        }
        if (this.sdPlayer == 1) {
            pos.changeSide();
        }
        return pos;
    }

    bookMove() {
        if (typeof BOOK_DAT != "object" || BOOK_DAT.length == 0) {
            return 0;
        }
        var mirror = false;
        var lock = this.zobristLock >>> 1; // Convert into Unsigned
        var index = binarySearch(BOOK_DAT, lock);
        if (index < 0) {
            mirror = true;
            lock = this.mirror().zobristLock >>> 1; // Convert into Unsigned
            index = binarySearch(BOOK_DAT, lock);
        }
        if (index < 0) {
            return 0;
        }
        index--;
        while (index >= 0 && BOOK_DAT[index][0] == lock) {
            index--;
        }
        var mvs = [],
            vls = [];
        var value = 0;
        index++;
        while (index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
            var mv = BOOK_DAT[index][1];
            mv = (mirror ? MIRROR_MOVE(mv) : mv);
            if (this.legalMove(mv)) {
                mvs.push(mv);
                var vl = BOOK_DAT[index][2];
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
        return ((this.squares[SRC(mv)] - 8) << 8) + DST(mv);
    }
}