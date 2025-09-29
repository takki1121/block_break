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
let gameStartTime;
let pauseStartTime;
let totalPauseTime = 0;

// ゲーム状態管理システム
const gameStateManager = {
    previousState: null,
    stateHistory: [],
    transitionTimestamp: 0,
    
    // 状態遷移ログ記録
    logTransition(fromState, toState) {
        this.stateHistory.push({
            from: fromState,
            to: toState,
            timestamp: Date.now(),
            gameTime: millis()
        });
        console.log(`状態遷移: ${fromState} → ${toState} (${millis()}ms)`);
    },
    
    // 状態変更
    changeState(newState) {
        if (currentState !== newState) {
            this.logTransition(currentState, newState);
            this.previousState = currentState;
            currentState = newState;
            this.transitionTimestamp = millis();
            this.onStateEnter(newState);
        }
    },
    
    // 状態開始時の処理
    onStateEnter(state) {
        switch(state) {
            case GAME_STATE.PLAYING:
                if (this.previousState === GAME_STATE.PAUSED) {
                    totalPauseTime += millis() - pauseStartTime;
                } else if (this.previousState === GAME_STATE.OPENING) {
                    gameStartTime = millis();
                    totalPauseTime = 0;
                }
                break;
            case GAME_STATE.PAUSED:
                pauseStartTime = millis();
                break;
        }
    },
    
    // 前の状態に戻る
    revertToPreviousState() {
        if (this.previousState) {
            this.changeState(this.previousState);
        }
    }
};

// p5.js setup関数 - キャンバス初期化
function setup() {
    // キャンバス作成 (800x600)
    createCanvas(gameConfig.canvas.width, gameConfig.canvas.height);
    
    // 基本設定の初期化
    currentState = GAME_STATE.OPENING;
    gameStarted = false;
    gameStartTime = 0;
    totalPauseTime = 0;
    
    // フォント設定
    textFont('Delius');
    
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
    // グラデーション背景
    drawGradientBackground([30, 30, 60], [60, 30, 90]);
    
    // タイトルロゴ効果
    drawAnimatedTitle();
    
    // 開始指示（点滅効果）
    if (Math.floor(millis() / 500) % 2 === 0) {
        fill(255, 255, 100);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("クリックしてゲーム開始", width/2, height/2 + 50);
    }
    
    // 操作説明
    fill(200, 200, 255);
    textSize(16);
    text("マウス移動: パドル操作", width/2, height/2 + 100);
    text("スペース: ポーズ", width/2, height/2 + 120);
    
    // バージョン情報
    fill(150);
    textAlign(RIGHT, BOTTOM);
    textSize(12);
    text("v1.0 - Block Breaker Game", width - 10, height - 10);
}

// アニメーションタイトル描画
function drawAnimatedTitle() {
    let time = millis() * 0.001;
    
    fill(255, 100 + 100 * sin(time * 2), 100);
    textAlign(CENTER, CENTER);
    textSize(48 + 8 * sin(time * 3));
    
    // 文字に影効果
    fill(0, 0, 0, 100);
    text("BLOCK BREAKER", width/2 + 3, height/3 + 3);
    
    fill(255, 150 + 100 * sin(time * 2), 100);
    text("BLOCK BREAKER", width/2, height/3);
}

// ゲーム中画面描画
function drawGame() {
    // 背景グラデーション
    drawGradientBackground([20, 20, 40], [40, 20, 60]);
    
    // ゲーム領域の境界線描画
    drawGameBoundaries();
    
    // ゲーム要素描画エリア（プレースホルダー）
    fill(100, 100, 150, 50);
    noStroke();
    rect(50, 100, width - 100, height - 200);
    
    fill(255, 255, 255, 150);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("ゲーム画面", width/2, height/2 - 50);
    text("(フェーズ3で実装予定)", width/2, height/2 - 20);
    
    // ゲーム経過時間表示
    if (gameStartTime > 0) {
        let gameTime = (millis() - gameStartTime - totalPauseTime) / 1000;
        fill(200);
        textAlign(CENTER, TOP);
        textSize(14);
        text("経過時間: " + gameTime.toFixed(1) + "秒", width/2, height/2 + 20);
    }
    
    // 基本UI表示
    drawUI();
    
    // デバッグ情報
    drawDebugInfo();
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
    // UIパネル背景
    fill(0, 0, 0, 100);
    rect(0, 0, width, 80);
    
    // スコア表示（左上）
    fill(255, 255, 100);
    textAlign(LEFT, TOP);
    textSize(18);
    text("スコア", 15, 15);
    textSize(24);
    text(gameConfig.player.score.toString().padStart(6, '0'), 15, 35);
    
    // ライフ表示（右上）
    drawLives();
    
    // レベル表示（右上、ライフの下）
    fill(100, 255, 100);
    textAlign(RIGHT, TOP);
    textSize(16);
    text("レベル " + gameConfig.player.level, width - 15, 50);
    
    // プログレスバー（レベル進行度）
    drawLevelProgress();
}

