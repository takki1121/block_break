// Block クラス - ブロック管理
// ブロックの描画、破壊アニメーション、アイテム生成を処理

class Block {
    constructor(x, y, color, isSpecial = false, itemType = null) {
        this.position = { x, y };
        this.width = blockLayout.width;
        this.height = blockLayout.height;
        this.color = color;
        this.isSpecial = isSpecial;
        this.itemType = itemType;
        this.isDestroyed = false;
        this.destroyAnimation = 0;
    }
    
    // ブロック描画
    draw() {
        if (this.isDestroyed && this.destroyAnimation <= 0) return;
        
        push();
        translate(this.position.x, this.position.y);
        
        if (this.destroyAnimation > 0) {
            // 破壊アニメーション
            let scaleValue = map(this.destroyAnimation, 30, 0, 1, 0);
            let alpha = map(this.destroyAnimation, 30, 0, 255, 0);
            
            scale(scaleValue);
            tint(255, alpha);
            this.destroyAnimation--;
        }
        
        // ブロック本体
        fill(this.color);
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        rectMode(CORNER);
        rect(0, 0, this.width, this.height, 3);
        
        // 特殊ブロックの模様
        if (this.isSpecial && this.itemType) {
            this.drawSpecialPattern();
        }
        
        // ブロックのハイライト
        fill(255, 255, 255, 100);
        noStroke();
        rect(2, 2, this.width - 4, 3, 2);
        
        pop();
    }
    
    // 特殊ブロックの模様描画
    drawSpecialPattern() {
        let centerX = this.width / 2;
        let centerY = this.height / 2;
        
        fill(255, 255, 255, 150);
        noStroke();
        
        switch(this.itemType) {
            case 'LIFE_UP':
                // ハート模様
                drawHeart(centerX, centerY, 8);
                break;
            case 'PADDLE_EXPAND':
                // 盾模様
                ellipse(centerX, centerY, 12);
                fill(this.color);
                ellipse(centerX, centerY, 8);
                break;
            case 'BALL_MULTIPLY':
                // 複数ボール模様
                ellipse(centerX - 3, centerY, 4);
                ellipse(centerX + 3, centerY, 4);
                ellipse(centerX, centerY - 3, 4);
                break;
            case 'SLOW_PENALTY':
                // 骸骨模様
                fill(255, 100, 100, 150);
                rect(centerX - 4, centerY - 2, 8, 4);
                break;
        }
    }
    
    // ブロック破壊（エフェクト追加 - フェーズ7）
    destroy() {
        if (!this.isDestroyed) {
            this.isDestroyed = true;
            this.destroyAnimation = 30; // 30フレームのアニメーション
            
            // 爆発エフェクト生成
            let centerX = this.position.x + this.width / 2;
            let centerY = this.position.y + this.height / 2;
            createBlockExplosion(centerX, centerY, this.color);
            
            // スコア加算（改善版）
            let blockType = this.isSpecial ? 'special' : 'normal';
            let earnedScore = scoreSystem.onBlockDestroy(blockType);
            console.log("ブロック破壊スコア:", earnedScore, "総スコア:", gameConfig.player.score);
            
            // 特殊ブロックならアイテム生成
            if (this.isSpecial && this.itemType) {
                this.spawnItem();
            }
            
            return true;
        }
        return false;
    }
    
    // アイテム生成
    spawnItem() {
        // アイテム生成確率チェック
        let spawnChance = random(100);
        let shouldSpawn = false;
        
        if (this.itemType === 'SLOW_PENALTY') {
            shouldSpawn = spawnChance < 70; // ペナルティは70%で出現
        } else {
            shouldSpawn = spawnChance < 50; // 良いアイテムは50%で出現
        }
        
        if (shouldSpawn) {
            let item = new Item(
                this.position.x + this.width/2,
                this.position.y + this.height/2,
                this.itemType
            );
            items.push(item);
        }
    }
    
    // 境界取得（衝突判定用）
    getBounds() {
        return {
            left: this.position.x,
            right: this.position.x + this.width,
            top: this.position.y,
            bottom: this.position.y + this.height
        };
    }
}