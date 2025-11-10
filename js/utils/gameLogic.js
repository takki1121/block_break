// ゲームロジックユーティリティ
// ブロック生成、ゲーム条件チェック、リセット処理など

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
                console.log("特殊ブロック生成:", "位置(" + col + "," + row + ")", "アイテム:", itemType);
            }
            
            blocks.push(new Block(x, y, blockColor, isSpecial, itemType));
        }
    }
    
    // ブロック生成統計
    let specialBlocks = blocks.filter(block => block.isSpecial).length;
    console.log("ブロック生成完了:", "総数:", blocks.length, "特殊ブロック:", specialBlocks);
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
    if (ball) ball.update();
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
    
    // 破壊済みブロックのクリーンアップ（メモリリーク防止）
    if (frameCount % 600 === 0) { // 10秒に1回
        blocks = blocks.filter(block => !block.isDestroyed || block.destroyAnimation > 0);
    }
}