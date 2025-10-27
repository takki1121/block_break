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

// ゲームオブジェクト
let ball;
let paddle;
let blocks = [];  
let items = [];

// ビジュアルエフェクトシステム（フェーズ7）
let particles = [];
let maxParticles = 50;

// スコアシステム
let highScore = 0;
let scoreMultiplier = 1;

// 入力システム
let inputSystem = {
    currentInputX: 0,
    targetInputX: 0,
    inputSmoothing: 0.15,
    isTouch: false,
    lastTouchTime: 0
};

// UI システム
let uiSystem = {
    pauseButton: { x: 0, y: 0, width: 60, height: 30, visible: true },
    showPauseOverlay: false,
    fadeOpacity: 0,
    transitionProgress: 0
};

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
    
    // 状態変更（視覚効果追加 - フェーズ7）
    changeState(newState) {
        if (currentState !== newState) {
            this.logTransition(currentState, newState);
            this.previousState = currentState;
            currentState = newState;
            this.transitionTimestamp = millis();
            
            // 状態遷移エフェクト生成
            createStateTransitionEffect(newState);
            
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
                    initializeGame();
                } else if (this.previousState === GAME_STATE.LEVEL_CLEAR) {
                    initializeLevel();
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
    
    // スコアシステム初期化
    loadHighScore();
    scoreMultiplier = 1;
    
    // 入力システム初期化
    initializeInputSystem();
    
    // UIシステム初期化
    initializeUISystem();
    
    // レスポンシブ対応初期化
    updateCanvasScale();
    
    // フォント設定
    textFont('Delius');
    
    console.log("ブロック崩しゲーム初期化完了");
    console.log("キャンバスサイズ:", gameConfig.canvas.width, "x", gameConfig.canvas.height);
    console.log("ハイスコア:", highScore);
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

// オープニング画面描画（改良版 - フェーズ6）
function drawOpening() {
    // 動的グラデーション背景
    drawAnimatedBackground();
    
    // メインタイトル表示
    drawMainTitle();
    
    // ハイスコア表示
    drawHighScoreDisplay();
    
    // ゲーム開始メッセージ
    drawStartMessage();
    
    // 操作説明パネル
    drawControlsPanel();
    
    // フッター情報
    drawFooterInfo();
}

// 動的背景
function drawAnimatedBackground() {
    let time = millis() * 0.001;
    let color1 = [30 + 10 * sin(time), 30 + 10 * cos(time * 0.7), 60 + 15 * sin(time * 0.5)];
    let color2 = [60 + 15 * cos(time * 0.3), 30 + 10 * sin(time * 0.9), 90 + 20 * cos(time * 0.4)];
    drawGradientBackground(color1, color2);
}

// メインタイトル
function drawMainTitle() {
    push();
    translate(width/2, height/3);
    
    let time = millis() * 0.001;
    let titleScale = 1 + 0.05 * sin(time * 2);
    scale(titleScale);
    
    // タイトル影効果
    fill(0, 0, 0, 100);
    textAlign(CENTER, CENTER);
    textSize(52);
    text("BLOCK BREAKER", 4, 4);
    
    // メインタイトル
    fill(255, 200 + 50 * sin(time * 3), 100);
    text("BLOCK BREAKER", 0, 0);
    
    // サブタイトル
    fill(200, 200, 255, 200 + 50 * sin(time * 1.5));
    textSize(16);
    text("- Classic Arcade Game -", 0, 40);
    
    pop();
}

// ハイスコア表示
function drawHighScoreDisplay() {
    // ハイスコアパネル
    let panelY = height/3 + 70;
    fill(0, 0, 0, 100);
    rect(width/2 - 120, panelY - 10, 240, 40, 10);
    
    fill(255, 220, 100);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("HIGH SCORE", width/2, panelY);
    
    fill(255, 255, 150);
    textSize(24);
    textFont('monospace');
    text(highScore.toString().padStart(8, '0'), width/2, panelY + 20);
    textFont('Delius');
}

// ゲーム開始メッセージ
function drawStartMessage() {
    if (Math.floor(millis() / 400) % 2 === 0) {
        let messageY = height/2 + 50;
        
        // メッセージ背景
        fill(255, 255, 100, 100);
        rect(width/2 - 130, messageY - 15, 260, 35, 15);
        
        fill(255, 255, 150);
        textAlign(CENTER, CENTER);
        textSize(22);
        
        if (inputSystem.isTouch) {
            text("📱 TAP TO START", width/2, messageY);
        } else {
            text("🖱️ CLICK TO START", width/2, messageY);
        }
    }
}

// 操作説明パネル
function drawControlsPanel() {
    let panelY = height/2 + 120;
    let panelHeight = inputSystem.isTouch ? 80 : 100;
    
    // パネル背景
    fill(40, 40, 80, 150);
    stroke(100, 150, 255, 100);
    strokeWeight(1);
    rect(width/2 - 150, panelY - 10, 300, panelHeight, 10);
    noStroke();
    
    fill(200, 200, 255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("CONTROLS", width/2, panelY + 5);
    
    textSize(12);
    if (inputSystem.isTouch) {
        text("🖐️ Touch & Drag: Move Paddle", width/2, panelY + 25);
        text("👆 Tap: Game Actions", width/2, panelY + 40);
    } else {
        text("🖱️ Mouse: Move Paddle", width/2, panelY + 25);
        text("⌨️ SPACE: Pause", width/2, panelY + 40);
        text("⌨️ R: Restart / ESC: Menu", width/2, panelY + 55);
    }
}

// フッター情報
function drawFooterInfo() {
    fill(150, 150, 200);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text("Block Breaker v1.0 | Made with p5.js", width/2, height - 30);
    
    textAlign(RIGHT, BOTTOM);
    textSize(10);
    text("🎮 Ready Player One", width - 10, height - 10);
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
    
    // ゲームオブジェクトの更新と描画
    updateGameObjects();
    drawGameObjects();
    
    // 基本UI表示
    drawUI();
    
    // デバッグ情報
    drawDebugInfo();
}

// メインゲーム更新関数（フェーズ4実装）
function updateGame() {
    if (!ball || !paddle) return;
    
    // 入力システム更新
    updateInputSystem();
    
    // UIシステム更新
    updateUISystem();
    
    // パーティクルシステム更新（フェーズ7）
    updateParticles();
    
    // ボール更新
    ball.update();
    
    // パドル更新
    paddle.update();
    
    // アイテム更新処理
    updateItems();
    
    // 衝突判定処理
    checkAllCollisions();
    
    // ゲーム状態判定
    checkGameConditions();
}

// ゲームオブジェクト更新（旧関数、互換性のため）
function updateGameObjects() {
    updateGame();
}

// アイテム更新処理
function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].update();
        
        // パドルとの衝突判定
        if (items[i].checkPaddleCollision(paddle)) {
            console.log("アイテム取得:", items[i].type);
            items.splice(i, 1);
            continue;
        }
        
        // 画面外に出たアイテムを削除
        if (items[i].collected) {
            items.splice(i, 1);
        }
    }
}

// 全衝突判定チェック
function checkAllCollisions() {
    // ボール vs パドル衝突判定
    checkBallPaddleCollision();
    
    // ボール vs ブロック衝突判定（改善版）
    checkBallBlockCollisionImproved();
}

// ゲーム条件判定（ライフ、レベルクリア、ゲームオーバー）
function checkGameConditions() {
    // レベルクリア判定
    checkLevelClearCondition();
    
    // ゲームオーバー判定
    checkGameOverCondition();
}

