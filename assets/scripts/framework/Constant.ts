import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Constant')
export class Constant {
    /** 方格宽 纹理实际 120 加上方格之间的空隙 10  所有是赋值130  */
    static readonly widthXY:number = 130;
    /** 方格高开始坐标 -(650/2 - 130/2) */
    static readonly startX:number = -260;
    /** 方格高开始坐标 (650/2 - 130/2) */
    static readonly startY:number = 260;
}

/** 导出事件名称枚举 */
export enum EVENT {
    /** 如果所有补上的方块 都没有3个相连的 就打开触摸*/
    OPEN_TOUCHEND = 'openTouchEnd'
}

