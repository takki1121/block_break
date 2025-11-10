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
        switch(this.type) {
            case 'LIFE_UP':
                fill(255, 120, 120);
                stroke(255, 200, 200);
                strokeWeight(2);
                drawHeart(0, 0, this.size/2);
                
                // ハートの輝き
                fill(255, 255, 255, 100);
                noStroke();
                drawHeart(-1, -1, this.size/3);
                break;
                
            case 'PADDLE_EXPAND':
                fill(120, 255, 120);
                stroke(200, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                
                fill(80, 220, 80);
                ellipse(0, 0, this.size * 0.7);
                
                // 中心の輝き
                fill(255, 255, 255, 120);
                noStroke();
                ellipse(0, 0, this.size * 0.3);
                break;
                
            case 'BALL_MULTIPLY':
                fill(255, 255, 120);
                stroke(255, 255, 200);
                strokeWeight(2);
                ellipse(0, 0, this.size);
                
                fill(220, 220, 100);
                ellipse(-3, 0, this.size * 0.6);
                ellipse(3, 0, this.size * 0.6);
                
                // 輝きエフェクト
                fill(255, 255, 255, 100);
                noStroke();
                ellipse(0, 0, this.size * 0.4);
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
                // 将来的にボール複製実装
                gameConfig.player.score += 50; // とりあえずボーナススコア
                break;
            case 'SLOW_PENALTY':
                paddle.slowPaddle();
                break;
        }
    }
}