// ゲームオブジェクト描画（エフェクト追加 - フェーズ7）
function drawGameObjects() {
    // ブロック描画
    for (let block of blocks) {
        if (!block.isDestroyed || block.destroyAnimation > 0) {
            block.draw();
        }
    }
    
    // アイテム描画
    for (let item of items) {
        item.draw();
    }
    
    // パドル描画
    if (paddle) paddle.draw();
    
    // ボール描画
    if (ball) ball.draw();
    
    // パーティクル描画（最前面）
    drawParticles();
}

// 衝突判定メイン関数
function checkCollisions() {
    if (!ball || !paddle) return;
    
    // ボール vs パドル衝突判定
    checkBallPaddleCollision();
    
    // ボール vs ブロック衝突判定
    checkBallBlockCollision();
}

// ボール vs パドル衝突判定
function checkBallPaddleCollision() {
    let paddleBounds = paddle.getBounds();
    
    if (ball.position.x + ball.radius > paddleBounds.left &&
        ball.position.x - ball.radius < paddleBounds.right &&
        ball.position.y + ball.radius > paddleBounds.top &&
        ball.position.y - ball.radius < paddleBounds.bottom &&
        ball.velocity.vy > 0) { // 下向きの時のみ
        
        // 反射角度計算（パドルのどの部分に当たったかで変わる）
        let hitPos = (ball.position.x - paddle.position.x) / (paddle.width / 2);
        hitPos = constrain(hitPos, -1, 1);
        
        // 新しい速度設定
        ball.velocity.vx = hitPos * 4; // 横方向の速度
        ball.velocity.vy = -Math.abs(ball.velocity.vy); // 上向きに反射
        
        // ボールがパドルに埋まらないように位置調整
        ball.position.y = paddleBounds.top - ball.radius;
    }
}

// ボール vs ブロック衝突判定（改善版）
function checkBallBlockCollisionImproved() {
    let collisionDetected = false;
    
    for (let i = 0; i < blocks.length && !collisionDetected; i++) {
        let block = blocks[i];
        if (block.isDestroyed) continue;
        
        let bounds = block.getBounds();
        
        // より精密な矩形 vs 円の衝突判定
        if (isCircleRectCollision(ball.position.x, ball.position.y, ball.radius, bounds)) {
            
            // 衝突面の正確な判定
            let collision = getCollisionSide(ball.position.x, ball.position.y, ball.radius, bounds);
            
            // 反射処理
            if (collision.horizontal) {
                ball.velocity.vx = -ball.velocity.vx;
                // ボール位置補正
                if (collision.side === 'left') {
                    ball.position.x = bounds.left - ball.radius;
                } else if (collision.side === 'right') {
                    ball.position.x = bounds.right + ball.radius;
                }
            }
            
            if (collision.vertical) {
                ball.velocity.vy = -ball.velocity.vy;
                // ボール位置補正
                if (collision.side === 'top') {
                    ball.position.y = bounds.top - ball.radius;
                } else if (collision.side === 'bottom') {
                    ball.position.y = bounds.bottom + ball.radius;
                }
            }
            
            // ブロック破壊処理
            if (block.destroy()) {
                console.log("ブロック破壊 - スコア:", gameConfig.player.score);
                collisionDetected = true; // 重要: 一度に一つのブロックのみ処理
            }
        }
    }
}

// 円と矩形の衝突判定
function isCircleRectCollision(circleX, circleY, radius, rect) {
    // 最も近い点を見つける
    let closestX = constrain(circleX, rect.left, rect.right);
    let closestY = constrain(circleY, rect.top, rect.bottom);
    
    // 距離を計算
    let distanceX = circleX - closestX;
    let distanceY = circleY - closestY;
    let distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < (radius * radius);
}

// 衝突面判定
function getCollisionSide(circleX, circleY, radius, rect) {
    let result = { horizontal: false, vertical: false, side: '' };
    
    // 中心位置での判定
    let centerX = rect.left + (rect.right - rect.left) / 2;
    let centerY = rect.top + (rect.bottom - rect.top) / 2;
    
    let dx = circleX - centerX;
    let dy = circleY - centerY;
    
    let width = (rect.right - rect.left) / 2;
    let height = (rect.bottom - rect.top) / 2;
    
    let crossWidth = width * dy;
    let crossHeight = height * dx;
    
    if (Math.abs(crossWidth) > Math.abs(crossHeight)) {
        // 上下の衝突
        result.vertical = true;
        result.side = crossWidth > 0 ? 'bottom' : 'top';
    } else {
        // 左右の衝突
        result.horizontal = true;
        result.side = crossHeight > 0 ? 'right' : 'left';
    }
    
    return result;
}

// 旧関数（互換性のため）
function checkBallBlockCollision() {
    checkBallBlockCollisionImproved();
}

// レベルクリア判定（改善版）
function checkLevelClearCondition() {
    let remainingBlocks = blocks.filter(block => !block.isDestroyed).length;
    
    if (remainingBlocks === 0) {
        // レベルクリア処理
        onLevelClear();
    }
}

// レベルクリア処理
function onLevelClear() {
    gameConfig.player.level++;
    
    // レベルクリアスコア（改善版）
    let earnedScore = scoreSystem.onLevelClear();
    
    console.log("レベルクリア! レベル", gameConfig.player.level, "獲得スコア:", earnedScore, "総スコア:", gameConfig.player.score);
    
    // ハイスコア更新チェック
    let isNewRecord = updateHighScore();
    if (isNewRecord) {
        console.log("新ハイスコア達成!");
    }
    
    gameStateManager.changeState(GAME_STATE.LEVEL_CLEAR);
}

// ゲームオーバー判定
function checkGameOverCondition() {
    if (gameConfig.player.lives <= 0) {
        onGameOver();
    }
}

// ゲームオーバー処理
function onGameOver() {
    console.log("ゲームオーバー - 最終スコア:", gameConfig.player.score);
    
    // ハイスコア更新チェック
    updateHighScore();
    
    gameStateManager.changeState(GAME_STATE.GAME_OVER);
}

// ライフ減少処理
function loseLife() {
    gameConfig.player.lives--;
    console.log("ライフ減少 - 残り:", gameConfig.player.lives);
    
    if (gameConfig.player.lives <= 0) {
        onGameOver();
    } else {
        // ボールリセット
        if (ball) ball.reset();
    }
}

// 旧関数（互換性のため）
function checkLevelClear() {
    checkLevelClearCondition();
}

// ポーズ画面描画（改良版）
function drawPaused() {
    // ゲーム画面をそのまま表示
    drawGame();
    
    // ポーズオーバーレイ表示
    drawPauseOverlay();
}

// ポーズオーバーレイ描画
function drawPauseOverlay() {
    // 背景ブラー効果
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    // ポーズメニューパネル
    let panelWidth = 300;
    let panelHeight = 200;
    let panelX = (width - panelWidth) / 2;
    let panelY = (height - panelHeight) / 2;
    
    // パネル背景
    fill(40, 40, 60, 220);
    stroke(100, 150, 255);
    strokeWeight(2);
    rect(panelX, panelY, panelWidth, panelHeight, 15);
    noStroke();
    
    // パネル内容
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("PAUSED", width/2, panelY + 50);
    
    // 操作説明
    textSize(16);
    fill(200, 200, 255);
    if (inputSystem.isTouch) {
        text("タップで再開", width/2, panelY + 100);
        text("画面タップでメニュー操作", width/2, panelY + 120);
    } else {
        text("スペースキーで再開", width/2, panelY + 100);
        text("ESC: メニューに戻る", width/2, panelY + 120);
        text("R: ゲームリスタート", width/2, panelY + 140);
    }
    
    // 点滅する再開指示
    if (Math.floor(millis() / 300) % 2 === 0) {
        fill(255, 255, 100);
        textSize(18);
        text("▶ RESUME", width/2, panelY + 165);
    }
}

