// ブロック崩しゲーム - メインファイル
// p5.jsのメイン関数のみを定義

// デバッグモード（開発時のみ有効）
// const DEBUG_MODE = true;

// p5.js preload関数 - アセット読み込み
function preload() {
    // 音響システムのプリロード
    audioSystem.preload();
    
    // アイテム画像を読み込み
    try {
        itemImages.hp = loadImage('img/hp.png', 
            () => console.log("HP画像読み込み成功"),
            () => console.error("HP画像読み込み失敗")
        );
        itemImages.shield = loadImage('img/shield.png',
            () => console.log("Shield画像読み込み成功"),
            () => console.error("Shield画像読み込み失敗")
        );
        itemImages.ball = loadImage('img/ball.png',
            () => console.log("Ball画像読み込み成功"),
            () => console.error("Ball画像読み込み失敗")
        );
        itemImages.skull = loadImage('img/skull.png',
            () => console.log("Skull画像読み込み成功"),
            () => console.error("Skull画像読み込み失敗")
        );
        
        console.log("アイテム画像読み込み開始");
    } catch (error) {
        console.error("画像読み込み中にエラー:", error);
    }
}

// p5.js setup関数 - 初期化処理
function setup() {
    // 初期スケール係数の計算
    gameConfig.canvas.scaleFactor = calculateScaleFactor();
    
    // デバイス・向きに応じて基準サイズを取得
    const target = getTargetCanvasSize();
    const canvasWidth = target.width * gameConfig.canvas.scaleFactor;
    const canvasHeight = target.height * gameConfig.canvas.scaleFactor;
    createCanvas(canvasWidth, canvasHeight);
    
    // デスクトップの場合、キャンバスを中央配置
    if (gameConfig.canvas.scaleFactor === 1.0) {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
        }
    }
    
    // 基本設定
    colorMode(RGB);
    textFont('Delius');
    
    // システム初期化
    initializeGameState();
    initializeInputSystem();
    initializeUI();
    initializeEffects();
    
    // 音響システムの初期化
    audioSystem.initialize();
    audioSystem.checkLoadStatus();
    
    // 画像読み込み確認
    console.log("アイテム画像読み込み状況:");
    console.log("HP:", itemImages.hp ? "OK" : "NG");
    console.log("Shield:", itemImages.shield ? "OK" : "NG");
    console.log("Ball:", itemImages.ball ? "OK" : "NG");
    console.log("Skull:", itemImages.skull ? "OK" : "NG");
    
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

// 対象デバイスに応じた基準キャンバスサイズを取得
function getTargetCanvasSize() {
    const baseWidth = 800;
    const baseHeight = 600;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmartphone = window.innerWidth <= 768;
    const isPortrait = window.innerHeight >= window.innerWidth;
    
    // デスクトップ（横長固定）
    if (!isMobile && window.innerWidth >= 1024) {
        return { width: baseWidth, height: baseHeight, isPortrait: false, isSmartphone: false };
    }
    
    // スマートフォン：縦長優先（縦を長めに確保）
    if (isSmartphone && isPortrait) {
        return { width: baseHeight, height: baseWidth + 300, isPortrait: true, isSmartphone: true };
    }
    
    // スマートフォン横向き or タブレット：横長を維持
    return { width: baseWidth, height: baseHeight, isPortrait: isPortrait, isSmartphone: isSmartphone };
}

// スケール係数計算関数（アスペクト比維持）
function calculateScaleFactor() {
    const target = getTargetCanvasSize();
    
    // デスクトップ固定サイズ
    if (!target.isSmartphone && window.innerWidth >= 1024) {
        return 1.0;
    }
    
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const scaleX = windowW / target.width;
    const scaleY = windowH / target.height;
    
    // 小さい方を採用してアスペクト比を維持
    let scaleFactor = Math.min(scaleX, scaleY);
    
    // 端末向けのスケール制限
    if (target.isSmartphone && target.isPortrait) {
        scaleFactor = Math.max(0.4, Math.min(scaleFactor, 1.2));
    } else {
        scaleFactor = Math.max(0.5, Math.min(scaleFactor, 1.5));
    }
    
    return scaleFactor;
}

// キャンバスと要素のリサイズ関数
function resizeGameElements() {
    const scaleFactor = calculateScaleFactor();
    const target = getTargetCanvasSize();
    
    // キャンバスサイズの更新（アスペクト比維持）
    const newWidth = target.width * scaleFactor;
    const newHeight = target.height * scaleFactor;
    
    // p5.jsキャンバスのリサイズ
    resizeCanvas(newWidth, newHeight);
    
    // スケール係数をconfigに保存
    gameConfig.canvas.scaleFactor = scaleFactor;
    
    // ゲーム要素の位置とサイズを更新
    updateGameElementsScale(scaleFactor);
    
    console.log(`Canvas resized to: ${newWidth}x${newHeight}, Scale: ${scaleFactor.toFixed(2)}, Smartphone: ${isSmartphone}`);
}

// ゲーム要素のスケール更新関数
function updateGameElementsScale(scaleFactor) {
    // パドルの位置とサイズを更新
    if (typeof paddle !== 'undefined' && paddle) {
        paddle.x = paddle.x; // 相対位置は維持
        paddle.width = gameConfig.paddle.width * scaleFactor;
        paddle.height = gameConfig.paddle.height * scaleFactor;
    }
    
    // ボールの位置とサイズを更新
    if (typeof balls !== 'undefined' && balls.length > 0) {
        balls.forEach(ball => {
            ball.radius = ball.originalRadius ? ball.originalRadius * scaleFactor : 8 * scaleFactor;
        });
    }
    
    // ブロックのサイズと位置を更新
    if (typeof blocks !== 'undefined' && blocks.length > 0) {
        blocks.forEach(block => {
            block.width = blockLayout.width * scaleFactor;
            block.height = blockLayout.height * scaleFactor;
            // ブロックの位置は初期化時に再計算される
        });
        // ブロック配置の再計算
        repositionBlocks();
    }
    
    // アイテムのサイズ更新
    if (typeof items !== 'undefined' && items.length > 0) {
        items.forEach(item => {
            item.size = 20 * scaleFactor;
        });
    }
    
    // パーティクルのサイズ更新
    if (typeof particles !== 'undefined' && particles.length > 0) {
        particles.forEach(particle => {
            if (particle.originalSize) {
                particle.size = particle.originalSize * scaleFactor;
            }
        });
    }
}

// ブロック配置の再計算関数
function repositionBlocks() {
    const scaleFactor = gameConfig.canvas.scaleFactor;
    const startX = (width - (blockLayout.cols * (blockLayout.width * scaleFactor) + (blockLayout.cols - 1) * (blockLayout.spacing * scaleFactor))) / 2;
    const startY = 80 * scaleFactor;
    
    blocks.forEach((block, index) => {
        const row = Math.floor(index / blockLayout.cols);
        const col = index % blockLayout.cols;
        
        block.x = startX + col * ((blockLayout.width + blockLayout.spacing) * scaleFactor);
        block.y = startY + row * ((blockLayout.height + blockLayout.spacing) * scaleFactor);
    });
}

// ウィンドウリサイズ対応
function windowResized() {
    // デスクトップの場合はリサイズしない
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile && window.innerWidth >= 1024) {
        return; // デスクトップでは固定サイズを維持
    }
    
    // モバイル・タブレットの場合のみレスポンシブリサイズを実行
    resizeGameElements();
    
    // 入力システムの座標も更新
    if (typeof updateInputCoordinates !== 'undefined') {
        updateInputCoordinates();
    }
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