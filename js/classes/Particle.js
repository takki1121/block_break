// Particle クラス - パーティクル管理
// パーティクルシステムによる視覚効果を処理

class Particle {
    constructor(x, y, vx, vy, color, life = 60, size = 3) {
        this.reset(x, y, vx, vy, color, life, size);
    }

    // プール再利用時に初期化
    reset(x, y, vx, vy, color, life = 60, size = 3) {
        this.position = { x, y };
        this.velocity = { vx: vx || random(-2, 2), vy: vy || random(-2, 2) };
        this.color = color || [255, 255, 255];
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0.1;
        this.friction = 0.98;
        this.type = 'normal';
    }
    
    // パーティクル更新
    update() {
        // 位置更新
        this.position.x += this.velocity.vx;
        this.position.y += this.velocity.vy;
        
        // 物理演算
        this.velocity.vy += this.gravity;
        this.velocity.vx *= this.friction;
        this.velocity.vy *= this.friction;
        
        // ライフ減少
        this.life--;
        
        return this.life > 0;
    }
    
    // パーティクル描画
    draw() {
        let alpha = map(this.life, 0, this.maxLife, 0, 255);
        let currentSize = map(this.life, 0, this.maxLife, 0, this.size);
        
        push();
        translate(this.position.x, this.position.y);
        
        // パーティクルのタイプに応じた描画
        switch(this.type) {
            case 'explosion':
                this.drawExplosion(alpha, currentSize);
                break;
            case 'sparkle':
                this.drawSparkle(alpha, currentSize);
                break;
            case 'trail':
                this.drawTrail(alpha, currentSize);
                break;
            default:
                this.drawNormal(alpha, currentSize);
        }
        
        pop();
    }
    
    // 通常パーティクル描画
    drawNormal(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha);
        noStroke();
        ellipse(0, 0, size);
    }
    
    // 爆発パーティクル描画
    drawExplosion(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha);
        noStroke();
        
        // 複数の円で爆発効果
        for (let i = 0; i < 3; i++) {
            let offset = i * 2;
            ellipse(random(-offset, offset), random(-offset, offset), size - i);
        }
    }
    
    // きらきらパーティクル描画
    drawSparkle(alpha, size) {
        stroke(this.color[0], this.color[1], this.color[2], alpha);
        strokeWeight(2);
        
        // 十字の線
        line(-size/2, 0, size/2, 0);
        line(0, -size/2, 0, size/2);
        
        // 対角線
        line(-size/3, -size/3, size/3, size/3);
        line(-size/3, size/3, size/3, -size/3);
    }
    
    // 軌跡パーティクル描画
    drawTrail(alpha, size) {
        fill(this.color[0], this.color[1], this.color[2], alpha * 0.7);
        noStroke();
        ellipse(0, 0, size);
        
        // 内側のハイライト
        fill(255, 255, 255, alpha * 0.3);
        ellipse(-1, -1, size * 0.6);
    }
}