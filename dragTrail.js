/**
 * ドラッグ軌跡管理クラス
 * ユーザーのドラッグ操作による軌跡の記録、更新、描画を担当
 * パフォーマンス最適化とエラーハンドリングを含む
 */
class DragTrail {
    /**
     * DragTrailのコンストラクタ
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        try {
            // 設定値の初期化（Config使用）
            const config = Config.DRAG_TRAIL;
            this.maxTrails = options.maxTrails || config.MAX_TRAILS;
            this.trailDuration = options.duration || config.DURATION_FRAMES;
            this.maxSegments = options.maxSegments || config.MAX_SEGMENTS;
            this.cleanupKeepCount = options.cleanupKeepCount || config.CLEANUP_KEEP_COUNT;
            this.recentInfluenceFrames = config.RECENT_INFLUENCE_FRAMES;
            
            // 軌跡データ
            this.trails = [];
            this.totalSegments = 0;
            
            // パフォーマンス監視
            this.lastCleanupTime = 0;
            this.renderStats = {
                lastRenderTime: 0,
                segmentsRendered: 0,
                skippedSegments: 0
            };
            
            // 描画設定
            this.renderingConfig = config.RENDERING;
            
            console.log('✅ DragTrail initialized successfully');
        } catch (error) {
            errorHandler.handleError(new AppError(
                `DragTrail initialization failed: ${error.message}`,
                ErrorCategory.GRAPHICS,
                ErrorLevel.ERROR,
                { options, error }
            ));
            
            // フォールバック設定
            this.initializeFallbackSettings();
        }
    }
    
    /**
     * フォールバック設定の初期化
     */
    initializeFallbackSettings() {
        this.maxTrails = 10;
        this.trailDuration = 180;
        this.maxSegments = 500;
        this.cleanupKeepCount = 300;
        this.recentInfluenceFrames = 30;
        this.trails = [];
        this.totalSegments = 0;
        this.renderStats = { lastRenderTime: 0, segmentsRendered: 0, skippedSegments: 0 };
        this.renderingConfig = {
            THICKNESS_RANGE: { min: 2, max: 8 },
            VELOCITY_RANGE: { min: 0, max: 20 },
            GRADIENT_LAYERS: 3,
            CORE_THICKNESS_FACTOR: 0.3,
            HUE_CHANGE_SPEED: 2,
            SATURATION: 80,
            BRIGHTNESS: 100,
            ALPHA_FADE_FACTOR: 0.3
        };
    }
    
    /**
     * 新しい軌跡ポイントを追加
     * @param {number} x - 現在のX座標
     * @param {number} y - 現在のY座標
     * @param {number} prevX - 前のX座標
     * @param {number} prevY - 前のY座標
     * @returns {boolean} 追加に成功したかどうか
     */
    addPoint(x, y, prevX, prevY) {
        return ErrorUtils.safeExecute(() => {
            // 入力値の検証
            if (!this.validateCoordinates(x, y, prevX, prevY)) {
                return false;
            }
            
            // 軌跡セグメントの作成
            const trail = this.createTrailSegment(x, y, prevX, prevY);
            this.trails.push(trail);
            this.totalSegments++;
            
            // パフォーマンス監視：メモリ使用量チェック
            this.performMaintenanceIfNeeded();
            
            return true;
        }, 'DragTrail.addPoint', false);
    }
    
    /**
     * 座標の検証
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {number} prevX - 前のX座標
     * @param {number} prevY - 前のY座標
     * @returns {boolean} 有効かどうか
     */
    validateCoordinates(x, y, prevX, prevY) {
        const coords = [x, y, prevX, prevY];
        for (const coord of coords) {
            if (!isFinite(coord) || isNaN(coord)) {
                errorHandler.handleError(new AppError(
                    'Invalid coordinates provided to DragTrail',
                    ErrorCategory.GRAPHICS,
                    ErrorLevel.WARN,
                    { x, y, prevX, prevY }
                ));
                return false;
            }
        }
        return true;
    }
    
