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

//todo ��ʱ����֪����ɶ��
const MATE_VALUE = 10000;
const BAN_VALUE = MATE_VALUE - 100;
const WIN_VALUE = MATE_VALUE - 200;
const NULL_SAFE_MARGIN = 400;
const NULL_OKAY_MARGIN = 200;
const DRAW_VALUE = 20;
const ADVANCED_VALUE = 3;

/**
 * @method �����Ƿ���������
 * @param {number} pos ���ӵ�����
 */
function isChessOnBoard(pos) {
    return IN_BOARD_[pos] != 0;
}

/**
 * @method �����Ƿ��ھŹ���
 * @param {number} pos ���ӵ�����
 */
function isInFort(pos) {
    return IN_FORT_[pos] != 0;
}

/**
 * @method ��ȡ�����е���ֵY
 * @param {number} pos ��������Y
 * @description �����ʾ��ʽ YX(��4λλ��ֵY ��4λΪ��ֵX)
 */
function getChessPosY(pos) {
    return pos >> 4;
}

/**
 * @method ��ȡ�����е���ֵX
 * @param {number} pos ��������X
 */
function getChessPosX(pos) {
    return pos & 15;
}

/**
 * @method ���X��YΪһ��ֵ����Ϊ����ķ����±�
 * @param {number} x 
 * @param {number} y 
 */
function MakeCoordWithXY(x, y) {
    return x + (y << 4);
}

/**
 * @method ��ת����
 * @param {number} sq 
 */
function flipPos(pos) {
    return 254 - pos;
}

/**
 * @method ��תX����
 * @param {number} x 
 */
function flipPosX(x) {
    return 14 - x;
}

/**
 * @method ��תY����
 * @param {number} y 
 */
function flipPosY(y) {
    return 15 - y;
}

/**
 * @method ��ȡ���Ҿ���λ��
 * @param {number} pos 
 */
function getMirrorPosByX(pos) {
    return MakeCoordWithXY(flipPosX(getChessPosX(pos)), getChessPosY(pos));
}

/**
 * @method ��(��) ǰ��һ���������
 * @param {number} pos ��������
 * @param {number} side ����������һ��
 * @description 0-�ڷ�, 1-��
 */
function getForwardPosForPawn(pos, side) {
    return pos - 16 + (side << 5);
}

/**
 * @method �ж��Ͻ��Ƿ�Ϸ�����
 * @param {number} posSrc ԭλ�� 
 * @param {number} posDst Ŀ��λ��
 */
function isKingSpan(posSrc, posDst) {
    return LEGAL_SPAN[posDst - posSrc + 256] == 1;
}

/**
 * 
 * @method �ж�ʿ�Ƿ�Ϸ�����
 * @param {number} posSrc ԭλ�� 
 * @param {number} posDst Ŀ��λ�� 
 */
function isAdvisorSpan(posSrc, posDst) {
    return LEGAL_SPAN[posDst - posSrc + 256] == 2;
}

/**
 * 
 * @method �ж����Ƿ�Ϸ�����
 * @param {number} posSrc ԭλ�� 
 * @param {number} posDst Ŀ��λ�� 
 */
function isBishopSpan(posSrc, posDst) {
    return LEGAL_SPAN[posDst - posSrc + 256] == 3;
}

/**
 * @method �ж��Ƿ��������
 * @param {number} posSrc ԭλ��
 * @param {number} posDst Ŀ��λ��
 */
function isExistBishopPin(posSrc, posDst) {
    return (posSrc + posDst) >> 1;
}

/**
 * @method �ж��Ƿ�������
 * @param {number} posSrc ԭλ��
 * @param {number} posDst Ŀ��λ��
 */
function isExistKnightPin(posSrc, posDst) {
    return posSrc + KNIGHT_PIN_[posDst - posSrc + 256];
}

/**
 * @method �ж������Ƿ��ڼ�����һ��
 * @param {number} pos ��������
 * @param {number} side ����������һ��
 * @description 0-�ڷ�, 1-��
 */
function isSelfHalf(pos, side) {
    return (pos & 0x80) != (side << 7);
}

/**
 * @method �ж������Ƿ��ڵз���һ��
 * @param {number} pos ��������
 * @param {number} side ����������һ��
 * @description 0-�ڷ�, 1-��
 */
function isEnemyHalf(pos, side) {
    return (pos & 0x80) == (side << 7);
}

/**
 * @method �ж�����ǰ���Ƿ���ͬһ��
 * @param {number} posSrc ԭλ��
 * @param {number} posDst Ŀ��λ��
 */
function isSameHalf(posSrc, posDst) {
    return ((posSrc ^ posDst) & 0x80) == 0;
}

