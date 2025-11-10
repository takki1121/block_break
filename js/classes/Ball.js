// Ball クラス - ボール管理
// ボールの位置、速度、描画、衝突判定を管理

class Ball {
    constructor(x, y, vx, vy) {
        this.position = { x: x || width/2, y: y || height - 100 };
        this.velocity = { vx: vx || 5, vy: vy || -5 };
        this.radius = 8;
        this.trail = []; // 残像効果用
        this.maxTrailLength = 8;
        this.color = color(255, 255, 100);
    }
    
    // ボール位置更新
    update() {
        // 残像追加
        this.trail.push({ x: this.position.x, y: this.position.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 位置更新
        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;
        
        // 壁衝突判定
        this.checkWallCollision();
    }
    
    // ボール描画（改良版 - フェーズ7）
    draw() {
        // 改良された残像描画
        this.drawTrail();
        
        // メインボール描画
        this.drawMainBall();
        
        // 動的軌跡パーティクル生成
        if (frameCount % 3 === 0) {
            createParticle(
                this.position.x + random(-2, 2),
                this.position.y + random(-2, 2),
                random(-0.5, 0.5),
                random(-0.5, 0.5),
                [255, 255, 150],
                15,
                3,
                'trail'
            );
        }
    }
    
    // 残像描画
    drawTrail() {
        for (let i = 0; i < this.trail.length; i++) {
            let progress = i / (this.trail.length - 1);
            let alpha = map(progress, 0, 1, 20, 180);
            let size = map(progress, 0, 1, this.radius * 0.2, this.radius * 0.9);
            
            // グラデーション効果
            let r = 255;
            let g = 255 - (100 * (1 - progress));
            let b = 100 + (100 * progress);
            
            fill(r, g, b, alpha);
            noStroke();
            ellipse(this.trail[i].x, this.trail[i].y, size * 2);
        }
    }
    
    // メインボール描画
    drawMainBall() {
        push();
        translate(this.position.x, this.position.y);
        
        // 外側のグロー効果
        for (let i = 0; i < 3; i++) {
            fill(255, 255, 100, 30 - i * 10);
            noStroke();
            ellipse(0, 0, (this.radius + i * 2) * 2);
        }
        
        // メインボール
        fill(this.color);
        stroke(255, 255, 255, 200);
        strokeWeight(2);
        ellipse(0, 0, this.radius * 2);
        
        // 内部ハイライト
        fill(255, 255, 255, 180);
        noStroke();
        ellipse(-2, -2, this.radius * 0.8);
        
        // 中心の輝き
        fill(255, 255, 255, 100);
        ellipse(0, 0, this.radius * 0.4);
        
        pop();
    }
    
    // 壁衝突判定と反射処理
    checkWallCollision() {
        let bounced = false;
        
        // 左右の壁
        if (this.position.x - this.radius <= 10) {
            this.position.x = 10 + this.radius;
            this.velocity.vx = Math.abs(this.velocity.vx);
            bounced = true;
        } else if (this.position.x + this.radius >= width - 10) {
            this.position.x = width - 10 - this.radius;
            this.velocity.vx = -Math.abs(this.velocity.vx);
            bounced = true;
        }
        
        // 上の壁
        if (this.position.y - this.radius <= 90) {
            this.position.y = 90 + this.radius;
            this.velocity.vy = Math.abs(this.velocity.vy);
            bounced = true;
        }
        
        // 下の壁（ライフ減少）
        if (this.position.y - this.radius >= height - 30) {
            this.onBottomHit();
        }
        
        return bounced;
    }
    
    // 底に到達した時の処理
    onBottomHit() {
        loseLife(); // 改善されたライフ減少処理を使用
    }
    
    // ボールリセット
    reset() {
        this.position.x = width/2;
        this.position.y = height - 100;
        this.velocity.vx = random(-5, 5);
        this.velocity.vy = -5;
        this.trail = [];
    }
}