/**
 * ユーティリティ関数群
 * アプリケーション全体で使用される汎用的な関数とヘルパークラス
 */

/**
 * 色相から RGB カラーを生成（HSB モード）
 * @param {number} hue - 色相 (0-360)
 * @param {number} saturation - 彩度 (0-100)
 * @param {number} brightness - 明度 (0-100)
 * @returns {p5.Color} p5.jsカラーオブジェクト
 */
function hueToColor(hue, saturation = 100, brightness = 100) {
    return ErrorUtils.safeExecute(() => {
        colorMode(HSB, 360, 100, 100, 100);
        const c = color(hue % 360, saturation, brightness);
        colorMode(RGB, 255);
        return c;
    }, 'hueToColor', color(255));
}

/**
 * 2点間の距離を計算
 * @param {number} x1 - 点1のX座標
 * @param {number} y1 - 点1のY座標
 * @param {number} x2 - 点2のX座標
 * @param {number} y2 - 点2のY座標
 * @returns {number} 距離
 */
function distance(x1, y1, x2, y2) {
    return ErrorUtils.safeExecute(() => {
        return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }, 'distance', 0);
}

/**
 * ベクトルの正規化
 * @param {number} x - Xコンポーネント
 * @param {number} y - Yコンポーネント
 * @returns {Object} 正規化されたベクトル {x, y}
 */
function normalizeVector(x, y) {
    return ErrorUtils.safeExecute(() => {
        const mag = sqrt(x * x + y * y);
        if (mag === 0 || !isFinite(mag)) return { x: 0, y: 0 };
        return { x: x / mag, y: y / mag };
    }, 'normalizeVector', { x: 0, y: 0 });
}

/**
 * 値を範囲内に制限
 * @param {number} value - 制限する値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} 制限された値
 */
function clamp(value, min, max) {
    return ErrorUtils.safeExecute(() => {
        if (!isFinite(value)) return min;
        return Math.max(min, Math.min(max, value));
    }, 'clamp', min);
}

/**
 * 補間関数
 * @param {number} start - 開始値
 * @param {number} end - 終了値
 * @param {number} t - 補間係数 (0-1)
 * @returns {number} 補間された値
 */
function lerp(start, end, t) {
    return ErrorUtils.safeExecute(() => {
        const clampedT = clamp(t, 0, 1);
        return start + (end - start) * clampedT;
    }, 'lerp', start);
}

/**
 * イージング関数群
 * アニメーションの滑らかな変化を提供
 */
const easing = {
    /**
     * イーズインアウト二次関数
     * @param {number} t - 時間係数 (0-1)
     * @returns {number} イージング値
     */
    easeInOutQuad: (t) => {
        return ErrorUtils.safeExecute(() => {
            const clampedT = clamp(t, 0, 1);
            return clampedT < 0.5 ? 2 * clampedT * clampedT : -1 + (4 - 2 * clampedT) * clampedT;
        }, 'easing.easeInOutQuad', t);
    },
    
    /**
     * イーズアウトエラスティック
     * @param {number} t - 時間係数 (0-1)
     * @returns {number} イージング値
     */
    easeOutElastic: (t) => {
        return ErrorUtils.safeExecute(() => {
            const clampedT = clamp(t, 0, 1);
            if (clampedT === 0) return 0;
            if (clampedT === 1) return 1;
            
            const p = 0.3;
            return Math.pow(2, -10 * clampedT) * Math.sin((clampedT - p / 4) * (2 * Math.PI) / p) + 1;
        }, 'easing.easeOutElastic', t);
    },
    
    /**
     * イーズアウトバック
     * @param {number} t - 時間係数 (0-1)
     * @returns {number} イージング値
     */
    easeOutBack: (t) => {
        return ErrorUtils.safeExecute(() => {
            const clampedT = clamp(t, 0, 1);
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(clampedT - 1, 3) + c1 * Math.pow(clampedT - 1, 2);
        }, 'easing.easeOutBack', t);
    },
    
    /**
     * スムーズステップ
     * @param {number} t - 時間係数 (0-1)
     * @returns {number} イージング値
     */
    smoothStep: (t) => {
        return ErrorUtils.safeExecute(() => {
            const clampedT = clamp(t, 0, 1);
            return clampedT * clampedT * (3 - 2 * clampedT);
        }, 'easing.smoothStep', t);
    }
};

