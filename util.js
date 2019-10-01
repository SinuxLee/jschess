/**
 * 一些与业务无关的工具函数
 */

"use strict";

/**
 * @method 二叉搜索
 * @param {array} vlss 要搜索的数组
 * @param {number} vl 目标元素
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

const SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093]; //步长
/**
 * @method 希尔排序
 * @description 一次对两个数组同时排序
 */
function shellSort(mvs, vls) {
    //寻找一个尽量大的步长
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
 * @method 从ASCII数值中获取对应的字符
 * @param {number} code ASCII值 
 */
function getCharFromByteCode(code) {
    return String.fromCharCode(code);
}

/**
 * @method 获取字符串中首字符的ASCII值
 * @param {string} char 字符串 
 */
function getCodeFromChar(char) {
    return char.charCodeAt(0);
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

        //[0 .. 255]种状态
        for (let i = 0; i < 256; i++) {
            this.state.push(i);
        }

        //初始排列
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

    // 产生密钥流
    // 密文第i字节=明文第i字节^密钥流第i字节
    // 明文 = 密文^密钥流
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