// ゲームオーバー画面描画（改良版 - フェーズ6）
function drawGameOver() {
    // 動的背景
    drawGameOverBackground();
    
    // メインタイトル
    drawGameOverTitle();
    
    // スコア情報パネル
    drawScoreInfoPanel();
    
    // 統計情報
    drawGameStats();
    
    // リスタートメッセージ
    drawRestartMessage();
}

// ゲームオーバー背景
function drawGameOverBackground() {
    let time = millis() * 0.0005;
    let color1 = [80 + 20 * sin(time), 20, 20];
    let color2 = [40, 20 + 10 * cos(time), 40];
    drawGradientBackground(color1, color2);
    
    // パーティクル風効果
    for (let i = 0; i < 20; i++) {
        let x = (millis() * 0.05 + i * 40) % (width + 50);
        let y = 50 + i * 25;
        fill(255, 100, 100, 30);
        ellipse(x, y, 3, 3);
    }
}

// ゲームオーバータイトル
function drawGameOverTitle() {
    push();
    translate(width/2, height/3);
    
    let pulseScale = 1 + 0.1 * sin(millis() * 0.003);
    scale(pulseScale);
    
    // 影効果
    fill(0, 0, 0, 150);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("GAME OVER", 3, 3);
    
    // メインテキスト
    fill(255, 100, 100);
    text("GAME OVER", 0, 0);
    
    pop();
}

// スコア情報パネル
function drawScoreInfoPanel() {
    let panelY = height/2 - 40;
    let panelWidth = 350;
    let panelHeight = 120;
    let panelX = (width - panelWidth) / 2;
    
    // パネル背景
    fill(20, 20, 40, 200);
    stroke(100, 100, 150);
    strokeWeight(2);
    rect(panelX, panelY, panelWidth, panelHeight, 15);
    noStroke();
    
    // 最終スコア
    fill(255, 255, 150);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("FINAL SCORE", width/2, panelY + 25);
    
    fill(255, 255, 100);
    textSize(32);
    textFont('monospace');
    text(gameConfig.player.score.toString().padStart(8, '0'), width/2, panelY + 50);
    textFont('Delius');
    
    // ハイスコア比較
    if (gameConfig.player.score >= highScore) {
        fill(255, 255, 100);
        textSize(20);
        text("🏆 NEW HIGH SCORE! 🏆", width/2, panelY + 85);
        
        // きらきら効果
        for (let i = 0; i < 5; i++) {
            let sparkleX = width/2 + random(-100, 100);
            let sparkleY = panelY + 85 + random(-20, 20);
            fill(255, 255, 100, random(100, 255));
            ellipse(sparkleX, sparkleY, random(2, 6));
        }
    } else {
        fill(200, 200, 200);
        textSize(16);
        text("High Score: " + highScore.toString().padStart(8, '0'), width/2, panelY + 85);
    }
}

// ゲーム統計
function drawGameStats() {
    let statsY = height/2 + 100;
    
    fill(150, 255, 150);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("📊 GAME STATISTICS", width/2, statsY);
    
    textSize(14);
    fill(200, 255, 200);
    text("Level Reached: " + gameConfig.player.level, width/2, statsY + 25);
    
    // プレイ時間計算
    let playTime = ((millis() - gameStartTime - totalPauseTime) / 1000).toFixed(1);
    text("Play Time: " + playTime + "s", width/2, statsY + 45);
    
    // スコア効率
    if (playTime > 0) {
        let efficiency = (gameConfig.player.score / parseFloat(playTime)).toFixed(1);
        text("Score/sec: " + efficiency, width/2, statsY + 65);
    }
}

// リスタートメッセージ
function drawRestartMessage() {
    if (Math.floor(millis() / 600) % 2 === 0) {
        let messageY = height - 80;
        
        // メッセージ背景
        fill(255, 255, 255, 50);
        rect(width/2 - 100, messageY - 15, 200, 35, 15);
        
        fill(255, 255, 150);
        textAlign(CENTER, CENTER);
        textSize(18);
        
        if (inputSystem.isTouch) {
            text("📱 TAP TO RESTART", width/2, messageY);
        } else {
            text("🖱️ CLICK TO RESTART", width/2, messageY);
        }
    }
}

// レベルクリア画面描画
function drawLevelClear() {
    background(20, 80, 20);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("LEVEL CLEAR!", width/2, height/3);
    
    // レベル情報
    textSize(24);
    text("レベル " + (gameConfig.player.level - 1) + " クリア！", width/2, height/2 - 20);
    
    // スコア情報
    fill(255, 255, 100);
    textSize(20);
    text("現在のスコア: " + gameConfig.player.score.toString().padStart(6, '0'), width/2, height/2 + 10);
    
    // マルチプライヤー情報
    let multiplier = scoreSystem.calculateMultiplier();
    if (multiplier > 1) {
        fill(255, 200, 100);
        textSize(16);
        text("スコア倍率: x" + multiplier, width/2, height/2 + 35);
    }
    
    // 次レベル指示（デバイス対応）
    fill(255);
    textSize(20);
    if (inputSystem.isTouch) {
        text("タップで次のレベルへ", width/2, height/2 + 70);
    } else {
        text("クリックで次のレベルへ", width/2, height/2 + 70);
    }
}

// HUD描画システム（改良版 - フェーズ6）
function drawUI() {
    // HUD背景パネル
    drawHUDBackground();
    
    // 基本HUD要素
    drawScoreDisplay();
    drawLivesDisplay(); 
    drawLevelDisplay();
    drawPauseButton();
    
    // 補助情報
    drawLevelProgress();
    drawScoreMultiplier();
}

// HUD背景描画
function drawHUDBackground() {
    // グラデーション背景
    for (let i = 0; i < 80; i++) {
        let alpha = map(i, 0, 80, 120, 0);
        stroke(0, 0, 0, alpha);
        line(0, i, width, i);
    }
    noStroke();
    
    // 区切り線
    stroke(100, 150, 255, 150);
    strokeWeight(2);
    line(0, 78, width, 78);
    noStroke();
}

// スコア表示（左上）
function drawScoreDisplay() {
    // スコアラベル
    fill(255, 255, 150);
    textAlign(LEFT, TOP);
    textSize(14);
    text("SCORE", 15, 12);
    
    // スコア値
    fill(255, 255, 100);
    textSize(24);
    textFont('monospace'); // 固定幅フォント
    text(gameConfig.player.score.toString().padStart(8, '0'), 15, 28);
    textFont('Delius'); // 元のフォントに戻す
    
    // スコア増加アニメーション用の背景
    if (gameConfig.player.score > 0) {
        let pulseAlpha = 30 + 20 * sin(millis() * 0.01);
        fill(255, 255, 0, pulseAlpha);
        noStroke();
        rect(12, 25, 150, 30, 5);
    }
}

