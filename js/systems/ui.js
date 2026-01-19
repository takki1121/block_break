// UI システム
// ゲームの各画面描画、HUD表示、ポーズ機能を管理

// スケール対応ヘルパー関数群
function getScaledValue(value) {
    return value * gameConfig.canvas.scaleFactor;
}

function getScaledFont(baseSize) {
    return baseSize * gameConfig.canvas.scaleFactor;
}

function getScaledPosition(x, y) {
    return {
        x: x * gameConfig.canvas.scaleFactor,
        y: y * gameConfig.canvas.scaleFactor
    };
}

// UI初期化
function initializeUI() {
    updateUIScale();
    
    uiSystem.showPauseOverlay = false;
    uiSystem.fadeOpacity = 0;
    uiSystem.transitionProgress = 0;
}

// UIスケールの更新
function updateUIScale() {
    const scaleFactor = gameConfig.canvas.scaleFactor;
    
    // ライフ・レベルパネルのサイズを計算
    const livesLevelPanelWidth = getScaledValue(120);
    const livesLevelPanelHeight = getScaledValue(50);
    const margin = getScaledValue(10);
    
    // ポーズボタンのスケール更新（ライフ・レベル表示と同じY座標、右端揃え）
    uiSystem.pauseButton.width = getScaledValue(uiConfig.pauseButton.width);
    uiSystem.pauseButton.height = getScaledValue(uiConfig.pauseButton.height);
    // 右端から margin 分の位置に配置、Y座標はレベル表示と同じ
    uiSystem.pauseButton.x = width - uiSystem.pauseButton.width - margin;
    uiSystem.pauseButton.y = margin;
    
    // ミュートボタンのスケール更新
    uiSystem.muteButton.width = getScaledValue(uiConfig.muteButton.width);
    uiSystem.muteButton.height = getScaledValue(uiConfig.muteButton.height);
    uiSystem.muteButton.x = getScaledValue(uiConfig.muteButton.scoreMargin);
    uiSystem.muteButton.y = getScaledValue(uiConfig.muteButton.margin);
}

// オープニング画面描画（改良版）
function drawOpening() {
    // 動的背景
    drawAnimatedBackground();
    
    // メインタイトル
    drawMainTitle();
    
    // ハイスコア表示
    drawHighScoreDisplay();
    
    // ゲーム開始メッセージ
    drawStartMessage();
    
    // 操作説明パネル
    drawControlsPanel();
    
    // フッター情報
    drawFooterInfo();
    
    // ミュートボタン（オープニング画面）
    drawMuteButton();
}

// 動的背景
function drawAnimatedBackground() {
    for (let i = 0; i < 20; i++) {
        let alpha = map(sin(frameCount * 0.01 + i), -1, 1, 10, 50);
        fill(70, 130, 180, alpha);
        noStroke();
        ellipse(
            (width / 20) * i + sin(frameCount * 0.008 + i) * 20,
            height / 2 + cos(frameCount * 0.005 + i) * 100,
            30 + sin(frameCount * 0.01 + i) * 10
        );
    }
}

// メインタイトル
function drawMainTitle() {
    // スケール対応の値計算
    const titleY = getScaledValue(150);
    const bgWidth = getScaledValue(500);
    const bgHeight = getScaledValue(100);
    const shadowOffset = getScaledValue(3);
    
    // タイトル背景
    fill(0, 0, 0, 100);
    noStroke();
    rectMode(CENTER);
    rect(width/2, titleY, bgWidth, bgHeight, getScaledValue(10));
    
    // メインタイトル
    textAlign(CENTER, CENTER);
    textFont(uiConfig.fonts.title.family);
    
    // 外側の影
    fill(0, 0, 0, 150);
    textSize(getScaledFont(uiConfig.fonts.title.size + 4));
    text("BLOCK BREAKER", width/2 + shadowOffset, titleY + shadowOffset);
    
    // メインテキスト
    let titleColor = lerpColor(
        color(100, 200, 255),
        color(255, 255, 100),
        (sin(frameCount * 0.02) + 1) / 2
    );
    fill(titleColor);
    textSize(getScaledFont(uiConfig.fonts.title.size));
    text("BLOCK BREAKER", width/2, titleY);
    
    // サブタイトル
    fill(200, 200, 200);
    textSize(uiConfig.fonts.ui.size);
    text("- Retro Arcade Style -", width/2, 180);
}

