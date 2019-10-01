/**
 * һЩ��ҵ���޹صĹ��ߺ���
 */

"use strict";

/**
 * @method ��������
 * @param {array} vlss Ҫ����������
 * @param {number} vl Ŀ��Ԫ��
 */
function binarySearch(vlss, vl) {
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

const SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093]; //����
/**
 * @method ϣ������
 * @description һ�ζ���������ͬʱ����
 */
function shellSort(mvs, vls) {
    //Ѱ��һ��������Ĳ���
    let stepLevel = 1;
    while (SHELL_STEP[stepLevel] < mvs.length) {
        stepLevel++;
    }
    stepLevel--;

    while (stepLevel > 0) {
        let step = SHELL_STEP[stepLevel];
        for (let i = step; i < mvs.length; i++) {
            let mvBest = mvs[i];
            let vlBest = vls[i];
            let j = i - step;
            while (j >= 0 && vlBest > vls[j]) {
                mvs[j + step] = mvs[j];
                vls[j + step] = vls[j];
                j -= step;
            }
            mvs[j + step] = mvBest;
            vls[j + step] = vlBest;
        }
        stepLevel--;
    }
}

/**
 * @method ��ASCII��ֵ�л�ȡ��Ӧ���ַ�
 * @param {number} code ASCIIֵ 
 */
function getCharFromByteCode(code) {
    return String.fromCharCode(code);
}

/**
 * @method ��ȡ�ַ��������ַ���ASCIIֵ
 * @param {string} char �ַ��� 
 */
function getCodeFromChar(char) {
    return char.charCodeAt(0);
}

/**
 * @class RC4(Rivest Cipher 4)
 * @constructor ����Ϊ��Կ
 * @classdesc �ԳƼ����㷨
 */
class RC4 {
    constructor(key) {
        this.x = this.y = 0;
        this.state = [];

        //[0 .. 255]��״̬
        for (let i = 0; i < 256; i++) {
            this.state.push(i);
        }

        //��ʼ����
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

    // ������Կ��
    // ���ĵ�i�ֽ�=���ĵ�i�ֽ�^��Կ����i�ֽ�
    // ���� = ����^��Կ��
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