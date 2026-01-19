// ゲームロジックユーティリティ
// ブロック生成、ゲーム条件チェック、リセット処理など

// アイテム出現プール（レベルごとに構築）
let itemPool = [];
// ブロック衝突用のグリッド参照
let blockGrid = [];
let blockOrigin = { x: 0, y: 120 };
let blockCell = { w: 0, h: 0 };

// ブロック配置生成関数
function generateBlocks() {
    blocks = [];
    blockGrid = [];

    // プールが空の場合は現在レベルで再構築しておく
    if (itemPool.length === 0) {
        prepareItemPoolForLevel(gameConfig.player.level);
    }
    
    blockOrigin.x = (width - (blockLayout.cols * (blockLayout.width + blockLayout.spacing) - blockLayout.spacing)) / 2;
    blockOrigin.y = 120;
    blockCell.w = blockLayout.width + blockLayout.spacing;
    blockCell.h = blockLayout.height + blockLayout.spacing;
    
    for (let row = 0; row < blockLayout.rows; row++) {
        for (let col = 0; col < blockLayout.cols; col++) {
            let x = blockOrigin.x + col * blockCell.w;
            let y = blockOrigin.y + row * blockCell.h;
            
            // ランダム色選択
            let blockColor = color(blockLayout.colors[Math.floor(random(blockLayout.colors.length))]);
            
            // 特殊ブロック判定
            let isSpecial = random(1) < blockLayout.specialBlockRatio;
            let itemType = null;
            
            if (isSpecial) {
                itemType = getItemTypeForLevel(gameConfig.player.level);
                console.log("特殊ブロック生成:", "位置(" + col + "," + row + ")", "アイテム:", itemType);
            }
            
            const newBlock = new Block(x, y, blockColor, isSpecial, itemType);
            blocks.push(newBlock);
            if (!blockGrid[row]) blockGrid[row] = [];
            blockGrid[row][col] = newBlock;
        }
    }
    
    // ブロック生成統計
    let specialBlocks = blocks.filter(block => block.isSpecial).length;
    console.log("ブロック生成完了:", "総数:", blocks.length, "特殊ブロック:", specialBlocks);
}

// レベルに応じたアイテムプールを組み立て
function prepareItemPoolForLevel(level) {
    const { level1, levelUp } = itemConfig.spawnRates;
    const goodMin = Math.max(0, level1.good[0] - levelUp.goodDecrease * (level - 1));
    const goodMax = Math.max(goodMin, level1.good[1] - levelUp.goodDecrease * (level - 1));
    const penaltyMin = Math.min(level1.penalty[0] + levelUp.penaltyIncrease * (level - 1), levelUp.maxPenalty);
    const penaltyMax = Math.min(level1.penalty[1] + levelUp.penaltyIncrease * (level - 1), levelUp.maxPenalty);
    
    const goodCount = Math.max(0, Math.round(random(goodMin, goodMax)));
    const penaltyCount = Math.max(0, Math.round(random(penaltyMin, penaltyMax)));
    
    const goodTypes = ['LIFE_UP', 'PADDLE_EXPAND', 'BALL_MULTIPLY'];
    itemPool = [];
    
    for (let i = 0; i < goodCount; i++) {
        itemPool.push(goodTypes[i % goodTypes.length]);
    }
    for (let i = 0; i < penaltyCount; i++) {
        itemPool.push('SLOW_PENALTY');
    }
    
    itemPool = shuffle(itemPool);
    console.log(`アイテムプール再構築: Good=${goodCount}, Penalty=${penaltyCount}, Level=${level}`);
}

// プールからアイテムを取得（枯渇時は重み付きランダム）
function getItemTypeForLevel(level) {
    if (itemPool.length > 0) {
        return itemPool.pop();
    }
    return getPenaltyWeightedItem(level);
}

// ペナルティ比率をレベル依存で増やす
function getPenaltyWeightedItem(level) {
    const basePenaltyBias = 0.25;
    const penaltyBias = constrain(basePenaltyBias + 0.08 * (level - 1), 0.25, 0.7);
    
    if (random() < penaltyBias) {
        return 'SLOW_PENALTY';
    }
    
    const goodTypes = ['LIFE_UP', 'PADDLE_EXPAND', 'BALL_MULTIPLY'];
    return goodTypes[Math.floor(random(goodTypes.length))];
}

