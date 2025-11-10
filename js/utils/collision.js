// 衝突判定ユーティリティ
// 各種衝突判定ロジック、物理演算の処理

// 衝突判定メイン関数
function checkCollisions() {
    if (balls.length === 0 || !paddle) return;
    
    // すべてのボールに対して衝突判定
    balls.forEach(ball => {
        // ボール vs パドル衝突判定
        checkBallPaddleCollision(ball);
        
        // ボール vs ブロック衝突判定
        checkBallBlockCollision(ball);
    });
}

// ボール vs パドル衝突判定
function checkBallPaddleCollision(ball) {
    let paddleBounds = paddle.getBounds();
    
    if (ball.position.x + ball.radius > paddleBounds.left &&
        ball.position.x - ball.radius < paddleBounds.right &&
        ball.position.y + ball.radius > paddleBounds.top &&
        ball.position.y - ball.radius < paddleBounds.bottom &&
        ball.velocity.vy > 0) { // 下向きの時のみ
        
        // 反射角度計算（パドルのどの部分に当たったかで変わる）
        let hitPos = (ball.position.x - paddle.position.x) / (paddle.width / 2);
        hitPos = constrain(hitPos, -1, 1);
        
        // 新しい速度設定
        ball.velocity.vx = hitPos * 4; // 横方向の速度
        ball.velocity.vy = -Math.abs(ball.velocity.vy); // 上向きに反射
        
        // ボールがパドルに埋まらないように位置調整
        ball.position.y = paddleBounds.top - ball.radius;
    }
}

// ボール vs ブロック衝突判定（改善版）
function checkBallBlockCollisionImproved(ball) {
    let collisionDetected = false;
    
    for (let i = 0; i < blocks.length && !collisionDetected; i++) {
        let block = blocks[i];
        if (block.isDestroyed) continue;
        
        let bounds = block.getBounds();
        
        // より精密な矩形 vs 円の衝突判定
        if (isCircleRectCollision(ball.position.x, ball.position.y, ball.radius, bounds)) {
            
            // 衝突面の正確な判定
            let collision = getCollisionSide(ball.position.x, ball.position.y, ball.radius, bounds);
            
            // 反射処理
            if (collision.horizontal) {
                ball.velocity.vx = -ball.velocity.vx;
                // ボール位置補正
                if (collision.side === 'left') {
                    ball.position.x = bounds.left - ball.radius;
                } else if (collision.side === 'right') {
                    ball.position.x = bounds.right + ball.radius;
                }
            }
            
            if (collision.vertical) {
                ball.velocity.vy = -ball.velocity.vy;
                // ボール位置補正
                if (collision.side === 'top') {
                    ball.position.y = bounds.top - ball.radius;
                } else if (collision.side === 'bottom') {
                    ball.position.y = bounds.bottom + ball.radius;
                }
            }
            
            // ブロック破壊処理
            if (block.destroy()) {
                console.log("ブロック破壊 - スコア:", gameConfig.player.score);
                collisionDetected = true; // 重要: 一度に一つのブロックのみ処理
            }
        }
    }
}

// 円と矩形の衝突判定
function isCircleRectCollision(circleX, circleY, radius, rect) {
    // 最も近い点を見つける
    let closestX = constrain(circleX, rect.left, rect.right);
    let closestY = constrain(circleY, rect.top, rect.bottom);
    
    // 距離を計算
    let distanceX = circleX - closestX;
    let distanceY = circleY - closestY;
    let distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < (radius * radius);
}

// 衝突面判定
function getCollisionSide(circleX, circleY, radius, rect) {
    let result = { horizontal: false, vertical: false, side: '' };
    
    // 中心位置での判定
    let centerX = rect.left + (rect.right - rect.left) / 2;
    let centerY = rect.top + (rect.bottom - rect.top) / 2;
    
    let dx = circleX - centerX;
    let dy = circleY - centerY;
    
    let width = (rect.right - rect.left) / 2;
    let height = (rect.bottom - rect.top) / 2;
    
    let crossWidth = width * dy;
    let crossHeight = height * dx;
    
    if (Math.abs(crossWidth) > Math.abs(crossHeight)) {
        // 上下の衝突
        result.vertical = true;
        result.side = crossWidth > 0 ? 'bottom' : 'top';
    } else {
        // 左右の衝突
        result.horizontal = true;
        result.side = crossHeight > 0 ? 'right' : 'left';
    }
    
    return result;
}

// 旧関数（互換性のため）
function checkBallBlockCollision(ball) {
    checkBallBlockCollisionImproved(ball);
}

// 全衝突判定チェック
function checkAllCollisions() {
    // ボール vs パドル衝突判定
    checkBallPaddleCollision();
    
    // ボール vs ブロック衝突判定（改善版）
    checkBallBlockCollisionImproved();
}