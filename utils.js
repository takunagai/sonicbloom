// ユーティリティ関数

// 色相から RGB カラーを生成（HSB モード）
function hueToColor(hue, saturation = 100, brightness = 100) {
    colorMode(HSB, 360, 100, 100, 100);
    const c = color(hue % 360, saturation, brightness);
    colorMode(RGB, 255);
    return c;
}

// 2点間の距離を計算
function distance(x1, y1, x2, y2) {
    return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// ベクトルの正規化
function normalizeVector(x, y) {
    const mag = sqrt(x * x + y * y);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: x / mag, y: y / mag };
}

// 値を範囲内に制限
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// イージング関数
const easing = {
    // イーズインアウト
    easeInOutQuad: (t) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    // イーズアウトエラスティック
    easeOutElastic: (t) => {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    
    // イーズアウトバック
    easeOutBack: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};

// ランダムな方向ベクトルを生成
function randomDirection() {
    const angle = random(TWO_PI);
    return {
        x: cos(angle),
        y: sin(angle)
    };
}

// 虹色グラデーションの色を取得
function getRainbowColor(offset, time) {
    const hue = (offset + time * 0.1) % 360;
    return hueToColor(hue, 80, 100);
}

// パフォーマンス計測用
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getFPS() {
        return this.fps;
    }
}