// ハイスコア表示
function drawHighScoreDisplay() {
    textAlign(CENTER, CENTER);
    textFont(uiConfig.fonts.subtitle.family);
    
    // ハイスコア背景
    fill(0, 0, 0, 80);
    noStroke();
    rectMode(CENTER);
    rect(width/2, 220, 200, 40, 5);
    
    // ハイスコアテキスト
    fill(255, 215, 0);
    textSize(uiConfig.fonts.small.size + 2);
    text("HIGH SCORE", width/2, 210);
    
    fill(uiConfig.colors.text);
    textSize(uiConfig.fonts.ui.size + 4);
    text(highScore.toLocaleString(), width/2, 230);
}

// ゲーム開始メッセージ
function drawStartMessage() {
    textAlign(CENTER, CENTER);
    textFont('Delius');
    
    // パルス効果
    let pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 150, 255);
    
    fill(255, 255, 255, pulseAlpha);
    textSize(24);
    
    if (inputSystem.isTouch) {
        text("TAP TO START", width/2, 300);
    } else {
        text("CLICK TO START", width/2, 300);
    }
    
    // 小さなヒント
    fill(180, 180, 180, pulseAlpha * 0.8);
    textSize(14);
    text("Press SPACE or ESC for pause", width/2, 325);
}

// 操作説明パネル
function drawControlsPanel() {
    let panelY = 420;
    let panelHeight = inputSystem.isTouch ? 80 : 100;
    
    // パネル背景
    fill(0, 0, 0, 120);
    noStroke();
    rectMode(CENTER);
    rect(width/2, panelY, 350, panelHeight, 8);
    
    // タイトル
    textAlign(CENTER, CENTER);
    textFont('Delius');
    fill(100, 200, 255);
    textSize(16);
    text("CONTROLS", width/2, panelY - panelHeight/2 + 20);
    
    // 操作説明
    fill(200, 200, 200);
    textSize(12);
    
    if (inputSystem.isTouch) {
        text("• Touch and drag to move paddle", width/2, panelY - 10);
        text("• Tap to start/restart game", width/2, panelY + 10);
    } else {
        text("• Move mouse to control paddle", width/2, panelY - 20);
        text("• Click to start/restart game", width/2, panelY - 5);
        text("• Press SPACE for quick actions", width/2, panelY + 10);
        text("• Press ESC to pause/unpause", width/2, panelY + 25);
    }
}

// フッター情報
function drawFooterInfo() {
    textAlign(CENTER, CENTER);
    textFont('Delius');
    fill(120, 120, 120);
    textSize(10);
    text("Made with p5.js | © 2024", width/2, height - 20);
}

// ゲーム画面描画
function drawGame() {
    // 背景グラデーション
    drawGameBackground();
    
    // ゲームオブジェクト描画
    drawGameObjects();
    
    // HUD描画
    drawHUD();
    
    // ポーズオーバーレイ
    if (currentState === GAME_STATE.PAUSED) {
        drawPauseOverlay();
    }
}

// ゲーム背景
function drawGameBackground() {
    // 動的グラデーション背景
    for (let i = 0; i <= height; i += 2) {
        let alpha = map(i, 0, height, 30, 10);
        stroke(20, 30, 40, alpha);
        line(0, i, width, i);
    }
}

// ゲームオブジェクト描画
function drawGameObjects() {
    // ブロック描画
    blocks.forEach(block => block.draw());
    
    // アイテム描画
    items.forEach(item => item.draw());
    
    // パーティクル描画
    particles.forEach(particle => particle.draw());
    
    // パドル描画
    if (paddle) paddle.draw();
    
    // すべてのボール描画
    balls.forEach(ball => ball.draw());
}

// HUD描画
function drawHUD() {
    // スコア表示（左上）
    drawScore();
    
    // ライフ・レベル表示（右上）
    drawLivesAndLevel();
    
    // ミュートボタン
    drawMuteButton();
    
    // ポーズボタン
    drawPauseButton();
}

// スコア表示
function drawScore() {
    textAlign(LEFT, TOP);
    textFont(uiConfig.fonts.ui.family);
    
    // スケールを考慮したサイズと位置
    const margin = getScaledValue(10);
    const width = getScaledValue(120);
    const height = getScaledValue(35);
    const radius = getScaledValue(5);
    const textMargin = getScaledValue(8);
    
    // 背景
    fill(0, 0, 0, 100);
    noStroke();
    rect(margin, margin, width, height, radius);
    
    // スコアテキスト
    fill(uiConfig.colors.text);
    textSize(getScaledFont(uiConfig.fonts.small.size));
    text("SCORE", margin + textMargin, margin + getScaledValue(10));
    
    fill(255, 215, 0);
    textSize(getScaledFont(uiConfig.fonts.ui.size));
    text(gameConfig.player.score.toLocaleString(), margin + textMargin, margin + getScaledValue(25));
}