// ライフ表示（右上）
function drawLivesDisplay() {
    // ライフラベル
    fill(255, 150, 150);
    textAlign(RIGHT, TOP);
    textSize(14);
    text("LIVES", width - 15, 12);
    
    // ハート描画
    let heartSize = 18;
    let heartSpacing = 22;
    let startX = width - 15 - (gameConfig.player.maxLives * heartSpacing);
    
    for (let i = 0; i < gameConfig.player.maxLives; i++) {
        let x = startX + i * heartSpacing;
        let y = 35;
        
        if (i < gameConfig.player.lives) {
            // 生きているライフ（赤いハート）
            fill(255, 80, 80);
            // ライフ減少時の点滅効果
            if (gameConfig.player.lives <= 1) {
                let pulseAlpha = 150 + 100 * sin(millis() * 0.02);
                fill(255, 80, 80, pulseAlpha);
            }
        } else {
            // 失ったライフ（グレーのハート）
            fill(100, 100, 100, 150);
        }
        
        drawHeart(x, y, heartSize);
    }
}

// レベル表示（右上、ライフの下）
function drawLevelDisplay() {
    fill(150, 255, 150);
    textAlign(RIGHT, TOP);
    textSize(16);
    text("LEVEL " + gameConfig.player.level, width - 15, 58);
    
    // レベル背景装飾
    fill(100, 200, 100, 30);
    noStroke();
    rect(width - 120, 55, 100, 20, 10);
}

// ポーズボタン描画
function drawPauseButton() {
    if (!uiSystem.pauseButton.visible || currentState !== GAME_STATE.PLAYING) return;
    
    let btn = uiSystem.pauseButton;
    
    // ボタン背景
    fill(50, 50, 50, 180);
    stroke(150, 150, 200);
    strokeWeight(1);
    rect(btn.x, btn.y, btn.width, btn.height, 5);
    
    // ポーズアイコン（二本の縦線）
    fill(200, 200, 255);
    noStroke();
    rect(btn.x + 18, btn.y + 8, 4, 14);
    rect(btn.x + 26, btn.y + 8, 4, 14);
    
    // ホバー効果
    if (isMouseOverPauseButton()) {
        fill(255, 255, 255, 50);
        rect(btn.x, btn.y, btn.width, btn.height, 5);
    }
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

// スコア倍率表示
function drawScoreMultiplier() {
    let multiplier = scoreSystem.calculateMultiplier();
    
    if (multiplier > 1) {
        fill(255, 200, 100);
        textAlign(RIGHT, TOP);
        textSize(14);
        text("倍率: x" + multiplier, width - 15, 15);
    }
    
    // ハイスコア表示
    if (gameConfig.player.score > 0) {
        fill(200, 200, 200);
        textAlign(CENTER, TOP);
        textSize(12);
        text("ハイスコア: " + highScore, width/2, 15);
    }
}

// 旧マウスクリック処理（互換性のため残存）
// 実際の処理は新しい入力システムで行われる

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

// ゲーム初期化
function initializeGame() {
    // ゲームオブジェクト作成
    ball = new Ball();
    paddle = new Paddle();
    items = [];
    
    // ブロック生成
    generateBlocks();
    
    console.log("ゲーム初期化完了 - レベル", gameConfig.player.level);
}

// レベル初期化（レベルアップ時）
function initializeLevel() {
    // ボールとパドルリセット
    if (ball) ball.reset();
    if (paddle) {
        paddle.position.x = width/2;
        paddle.isExpanded = false;
        paddle.isSlowed = false;
        paddle.width = gameConfig.paddle.width;
    }
    
    // アイテムクリア
    items = [];
    
    // 新しいブロック生成
    generateBlocks();
    
    console.log("レベル", gameConfig.player.level, "初期化完了");
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
        rect(10, height - 160, 250, 120);
        
        fill(255, 255, 0);
        textAlign(LEFT, TOP);
        textSize(12);
        text("デバッグ情報:", 15, height - 155);
        text("現在の状態: " + currentState, 15, height - 140);
        text("フレームレート: " + frameRate().toFixed(1), 15, height - 125);
        text("入力位置: " + inputSystem.currentInputX.toFixed(1), 15, height - 110);
        text("入力デバイス: " + (inputSystem.isTouch ? "タッチ" : "マウス"), 15, height - 95);
        text("スケール: " + gameConfig.canvas.scaleFactor.toFixed(2), 15, height - 80);
        text("ゲーム時間: " + ((millis() - gameStartTime - totalPauseTime) / 1000).toFixed(1) + "s", 15, height - 65);
        
        if (paddle) {
            text("パドル位置: " + paddle.position.x.toFixed(1), 15, height - 50);
        }
    }
}

// 状態遷移関数（互換性のため残存）
function changeGameState(newState) {
    gameStateManager.changeState(newState);
}

// =============================================================================
// 入力システム実装（フェーズ5）
// =============================================================================

// PC入力対応 - マウス移動処理
function mouseMoved() {
    // タッチデバイスでない場合のみ処理
    if (!inputSystem.isTouch) {
        updateInputPosition(mouseX);
    }
    return false; // デフォルト動作防止
}

// PC入力対応 - マウスクリック処理（改善版）
function mousePressed() {
    // タッチデバイスでない場合のみ処理
    if (!inputSystem.isTouch) {
        handleGameInput();
    }
    return false;
}

// モバイル入力対応 - タッチ移動処理
function touchMoved() {
    inputSystem.isTouch = true;
    inputSystem.lastTouchTime = millis();
    
    if (touches.length > 0) {
        // 最初のタッチポイントを使用
        updateInputPosition(touches[0].x);
    }
    
    return false; // デフォルトタッチ動作の無効化
}

// モバイル入力対応 - タッチ開始処理
function touchStarted() {
    inputSystem.isTouch = true;
    inputSystem.lastTouchTime = millis();
    
    if (touches.length > 0) {
        updateInputPosition(touches[0].x);
        handleGameInput();
    }
    
    return false; // デフォルトタッチ動作の無効化
}

// タッチ終了処理
function touchEnded() {
    return false;
}

// 入力座標の正規化処理
function updateInputPosition(rawX) {
    // スケールファクターを考慮した座標変換
    let normalizedX = rawX / gameConfig.canvas.scaleFactor;
    
    // パドル移動範囲の制限
    let paddleHalfWidth = paddle ? paddle.width / 2 : gameConfig.paddle.width / 2;
    inputSystem.targetInputX = constrain(normalizedX, 
        10 + paddleHalfWidth, 
        gameConfig.canvas.width - 10 - paddleHalfWidth
    );
}

// 統一されたゲーム入力処理
function handleGameInput() {
    // ポーズボタンのクリック判定
    if (currentState === GAME_STATE.PLAYING && isMouseOverPauseButton()) {
        gameStateManager.changeState(GAME_STATE.PAUSED);
        return;
    }
    
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
        case GAME_STATE.PAUSED:
            // ポーズ解除
            gameStateManager.changeState(GAME_STATE.PLAYING);
            break;
    }
}

// 入力システム更新
function updateInputSystem() {
    // スムーズな入力補間
    inputSystem.currentInputX = lerp(
        inputSystem.currentInputX, 
        inputSystem.targetInputX, 
        inputSystem.inputSmoothing
    );
    
    // タッチデバイス判定の自動リセット（5秒後）
    if (inputSystem.isTouch && millis() - inputSystem.lastTouchTime > 5000) {
        inputSystem.isTouch = false;
    }
}

