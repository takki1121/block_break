// エフェクトシステム
// パーティクル管理、視覚エフェクト、アニメーション処理

// エフェクトシステム初期化
function initializeEffects() {
    particles = [];
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
    
    // 輝きパーティクル
    for (let i = 0; i < 4; i++) {
        createParticle(
            x + random(-15, 15),
            y + random(-10, 10),
            random(-1, 1),
            random(-2, 0),
            [255, 255, 200],
            random(20, 35),
            random(2, 5),
            'sparkle'
        );
    }
}

// アイテム効果エフェクト
function createItemEffect(x, y, itemType) {
    let effectColor = getItemEffectColor(itemType);
    let particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        let angle = (i * TWO_PI) / particleCount;
        let speed = random(1, 3);
        let vx = cos(angle) * speed;
        let vy = sin(angle) * speed;
        
        createParticle(
            x, y, vx, vy,
            effectColor,
            random(40, 60),
            random(3, 6),
            'sparkle'
        );
    }
}

// アイテム効果色取得
function getItemEffectColor(itemType) {
    switch(itemType) {
        case 'LIFE_UP': return [255, 120, 120];
        case 'PADDLE_EXPAND': return [120, 255, 120];
        case 'BALL_MULTIPLY': return [255, 255, 120];
        case 'SLOW_PENALTY': return [255, 70, 70];
        default: return [255, 255, 255];
    }
}

// 状態遷移エフェクト
function createStateTransitionEffect(newState) {
    switch(newState) {
        case GAME_STATE.PLAYING:
            createTransitionSparkles();
            break;
        case GAME_STATE.GAME_OVER:
            createGameOverEffect();
            break;
        case GAME_STATE.LEVEL_CLEAR:
            createLevelClearEffect();
            break;
    }
}

// 遷移時のきらきらエフェクト
function createTransitionSparkles() {
    for (let i = 0; i < 20; i++) {
        createParticle(
            random(width),
            random(height),
            random(-2, 2),
            random(-2, 2),
            [255, 255, 255],
            random(30, 50),
            random(2, 4),
            'sparkle'
        );
    }
}

// ゲームオーバーエフェクト
function createGameOverEffect() {
    // 画面全体に暗いパーティクル
    for (let i = 0; i < 30; i++) {
        createParticle(
            random(width),
            random(height/2),
            random(-1, 1),
            random(1, 3),
            [100, 50, 50],
            random(60, 90),
            random(3, 7),
            'explosion'
        );
    }
}

// レベルクリアエフェクト
function createLevelClearEffect() {
    // 画面上部から金色のパーティクル
    for (let i = 0; i < 50; i++) {
        createParticle(
            random(width),
            random(-50, 50),
            random(-2, 2),
            random(2, 5),
            [255, 215, 0],
            random(80, 120),
            random(4, 8),
            'sparkle'
        );
    }
}

// ライフ減少エフェクト
function createLifeLossEffect() {
    // パドル周辺に赤いパーティクル
    if (paddle) {
        for (let i = 0; i < 15; i++) {
            createParticle(
                paddle.position.x + random(-30, 30),
                paddle.position.y + random(-10, 10),
                random(-3, 3),
                random(-2, 1),
                [255, 100, 100],
                random(40, 60),
                random(3, 6),
                'explosion'
            );
        }
    }
}

// パーティクルシステム更新
function updateParticles() {
    // パーティクル更新（逆順で処理して安全に削除）
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        
        if (!particle.update()) {
            // ライフが尽きたパーティクルを削除
            particles.splice(i, 1);
        }
    }
}

// 全パーティクル描画
function drawAllParticles() {
    particles.forEach(particle => {
        particle.draw();
    });
}

// パーティクルクリア
function clearParticles() {
    particles = [];
}

// パーティクル統計取得
function getParticleStats() {
    return {
        count: particles.length,
        maxCount: maxParticles,
        types: particles.reduce((stats, p) => {
            stats[p.type] = (stats[p.type] || 0) + 1;
            return stats;
        }, {})
    };
}