    /**
     * 軌跡セグメントの作成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} prevX - 前のX座標
     * @param {number} prevY - 前のY座標
     * @returns {Object} 軌跡セグメント
     */
    createTrailSegment(x, y, prevX, prevY) {
        const deltaX = x - prevX;
        const deltaY = y - prevY;
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        return {
            x: x,
            y: y,
            prevX: prevX,
            prevY: prevY,
            age: 0,
            maxAge: this.trailDuration,
            velocity: velocity,
            hue: (frameCount * this.renderingConfig.HUE_CHANGE_SPEED) % 360,
            direction: velocity > 0 ? { x: deltaX / velocity, y: deltaY / velocity } : { x: 0, y: 0 },
            createTime: performance.now()
        };
    }
    
    /**
     * 必要に応じてメンテナンス処理を実行
     */
    performMaintenanceIfNeeded() {
        const now = performance.now();
        
        // 定期的なクリーンアップ（1秒間隔）
        if (now - this.lastCleanupTime > 1000) {
            this.performCleanup();
            this.lastCleanupTime = now;
        }
        
        // 緊急クリーンアップ（メモリ制限）
        if (this.trails.length > this.maxSegments) {
            this.performEmergencyCleanup();
        }
    }
    
    /**
     * 定期的なクリーンアップ処理
     */
    performCleanup() {
        const initialCount = this.trails.length;
        
        // 古い軌跡の削除
        this.trails = this.trails.filter(trail => trail.age < trail.maxAge);
        
        const removedCount = initialCount - this.trails.length;
        if (removedCount > 0) {
            console.debug(`DragTrail cleanup: removed ${removedCount} segments`);
        }
    }
    
    /**
     * 緊急クリーンアップ処理
     */
    performEmergencyCleanup() {
        console.warn(`DragTrail emergency cleanup: ${this.trails.length} segments exceeded limit`);
        
        // 古いセグメントから削除
        const toRemove = this.trails.length - this.cleanupKeepCount;
        this.trails.splice(0, toRemove);
        
        errorHandler.handleError(new AppError(
            'DragTrail emergency cleanup triggered',
            ErrorCategory.PERFORMANCE,
            ErrorLevel.WARN,
            { removedSegments: toRemove, remainingSegments: this.trails.length }
        ));
    }
    