/**
 * @method �ж�����ǰ���Ƿ���ͬһ��
 * @param {number} posSrc ԭλ��
 * @param {number} posDst Ŀ��λ��
 */
function isSamePoxY(posSrc, posDst) {
    return ((posSrc ^ posDst) & 0xf0) == 0;
}

/**
 * @method �ж�����ǰ���Ƿ���ͬһ��
 * @param {number} posSrc ԭλ��
 * @param {number} posDst Ŀ��λ��
 */
function isSamePoxX(posSrc, posDst) {
    return ((posSrc ^ posDst) & 0x0f) == 0;
}

/**
 * @method ������ʶ
 * @param {number} side
 * @description 0-�ڷ�, 1-��
 */
function getSelfSideTag(side) {
    return 8 + (side << 3);
}

/**
 * @method �з���ʶ
 * @param {number} side 
 * @description 0-�ڷ�, 1-��
 */
function getEnemySideTag(side) {
    return 16 - (side << 3);
}

/**
 * @method �������ŷ��л�ȡԭλ��
 * @param {number} motion 
 * @description motion(��8λ��ʶĿ��λ�ã���8λ��ʶԭλ��) => dest << 8 + src
 */
function getSrcPosFromMotion(motion) {
    return motion & 255;
}

/**
 * @method �������ŷ��л�ȡĿ��λ��
 * @param {number} motion 
 * @description motion(��8λ��ʶĿ��λ�ã���8λ��ʶԭλ��) => dest << 8 + src
 */
function getDstPosFromMotion(motion) {
    return motion >> 8;
}

/**
 * @method ��ԭλ�ú�Ŀ��λ����ϳ��ŷ�
 * @param {number} posSrc 
 * @param {number} posDst 
 */
function makeMotionBySrcDst(posSrc, posDst) {
    return posSrc + (posDst << 8);
}

/**
 * @method ��ȡ�����ŷ�
 * @param {number} motion 
 */
function getMirrorMotionByX(motion) {
    return makeMotionBySrcDst(getMirrorPosByX(getSrcPosFromMotion(motion)), getMirrorPosByX(getDstPosFromMotion(motion)));
}

//todo ��̫��
function MVV_LVA(pc, lva) {
    return MVV_VALUE[pc & 7] - lva;
}

const rc4 = new RC4([0]);

let PreGen_zobristKeyPlayer = rc4.nextLong();
rc4.nextLong();
let PreGen_zobristLockPlayer = rc4.nextLong();

/**
 * Zobrist ��ϣ����Albert L.Zobrist����������������һ��������û���
 * ��һ��ר�����������Ϸ��������ı��뷽ʽ���ж���ʷ�����Ƿ���ڵ��㷨��
 * ��λ���
 */
let PreGen_zobristKeyTable = [],
    PreGen_zobristLockTable = [];