// =============================================================================
// スコアシステム実装（フェーズ4）
// =============================================================================

// ハイスコア読み込み
function loadHighScore() {
    let savedScore = localStorage.getItem('blockBreakerHighScore');
    if (savedScore !== null) {
        highScore = parseInt(savedScore);
    } else {
        highScore = 0;
    }
}

// ハイスコア保存
function saveHighScore() {
    localStorage.setItem('blockBreakerHighScore', highScore.toString());
    console.log("ハイスコア保存:", highScore);
}

// ハイスコア更新
function updateHighScore() {
    if (gameConfig.player.score > highScore) {
        let oldHighScore = highScore;
        highScore = gameConfig.player.score;
        saveHighScore();
        console.log("新ハイスコア!", oldHighScore, "→", highScore);
        return true; // 新記録
    }
    return false;
}

// スコア計算システム
const scoreSystem = {
    // 基本スコア
    blockDestroy: 10,
    levelClear: 100,
    lifeBonus: 50,
    
    // マルチプライヤー
    calculateMultiplier() {
        return Math.floor(gameConfig.player.level / 5) + 1;
    },
    
    // スコア加算
    addScore(baseScore, useMultiplier = true) {
        let finalScore = baseScore;
        if (useMultiplier) {
            finalScore *= this.calculateMultiplier();
        }
        gameConfig.player.score += finalScore;
        return finalScore;
    },
    
    // ブロック破壊スコア
    onBlockDestroy(blockType = 'normal') {
        let baseScore = this.blockDestroy;
        if (blockType === 'special') {
            baseScore *= 2;
        }
        return this.addScore(baseScore);
    },
    
    // レベルクリアスコア
    onLevelClear() {
        let baseScore = this.levelClear;
        // 残りライフボーナス
        let lifeBonus = (gameConfig.player.lives - 1) * this.lifeBonus;
        return this.addScore(baseScore + lifeBonus);
    }
};

// =============================================================================
// レスポンシブ対応・入力システム初期化
// =============================================================================

// 入力システム初期化
function initializeInputSystem() {
    inputSystem.currentInputX = gameConfig.canvas.width / 2;
    inputSystem.targetInputX = gameConfig.canvas.width / 2;
    inputSystem.isTouch = false;
    inputSystem.lastTouchTime = 0;
    
    // タッチデバイス検出
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        inputSystem.isTouch = true;
        console.log("タッチデバイス検出");
    }
}

// スケールファクター計算
function calculateScaleFactor() {
    const scaleX = windowWidth / gameConfig.canvas.width;
    const scaleY = windowHeight / gameConfig.canvas.height;
    return Math.min(scaleX, scaleY, 1.0);
}

// キャンバススケール更新
function updateCanvasScale() {
    gameConfig.canvas.scaleFactor = calculateScaleFactor();
    
    // キャンバスサイズ調整
    let newWidth = gameConfig.canvas.width * gameConfig.canvas.scaleFactor;
    let newHeight = gameConfig.canvas.height * gameConfig.canvas.scaleFactor;
    
    if (canvas) {
        resizeCanvas(newWidth, newHeight);
    }
    
    console.log("キャンバススケール更新:", gameConfig.canvas.scaleFactor);
}

// ウィンドウリサイズ処理
function windowResized() {
    updateCanvasScale();
    updateUIPositions(); // UI要素の位置も更新
}

// デバイス向き変更処理
function deviceTurned() {
    setTimeout(() => {
        updateCanvasScale();
        updateUIPositions(); // UI要素の位置も更新
    }, 100); // 少し遅延させて正確なサイズを取得
}

// =============================================================================
// UIシステム実装（フェーズ6）
// =============================================================================

// UIシステム初期化
function initializeUISystem() {
    updateUIPositions();
    uiSystem.showPauseOverlay = false;
    uiSystem.fadeOpacity = 0;
    uiSystem.transitionProgress = 0;
}

// UI要素位置更新
function updateUIPositions() {
    // ポーズボタンの位置設定
    uiSystem.pauseButton.x = width - 70;
    uiSystem.pauseButton.y = 10;
    uiSystem.pauseButton.width = 55;
    uiSystem.pauseButton.height = 25;
}

// ポーズボタンマウスオーバー判定
function isMouseOverPauseButton() {
    if (!uiSystem.pauseButton.visible || currentState !== GAME_STATE.PLAYING) {
        return false;
    }
    
    let btn = uiSystem.pauseButton;
    let checkX = inputSystem.isTouch ? touches[0]?.x || 0 : mouseX;
    let checkY = inputSystem.isTouch ? touches[0]?.y || 0 : mouseY;
    
    return checkX >= btn.x && checkX <= btn.x + btn.width && 
           checkY >= btn.y && checkY <= btn.y + btn.height;
}

// UI更新処理（視覚効果追加 - フェーズ7）
function updateUISystem() {
    // フェード効果の更新
    if (currentState === GAME_STATE.PAUSED) {
        uiSystem.fadeOpacity = lerp(uiSystem.fadeOpacity, 255, 0.1);
    } else {
        uiSystem.fadeOpacity = lerp(uiSystem.fadeOpacity, 0, 0.1);
    }
    
    // 状態遷移アニメーションの更新
    uiSystem.transitionProgress += 0.02;
    if (uiSystem.transitionProgress > TWO_PI) {
        uiSystem.transitionProgress = 0;
    }
    
    // UI エフェクト生成
    generateUIEffects();
}

// UI視覚効果生成
function generateUIEffects() {
    // ライフが少ない時の警告エフェクト
    if (currentState === GAME_STATE.PLAYING && gameConfig.player.lives === 1) {
        if (frameCount % 30 === 0) {
            createParticle(
                width - 50 + random(-10, 10),
                35 + random(-5, 5),
                random(-1, 1),
                random(-0.5, 0.5),
                [255, 100, 100],
                40,
                4,
                'sparkle'
            );
        }
    }
    
    // スコア更新時のエフェクト
    if (currentState === GAME_STATE.PLAYING && frameCount % 60 === 0 && gameConfig.player.score > 0) {
        if (random(100) < 20) { // 20%の確率
            createParticle(
                100 + random(-20, 20),
                45 + random(-5, 5),
                random(-0.5, 0.5),
                random(-1, 0),
                [255, 255, 150],
                25,
                3,
                'sparkle'
            );
        }
    }
}

// 状態遷移時のアニメーション
function createStateTransitionEffect(newState) {
    let centerX = width / 2;
    let centerY = height / 2;
    
    switch(newState) {
        case GAME_STATE.LEVEL_CLEAR:
            // レベルクリア時の花火エフェクト
            for (let i = 0; i < 20; i++) {
                let angle = random(TWO_PI);
                let speed = random(3, 8);
                
                createParticle(
                    centerX, centerY,
                    cos(angle) * speed,
                    sin(angle) * speed,
                    [random(200, 255), random(200, 255), random(100, 255)],
                    random(40, 60),
                    random(4, 8),
                    'explosion'
                );
            }
            break;
            
        case GAME_STATE.GAME_OVER:
            // ゲームオーバー時の落下エフェクト
            for (let i = 0; i < 15; i++) {
                createParticle(
                    random(width),
                    0,
                    random(-1, 1),
                    random(1, 3),
                    [100, 100, 150],
                    random(60, 80),
                    random(3, 6),
                    'normal'
                );
            }
            break;
    }
}

// =============================================================================
// ゲームオブジェクトクラス
// =============================================================================