// ゲーム条件チェック
function checkGameConditions() {
    // レベルクリア判定
    checkLevelClearCondition();
    
    // ゲームオーバー判定は各ボールの onBottomHit で処理される
}

// レベルクリア条件チェック
function checkLevelClearCondition() {
    let remainingBlocks = blocks.filter(block => !block.isDestroyed).length;
    
    if (remainingBlocks === 0 && currentState === GAME_STATE.PLAYING) {
        // レベルクリア処理
        let bonus = scoreSystem.onLevelClear();
        gameConfig.player.level++;
        
        gameStateManager.changeState(GAME_STATE.LEVEL_CLEAR);
        createLevelClearEffect();
        
        console.log("レベルクリア！ボーナス:", bonus);
        
        // 2秒後に次のレベルに移行
        setTimeout(() => {
            if (currentState === GAME_STATE.LEVEL_CLEAR) {
                gameStateManager.changeState(GAME_STATE.PLAYING);
            }
        }, 2000);
    }
}

// ゲームオーバー条件チェック
function checkGameOverCondition() {
    if (gameConfig.player.lives <= 0 && currentState === GAME_STATE.PLAYING) {
        gameStateManager.changeState(GAME_STATE.GAME_OVER);
        console.log("ゲームオーバー - 最終スコア:", gameConfig.player.score);
    }
}

// ゲームリセット
function resetGame() {
    // プレイヤーデータリセット
    gameConfig.player.score = 0;
    gameConfig.player.lives = gameConfig.player.maxLives;
    gameConfig.player.level = 1;
    
    // ゲームオブジェクト初期化
    initializeGame();
    
    console.log("ゲームリセット完了");
}

// ゲーム更新メイン関数
function updateGame() {
    if (currentState !== GAME_STATE.PLAYING) return;
    
    // オブジェクト更新
    // すべてのボールを更新
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].update();
        
        // 画面下に落ちたボールを削除
        if (balls[i].position.y > height + 50) {
            balls.splice(i, 1);
        }
    }
    
    // ボールがすべてなくなったらライフ減少
    if (balls.length === 0) {
        loseLife();
    }
    
    if (paddle) paddle.update();
    
    // アイテム更新
    updateItems();
    
    // パーティクル更新
    updateParticles();
    
    // 衝突判定
    checkCollisions();
    
    // ゲーム条件チェック
    checkGameConditions();
}

// アイテム更新処理
function updateItems() {
    // アイテム更新（逆順で処理して安全に削除）
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.update();
        
        // パドルとの衝突判定
        if (item.checkPaddleCollision(paddle)) {
            console.log("アイテム取得:", item.type);
        }
        
        // 収集済みアイテムを削除
        if (item.collected) {
            items.splice(i, 1);
        }
    }
}

// デバッグ情報表示
function drawDebugInfo() {
    if (typeof DEBUG_MODE === 'undefined' || !DEBUG_MODE) return;
    
    fill(0, 255, 0);
    textAlign(LEFT, TOP);
    textFont('monospace');
    textSize(10);
    
    let debugY = height - 150;
    
    // システム情報
    text("FPS: " + frameRate().toFixed(1), 15, debugY);
    text("ゲーム状態: " + currentState, 15, debugY + 15);
    text("ブロック数: " + blocks.filter(b => !b.isDestroyed).length + "/" + blocks.length, 15, debugY + 30);
    text("アイテム数: " + items.length, 15, debugY + 45);
    text("パーティクル数: " + particles.length + "/" + maxParticles, 15, debugY + 60);
    
    // プレイヤー情報
    text("スコア: " + gameConfig.player.score, 15, debugY + 75);
    text("レベル: " + gameConfig.player.level, 15, debugY + 90);
    text("残機: " + gameConfig.player.lives, 15, debugY + 105);
    
    // 入力情報
    if (inputSystem) {
        text("入力位置: " + inputSystem.currentInputX.toFixed(1), 15, debugY + 120);
        text("入力デバイス: " + (inputSystem.isTouch ? "タッチ" : "マウス"), 15, debugY + 135);
    }
}

