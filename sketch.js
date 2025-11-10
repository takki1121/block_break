// ブロック崩しゲーム - メインファイル
// p5.jsのメイン関数のみを定義

// デバッグモード（開発時のみ有効）
// const DEBUG_MODE = true;

// p5.js setup関数 - 初期化処理
function setup() {
    // キャンバス作成
    createCanvas(gameConfig.canvas.width, gameConfig.canvas.height);
    
    // 基本設定
    colorMode(RGB);
    textFont('Delius');
    
    // システム初期化
    initializeGameState();
    initializeInputSystem();
    initializeUI();
    initializeEffects();
    
    console.log("ゲーム初期化完了");
}

// p5.js draw関数 - メインゲームループ
function draw() {
    // 背景クリア
    background(30, 30, 40);
    
    // 入力システム更新
    updateInputSystem();
    
    // 状態に応じた描画・更新処理
    switch(currentState) {
        case GAME_STATE.OPENING:
            drawOpening();
            break;
            
        case GAME_STATE.PLAYING:
            updateGame();
            drawGame();
            break;
            
        case GAME_STATE.PAUSED:
            drawGame(); // ゲーム画面を背景に
            drawPauseOverlay();
            break;
            
        case GAME_STATE.GAME_OVER:
            drawGame(); // ゲーム画面を背景に
            drawGameOver();
            break;
            
        case GAME_STATE.LEVEL_CLEAR:
            drawGame();
            drawLevelClearMessage();
            break;
    }
    
    // デバッグ情報表示
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
        drawDebugInfo();
    }
    
    // パフォーマンス最適化
    if (frameCount % 60 === 0) { // 1秒に1回
        optimizePerformance();
    }
}

// レベルクリアメッセージ描画
function drawLevelClearMessage() {
    // 半透明オーバーレイ
    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, width, height);
    
    // レベルクリアテキスト
    textAlign(CENTER, CENTER);
    textFont('Delius');
    
    fill(255, 215, 0);
    textSize(48);
    text("LEVEL CLEAR!", width/2, height/2 - 40);
    
    fill(255, 255, 255);
    textSize(20);
    text("Level " + (gameConfig.player.level - 1) + " Complete!", width/2, height/2);
    
    fill(100, 255, 100);
    textSize(16);
    text("Next Level: " + gameConfig.player.level, width/2, height/2 + 30);
    
    // 進行中表示
    let pulseAlpha = map(sin(frameCount * 0.15), -1, 1, 150, 255);
    fill(255, 255, 255, pulseAlpha);
    textSize(14);
    text("Preparing next level...", width/2, height/2 + 60);
}

// ウィンドウリサイズ対応
function windowResized() {
    // 現在は固定サイズのため処理なし
    // 将来的にレスポンシブ対応時に実装
}

// p5.js エラーハンドリング
window.onerror = function(message, source, lineno, colno, error) {
    console.error('ゲームエラー:', {
        message: message,
        source: source,
        line: lineno,
        column: colno,
        error: error
    });
    
    // エラー時の緊急停止防止
    if (typeof currentState !== 'undefined') {
        console.log('現在の状態:', currentState);
    }
    
    return false; // デフォルトのエラーハンドリングも実行
};