// ライフ・レベル表示
function drawLivesAndLevel() {
    textAlign(RIGHT, TOP);
    textFont('Delius');
    
    // スケールを考慮したサイズと位置
    const panelWidth = getScaledValue(130);
    const panelHeight = getScaledValue(50);
    const margin = getScaledValue(10);
    const radius = getScaledValue(5);
    const textMargin = getScaledValue(18);
    
    // 背景
    fill(0, 0, 0, 100);
    noStroke();
    rect(width - panelWidth, margin, getScaledValue(120), panelHeight, radius);
    
    // レベル表示
    fill(255, 255, 255);
    textSize(getScaledFont(12));
    text("LEVEL", width - textMargin, margin + getScaledValue(10));
    
    fill(100, 255, 100);
    textSize(getScaledFont(16));
    text(gameConfig.player.level, width - textMargin, margin + getScaledValue(20));
    
    // ライフ表示
    fill(255, 255, 255);
    textSize(getScaledFont(12));
    text("LIVES", width - textMargin, margin + getScaledValue(40));
    
    // ハート表示
    for (let i = 0; i < gameConfig.player.maxLives; i++) {
        let heartX = width - getScaledValue(25) - (i * getScaledValue(15));
        let heartY = margin + getScaledValue(58);
        
        if (i < gameConfig.player.lives) {
            fill(255, 100, 100); // 赤いハート（アクティブなライフ）
        } else {
            fill(80, 80, 80); // 灰色のハート（失ったライフ）
        }
        
        drawHeart(heartX, heartY, getScaledValue(6));
    }
}

// ポーズボタン
function drawPauseButton() {
    let btn = uiSystem.pauseButton;
    
    // ボタン背景
    if (isMouseOverPauseButton()) {
        fill(100, 100, 100, 150);
    } else {
        fill(0, 0, 0, 100);
    }
    
    stroke(255, 255, 255, 150);
    strokeWeight(getScaledValue(1));
    rect(btn.x, btn.y, btn.width, btn.height, getScaledValue(3));
    
    // ポーズアイコン（二本の縦線を中央に正確に配置）
    fill(255, 255, 255);
    noStroke();
    
    // ボタンの中心座標を直接計算
    let centerX = btn.x + btn.width * 0.5-getScaledValue(60);
    let centerY = btn.y + btn.height * 0.5-getScaledValue(15);
    
    // 線の幅と高さを定義（固定値でスケール対応）
    let lineWidth = getScaledValue(3);
    let lineHeight = getScaledValue(12);
    let gap = getScaledValue(3); // 2本の線の間のギャップ
    
    // 左の縦線
    rect(centerX - gap - lineWidth, centerY - lineHeight/2, lineWidth, lineHeight, getScaledValue(1));
    
    // 右の縦線
    rect(centerX + gap, centerY - lineHeight/2, lineWidth, lineHeight, getScaledValue(1));
}

// ミュートボタン
function drawMuteButton() {
    let btn = uiSystem.muteButton;
    
    // ボタン背景
    if (isMouseOverMuteButton()) {
        fill(100, 100, 100, 150);
    } else {
        fill(0, 0, 0, 100);
    }
    
    stroke(255, 255, 255, 150);
    strokeWeight(1);
    rect(btn.x, btn.y, btn.width, btn.height, 3);
    
    // サウンドアイコンの中央座標を正しく計算
    let centerX = btn.x + btn.width / 2-20;
    let centerY = btn.y + btn.height / 2-15;
    
    if (audioSystem.isMuted) {
        // ミュート状態：Xマーク（config色設定を使用）
        stroke(uiConfig.colors.warning);
        strokeWeight(2);
        noFill();
        line(centerX - 6, centerY - 6, centerX + 6, centerY + 6);
        line(centerX - 6, centerY + 6, centerX + 6, centerY - 6);
        noStroke();
    } else {
        // 音声ON：スピーカーアイコン
        noStroke();
        fill(uiConfig.colors.text);
        
        // スピーカー本体（矩形部分）
        rect(centerX - 8, centerY - 4, 6, 8);
        
        // スピーカーホーン部分（三角形）
        triangle(
            centerX - 2, centerY - 4,
            centerX - 2, centerY + 4, 
            centerX + 3, centerY
        );
        
        // 音波線（config色設定を使用）
        stroke(uiConfig.colors.accent);
        strokeWeight(1);
        noFill();
        // 内側の音波
        arc(centerX + 4, centerY, 8, 8, -PI/3, PI/3);
        // 外側の音波
        arc(centerX + 5, centerY, 12, 12, -PI/4, PI/4);
        noStroke();
    }
}

