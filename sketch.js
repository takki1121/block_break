// ブロック崩しゲーム - p5.jsベースファイル
// 設計書: c:\Users\takeru\OneDrive\ドキュメント\programing\p5js\block_break\設計書.md

// ゲームステート定義
const GAME_STATE = {
    OPENING: 'opening',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_CLEAR: 'levelClear'
};

// ゲーム設定
const gameConfig = {
    canvas: {
        width: 800,
        height: 600,
        scaleFactor: 1.0
    },
    player: {
        lives: 3,
        maxLives: 3,
        score: 0,
        level: 1
    },
    paddle: {
        width: 80,
        height: 15,
        expandedWidth: 120,
        expandDuration: 20000, // ms
        slowDuration: 5000     // ms
    }
};

// ブロック配置設定
const blockLayout = {
    rows: 4,
    cols: 5,
    width: 60,
    height: 20,
    spacing: 10,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    specialBlockRatio: 0.3  // 30%がアイテムブロック
};

// アイテムシステム設定
const itemConfig = {
    types: {
        LIFE_UP: { id: 'hp', image: 'img/hp.png', effect: 'addLife' },
        PADDLE_EXPAND: { id: 'shield', image: 'img/shield.png', effect: 'expandPaddle' },
        BALL_MULTIPLY: { id: 'ball', image: 'img/ball.png', effect: 'multiplyBall' },
        SLOW_PENALTY: { id: 'skull', image: 'img/skull.png', effect: 'slowPaddle' }
    },
    spawnRates: {
        level1: { good: [5,7], penalty: [2,3] },
        levelUp: { goodDecrease: 1, penaltyIncrease: 1, maxPenalty: 6 }
    }
};

// グローバル変数
let currentState;
let gameStarted = false;

// p5.js setup関数 - キャンバス初期化
function setup() {
    // キャンバス作成 (800x600)
    createCanvas(gameConfig.canvas.width, gameConfig.canvas.height);
    
    // 基本設定の初期化
    currentState = GAME_STATE.OPENING;
    gameStarted = false;
    
    console.log("ブロック崩しゲーム初期化完了");
    console.log("キャンバスサイズ:", gameConfig.canvas.width, "x", gameConfig.canvas.height);
}

// p5.js draw関数 - メインゲームループ
function draw() {
    // 背景色設定
    background(240);
    
    // ゲーム状態に応じた処理分岐
    switch(currentState) {
        case GAME_STATE.OPENING:
            drawOpening();
            break;
        case GAME_STATE.PLAYING:
            drawGame();
            break;
        case GAME_STATE.PAUSED:
            drawPaused();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOver();
            break;
        case GAME_STATE.LEVEL_CLEAR:
            drawLevelClear();
            break;
        default:
            drawOpening();
    }
}

// オープニング画面描画
function drawOpening() {
    // 背景
    background(50, 50, 80);
    
    // タイトル
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("BLOCK BREAKER", width/2, height/3);
    
    // 開始指示
    textSize(24);
    text("クリックしてゲーム開始", width/2, height/2 + 50);
    
    // 操作説明
    textSize(16);
    text("マウス移動: パドル操作", width/2, height/2 + 100);
    text("スペース: ポーズ", width/2, height/2 + 120);
}

// ゲーム中画面描画
function drawGame() {
    // 背景
    background(30, 30, 50);
    
    // ゲーム要素描画エリア
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("ゲーム画面", width/2, height/2);
    text("(実装予定)", width/2, height/2 + 30);
    
    // 基本UI表示
    drawUI();
}

// ポーズ画面描画
function drawPaused() {
    // ゲーム画面をそのまま表示
    drawGame();
    
    // ポーズオーバーレイ
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("PAUSED", width/2, height/2);
    textSize(18);
    text("スペースキーで再開", width/2, height/2 + 50);
}

// ゲームオーバー画面描画
function drawGameOver() {
    background(80, 20, 20);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("GAME OVER", width/2, height/3);
    
    textSize(24);
    text("スコア: " + gameConfig.player.score, width/2, height/2);
    text("クリックでリスタート", width/2, height/2 + 50);
}

// レベルクリア画面描画
function drawLevelClear() {
    background(20, 80, 20);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("LEVEL CLEAR!", width/2, height/3);
    
    textSize(24);
    text("レベル " + gameConfig.player.level + " クリア！", width/2, height/2);
    text("クリックで次のレベルへ", width/2, height/2 + 50);
}

// UI描画（スコア、ライフなど）
function drawUI() {
    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    
    // スコア表示
    text("スコア: " + gameConfig.player.score, 10, 10);
    
    // ライフ表示
    text("ライフ: " + gameConfig.player.lives, 10, 30);
    
    // レベル表示
    text("レベル: " + gameConfig.player.level, 10, 50);
}

// マウスクリック処理
function mousePressed() {
    switch(currentState) {
        case GAME_STATE.OPENING:
            // ゲーム開始
            currentState = GAME_STATE.PLAYING;
            gameStarted = true;
            console.log("ゲーム開始");
            break;
        case GAME_STATE.GAME_OVER:
            // リスタート
            resetGame();
            currentState = GAME_STATE.PLAYING;
            console.log("ゲームリスタート");
            break;
        case GAME_STATE.LEVEL_CLEAR:
            // 次のレベルへ
            gameConfig.player.level++;
            currentState = GAME_STATE.PLAYING;
            console.log("レベル " + gameConfig.player.level + " 開始");
            break;
    }
}

// キーボード入力処理
function keyPressed() {
    if (key === ' ') { // スペースキー
        if (currentState === GAME_STATE.PLAYING) {
            currentState = GAME_STATE.PAUSED;
            console.log("ゲームポーズ");
        } else if (currentState === GAME_STATE.PAUSED) {
            currentState = GAME_STATE.PLAYING;
            console.log("ゲーム再開");
        }
    }
}

// ゲームリセット関数
function resetGame() {
    gameConfig.player.lives = 3;
    gameConfig.player.score = 0;
    gameConfig.player.level = 1;
    gameStarted = false;
    console.log("ゲームリセット完了");
}

// 状態遷移関数
function changeGameState(newState) {
    console.log("状態変更:", currentState, "->", newState);
    currentState = newState;
}