// ゲーム統計取得
function getGameStats() {
    return {
        score: gameConfig.player.score,
        level: gameConfig.player.level,
        lives: gameConfig.player.lives,
        highScore: highScore,
        blocksRemaining: blocks.filter(b => !b.isDestroyed).length,
        totalBlocks: blocks.length,
        itemsActive: items.length,
        particlesActive: particles.length,
        gameState: currentState,
        gameTime: gameStarted ? millis() - gameStartTime - totalPauseTime : 0
    };
}

// ボール増殖関数
function multiplyBalls() {
    let currentBalls = [...balls]; // 現在のボールをコピー
    let maxBalls = 10; // 最大ボール数制限
    
    // 現在のボール数が制限以下の場合、各ボールを複製
    currentBalls.forEach(originalBall => {
        if (balls.length >= maxBalls) return;
        
        // 新しいボールを作成（元のボールの位置から少しずらして）
        let newBall = new Ball(
            originalBall.position.x + random(-20, 20),
            originalBall.position.y + random(-10, 10),
            originalBall.velocity.vx + random(-2, 2),
            originalBall.velocity.vy + random(-1, 1)
        );
        
        balls.push(newBall);
        console.log("新しいボール追加:", balls.length);
    });
    
    // 最大数に達した場合の警告
    if (balls.length >= maxBalls) {
        console.log("ボール数が最大に達しました:", maxBalls);
    }
}

// パフォーマンス最適化チェック
function optimizePerformance() {
    // パーティクル数制限
    if (particles.length > maxParticles) {
        particles.splice(0, particles.length - maxParticles);
    }
    
    // アイテム数制限（稀なケース）
    if (items.length > 20) {
        items.splice(0, items.length - 20);
    }
    
    // ボール数制限
    if (balls.length > 10) {
        balls.splice(10); // 10個以上は削除
        console.log("ボール数を制限しました:", balls.length);
    }
    
    // 破壊済みブロックのクリーンアップ（メモリリーク防止）
    if (frameCount % 600 === 0) { // 10秒に1回
        blocks = blocks.filter(block => !block.isDestroyed || block.destroyAnimation > 0);
    }
}

// レベルに応じたボール初速を計算
function getBallSpeedForLevel(level) {
    const cfg = difficultyConfig.ball;
    let speed = cfg.baseSpeed + cfg.speedIncreasePerLevel * (level - 1);
    return Math.min(speed, cfg.maxSpeed);
}

// レベルに応じたボールを生成
function createBallForLevel(level) {
    const speed = getBallSpeedForLevel(level);
    const vx = random(-speed, speed);
    const vy = -Math.max(speed, 4); // 上向きに確実に発射
    return new Ball(undefined, undefined, vx, vy);
}

// レベル上昇時の難易度スケーリングを適用
function applyDifficultyForLevel(level) {
    // ブロック行数の増加
    const blockCfg = difficultyConfig.blocks;
    const addedRows = Math.floor((level - 1) / blockCfg.rowIncreaseInterval);
    blockLayout.rows = Math.min(blockCfg.baseRows + addedRows, blockCfg.maxRows);

    // 特殊ブロック比率の調整
    const specialCfg = difficultyConfig.specialBlocks;
    const ratio = specialCfg.baseRatio + specialCfg.ratioIncreasePerLevel * (level - 1);
    blockLayout.specialBlockRatio = Math.min(ratio, specialCfg.maxRatio);

    // パドル幅の縮小（一定レベルごと）
    const paddleCfg = difficultyConfig.paddle;
    const shrinkSteps = Math.floor((level - 1) / paddleCfg.widthDecreaseInterval);
    const targetWidth = Math.max(paddleCfg.minWidth, gameConfig.paddle.baseWidth - shrinkSteps * paddleCfg.widthDecrease);
    gameConfig.paddle.width = targetWidth;
    gameConfig.paddle.expandedWidth = Math.max(targetWidth * 1.5, targetWidth + 20);
    
    // 既存パドルにも反映（レベル開始時のみ呼ばれる想定）
    if (paddle) {
        paddle.width = targetWidth;
        paddle.isExpanded = false;
        paddle.isSlowed = false;
        paddle.expandTimer = 0;
        paddle.slowTimer = 0;
    }
    
    // アイテム出現プール更新
    prepareItemPoolForLevel(level);
    
    console.log(`難易度更新: Level=${level}, Rows=${blockLayout.rows}, SpecialRatio=${blockLayout.specialBlockRatio.toFixed(2)}, PaddleWidth=${targetWidth}`);
}