// Ballクラス - ボール管理
class Ball {
    constructor(x, y, vx, vy) {
        this.position = { x: x || width/2, y: y || height - 100 };
        this.velocity = { vx: vx || 3, vy: vy || -3 };
        this.radius = 8;
        this.trail = []; // 残像効果用
        this.maxTrailLength = 8;
        this.color = color(255, 255, 100);
    }
    
    // ボール位置更新
    update() {
        // 残像追加
        this.trail.push({ x: this.position.x, y: this.position.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 位置更新
        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;
        
        // 壁衝突判定
        this.checkWallCollision();
    }
    
    // ボール描画（改良版 - フェーズ7）
    draw() {
        // 改良された残像描画
        this.drawTrail();
        
        // メインボール描画
        this.drawMainBall();
        
        // 動的軌跡パーティクル生成
        if (frameCount % 3 === 0) {
            createParticle(
                this.position.x + random(-2, 2),
                this.position.y + random(-2, 2),
                random(-0.5, 0.5),
                random(-0.5, 0.5),
                [255, 255, 150],
                15,
                3,
                'trail'
            );
        }
    }
    
    // 残像描画
    drawTrail() {
        for (let i = 0; i < this.trail.length; i++) {
            let progress = i / (this.trail.length - 1);
            let alpha = map(progress, 0, 1, 20, 180);
            let size = map(progress, 0, 1, this.radius * 0.2, this.radius * 0.9);
            
            // グラデーション効果
            let r = 255;
            let g = 255 - (100 * (1 - progress));
            let b = 100 + (100 * progress);
            
            fill(r, g, b, alpha);
            noStroke();
            ellipse(this.trail[i].x, this.trail[i].y, size * 2);
        }
    }
    
    // メインボール描画
    drawMainBall() {
        push();
        translate(this.position.x, this.position.y);
        
        // 外側のグロー効果
        for (let i = 0; i < 3; i++) {
            fill(255, 255, 100, 30 - i * 10);
            noStroke();
            ellipse(0, 0, (this.radius + i * 2) * 2);
        }
        
        // メインボール
        fill(this.color);
        stroke(255, 255, 255, 200);
        strokeWeight(2);
        ellipse(0, 0, this.radius * 2);
        
        // 内部ハイライト
        fill(255, 255, 255, 180);
        noStroke();
        ellipse(-2, -2, this.radius * 0.8);
        
        // 中心の輝き
        fill(255, 255, 255, 100);
        ellipse(0, 0, this.radius * 0.4);
        
        pop();
    }
    
    // 壁衝突判定と反射処理
    checkWallCollision() {
        let bounced = false;
        
        // 左右の壁
        if (this.position.x - this.radius <= 10) {
            this.position.x = 10 + this.radius;
            this.velocity.vx = Math.abs(this.velocity.vx);
            bounced = true;
        } else if (this.position.x + this.radius >= width - 10) {
            this.position.x = width - 10 - this.radius;
            this.velocity.vx = -Math.abs(this.velocity.vx);
            bounced = true;
        }
        
        // 上の壁
        if (this.position.y - this.radius <= 90) {
            this.position.y = 90 + this.radius;
            this.velocity.vy = Math.abs(this.velocity.vy);
            bounced = true;
        }
        
        // 下の壁（ライフ減少）
        if (this.position.y - this.radius >= height - 30) {
            this.onBottomHit();
        }
        
        return bounced;
    }
    
    // 底に到達した時の処理
    onBottomHit() {
        loseLife(); // 改善されたライフ減少処理を使用
    }
    
    // ボールリセット
    reset() {
        this.position.x = width/2;
        this.position.y = height - 100;
        this.velocity.vx = random(-3, 3);
        this.velocity.vy = -3;
        this.trail = [];
    }
}

// Paddleクラス - パドル管理
class Paddle {
    constructor(x, y) {
        this.position = { x: x || width/2, y: y || height - 50 };
        this.width = gameConfig.paddle.width;
        this.height = gameConfig.paddle.height;
        this.isExpanded = false;
        this.isSlowed = false;
        this.expandTimer = 0;
        this.slowTimer = 0;
        this.baseSpeed = 1.0;
        this.color = color(100, 200, 255);
    }
    
    // パドル更新（入力システム対応）
    update() {
        // 統一入力システムから位置取得
        let targetX = inputSystem.currentInputX;
        
        // 速度制限適用
        let speed = this.baseSpeed;
        if (this.isSlowed) speed *= 0.5;
        
        // 入力デバイスに応じた応答性調整
        let responsiveness = inputSystem.isTouch ? 0.25 : 0.15;
        this.position.x = lerp(this.position.x, targetX, responsiveness * speed);
        
        // 効果時間管理
        if (this.isExpanded) {
            this.expandTimer--;
            if (this.expandTimer <= 0) {
                this.isExpanded = false;
                this.width = gameConfig.paddle.width;
            }
        }
        
        if (this.isSlowed) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
            }
        }
    }
    
    // パドル描画
    draw() {
        let paddleColor = this.color;
        
        // 効果に応じて色変更
        if (this.isExpanded) {
            paddleColor = color(100, 255, 100); // 緑色（拡大中）
        } else if (this.isSlowed) {
            paddleColor = color(255, 100, 100); // 赤色（速度低下中）
        }
        
        // パドル本体
        fill(paddleColor);
        stroke(255);
        strokeWeight(2);
        rectMode(CENTER);
        rect(this.position.x, this.position.y, this.width, this.height, 5);
        
        // パドル上部のハイライト
        fill(255, 255, 255, 100);
        noStroke();
        rect(this.position.x, this.position.y - 2, this.width - 4, 3, 3);
        
        // 効果時間表示
        if (this.isExpanded || this.isSlowed) {
            this.drawEffectTimer();
        }
    }
    
    // 効果時間バー描画
    drawEffectTimer() {
        let barWidth = this.width;
        let barHeight = 3;
        let barY = this.position.y + this.height/2 + 8;
        
        // 背景バー
        fill(50, 50, 50);
        noStroke();
        rectMode(CENTER);
        rect(this.position.x, barY, barWidth, barHeight);
        
        // 進行バー
        let progress = 0;
        let effectColor = color(255);
        
        if (this.isExpanded) {
            progress = this.expandTimer / (gameConfig.paddle.expandDuration / 16.67); // 60FPS換算
            effectColor = color(100, 255, 100);
        } else if (this.isSlowed) {
            progress = this.slowTimer / (gameConfig.paddle.slowDuration / 16.67);
            effectColor = color(255, 100, 100);
        }
        
        fill(effectColor);
        rect(this.position.x - barWidth/2 + (barWidth * progress)/2, barY, barWidth * progress, barHeight);
    }
    
    // パドル拡大効果
    expandPaddle() {
        this.isExpanded = true;
        this.width = gameConfig.paddle.expandedWidth;
        this.expandTimer = gameConfig.paddle.expandDuration / 16.67; // フレーム数に変換
    }
    
    // パドル速度低下効果
    slowPaddle() {
        this.isSlowed = true;
        this.slowTimer = gameConfig.paddle.slowDuration / 16.67; // フレーム数に変換
    }
    
    // 境界取得（衝突判定用）
    getBounds() {
        return {
            left: this.position.x - this.width/2,
            right: this.position.x + this.width/2,
            top: this.position.y - this.height/2,
            bottom: this.position.y + this.height/2
        };
    }
}