    /**
     * 軌跡の更新
     * フレームごとに呼び出される
     */
    update() {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const updateStartTime = performance.now();
            
            // 各軌跡の年齢を更新
            for (let i = this.trails.length - 1; i >= 0; i--) {
                const trail = this.trails[i];
                trail.age++;
                
                // 期限切れの軌跡を削除
                if (trail.age >= trail.maxAge) {
                    this.trails.splice(i, 1);
                }
            }
            
            // パフォーマンス統計の更新
            const updateDuration = performance.now() - updateStartTime;
            if (updateDuration > 5) { // 5ms以上で警告
                console.debug(`DragTrail update took ${updateDuration.toFixed(2)}ms for ${this.trails.length} segments`);
            }
        }, 'DragTrail.update', 5);
    }
    
    /**
     * 軌跡の描画
     * 最適化された描画処理
     */
    display() {
        if (this.trails.length === 0) return;
        
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const renderStartTime = performance.now();
            this.renderStats.segmentsRendered = 0;
            this.renderStats.skippedSegments = 0;
            
            push();
            colorMode(HSB, 360, 100, 100, 100);
            
            // 描画ループの最適化
            this.renderTrailSegments();
            
            pop();
            
            // パフォーマンス統計の更新
            this.renderStats.lastRenderTime = performance.now() - renderStartTime;
            
            // パフォーマンス警告
            if (this.renderStats.lastRenderTime > 8) { // 60fps基準で8ms以上
                errorHandler.handleError(new AppError(
                    'DragTrail rendering performance warning',
                    ErrorCategory.PERFORMANCE,
                    ErrorLevel.WARN,
                    { 
                        renderTime: this.renderStats.lastRenderTime,
                        segmentsRendered: this.renderStats.segmentsRendered,
                        totalSegments: this.trails.length
                    }
                ));
            }
        }, 'DragTrail.display', 8);
    }
    
    /**
     * 軌跡セグメントの描画
     */
    renderTrailSegments() {
        const config = this.renderingConfig;
        
        for (const trail of this.trails) {
            // アルファ値の計算（フェードアウト）
            const ageRatio = trail.age / trail.maxAge;
            const alpha = map(ageRatio, 0, 1, 100, 0);
            
            // 透明度が低すぎる場合はスキップ（最適化）
            if (alpha <= 1) {
                this.renderStats.skippedSegments++;
                continue;
            }
            
            // 線の太さ計算
            const thickness = map(
                trail.velocity, 
                config.VELOCITY_RANGE.min, 
                config.VELOCITY_RANGE.max, 
                config.THICKNESS_RANGE.min, 
                config.THICKNESS_RANGE.max
            );
            
            // グラデーション効果のレイヤー描画
            this.renderGradientLayers(trail, thickness, alpha, config);
            
            // 中心の明るいライン
            this.renderCoreLine(trail, thickness, alpha, config);
            
            this.renderStats.segmentsRendered++;
        }
    }
    
    /**
     * グラデーションレイヤーの描画
     * @param {Object} trail - 軌跡セグメント
     * @param {number} thickness - 線の太さ
     * @param {number} alpha - アルファ値
     * @param {Object} config - 描画設定
     */
    renderGradientLayers(trail, thickness, alpha, config) {
        for (let layer = config.GRADIENT_LAYERS; layer >= 1; layer--) {
            const layerThickness = thickness * (layer / 2);
            const layerAlpha = alpha * (config.ALPHA_FADE_FACTOR / layer);
            
            strokeWeight(layerThickness);
            stroke(trail.hue, config.SATURATION, config.BRIGHTNESS, layerAlpha);
            line(trail.prevX, trail.prevY, trail.x, trail.y);
        }
    }
    
    /**
     * 中心線の描画
     * @param {Object} trail - 軌跡セグメント
     * @param {number} thickness - 線の太さ
     * @param {number} alpha - アルファ値
     * @param {Object} config - 描画設定
     */
    renderCoreLine(trail, thickness, alpha, config) {
        strokeWeight(thickness * config.CORE_THICKNESS_FACTOR);
        stroke(trail.hue, config.SATURATION * 0.4, config.BRIGHTNESS, alpha);
        line(trail.prevX, trail.prevY, trail.x, trail.y);
    }
    
    /**
     * アクティブな軌跡の取得（パーティクルへの影響計算用）
     * @returns {Array} 最近の軌跡配列
     */
    getActiveTrails() {
        return ErrorUtils.safeExecute(() => {
            const recentTrails = [];
            
            for (const trail of this.trails) {
                // 最近の軌跡のみを返す（影響を与える範囲）
                if (trail.age < this.recentInfluenceFrames) {
                    recentTrails.push({
                        x: trail.x,
                        y: trail.y,
                        prevX: trail.prevX,
                        prevY: trail.prevY,
                        velocity: trail.velocity,
                        age: trail.age,
                        direction: trail.direction
                    });
                }
            }
            
            return recentTrails;
        }, 'DragTrail.getActiveTrails', []);
    }
    
    /**
     * 軌跡をクリア
     */
    clear() {
        ErrorUtils.safeExecute(() => {
            this.trails = [];
            this.totalSegments = 0;
            this.renderStats = {
                lastRenderTime: 0,
                segmentsRendered: 0,
                skippedSegments: 0
            };
            console.log('DragTrail cleared');
        }, 'DragTrail.clear');
    }
    
    /**
     * 軌跡の数を取得
     * @returns {number} 現在の軌跡数
     */
    getTrailCount() {
        return this.trails.length;
    }
    
    /**
     * パフォーマンス統計の取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        return {
            trailCount: this.trails.length,
            totalSegments: this.totalSegments,
            lastRenderTime: this.renderStats.lastRenderTime,
            segmentsRendered: this.renderStats.segmentsRendered,
            skippedSegments: this.renderStats.skippedSegments,
            memoryUsage: this.trails.length * 8 * 10 // 概算（バイト）
        };
    }
    
    /**
     * 設定の動的更新
     * @param {Object} newConfig - 新しい設定
     */
    updateConfig(newConfig) {
        ErrorUtils.safeExecute(() => {
            if (newConfig.maxTrails !== undefined) {
                this.maxTrails = newConfig.maxTrails;
            }
            if (newConfig.trailDuration !== undefined) {
                this.trailDuration = newConfig.trailDuration;
            }
            if (newConfig.rendering !== undefined) {
                Object.assign(this.renderingConfig, newConfig.rendering);
            }
            
            console.log('DragTrail config updated', newConfig);
        }, 'DragTrail.updateConfig');
    }
}