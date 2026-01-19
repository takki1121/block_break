// ブロック崩しゲーム - 設定ファイル
// ゲームの各種設定、定数、レイアウト設定を管理

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
        baseWidth: 80,
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
    specialBlockRatio: 0.35
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

// 難易度スケーリング設定
const difficultyConfig = {
    ball: {
        baseSpeed: 5,
        speedIncreasePerLevel: 0.5,
        maxSpeed: 9
    },
    paddle: {
        widthDecreaseInterval: 2,
        widthDecrease: 5,
        minWidth: 60
    },
    blocks: {
        baseRows: 4,
        maxRows: 6,
        rowIncreaseInterval: 3
    },
    specialBlocks: {
        baseRatio: 0.35,
        ratioIncreasePerLevel: 0.03,
        maxRatio: 0.6
    }
};

// ビジュアルエフェクト設定
const visualConfig = {
    particles: {
        maxCount: 50,
        defaultLife: 60,
        defaultSize: 3
    },
    trails: {
        ballTrailLength: 10,
        fadeRate: 0.8
    },
    animations: {
        transitionDuration: 500,
        fadeSpeed: 0.05
    }
};

// 入力システム設定
const inputConfig = {
    smoothing: 0.15,
    touchDebounce: 100, // ms
    mouseSensitivity: 1.0,
    touchSensitivity: 1.2
};

// UI設定
const uiConfig = {
    pauseButton: {
        width: 120,
        height: 50,
        margin: 10
    },
    muteButton: {
        width: 40,
        height: 30,
        margin: 10,
        scoreMargin: 140  // スコア表示（10px + 120px + 10px間隔）の右隣
    },
    fonts: {
        title: { size: 48, family: 'Delius' },
        subtitle: { size: 24, family: 'Delius' },
        ui: { size: 16, family: 'Delius' },
        small: { size: 12, family: 'Delius' }
    },
    colors: {
        background: '#1a1a1a',
        text: '#ffffff',
        accent: '#4ECDC4',
        warning: '#FF6B6B',
        success: '#96CEB4'
    }
};