// ポーズオーバーレイ
function drawPauseOverlay() {
    // 半透明オーバーレイ
    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, width, height);
    
    // ポーズメッセージの背景（黒枠）
    const pauseText = "PAUSED";
    
    // テキスト設定
    textAlign(CENTER, CENTER);
    textFont('Delius');
    textSize(48);
    
    // テキストの実際の位置
    const textX = width / 2;
    const textY = height / 2 - 40;
    
    // 固定サイズの背景枠を画面中央に配置（横70%、縦50%）
    const bgWidth = width * 0.7;
    const bgHeight = height * 0.5;
    const bgX = width / 2;
    const bgY = height / 2;
    
    // 黒い背景枠を描画（CENTER モードで中央配置）
    rectMode(CENTER);
    fill(0, 0, 0, 200);
    noStroke();
    rect(bgX, bgY, bgWidth, bgHeight);
    
    // 白い枠線
    stroke(255, 255, 255);
    strokeWeight(2);
    noFill();
    rect(bgX, bgY, bgWidth, bgHeight);
    
    // rectMode を元に戻す
    rectMode(CORNER);
    
    // PAUSEDテキストを描画
    fill(255, 255, 255);
    noStroke();
    text(pauseText, textX, textY);
    
    // 操作説明テキスト
    let pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 150, 255);
    fill(255, 255, 255, pulseAlpha);
    textSize(18);
    
    if (inputSystem.isTouch) {
        text("TAP TO RESUME", width/2, height/2 + 20);
    } else {
        text("CLICK TO RESUME", width/2, height/2 + 20);
        text("or press ESC", width/2, height/2 + 45);
    }
}

// ゲームオーバー画面
function drawGameOver() {
    // 背景
    fill(0, 0, 0, 200);
    noStroke();
    rectMode(CORNER);
    rect(0, 0, width, height);
    
    textAlign(CENTER, CENTER);
    textFont('Delius');
    
    // ゲームオーバーテキスト
    fill(255, 50, 50);
    textSize(48);
    text("GAME OVER", width/2, height/2 - 80);
    
    // 最終スコア
    fill(255, 255, 255);
    textSize(20);
    text("Final Score: " + gameConfig.player.score.toLocaleString(), width/2, height/2 - 30);
    
    // ハイスコア更新通知
    if (gameConfig.player.score >= highScore) {
        fill(255, 215, 0);
        textSize(16);
        text("NEW HIGH SCORE!", width/2, height/2);
    }
    
    // リスタートメッセージ
    let pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 150, 255);
    fill(255, 255, 255, pulseAlpha);
    textSize(18);
    
    if (inputSystem.isTouch) {
        text("TAP TO RESTART", width/2, height/2 + 50);
    } else {
        text("CLICK TO RESTART", width/2, height/2 + 50);
    }
}

// ポーズボタン上マウス判定
function isMouseOverPauseButton() {
    let btn = uiSystem.pauseButton;
    let mx = inputSystem.isTouch ? (touches.length > 0 ? touches[0].x : 0) : mouseX;
    let my = inputSystem.isTouch ? (touches.length > 0 ? touches[0].y : 0) : mouseY;
    
    return mx >= btn.x && mx <= btn.x + btn.width &&
           my >= btn.y && my <= btn.y + btn.height;
}

// ミュートボタンマウスオーバー判定
function isMouseOverMuteButton() {
    let btn = uiSystem.muteButton;
    let mx = inputSystem.isTouch ? (touches.length > 0 ? touches[0].x : 0) : mouseX;
    let my = inputSystem.isTouch ? (touches.length > 0 ? touches[0].y : 0) : mouseY;
    
    return mx >= btn.x && mx <= btn.x + btn.width &&
           my >= btn.y && my <= btn.y + btn.height;
}

// ハート描画ヘルパー関数
function drawHeart(x, y, size) {
    push();
    translate(x, y);
    noStroke();
    // fill色は呼び出し元で設定されているので、ここでは設定しない
    
    // ハート形状を三角形と円で近似
    ellipse(-size/3, -size/4, size/2);
    ellipse(size/3, -size/4, size/2);
    triangle(-size/2, 0, size/2, 0, 0, size/2);
    
    pop();
}