/**
 * ランダムな方向ベクトルを生成
 * @returns {Object} 正規化された方向ベクトル {x, y}
 */
function randomDirection() {
    return ErrorUtils.safeExecute(() => {
        const angle = random(TWO_PI);
        return {
            x: cos(angle),
            y: sin(angle)
        };
    }, 'randomDirection', { x: 1, y: 0 });
}

/**
 * 虹色グラデーションの色を取得
 * @param {number} offset - 色相オフセット
 * @param {number} time - 時間係数
 * @returns {p5.Color} 虹色カラー
 */
function getRainbowColor(offset, time) {
    return ErrorUtils.safeExecute(() => {
        const hue = (offset + time * 0.1) % 360;
        return hueToColor(hue, 80, 100);
    }, 'getRainbowColor', color(255));
}

/**
 * 度をラジアンに変換
 * @param {number} degrees - 度数
 * @returns {number} ラジアン
 */
function degreesToRadians(degrees) {
    return ErrorUtils.safeExecute(() => {
        return degrees * (Math.PI / 180);
    }, 'degreesToRadians', 0);
}

/**
 * ラジアンを度に変換
 * @param {number} radians - ラジアン
 * @returns {number} 度数
 */
function radiansToDegrees(radians) {
    return ErrorUtils.safeExecute(() => {
        return radians * (180 / Math.PI);
    }, 'radiansToDegrees', 0);
}

/**
 * パフォーマンス計測・監視クラス
 * FPS、メモリ使用量、レンダリング時間などの性能指標を追跡
 */
class PerformanceMonitor {
    /**
     * PerformanceMonitorのコンストラクタ
     * @param {Object} options - 監視設定オプション
     */
    constructor(options = {}) {
        // 基本設定
        this.fps = Config.CANVAS.TARGET_FPS;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        // 詳細統計
        this.stats = {
            fps: this.fps,
            averageFPS: this.fps,
            minFPS: this.fps,
            maxFPS: this.fps,
            frameTime: 16.67, // 60fps基準
            totalFrames: 0,
            droppedFrames: 0,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0
        };
        
        // 履歴データ
        this.fpsHistory = [];
        this.maxHistoryLength = options.maxHistory || 300; // 5分間（60fps × 300秒）
        
        // 警告閾値
        this.warningThresholds = {
            lowFPS: options.lowFPSThreshold || Config.PERFORMANCE.FPS_WARNING_THRESHOLD,
            highFrameTime: options.highFrameTimeThreshold || 33.33, // 30fps相当
            memoryWarning: options.memoryWarning || Config.PERFORMANCE.MEMORY_WARNING_THRESHOLD * 1024 * 1024 // MB to bytes
        };
        
        // 統計更新間隔
        this.updateInterval = options.updateInterval || Config.PERFORMANCE.MEASUREMENT_INTERVAL;
        this.lastStatsUpdate = 0;
        
        // パフォーマンス監視状態
        this.isMonitoring = true;
        this.warningCount = 0;
        
        console.log('✅ PerformanceMonitor initialized', { 
            target: this.fps, 
            warningThresholds: this.warningThresholds 
        });
    }
    
