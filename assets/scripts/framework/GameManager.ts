import { _decorator, Component, Node, Prefab, instantiate, Sprite, SpriteFrame, math, Label, tween, v3, UITransform, UIOpacity, director, v2 } from 'cc';
import { AudioManager } from './AudioManager';
import { Constant, EVENT } from './Constant';
import { PoolManager } from './PoolManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Prefab)
    blockPrefab: Prefab = null;

    @property(Node)
    blockBoot: Node = null;

    @property([SpriteFrame])
    blockSpriteFrames: SpriteFrame[] = [];

    @property(Node)
    game: Node = null;

    @property(Label)
    public showScoreLabel: Label = null;
    @property(Node)
    // 管理5个生命值
    hpManager: Node = null;
    // audio
    @property(AudioManager)
    public audioEffect: AudioManager = null;

    public map = [];//每个方格纹理
    public mapNode = [];//方块
    public book = [];//检测方块周围相同方块，记录于book

    public hp = 5;//血量
    public isStartGame: Boolean = false;

    // 用于计数
    public count = 0;
    // 用于记录连击音效
    public hits = 1;

    public score = 0;

    start() {
        this.init();
        this.gameStart();
        this.hp = 5;
    }

    gameOverType() {
        this.count = 0;
        this.hits = 1;
        this.score = 0;
        this.hp = 5;
        this.updateHpShow(this.hp);
        this.showScoreLabel.string = this.score + "";
        this.cleanInit();
        this.gameStart();
    }

    public playAudioEffect(name: string) {
        this.audioEffect.play(name);
    }

    /**
    * 将已经标记的方块消除
    * @param {*} col 
    * @param {*} row 
    */
    doActionForBook(col, row) {
        // 分数
        this.updateScoreLabel(this.count, this.map[col][row]);
        //遍历所有方块 把book标记 为1 的方块清除, 并保留被点击的方块
        const list = new Array<Number>(6)
        for (let i = 1; i < list.length; i++) {
            for (let j = 1; j < list.length; j++) {
                if (i === col && j === row) {//被点击的方块保留
                    continue;
                } else if (this.book[i][j] === 1) {
                    tween(this.mapNode[i][j])
                        .to(0.15, { scale: v3(0, 0) })
                        .call(() => {
                            PoolManager.instance().putNode(this.mapNode[i][j])
                            this.map[i][j] = null;
                            this.mapNode[i][j] = null;
                        }).start();
                }
            }
        }
        // 本身操作
        this.blockAddOneAni(col, row)

        // 每一次消除，hp += 1；
        this.hp += 1;
        if (this.hp > 5) this.hp = 5
        this.updateHpShow(this.hp);
        // // 连击加一
        // this.musicRoot.playCombo(this.hits);
        this.playAudioEffect("Combo" + this.hits)
        if (this.hits > 5) this.hits = 6
        this.hits += 1;

    }

    /**
     * 刷新血量
     */
    updateHpShow(hp) {
        if (hp < 0) hp = 0;
        if (hp > 5) hp = 5;
        for (let i = 0; i < this.hpManager.children.length; i++) {
            //如果UIOpacity 无法获取为null 就是ui里面没有添加这个组件，添加上就可以了
            this.hpManager.children[i].getComponent(UIOpacity).opacity = 0;
        }
        for (let r = 0; r < hp; r++) {
            this.hpManager.children[r].getComponent(UIOpacity).opacity = 255;
        }
    }

    /**
     * 分数增加，传入消除的数量与消除方块的数
     * 例子：我们消除了3个1 3* 1  4个2 4*2
     */
    updateScoreLabel(num, k) {
        tween(this.showScoreLabel.node)
            .to(0.1, { scale: v3(1.2, 1.2) })
            .call(() => {
                this.score += (k + 1) * num;
                this.showScoreLabel.string = this.score + "";
            })
            .to(0.1, { scale: v3(1, 1) })
            .start()

    }

    /**
     * 检测方块周围相同方块，记录于book
     * @param {*} col 
     * @param {*} row 
     * @param {*} num 
     */
    mapForCount(col, row, num) {
        let dir = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const posLsit = new Array<Number>(4)
        for (let k = 0; k < posLsit.length; k++) {
            let i = col + dir[k][0];
            let j = row + dir[k][1];
            // 0 - 6 1-5
            if (i < 1 || i > 5 || j < 1 || j > 5) {
                continue;
            }
            if (this.map[i][j] === num && this.book[i][j] === 0) {
                // console.log('找到相同方块', i, j);
                this.book[i][j] = 1;
                this.count += 1;
                // console.log(this.count);
                this.mapForCount(i, j, num);//找到相同方块，检测该相同方块周围相同方块
            }
        }
    }

    setZeroBook() {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                this.book[i][j] = 0;
            }
        }
    }

    gameStart() {
        // 我们需要随机的创建25个方块
        const list = new Array<Node>(6);
        for (let i = 1; i < list.length; i++) {
            for (let j = 1; j < list.length; j++) {
                // 这里我们要注意坐标转化问题
                // 我们鼠标点击的区域是正方形，而方块的坐标是在那个方形区域中心
                // 宽为 650 左右坐标为 （-650/2+130/2 ，650/2-130/2）及（-260，260） 那么边界的方块坐标为 -325 + 130/2。。。
                // let x = -260 + (i - 1) * 130;
                // let y = 260 - (j - 1) * 130;
                let x = Constant.startX + (i - 1) * Constant.widthXY;
                let y = Constant.startY - (j - 1) * Constant.widthXY;
                // 这样就能遍历到所有方块 ， 随机0-4
                let num = this.randNum(0, 4);
                this.map[i][j] = num;
                // 上下左右均不相同即可
                while (this.map[i][j] === this.map[i - 1][j] ||
                    this.map[i][j] === this.map[i][j - 1] ||
                    this.map[i][j] === this.map[i + 1][j] ||
                    this.map[i][j] === this.map[i][j + 1]) {
                    num = this.randNum(0, 4);
                    this.map[i][j] = num;
                }
                // 这样就不会连着相同了, 创建完的节点存入节点数组
                this.mapNode[i][j] = this.createBlock(x, y, num);
            }
        }
        // console.log(this.map);
        // console.log(this.mapNode);
        // console.log(this.book);
    }

    init() {
        this.map = [];
        this.mapNode = [];
        // 标志数组
        this.book = [];
        // 让我们创建二维数组 在JavaScript中只有1维数组，二维数组就是[[],[],[],,,,,]数组中装入数组
        const list = new Array<Node>(7)
        for (let i = 0; i < list.length; i++) {
            this.map[i] = [];
            this.mapNode[i] = [];
            this.book[i] = [];
            for (let j = 0; j < list.length; j++) {
                this.map[i][j] = null;
                this.mapNode[i][j] = null;
                this.book[i][j] = 0;
            }
        }
        // 这样，就初始化了3个二维数组，打印看下
        // console.log(this.map);
        // console.log(this.mapNode);
        // console.log(this.book);
    }

    //清除数据
    cleanInit() {
        const list = new Array<Number>(6)
        for (let i = 1; i < list.length; i++) {
            for (let j = 1; j < list.length; j++) {
                if(this.mapNode[i][j]) PoolManager.instance().putNode(this.mapNode[i][j])
                this.map[i][j] = null;
                this.mapNode[i][j] = null;
                this.book[i][j] = 0;
            }
        }
    }
    //当相同其他方块清除是，被点击的方块自己加一， 并下落
    blockAddOneAni(col, row) {
        tween(this.mapNode[col][row])
            .to(0.15, { scale: v3(1.2, 1.2) })
            .call(() => {
                this.blockAddOne(col, row);//数字加一
            })
            .to(0.15, { scale: v3(1, 1) })
            .call(() => {
                this.blockDown();//下落
            }).start();
    }

    /**
     * 方块下落
     */
    blockDown() {
        let downFlag = true;
        while (downFlag) {
            downFlag = false;
            const list = new Array<Node>(6)
            for (let i = 1; i < 6; i++) {
                for (let j = 1; j < 5; j++) {
                    //当方块存在，并且它下面的方块为null的时候，就找到应该下落的方块
                    if (this.mapNode[i][j] !== null && this.mapNode[i][j + 1] === null) {
                        console.log('找到', i, j);
                        let pos = this.mapNode[i][j].position;
                        let pos2 = pos.y - 130;
                        // tween(this.mapNode[i][j])
                        //     .to(0.1, { position: v2(pos.x, pos2) }).start();
                        this.mapNode[i][j].setPosition(pos.x,pos2)
                        // this.mapNode[i][j].runAction(moveBy(0.1, 0, -130));
                        this.mapNode[i][j + 1] = this.mapNode[i][j];
                        this.map[i][j + 1] = this.map[i][j];
                        this.mapNode[i][j] = null;
                        this.map[i][j] = null;
                        // if(this.mapNode[i][j + 1] === null)
                        downFlag = true;
                    }
                }
            }
        }
        // 下落之后，我们需要把空补上。
        this.scheduleOnce(this.checkNullBlock, 0.5);
    }
    // 下落之后，我们需要把空补上
    checkNullBlock() {
        const list = new Array<Node>(6);
        for (let i = 1; i < list.length; i++) {
            for (let j = 1; j < list.length; j++) {
                //如果是null 的位置就随机创建方块
                if (this.mapNode[i][j] === null) {
                    let num = this.randNum(0, 4);
                    let x = Constant.startX + (i - 1) * Constant.widthXY;
                    let y = Constant.startY - (j - 1) * Constant.widthXY;

                    // let x = -260 + (i - 1) * 130;
                    // let y = 260 - (j - 1) * 130;


                    this.map[i][j] = num;
                    this.mapNode[i][j] = this.createBlock(x, y, num);
                    // 消除时 缩小 0
                    // pool get 
                    // this.mapNode[i][j].scale = 0;
                    // this.mapNode[i][j].runAction(scaleTo(0.1, 1));
                    this.mapNode[i][j].setScale(0, 0);
                    tween(this.mapNode[i][j])
                        .to(0.1, { scale: v3(1, 1) })
                        .start();
                }
            }
        }
        // 新建方块时间0.1秒
        this.scheduleOnce(this.checkCount, 0.3);
    }

    /**
     * 新建方块后继续检测是否有超过3个方块连接
     */
    checkCount() {
        let checkFlag = true;
        const list = new Array<Node>(6);
        //遍历二维数组所有方块 有3个方块连接 的标记book count值 并清除相连的所有方块
        for (let i = 1; i < list.length; i++) {
            for (let j = 1; j < list.length; j++) {
                if (checkFlag === false) break;
                this.count = 0;
                this.setZeroBook();
                this.mapForCount(i, j, this.map[i][j]);
                if (this.count >= 3) {
                    this.doActionForBook(i, j);
                    checkFlag = false;
                }
            }
        }
        //如果所有补上的方块 都没有3个相连的 就打开触摸
        if (checkFlag === true) {
            director.emit(EVENT.OPEN_TOUCHEND);
        }
    }

    /**
     * 点击方块加一
     * @param {*} col 
     * @param {*} row 
     */
    blockAddOne(col, row) {
        if (this.map[col][row] === 8) {
            console.log('到9了');
            return false;
        }
        this.map[col][row] += 1;
        let num = this.map[col][row];
        this.mapNode[col][row].getComponent(Sprite).spriteFrame = this.blockSpriteFrames[num];
        return true;
    }
    /**
     * 通过给定坐标和数字创建一个方块
     * @param {number} x 
     * @param {number} y 
     * @param {number} num 
     */
    createBlock(x, y, num) {
        // let b = null;
        // 获取前判断对象池是否为空
        // if (this.pool.size() > 0) {
        //     b = this.pool.get(); 
        // } else {
        //     b = instantiate(this.blockPrefab);
        // }
        const b = PoolManager.instance().getNode(this.blockPrefab, this.blockBoot);
        // b.parent = this.node;
        // b.x = x;
        // b.y = y;
        b.setPosition(x, y)
        b.getComponent(Sprite).spriteFrame = this.blockSpriteFrames[num];
        return b;
    }

    /**
     * 返回min - max 的随机值
     * @param {number} min 
     * @param {number} max 
     */
    randNum(min, max) {
        let value = min + (max - min + 1) * Math.random();
        return Math.floor(value);
    }

}

