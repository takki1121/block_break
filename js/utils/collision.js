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
        
        // ボール反射音
        audioSystem.playSound('reflect', 0.5);
        
        // ボールがパドルに埋まらないように位置調整
        ball.position.y = paddleBounds.top - ball.radius;
    }
}

// ボール vs ブロック衝突判定（グリッド範囲限定版）
function checkBallBlockCollisionImproved(ball) {
    let collisionDetected = false;
    
    // ブロックグリッドが未構築の場合はフォールバック
    if (!blockGrid || blockGrid.length === 0) {
        return legacyBallBlockCollision(ball);
    }
    
    const minCol = Math.max(0, Math.floor((ball.position.x - ball.radius - blockOrigin.x) / blockCell.w));
    const maxCol = Math.min(blockLayout.cols - 1, Math.floor((ball.position.x + ball.radius - blockOrigin.x) / blockCell.w));
    const minRow = Math.max(0, Math.floor((ball.position.y - ball.radius - blockOrigin.y) / blockCell.h));
    const maxRow = Math.min(blockLayout.rows - 1, Math.floor((ball.position.y + ball.radius - blockOrigin.y) / blockCell.h));
    
    for (let row = minRow; row <= maxRow && !collisionDetected; row++) {
        if (!blockGrid[row]) continue;
        for (let col = minCol; col <= maxCol && !collisionDetected; col++) {
            const block = blockGrid[row][col];
            if (!block || block.isDestroyed) continue;
            
            const bounds = block.getBounds();
            if (!isCircleRectCollision(ball.position.x, ball.position.y, ball.radius, bounds)) continue;
            
            const collision = getCollisionSide(ball.position.x, ball.position.y, ball.radius, bounds);
            
            if (collision.horizontal) {
                ball.velocity.vx = -ball.velocity.vx;
                ball.position.x = collision.side === 'left' ? bounds.left - ball.radius : bounds.right + ball.radius;
            }
            if (collision.vertical) {
                ball.velocity.vy = -ball.velocity.vy;
                ball.position.y = collision.side === 'top' ? bounds.top - ball.radius : bounds.bottom + ball.radius;
            }
            
            if (block.destroy()) {
                collisionDetected = true; // 一度に一つのブロックのみ
            }
        }
    }
}

// 全探索フォールバック（グリッド未生成時のみ使用）
function legacyBallBlockCollision(ball) {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.isDestroyed) continue;
        const bounds = block.getBounds();
        if (!isCircleRectCollision(ball.position.x, ball.position.y, ball.radius, bounds)) continue;
        const collision = getCollisionSide(ball.position.x, ball.position.y, ball.radius, bounds);
        if (collision.horizontal) ball.velocity.vx = -ball.velocity.vx;
        if (collision.vertical) ball.velocity.vy = -ball.velocity.vy;
        if (block.destroy()) break;
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