for (let i = 0; i < 14; i++) {
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
     * @method �������
     */
    clearBoard() {
        this.sdPlayer = 0;
        this.squares = [];
        for (let sq = 0; sq < 256; sq++) {
            this.squares.push(0);
        }
        this.zobristKey = this.zobristLock = 0;
        this.vlWhite = this.vlBlack = 0;
    }

    /**
     * ����ṹ
     */
    setIrrev() {
        this.motionList = [0]; //�����б�
        this.pcList = [0];
        this.keyList = [0];
        this.chkList = [this.checked()];
        this.distance = 0;
    }

    /**
     * 
     * @param {number} sq ��������
     * @param {number} pc play color
     * @param {boolean} bDel ��ɾ��
     */
    addPiece(sq, pc, bDel) {
        let pcAdjust;
        this.squares[sq] = bDel ? 0 : pc;
        if (pc < 16) {
            pcAdjust = pc - 8;
            this.vlWhite += bDel ? -chessDynamicValue[pcAdjust][sq] :
                chessDynamicValue[pcAdjust][sq];
        } else {
            pcAdjust = pc - 16;
            this.vlBlack += bDel ? -chessDynamicValue[pcAdjust][flipPos(sq)] :
                chessDynamicValue[pcAdjust][flipPos(sq)];
            pcAdjust += 7;
        }
        this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq];
        this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq];
    }

    /**
     * @method �߶�����
     * @param {number} motion �����ŷ� 
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
        this.zobristKey ^= PreGen_zobristKeyPlayer;
        this.zobristLock ^= PreGen_zobristLockPlayer;
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

    fromFen(fen) {
        this.clearBoard();
        let y = RANK_TOP;
        let x = FILE_LEFT;
        let index = 0;
        if (index == fen.length) {
            this.setIrrev();
            return;
        }
        let c = fen.charAt(index);
        while (c != " ") {
            if (c == "/") {
                x = FILE_LEFT;
                y++;
                if (y > RANK_BOTTOM) {
                    break;
                }
            } else if (c >= "1" && c <= "9") {
                for (let k = 0; k < (getCodeFromChar(c) - getCodeFromChar("0")); k++) {
                    if (x >= FILE_RIGHT) {
                        break;
                    }
                    x++;
                }
            } else if (c >= "A" && c <= "Z") {
                if (x <= FILE_RIGHT) {
                    let pt = this.getChessIdFromChar(c);
                    if (pt >= 0) {
                        this.addPiece(MakeCoordWithXY(x, y), pt + 8);
                    }
                    x++;
                }
            } else if (c >= "a" && c <= "z") {
                if (x <= FILE_RIGHT) {
                    let pt = this.getChessIdFromChar(getCharFromByteCode(getCodeFromChar(c) + getCodeFromChar("A") - getCodeFromChar("a")));
                    if (pt >= 0) {
                        this.addPiece(MakeCoordWithXY(x, y), pt + 16);
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
        for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
            let k = 0;
            for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
                let pc = this.squares[MakeCoordWithXY(x, y)];
                if (pc > 0) {
                    if (k > 0) {
                        fen += getCharFromByteCode(getCodeFromChar("0") + k);
                        k = 0;
                    }
                    fen += FEN_PIECE.charAt(pc);
                } else {
                    k++;
                }
            }
            if (k > 0) {
                fen += getCharFromByteCode(getCodeFromChar("0") + k);
            }
            fen += "/";
        }
        return fen.substring(0, fen.length - 1) + " " +
            (this.sdPlayer == 0 ? 'w' : 'b');
    }

    generateMoves(vls) {
        let mvs = [];
        let pcSelfSide = getSelfSideTag(this.sdPlayer);
        let pcOppSide = getEnemySideTag(this.sdPlayer);
        for (let posSrc = 0; posSrc < 256; posSrc++) {
            let pcSrc = this.squares[posSrc];
            if ((pcSrc & pcSelfSide) == 0) {
                continue;
            }
            switch (pcSrc - pcSelfSide) {
                case PIECE_KING:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + KING_DELTA[i];
                        if (!isInFort(posDst)) {
                            continue;
                        }
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            vls.push(MVV_LVA(pcDst, 5));
                        }
                    }
                    break;
                case PIECE_ADVISOR:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + ADVISOR_DELTA[i];
                        if (!isInFort(posDst)) {
                            continue;
                        }
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            vls.push(MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case PIECE_BISHOP:
                    for (let i = 0; i < 4; i++) {
                        let posDst = posSrc + ADVISOR_DELTA[i];
                        if (!(isChessOnBoard(posDst) && isSelfHalf(posDst, this.sdPlayer) &&
                                this.squares[posDst] == 0)) {
                            continue;
                        }
                        posDst += ADVISOR_DELTA[i];
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            vls.push(MVV_LVA(pcDst, 1));
                        }
                    }
                    break;
                case PIECE_KNIGHT:
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
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                }
                            } else if ((pcDst & pcOppSide) != 0) {
                                mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                vls.push(MVV_LVA(pcDst, 1));
                            }
                        }
                    }
                    break;
                case PIECE_ROOK:
                    for (let i = 0; i < 4; i++) {
                        let delta = KING_DELTA[i];
                        let posDst = posSrc + delta;
                        while (isChessOnBoard(posDst)) {
                            let pcDst = this.squares[posDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                }
                            } else {
                                if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                    if (vls != null) {
                                        vls.push(MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            posDst += delta;
                        }
                    }
                    break;
                case PIECE_CANNON:
                    for (let i = 0; i < 4; i++) {
                        let delta = KING_DELTA[i];
                        let posDst = posSrc + delta;
                        while (isChessOnBoard(posDst)) {
                            let pcDst = this.squares[posDst];
                            if (pcDst == 0) {
                                if (vls == null) {
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
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
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                    if (vls != null) {
                                        vls.push(MVV_LVA(pcDst, 4));
                                    }
                                }
                                break;
                            }
                            posDst += delta;
                        }
                    }
                    break;
                case PIECE_PAWN:
                    let posDst = getForwardPosForPawn(posSrc, this.sdPlayer);
                    if (isChessOnBoard(posDst)) {
                        let pcDst = this.squares[posDst];
                        if (vls == null) {
                            if ((pcDst & pcSelfSide) == 0) {
                                mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            }
                        } else if ((pcDst & pcOppSide) != 0) {
                            mvs.push(makeMotionBySrcDst(posSrc, posDst));
                            vls.push(MVV_LVA(pcDst, 2));
                        }
                    }
                    if (isEnemyHalf(posSrc, this.sdPlayer)) {
                        for (let delta = -1; delta <= 1; delta += 2) {
                            posDst = posSrc + delta;
                            if (isChessOnBoard(posDst)) {
                                let pcDst = this.squares[posDst];
                                if (vls == null) {
                                    if ((pcDst & pcSelfSide) == 0) {
                                        mvs.push(makeMotionBySrcDst(posSrc, posDst));
                                    }
                                } else if ((pcDst & pcOppSide) != 0) {
                                    mvs.push(makeMotionBySrcDst(posSrc, posDst));
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
        let posSrc = getSrcPosFromMotion(mv);
        let pcSrc = this.squares[posSrc];
        let pcSelfSide = getSelfSideTag(this.sdPlayer);
        if ((pcSrc & pcSelfSide) == 0) {
            return false;
        }

        let posDst = getDstPosFromMotion(mv);
        let pcDst = this.squares[posDst];
        if ((pcDst & pcSelfSide) != 0) {
            return false;
        }

        switch (pcSrc - pcSelfSide) {
            case PIECE_KING:
                return isInFort(posDst) && isKingSpan(posSrc, posDst);
            case PIECE_ADVISOR:
                return isInFort(posDst) && isAdvisorSpan(posSrc, posDst);
            case PIECE_BISHOP:
                return isSameHalf(posSrc, posDst) && isBishopSpan(posSrc, posDst) &&
                    this.squares[isExistBishopPin(posSrc, posDst)] == 0;
            case PIECE_KNIGHT: {
                let sqPin = isExistKnightPin(posSrc, posDst);
                return sqPin != posSrc && this.squares[sqPin] == 0;
            }
            case PIECE_ROOK:
            case PIECE_CANNON: {
                let delta;
                if (isSamePoxY(posSrc, posDst)) {
                    delta = (posDst < posSrc ? -1 : 1);
                } else if (isSamePoxX(posSrc, posDst)) {
                    delta = (posDst < posSrc ? -16 : 16);
                } else {
                    return false;
                }
                let sqPin = posSrc + delta;
                while (sqPin != posDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                if (sqPin == posDst) {
                    return pcDst == 0 || pcSrc - pcSelfSide == PIECE_ROOK;
                }
                if (pcDst == 0 || pcSrc - pcSelfSide != PIECE_CANNON) {
                    return false;
                }
                sqPin += delta;
                while (sqPin != posDst && this.squares[sqPin] == 0) {
                    sqPin += delta;
                }
                return sqPin == posDst;
            }
            case PIECE_PAWN:
                if (isEnemyHalf(posDst, this.sdPlayer) && (posDst == posSrc - 1 || posDst == posSrc + 1)) {
                    return true;
                }
                return posDst == getForwardPosForPawn(posSrc, this.sdPlayer);
            default:
                return false;
        }
    }

    checked() {
        let pcSelfSide = getSelfSideTag(this.sdPlayer);
        let pcOppSide = getEnemySideTag(this.sdPlayer);
        for (let posSrc = 0; posSrc < 256; posSrc++) {
            if (this.squares[posSrc] != pcSelfSide + PIECE_KING) {
                continue;
            }
            if (this.squares[getForwardPosForPawn(posSrc, this.sdPlayer)] == pcOppSide + PIECE_PAWN) {
                return true;
            }
            for (let delta = -1; delta <= 1; delta += 2) {
                if (this.squares[posSrc + delta] == pcOppSide + PIECE_PAWN) {
                    return true;
                }
            }
            for (let i = 0; i < 4; i++) {
                if (this.squares[posSrc + ADVISOR_DELTA[i]] != 0) {
                    continue;
                }
                for (let j = 0; j < 2; j++) {
                    let pcDst = this.squares[posSrc + KNIGHT_CHECK_DELTA[i][j]];
                    if (pcDst == pcOppSide + PIECE_KNIGHT) {
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
                        if (pcDst == pcOppSide + PIECE_ROOK || pcDst == pcOppSide + PIECE_KING) {
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
                        if (pcDst == pcOppSide + PIECE_CANNON) {
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
        let pos = new Position();
        pos.clearBoard();
        for (let sq = 0; sq < 256; sq++) {
            let pc = this.squares[sq];
            if (pc > 0) {
                pos.addPiece(getMirrorPosByX(sq), pc);
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
        let mirror = false;
        let lock = this.zobristLock >>> 1; // Convert into Unsigned
        let index = binarySearch(BOOK_DAT, lock);
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
        let mvs = [],
            vls = [];
        let value = 0;
        index++;
        while (index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
            let mv = BOOK_DAT[index][1];
            mv = (mirror ? getMirrorMotionByX(mv) : mv);
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
     * @method ���ַ�ת���ɶ�Ӧ�����ӱ�ʶ
     * @param {char} char �ַ�ֵ
     */
    getChessIdFromChar(char) {
        switch (char) {
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
}