    /**
     * パフォーマンス統計の更新
     */
    update() {
        if (!this.isMonitoring) return;
        
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            this.frameCount++;
            this.stats.totalFrames++;
            
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;
            
            // フレーム時間の記録
            if (this.frameCount > 1) {
                this.stats.frameTime = deltaTime;
                
                // ドロップフレームの検出
                if (deltaTime > this.warningThresholds.highFrameTime) {
                    this.stats.droppedFrames++;
                }
            }
            
            // FPS計算（1秒間隔）
            if (deltaTime >= this.updateInterval) {
                this.calculateFPS(deltaTime);
                this.updateDetailedStats();
                this.checkPerformanceWarnings();
                
                this.frameCount = 0;
                this.lastTime = currentTime;
            }
            
            // メモリ使用量の監視
            this.updateMemoryStats();
        }, 'PerformanceMonitor.update', 1);
    }
    
    /**
     * FPS計算
     * @param {number} deltaTime - 経過時間
     */
    calculateFPS(deltaTime) {
        const currentFPS = Math.round((this.frameCount * 1000) / deltaTime);
        this.stats.fps = currentFPS;
        
        // FPS履歴の更新
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
        }
        
        // 統計値の計算
        this.stats.minFPS = Math.min(this.stats.minFPS, currentFPS);
        this.stats.maxFPS = Math.max(this.stats.maxFPS, currentFPS);
        
        if (this.fpsHistory.length > 0) {
            const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
            this.stats.averageFPS = Math.round(sum / this.fpsHistory.length);
        }
    }
    
    /**
     * 詳細統計の更新
     */
    updateDetailedStats() {
        // ドロップフレーム率の計算
        this.stats.dropRate = this.stats.totalFrames > 0 ? 
            (this.stats.droppedFrames / this.stats.totalFrames) * 100 : 0;
    }
    
    /**
     * メモリ使用量の更新
     */
    updateMemoryStats() {
        if (performance.memory) {
            this.stats.memoryUsage = performance.memory.usedJSHeapSize;
        }
    }
    
    /**
     * パフォーマンス警告のチェック
     */
    checkPerformanceWarnings() {
        let hasWarning = false;
        
        // 低FPS警告
        if (this.stats.fps < this.warningThresholds.lowFPS) {
            errorHandler.handleError(new AppError(
                `Low FPS detected: ${this.stats.fps}fps (target: ${this.fps}fps)`,
                ErrorCategory.PERFORMANCE,
                ErrorLevel.WARN,
                { 
                    currentFPS: this.stats.fps,
                    targetFPS: this.fps,
                    frameTime: this.stats.frameTime,
                    droppedFrames: this.stats.droppedFrames
                }
            ));
            hasWarning = true;
        }
        
        // メモリ使用量警告
        if (this.stats.memoryUsage > this.warningThresholds.memoryWarning) {
            errorHandler.handleError(new AppError(
                `High memory usage detected: ${(this.stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
                ErrorCategory.PERFORMANCE,
                ErrorLevel.WARN,
                { 
                    memoryUsage: this.stats.memoryUsage,
                    threshold: this.warningThresholds.memoryWarning
                }
            ));
            hasWarning = true;
        }
        
        if (hasWarning) {
            this.warningCount++;
        }
    }
    
    /**
     * 現在のFPSを取得
     * @returns {number} 現在のFPS
     */
    getFPS() {
        return this.stats.fps;
    }
    
    /**
     * 詳細な統計情報を取得
     * @returns {Object} パフォーマンス統計
     */
    getDetailedStats() {
        return {
            ...this.stats,
            warningCount: this.warningCount,
            historyLength: this.fpsHistory.length,
            isStable: this.isPerformanceStable()
        };
    }
    
    /**
     * パフォーマンスが安定しているかチェック
     * @returns {boolean} 安定しているかどうか
     */
    isPerformanceStable() {
        if (this.fpsHistory.length < 10) return true;
        
        // 最近10フレームのFPS変動をチェック
        const recent = this.fpsHistory.slice(-10);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / recent.length;
        const stdDev = Math.sqrt(variance);
        
        // 標準偏差が5以下であれば安定とみなす
        return stdDev <= 5;
    }
    
    /**
     * FPS履歴を取得
     * @param {number} count - 取得する履歴数
     * @returns {number[]} FPS履歴配列
     */
    getFPSHistory(count = 60) {
        return this.fpsHistory.slice(-count);
    }
    
    /**
     * パフォーマンス監視の有効/無効切り替え
     * @param {boolean} enabled - 有効かどうか
     */
    setMonitoring(enabled) {
        this.isMonitoring = enabled;
        console.log(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * 統計のリセット
     */
    reset() {
        this.stats = {
            fps: this.fps,
            averageFPS: this.fps,
            minFPS: this.fps,
            maxFPS: this.fps,
            frameTime: 16.67,
            totalFrames: 0,
            droppedFrames: 0,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0
        };
        
        this.fpsHistory = [];
        this.warningCount = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        console.log('Performance monitor stats reset');
    }
}