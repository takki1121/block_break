// Item クラス - アイテム管理
// アイテムの描画、アニメーション、効果適用を処理

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
        // 背景円を描画（画像の視認性向上）
        let bgColor = this.getAuraColor();
        fill(bgColor[0], bgColor[1], bgColor[2], 100);
        noStroke();
        ellipse(0, 0, this.size + 4);
        
        // アイテム画像を描画
        let imageName = this.getImageName();
        if (itemImages && itemImages[imageName]) {
            // 画像を中央に配置
            imageMode(CENTER);
            tint(255, 200); // 少し透明度を下げて柔らかく
            image(itemImages[imageName], 0, 0, this.size, this.size);
            noTint(); // tintをリセット
        } else {
            // 画像が読み込まれていない場合はフォールバック描画
            this.drawFallbackItem();
        }
    }
    
    // 画像名取得
    getImageName() {
        switch(this.type) {
            case 'LIFE_UP': return 'hp';
            case 'PADDLE_EXPAND': return 'shield';
            case 'BALL_MULTIPLY': return 'ball';
            case 'SLOW_PENALTY': return 'skull';
            default: return 'hp';
        }
    }
    
    // フォールバック描画（画像が読み込まれない場合）
    drawFallbackItem() {
        switch(this.type) {
            case 'LIFE_UP':
                fill(255, 120, 120);
                stroke(255, 200, 200);
                strokeWeight(2);
                // ハート形状を近似
                ellipse(-3, -2, 6);
                ellipse(3, -2, 6);
                triangle(-6, 2, 6, 2, 0, 8);
                break;
                
            case 'PADDLE_EXPAND':
                fill(120, 255, 120);
                stroke(200, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                fill(80, 220, 80);
                ellipse(0, 0, this.size * 0.7);
                break;
                
            case 'BALL_MULTIPLY':
                fill(255, 255, 120);
                stroke(255, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                fill(220, 220, 100);
                ellipse(-3, 0, this.size * 0.6);
                ellipse(3, 0, this.size * 0.6);
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
                // ボール増殖実装
                multiplyBalls();
                gameConfig.player.score += 100; // ボーナススコア
                console.log("ボール増殖アイテム取得！現在のボール数:", balls.length);
                break;
            case 'SLOW_PENALTY':
                paddle.slowPaddle();
                break;
        }
    }
}