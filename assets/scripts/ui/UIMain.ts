import { _decorator, Component, Node, tween, UITransform, Tween, Event, EventTouch, v3, director } from 'cc';
import { EVENT } from '../framework/Constant';
import { GameManager } from '../framework/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Uimain')
export class Uimain extends Component {

    @property(Node)
    startButton: Node = null;

    @property(GameManager)
    gamemanager: GameManager = null;
    @property(Node)
    startGame: Node = null;
    @property(Node)
    game: Node = null;

    start() {
        this.startAni();
        this.gamemanager.updateHpShow(this.gamemanager.hp);
        this.startGame.active = true;
        this.game.active = false;
    }

    private gameStart() {
        this.startGame.active = false;
        this.game.active = true;
        this.openTouch();
    }

    private touchEnd(e: EventTouch) {
        // this.musicRoot.playHit();
        this.gamemanager.playAudioEffect('hit');
        let locat = e.getUILocation()
        console.log("touchEnd", locat)
        // 获取下位置
        let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(locat.x, locat.y));
        // 每个方块 空间为 130 * 130 5个方块连一排为 650 宽
        // 所以在坐标转化时是 325  col 行  row 列
        // 加一是因为 5 * 5的空间，我准备采用 7 * 7 的二维数组
        let col = Math.floor((325 + pos.x) / 130) + 1;
        let row = Math.floor((325 - pos.y) / 130) + 1;
        // console.log(col, row);
        // 如果出界
        if (col < 1 || col > 5 || row < 1 || row > 5) {
            console.log('不在范围内');
            return;
        }
        if (!this.gamemanager.blockAddOne(col, row)) {
            return;
        }
        this.gamemanager.hp -= 1;
        if (this.gamemanager.hp <= 0) {
            console.log('游戏结束');
            // this.musicRoot.playOver();
            this.gamemanager.playAudioEffect('over');
            this.scheduleOnce(() => {
                this.startGame.active = true;
                this.game.active = false;
                this.gamemanager.gameOverType();
                this.closeTouch();
            }, 1);
        }
        this.gamemanager.updateHpShow(this.gamemanager.hp);
        this.closeTouch();
        // 每次检测前都应归零book, count也需要归零
        this.gamemanager.count = 0;
        this.gamemanager.setZeroBook();
        let num = this.gamemanager.map[col][row];//当前被点击方块纹理值
        this.gamemanager.mapForCount(col, row, num);
        if (this.gamemanager.count < 3) {
            this.openTouch();
            return;
        }
        this.gamemanager.hits = 0;
        // // this.updateScoreLabel(this.blockManager.count, this.blockManager.map[col][row]);
        this.gamemanager.doActionForBook(col, row);
        console.log("touchEnd", col, row)
    }
    //开始游戏按钮摆动
    private startAni() {
        Tween.stopAll()
        this.startButton.angle = 0
        tween(this.startButton).repeatForever(
            tween()
                .to(0.3, { angle: 4 })
                .to(0.6, { angle: -8 })
                .to(0.3, { angle: 4 }).call(() => {
                    this.startButton.angle = 0;
                })
                .delay(0.5)
        ).start()
    }

    openTouch() {
        this.node.on(Node.EventType.TOUCH_END, this.touchEnd, this);
    }

    closeTouch() {
        this.node.off(Node.EventType.TOUCH_END, this.touchEnd, this);
    }

    onEnable() {
        director.on(EVENT.OPEN_TOUCHEND, this.openTouch, this);
    }

    onDisable() {
        director.off(EVENT.OPEN_TOUCHEND, this.openTouch, this);
    }
}

