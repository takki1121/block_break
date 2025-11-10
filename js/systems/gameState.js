// ゲーム状態管理システム
// ゲームの状態遷移、スコア管理、UI表示を処理

// グローバル変数
let currentState;
let gameStarted = false;
let gameStartTime;
let pauseStartTime;
let totalPauseTime = 0;

// ゲームオブジェクト
let balls = []; // ボール配列に変更
let paddle;
let blocks = [];  
let items = [];

// ビジュアルエフェクトシステム
let particles = [];
let maxParticles = 50;

// アイテム画像
let itemImages = {};

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

// スコアシステム
const scoreSystem = {
    baseScore: {
        normal: 10,
        special: 20,
        levelClear: 100
    },
    
    // ブロック破壊時のスコア計算
    onBlockDestroy(blockType) {
        let points = this.baseScore[blockType] || this.baseScore.normal;
        points *= scoreMultiplier;
        
        gameConfig.player.score += points;
        this.updateHighScore();
        
        return points;
    },
    
    // レベルクリア時のスコア加算
    onLevelClear() {
        let bonus = this.baseScore.levelClear * gameConfig.player.level;
        gameConfig.player.score += bonus;
        this.updateHighScore();
        
        return bonus;
    },
    
    // ハイスコア更新
    updateHighScore() {
        if (gameConfig.player.score > highScore) {
            highScore = gameConfig.player.score;
            localStorage.setItem('blockBreakHighScore', highScore);
        }
    },
    
    // ハイスコア読み込み
    loadHighScore() {
        let saved = localStorage.getItem('blockBreakHighScore');
        highScore = saved ? parseInt(saved) : 0;
    }
};

// 初期化関数
function initializeGameState() {
    currentState = GAME_STATE.OPENING;
    scoreSystem.loadHighScore();
    
    // UI システムの初期化
    uiSystem.pauseButton.x = width - uiSystem.pauseButton.width - 10;
    uiSystem.pauseButton.y = 10;
}

// ゲーム初期化
function initializeGame() {
    // プレイヤーデータリセット
    gameConfig.player.score = 0;
    gameConfig.player.lives = gameConfig.player.maxLives;
    gameConfig.player.level = 1;
    
    // ゲームオブジェクト生成
    balls = [new Ball()]; // ボール配列に1個のボールを追加
    paddle = new Paddle();
    generateBlocks();
    
    // システム初期化
    particles = [];
    items = [];
    inputSystem.currentInputX = width / 2;
    inputSystem.targetInputX = width / 2;
    
    gameStarted = true;
}

// レベル初期化
function initializeLevel() {
    // 新しいブロック配置生成
    generateBlocks();
    
    // ボールリセット（1個に戻す）
    balls = [new Ball()];
    
    // パーティクル・アイテムクリア
    particles = [];
    items = [];
    
    console.log("レベル", gameConfig.player.level, "開始");
}

// ライフ減少処理
function loseLife() {
    gameConfig.player.lives--;
    
    if (gameConfig.player.lives <= 0) {
        gameStateManager.changeState(GAME_STATE.GAME_OVER);
    } else {
        // ボールを1個にリセット
        balls = [new Ball()];
        // ライフ減少エフェクト
        createLifeLossEffect();
    }
}

// レベルクリア判定
function checkLevelClear() {
    let remainingBlocks = blocks.filter(block => !block.isDestroyed).length;
    
    if (remainingBlocks === 0) {
        // レベルクリアボーナス
        let bonus = scoreSystem.onLevelClear();
        
        // レベルアップ
        gameConfig.player.level++;
        
        gameStateManager.changeState(GAME_STATE.LEVEL_CLEAR);
        
        // レベルクリアエフェクト
        createLevelClearEffect();
        
        console.log("レベルクリア！ボーナス:", bonus);
        
        // 一定時間後に次のレベルに移行
        setTimeout(() => {
            if (currentState === GAME_STATE.LEVEL_CLEAR) {
                gameStateManager.changeState(GAME_STATE.PLAYING);
            }
        }, 2000);
    }
}