// ライフ表示（ハート型）
function drawLives() {
    let heartSize = 20;
    let heartSpacing = 25;
    let startX = width - 15 - (gameConfig.player.maxLives * heartSpacing);
    
    for (let i = 0; i < gameConfig.player.maxLives; i++) {
        let x = startX + i * heartSpacing;
        let y = 25;
        
        if (i < gameConfig.player.lives) {
            // 生きているライフ（赤いハート）
            fill(255, 50, 50);
        } else {
            // 失ったライフ（グレーのハート）
            fill(100, 100, 100);
        }
        
        // ハート形状描画
        drawHeart(x, y, heartSize);
    }
}

// ハート形状描画関数
function drawHeart(x, y, size) {
    noStroke();
    let s = size * 0.5;
    
    // ハートの上部（2つの円）
    ellipse(x - s * 0.3, y - s * 0.2, s * 0.8, s * 0.8);
    ellipse(x + s * 0.3, y - s * 0.2, s * 0.8, s * 0.8);
    
    // ハートの下部（三角形）
    triangle(x - s * 0.7, y, x + s * 0.7, y, x, y + s * 0.8);
}

// レベルプログレスバー
function drawLevelProgress() {
    let barWidth = 150;
    let barHeight = 8;
    let barX = width - barWidth - 15;
    let barY = 65;
    
    // プログレスバー背景
    fill(50, 50, 50);
    rect(barX, barY, barWidth, barHeight);
    
    // プログレス（ダミーデータ：スコアベース）
    let progress = (gameConfig.player.score % 1000) / 1000;
    fill(100, 200, 255);
    rect(barX, barY, barWidth * progress, barHeight);
    
    // プログレスバー枠線
    noFill();
    stroke(255);
    strokeWeight(1);
    rect(barX, barY, barWidth, barHeight);
    noStroke();
}

// マウスクリック処理
function mousePressed() {
    switch(currentState) {
        case GAME_STATE.OPENING:
            // ゲーム開始
            gameStateManager.changeState(GAME_STATE.PLAYING);
            gameStarted = true;
            break;
        case GAME_STATE.GAME_OVER:
            // リスタート
            resetGame();
            gameStateManager.changeState(GAME_STATE.PLAYING);
            break;
        case GAME_STATE.LEVEL_CLEAR:
            // 次のレベルへ
            gameConfig.player.level++;
            gameStateManager.changeState(GAME_STATE.PLAYING);
            break;
    }
}

// キーボード入力処理
function keyPressed() {
    if (key === ' ') { // スペースキー
        if (currentState === GAME_STATE.PLAYING) {
            gameStateManager.changeState(GAME_STATE.PAUSED);
        } else if (currentState === GAME_STATE.PAUSED) {
            gameStateManager.changeState(GAME_STATE.PLAYING);
        }
    } else if (key === 'r' || key === 'R') { // リスタートキー
        if (currentState === GAME_STATE.PLAYING || currentState === GAME_STATE.PAUSED) {
            resetGame();
            gameStateManager.changeState(GAME_STATE.PLAYING);
        }
    } else if (key === 'ESC' || keyCode === 27) { // ESCキー
        if (currentState === GAME_STATE.PLAYING || currentState === GAME_STATE.PAUSED) {
            gameStateManager.changeState(GAME_STATE.OPENING);
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

// 補助描画関数群

// グラデーション背景描画
function drawGradientBackground(color1, color2) {
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(color1), color(color2), inter);
        stroke(c);
        line(0, i, width, i);
    }
    noStroke();
}

// ゲーム境界線描画
function drawGameBoundaries() {
    stroke(100, 150, 255);
    strokeWeight(2);
    noFill();
    
    // 上下左右の境界線
    line(10, 90, width - 10, 90);           // 上
    line(10, height - 30, width - 10, height - 30); // 下
    line(10, 90, 10, height - 30);         // 左
    line(width - 10, 90, width - 10, height - 30);  // 右
    
    noStroke();
}

// デバッグ情報表示
function drawDebugInfo() {
    if (keyIsPressed && key === 'd') { // Dキー押下時のみ表示
        fill(0, 0, 0, 150);
        rect(10, height - 120, 200, 80);
        
        fill(255, 255, 0);
        textAlign(LEFT, TOP);
        textSize(12);
        text("デバッグ情報:", 15, height - 115);
        text("現在の状態: " + currentState, 15, height - 100);
        text("フレームレート: " + frameRate().toFixed(1), 15, height - 85);
        text("マウス: (" + mouseX + ", " + mouseY + ")", 15, height - 70);
        text("ゲーム時間: " + ((millis() - gameStartTime - totalPauseTime) / 1000).toFixed(1) + "s", 15, height - 55);
    }
}

// 状態遷移関数（互換性のため残存）
function changeGameState(newState) {
    gameStateManager.changeState(newState);
}
