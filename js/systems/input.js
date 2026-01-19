// 入力システム
// マウス・タッチ入力の統一処理、デバイス判定、座標正規化を管理

// 入力座標更新関数
function updateInputCoordinates() {
    // スケール変更時に入力座標を正規化
    inputSystem.currentInputX = constrain(inputSystem.currentInputX, 0, width);
    inputSystem.targetInputX = constrain(inputSystem.targetInputX, 0, width);
}

// 入力システム初期化
function initializeInputSystem() {
    inputSystem.currentInputX = width / 2;
    inputSystem.targetInputX = width / 2;
    inputSystem.isTouch = false;
    inputSystem.lastTouchTime = 0;
}

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
    // ミュートボタンのクリック判定（ゲームオーバー時は無効）
    if (currentState !== GAME_STATE.GAME_OVER && isMouseOverMuteButton()) {
        audioSystem.toggleMute();
        audioSystem.playSound('click', 0.3); // ミュート切り替え音
        return;
    }
    
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

// キーボード入力処理
function keyPressed() {
    // ESCキーでポーズ切り替え
    if (key === 'Escape' || keyCode === 27) {
        if (currentState === GAME_STATE.PLAYING) {
            gameStateManager.changeState(GAME_STATE.PAUSED);
        } else if (currentState === GAME_STATE.PAUSED) {
            gameStateManager.changeState(GAME_STATE.PLAYING);
        }
    }
    
    // スペースキーでゲーム開始・リスタート
    if (key === ' ' || keyCode === 32) {
        handleGameInput();
    }

    // デバッグモード切り替え
    if (key === 'd' || key === 'D') {
        DEBUG_MODE = !DEBUG_MODE;
    }
    
    return false;
}