// Blockクラス - ブロック管理
class Block {
    constructor(x, y, color, isSpecial = false, itemType = null) {
        this.position = { x, y };
        this.width = blockLayout.width;
        this.height = blockLayout.height;
        this.color = color;
        this.isSpecial = isSpecial;
        this.itemType = itemType;
        this.isDestroyed = false;
        this.destroyAnimation = 0;
    }
    
    // ブロック描画
    draw() {
        if (this.isDestroyed && this.destroyAnimation <= 0) return;
        
        push();
        translate(this.position.x, this.position.y);
        
        if (this.destroyAnimation > 0) {
            // 破壊アニメーション
            let scaleValue = map(this.destroyAnimation, 30, 0, 1, 0);
            let alpha = map(this.destroyAnimation, 30, 0, 255, 0);
            
            scale(scaleValue);
            tint(255, alpha);
            this.destroyAnimation--;
        }
        
        // ブロック本体
        fill(this.color);
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        rectMode(CORNER);
        rect(0, 0, this.width, this.height, 3);
        
        // 特殊ブロックの模様
        if (this.isSpecial && this.itemType) {
            this.drawSpecialPattern();
        }
        
        // ブロックのハイライト
        fill(255, 255, 255, 100);
        noStroke();
        rect(2, 2, this.width - 4, 3, 2);
        
        pop();
    }
    
    // 特殊ブロックの模様描画
    drawSpecialPattern() {
        let centerX = this.width / 2;
        let centerY = this.height / 2;
        
        fill(255, 255, 255, 150);
        noStroke();
        
        switch(this.itemType) {
            case 'LIFE_UP':
                // ハート模様
                drawHeart(centerX, centerY, 8);
                break;
            case 'PADDLE_EXPAND':
                // 盾模様
                ellipse(centerX, centerY, 12);
                fill(this.color);
                ellipse(centerX, centerY, 8);
                break;
            case 'BALL_MULTIPLY':
                // 複数ボール模様
                ellipse(centerX - 3, centerY, 4);
                ellipse(centerX + 3, centerY, 4);
                ellipse(centerX, centerY - 3, 4);
                break;
            case 'SLOW_PENALTY':
                // 骸骨模様
                fill(255, 100, 100, 150);
                rect(centerX - 4, centerY - 2, 8, 4);
                break;
        }
    }
    
    // ブロック破壊（エフェクト追加 - フェーズ7）
    destroy() {
        if (!this.isDestroyed) {
            this.isDestroyed = true;
            this.destroyAnimation = 30; // 30フレームのアニメーション
            
            // 爆発エフェクト生成
            let centerX = this.position.x + this.width / 2;
            let centerY = this.position.y + this.height / 2;
            createBlockExplosion(centerX, centerY, this.color);
            
            // スコア加算（改善版）
            let blockType = this.isSpecial ? 'special' : 'normal';
            let earnedScore = scoreSystem.onBlockDestroy(blockType);
            console.log("ブロック破壊スコア:", earnedScore, "総スコア:", gameConfig.player.score);
            
            // 特殊ブロックならアイテム生成
            if (this.isSpecial && this.itemType) {
                this.spawnItem();
            }
            
            return true;
        }
        return false;
    }
    
    // アイテム生成
    spawnItem() {
        // アイテム生成確率チェック
        let spawnChance = random(100);
        let shouldSpawn = false;
        
        if (this.itemType === 'SLOW_PENALTY') {
            shouldSpawn = spawnChance < 70; // ペナルティは70%で出現
        } else {
            shouldSpawn = spawnChance < 50; // 良いアイテムは50%で出現
        }
        
        if (shouldSpawn) {
            let item = new Item(
                this.position.x + this.width/2,
                this.position.y + this.height/2,
                this.itemType
            );
            items.push(item);
        }
    }
    
    // 境界取得（衝突判定用）
    getBounds() {
        return {
            left: this.position.x,
            right: this.position.x + this.width,
            top: this.position.y,
            bottom: this.position.y + this.height
        };
    }
}

// Itemクラス - アイテム管理
class Item {
    constructor(x, y, type) {
        this.position = { x, y };
        this.type = type;
        this.velocity = { vx: 0, vy: 2 };
        this.animationFrame = 0;
        this.size = 16;
        this.collected = false;
    }
    
    // アイテム更新
    update() {
        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;
        this.animationFrame++;
        
        // 画面下に落下したら削除
        if (this.position.y > height) {
            this.collected = true;
        }
    }
    
    // アイテム描画（改良版 - フェーズ7）
    draw() {
        if (this.collected) return;
        
        push();
        translate(this.position.x, this.position.y);
        
        // 浮遊アニメーション
        let floatOffset = sin(this.animationFrame * 0.1) * 2;
        translate(0, floatOffset);
        
        // 回転アニメーション
        rotate(this.animationFrame * 0.05);
        
        // 外側のオーラ効果
        this.drawAura();
        
        // メインアイテム描画
        this.drawMainItem();
        
        pop();
        
        // パーティクル生成
        if (frameCount % 8 === 0) {
            this.generateParticles();
        }
    }
    
    // オーラ効果描画
    drawAura() {
        let auraColor = this.getAuraColor();
        
        for (let i = 0; i < 3; i++) {
            let alpha = 30 - i * 10;
            let size = this.size + i * 4;
            
            fill(auraColor[0], auraColor[1], auraColor[2], alpha);
            noStroke();
            ellipse(0, 0, size);
        }
    }
    
