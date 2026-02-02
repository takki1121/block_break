// Paddle クラス - パドル管理
// パドルの位置、入力処理、描画、効果管理を処理

/**
 * パドルクラス
 * プレイヤーが操作するパドルオブジェクトを管理
 * 
 * @class
 * @description 入力システムと連携した位置更新、
 * アイテム効果の適用と管理、視覚的なフィードバック表示を処理
 */
class Paddle {
    /**
     * Paddleコンストラクタ
     * @param {number} [x=width/2] - 初期X座標
     * @param {number} [y=height-50] - 初期Y座標
     */
    constructor(x, y) {
        this.position = { x: x || width/2, y: y || height - 50 };
        this.width = gameConfig.paddle.width;
        this.height = gameConfig.paddle.height;
        this.isExpanded = false;
        this.isSlowed = false;
        this.expandTimer = 0;
        this.slowTimer = 0;
        this.baseSpeed = 1.0;
        this.color = color(100, 200, 255);
    }
    
    // パドル更新（入力システム対応）
    update() {
        // 統一入力システムから位置取得
        let targetX = inputSystem.currentInputX;
        
        // 速度制限適用
        let speed = this.baseSpeed;
        if (this.isSlowed) speed *= 0.5;
        
        // 入力デバイスに応じた応答性調整
        let responsiveness = inputSystem.isTouch ? 0.25 : 0.15;
        this.position.x = lerp(this.position.x, targetX, responsiveness * speed);
        
        // 効果時間管理
        if (this.isExpanded) {
            this.expandTimer--;
            if (this.expandTimer <= 0) {
                this.isExpanded = false;
                this.width = gameConfig.paddle.width;
            }
        }
        
        if (this.isSlowed) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
            }
        }
    }
    
    // パドル描画
    draw() {
        let paddleColor = this.color;
        
        // 効果に応じて色変更
        if (this.isExpanded) {
            paddleColor = color(100, 255, 100); // 緑色（拡大中）
        } else if (this.isSlowed) {
            paddleColor = color(255, 100, 100); // 赤色（速度低下中）
        }
        
        // パドル本体
        fill(paddleColor);
        stroke(255);
        strokeWeight(2);
        rectMode(CENTER);
        rect(this.position.x, this.position.y, this.width, this.height, 5);
        
        // パドル上部のハイライト
        fill(255, 255, 255, 100);
        noStroke();
        rect(this.position.x, this.position.y - 2, this.width - 4, 3, 3);
        
        // 効果時間表示
        if (this.isExpanded || this.isSlowed) {
            this.drawEffectTimer();
        }
    }
    
    // 効果時間バー描画
    drawEffectTimer() {
        let barWidth = this.width;
        let barHeight = 3;
        let barY = this.position.y + this.height/2 + 8;
        
        // 背景バー
        fill(50, 50, 50);
        noStroke();
        rectMode(CENTER);
        rect(this.position.x, barY, barWidth, barHeight);
        
        // 進行バー
        let progress = 0;
        let effectColor = color(255);
        
        if (this.isExpanded) {
            progress = this.expandTimer / (gameConfig.paddle.expandDuration / 16.67); // 60FPS換算
            effectColor = color(100, 255, 100);
        } else if (this.isSlowed) {
            progress = this.slowTimer / (gameConfig.paddle.slowDuration / 16.67);
            effectColor = color(255, 100, 100);
        }
        
        fill(effectColor);
        rect(this.position.x - barWidth/2 + (barWidth * progress)/2, barY, barWidth * progress, barHeight);
    }
    
    // パドル拡大効果
    expandPaddle() {
        this.isExpanded = true;
        this.width = gameConfig.paddle.expandedWidth;
        this.expandTimer = gameConfig.paddle.expandDuration / 16.67; // フレーム数に変換
    }
    
    // パドル速度低下効果
    slowPaddle() {
        this.isSlowed = true;
        this.slowTimer = gameConfig.paddle.slowDuration / 16.67; // フレーム数に変換
    }
    
    // 境界取得（衝突判定用）
    getBounds() {
        return {
            left: this.position.x - this.width/2,
            right: this.position.x + this.width/2,
            top: this.position.y - this.height/2,
            bottom: this.position.y + this.height/2
        };
    }
}