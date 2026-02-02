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
        
        // 特殊ブロックは太い枠線で区別
        if (this.isSpecial && this.itemType) {
            stroke(255, 255, 0, 200); // 黄色の枠線
            strokeWeight(2);
        } else {
            stroke(255, 255, 255, 150);
            strokeWeight(1);
        }
        
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
    
    // 特殊ブロックの模様描画（アイテム画像を表示）
    drawSpecialPattern() {
        let centerX = this.width / 2;
        let centerY = this.height / 2;
        
        // アイテム画像を取得
        let imageName = this.getItemImageName();
        
        // 画像が読み込まれている場合は画像を表示
        if (itemImages && itemImages[imageName]) {
            imageMode(CENTER);
            tint(255, 200); // 半透明で表示
            image(itemImages[imageName], centerX, centerY, 16, 16);
            noTint();
        } else {
            // 画像が読み込まれていない場合はフォールバック（図形）
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
    }
    
    // アイテム画像名を取得
    getItemImageName() {
        switch(this.itemType) {
            case 'LIFE_UP': return 'hp';
            case 'PADDLE_EXPAND': return 'shield';
            case 'BALL_MULTIPLY': return 'ball';
            case 'SLOW_PENALTY': return 'skull';
            default: return '';
        }
    }
    
    // ブロック破壊（エフェクト追加 - フェーズ7）
    destroy() {
        if (!this.isDestroyed) {
            this.isDestroyed = true;
            this.destroyAnimation = 30; // 30フレームのアニメーション
            
            // ブロック破壊音
            audioSystem.playSound('hakai', 0.8);
            
            // 爆発エフェクト生成
            let centerX = this.position.x + this.width / 2;
            let centerY = this.position.y + this.height / 2;
            createBlockExplosion(centerX, centerY, this.color);
            
            // スコア加算（改善版）
            let blockType = this.isSpecial ? 'special' : 'normal';
            let earnedScore = scoreSystem.onBlockDestroy(blockType);
            
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
        // デバッグ情報
        // 特殊ブロック破壊ログは出力しない
        
        // テスト用：アイテムを必ず生成（確率を100%に設定）
        let shouldSpawn = true;
        
        // 本来の確率システム（デバッグ後に使用）
        /*
        let spawnChance = random(100);
        let shouldSpawn = false;
        
        if (this.itemType === 'SLOW_PENALTY') {
            shouldSpawn = spawnChance < 80; // ペナルティは80%で出現
        } else {
            shouldSpawn = spawnChance < 75; // 良いアイテムは75%で出現
        }
            // アイテム生成確率ログは省略
        */
        
        if (shouldSpawn) {
            let item = new Item(
                this.position.x + this.width/2,
                this.position.y + this.height/2,
                this.itemType
            );
            items.push(item);
        } else {
            // アイテムが出現しなかった場合もログは出さない
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