    // メインアイテム描画
    drawMainItem() {
        switch(this.type) {
            case 'LIFE_UP':
                fill(255, 120, 120);
                stroke(255, 200, 200);
                strokeWeight(2);
                drawHeart(0, 0, this.size/2);
                
                // ハートの輝き
                fill(255, 255, 255, 100);
                noStroke();
                drawHeart(-1, -1, this.size/3);
                break;
                
            case 'PADDLE_EXPAND':
                fill(120, 255, 120);
                stroke(200, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                
                fill(80, 220, 80);
                ellipse(0, 0, this.size * 0.7);
                
                // 中心の輝き
                fill(255, 255, 255, 120);
                noStroke();
                ellipse(0, 0, this.size * 0.3);
                break;
                
            case 'BALL_MULTIPLY':
                fill(255, 255, 120);
                stroke(255, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                
                fill(220, 220, 100);
                ellipse(-3, 0, this.size * 0.6);
                ellipse(3, 0, this.size * 0.6);
                
                // 輝きエフェクト
                fill(255, 255, 255, 100);
                noStroke();
                ellipse(0, 0, this.size * 0.4);
                break;
                
            case 'SLOW_PENALTY':
                fill(255, 70, 70);
                stroke(220, 50, 50);
                strokeWeight(2);
                rect(-this.size/2, -this.size/2, this.size, this.size, 3);
                
                // 危険マーク
                fill(220, 0, 0);
                noStroke();
                ellipse(-2, -2, 4);
                ellipse(2, -2, 4);
                rect(-4, 2, 8, 3);
                break;
        }
    }
    
    // オーラ色取得
    getAuraColor() {
        switch(this.type) {
            case 'LIFE_UP': return [255, 100, 100];
            case 'PADDLE_EXPAND': return [100, 255, 100];
            case 'BALL_MULTIPLY': return [255, 255, 100];
            case 'SLOW_PENALTY': return [255, 50, 50];
            default: return [255, 255, 255];
        }
    }
    
    // アイテムパーティクル生成
    generateParticles() {
        let auraColor = this.getAuraColor();
        
        createParticle(
            this.position.x + random(-8, 8),
            this.position.y + random(-8, 8),
            random(-0.5, 0.5),
            random(-1, 0),
            auraColor,
            random(20, 30),
            random(2, 4),
            'sparkle'
        );
    }
    
    // パドルとの衝突判定
    checkPaddleCollision(paddle) {
        if (this.collected) return false;
        
        let paddleBounds = paddle.getBounds();
        
        if (this.position.x > paddleBounds.left && 
            this.position.x < paddleBounds.right &&
            this.position.y > paddleBounds.top && 
            this.position.y < paddleBounds.bottom) {
            
            this.collected = true;
            this.applyEffect(paddle);
            return true;
        }
        return false;
    }
    
    // アイテム効果適用（エフェクト追加 - フェーズ7）
    applyEffect(paddle) {
        // エフェクト生成
        createItemEffect(this.position.x, this.position.y, this.type);
        
        switch(this.type) {
            case 'LIFE_UP':
                if (gameConfig.player.lives < gameConfig.player.maxLives) {
                    gameConfig.player.lives++;
                }
                break;
            case 'PADDLE_EXPAND':
                paddle.expandPaddle();
                break;
            case 'BALL_MULTIPLY':
                // 将来的にボール複製実装
                gameConfig.player.score += 50; // とりあえずボーナススコア
                break;
            case 'SLOW_PENALTY':
                paddle.slowPaddle();
                break;
        }
    }
}

// ブロック配置生成関数
function generateBlocks() {
    blocks = [];
    
    let startX = (width - (blockLayout.cols * (blockLayout.width + blockLayout.spacing) - blockLayout.spacing)) / 2;
    let startY = 120;
    
    for (let row = 0; row < blockLayout.rows; row++) {
        for (let col = 0; col < blockLayout.cols; col++) {
            let x = startX + col * (blockLayout.width + blockLayout.spacing);
            let y = startY + row * (blockLayout.height + blockLayout.spacing);
            
            // ランダム色選択
            let blockColor = color(blockLayout.colors[Math.floor(random(blockLayout.colors.length))]);
            
            // 特殊ブロック判定
            let isSpecial = random(1) < blockLayout.specialBlockRatio;
            let itemType = null;
            
            if (isSpecial) {
                let itemTypes = Object.keys(itemConfig.types);
                itemType = itemTypes[Math.floor(random(itemTypes.length))];
            }
            
            blocks.push(new Block(x, y, blockColor, isSpecial, itemType));
        }
    }
}

// =============================================================================
// パーティクルシステム実装（フェーズ7）
// =============================================================================

// Particleクラス - パーティクル管理
class Particle {
    constructor(x, y, vx, vy, color, life = 60, size = 3) {
        this.position = { x, y };
        this.velocity = { vx: vx || random(-2, 2), vy: vy || random(-2, 2) };
        this.color = color || [255, 255, 255];
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0.1;
        this.friction = 0.98;
        this.type = 'normal';
    }
    
    // パーティクル更新
    update() {
        // 位置更新
        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;
        
        // 物理演算
        this.velocity.vy += this.gravity;
        this.velocity.vx *= this.friction;
        this.velocity.vy *= this.friction;
        
        // ライフ減少
        this.life--;
        
        return this.life > 0;
    }
    
    // パーティクル描画
    draw() {
        let alpha = map(this.life, 0, this.maxLife, 0, 255);
        let currentSize = map(this.life, 0, this.maxLife, 0, this.size);
        
        push();
        translate(this.position.x, this.position.y);
        
        // パーティクルのタイプに応じた描画
        switch(this.type) {
            case 'explosion':
                this.drawExplosion(alpha, currentSize);
                break;
            case 'sparkle':
                this.drawSparkle(alpha, currentSize);
                break;
            case 'trail':
                this.drawTrail(alpha, currentSize);
                break;
            default:
                this.drawNormal(alpha, currentSize);
        }
        
        pop();
    }
    
    // 通常パーティクル描画
    drawNormal(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha);
        noStroke();
        ellipse(0, 0, size);
    }
    
    // 爆発パーティクル描画
    drawExplosion(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha);
        noStroke();
        
        // 複数の円で爆発効果
        for (let i = 0; i < 3; i++) {
            let offset = i * 2;
            ellipse(random(-offset, offset), random(-offset, offset), size - i);
        }
    }
    
    // きらきらパーティクル描画
    drawSparkle(alpha, size) {
        stroke(this.color[0], this.color[1], this.color[2], alpha);
        strokeWeight(2);
        
        // 十字の線
        line(-size/2, 0, size/2, 0);
        line(0, -size/2, 0, size/2);
        
        // 対角線
        line(-size/3, -size/3, size/3, size/3);
        line(-size/3, size/3, size/3, -size/3);
    }
    
    // 軌跡パーティクル描画
    drawTrail(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha * 0.7);
        noStroke();
        ellipse(0, 0, size);
        
        // 内側のハイライト
        fill(255, 255, 255, alpha * 0.3);
        ellipse(-1, -1, size * 0.6);
    }
}

// パーティクル生成関数
function createParticle(x, y, vx, vy, color, life, size, type = 'normal') {
    if (particles.length >= maxParticles) {
        particles.shift(); // 古いパーティクルを削除
    }
    
    let particle = new Particle(x, y, vx, vy, color, life, size);
    particle.type = type;
    particles.push(particle);
}

// ブロック破壊時の爆発エフェクト
function createBlockExplosion(x, y, blockColor) {
    let r = red(blockColor);
    let g = green(blockColor);
    let b = blue(blockColor);
    
    // メイン爆発パーティクル
    for (let i = 0; i < 8; i++) {
        let angle = (i * TWO_PI) / 8;
        let speed = random(2, 5);
        let vx = cos(angle) * speed;
        let vy = sin(angle) * speed;
        
        createParticle(
            x + random(-10, 10), 
            y + random(-5, 5),
            vx, vy,
            [r, g, b],
            random(30, 50),
            random(4, 8),
            'explosion'
        );
    }
    
    // きらきらエフェクト
    for (let i = 0; i < 5; i++) {
        createParticle(
            x + random(-15, 15),
            y + random(-10, 10),
            random(-1, 1),
            random(-2, 0),
            [255, 255, 200],
            random(20, 35),
            random(6, 10),
            'sparkle'
        );
    }
}

// アイテム取得時のエフェクト
function createItemEffect(x, y, itemType) {
    let effectColor;
    
    switch(itemType) {
        case 'LIFE_UP':
            effectColor = [255, 100, 100];
            break;
        case 'PADDLE_EXPAND':
            effectColor = [100, 255, 100];
            break;
        case 'BALL_MULTIPLY':
            effectColor = [255, 255, 100];
            break;
        case 'SLOW_PENALTY':
            effectColor = [200, 50, 50];
            break;
        default:
            effectColor = [255, 255, 255];
    }
    
    // 放射状パーティクル
    for (let i = 0; i < 12; i++) {
        let angle = (i * TWO_PI) / 12;
        let speed = random(1, 3);
        
        createParticle(
            x, y,
            cos(angle) * speed,
            sin(angle) * speed,
            effectColor,
            random(25, 40),
            random(3, 6),
            'sparkle'
        );
    }
}

// パーティクル更新処理
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }
}

// パーティクル描画処理
function drawParticles() {
    for (let particle of particles) {
        particle.draw();
    }
}
