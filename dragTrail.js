// ドラッグ軌跡管理クラス

class DragTrail {
    constructor() {
        this.trails = [];
        this.maxTrails = 10; // 同時に表示する軌跡の最大数
        this.trailDuration = 180; // 3秒間（60fps × 3秒）
    }
    
    // 新しい軌跡ポイントを追加
    addPoint(x, y, prevX, prevY) {
        // 新しい軌跡セグメントを作成
        const trail = {
            x: x,
            y: y,
            prevX: prevX,
            prevY: prevY,
            age: 0,
            maxAge: this.trailDuration,
            velocity: Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2),
            hue: (frameCount * 2) % 360 // 時間で変化する色相
        };
        
        this.trails.push(trail);
        
        // 古い軌跡を削除
        if (this.trails.length > this.maxTrails * 50) {
            this.trails.splice(0, this.trails.length - this.maxTrails * 30);
        }
    }
    
    // 軌跡の更新
    update() {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.age++;
            
            // 古くなった軌跡を削除
            if (trail.age >= trail.maxAge) {
                this.trails.splice(i, 1);
            }
        }
    }
    
    // 軌跡の描画
    display() {
        if (this.trails.length === 0) return;
        
        push();
        colorMode(HSB, 360, 100, 100, 100);
        
        for (const trail of this.trails) {
            // 年齢に基づいたアルファ値の計算（フェードアウト）
            const ageRatio = trail.age / trail.maxAge;
            const alpha = map(ageRatio, 0, 1, 100, 0);
            
            if (alpha <= 0) continue;
            
            // 速度に基づいた線の太さ
            const thickness = map(trail.velocity, 0, 20, 2, 8);
            
            // グラデーション効果のための複数の線を描画
            for (let layer = 3; layer >= 1; layer--) {
                const layerThickness = thickness * (layer / 2);
                const layerAlpha = alpha * (0.3 / layer);
                
                strokeWeight(layerThickness);
                stroke(trail.hue, 80, 100, layerAlpha);
                line(trail.prevX, trail.prevY, trail.x, trail.y);
            }
            
            // 中心の明るいライン
            strokeWeight(thickness * 0.3);
            stroke(trail.hue, 30, 100, alpha);
            line(trail.prevX, trail.prevY, trail.x, trail.y);
        }
        
        pop();
    }
    
    // アクティブな軌跡の取得（パーティクルへの影響計算用）
    getActiveTrails() {
        const recentTrails = [];
        const currentTime = frameCount;
        
        for (const trail of this.trails) {
            // 最近の軌跡のみを返す（影響を与える範囲）
            if (trail.age < 30) { // 0.5秒以内
                recentTrails.push({
                    x: trail.x,
                    y: trail.y,
                    prevX: trail.prevX,
                    prevY: trail.prevY,
                    velocity: trail.velocity,
                    age: trail.age
                });
            }
        }
        
        return recentTrails;
    }
    
    // 軌跡をクリア
    clear() {
        this.trails = [];
    }
    
    // 軌跡の数を取得
    getTrailCount() {
        return this.trails.length;
    }
}