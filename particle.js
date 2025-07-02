/**
 * パーティクルクラス
 * 個別パーティクルの物理演算、描画、ライフサイクル管理
 * オブジェクトプール対応とパフォーマンス最適化を実装
 */
class Particle {
    /**
     * Particleのコンストラクタ
     * @param {number} x - 初期X座標
     * @param {number} y - 初期Y座標
     * @param {Object} config - パーティクル設定
     */
    constructor(x, y, config = {}) {
        this.initialize(x, y, config);
    }
    
    /**
     * パーティクルの初期化
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} config - 設定オブジェクト
     */
    initialize(x, y, config = {}) {
        try {
            // 座標の検証
            if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
                throw new Error(`Invalid particle coordinates: x=${x}, y=${y}`);
            }
            
            // Configからのデフォルト値取得
            const particleConfig = Config.PARTICLES;
            
            // 位置ベクトル
            this.position = createVector(x, y);
            this.previousPosition = createVector(x, y);
            
            // 速度と加速度
            const dir = config.direction || randomDirection();
            const speed = config.speed || random(1, 5);
            this.velocity = createVector(dir.x * speed, dir.y * speed);
            this.acceleration = createVector(0, 0);
            
            // 外観プロパティ
            this.initializeAppearance(config, particleConfig);
            
            // 物理特性
            this.initializePhysics(config, particleConfig);
            
            // 動作特性
            this.initializeBehavior(config);
            
            // 特殊効果用プロパティ
            this.initializeEffects();
            
            // パフォーマンス最適化用
            this.lastUpdateTime = performance.now();
            this.skipFrameCount = 0;
            
        } catch (error) {
            errorHandler.handleError(new AppError(
                `Particle initialization failed: ${error.message}`,
                ErrorCategory.GRAPHICS,
                ErrorLevel.ERROR,
                { x, y, config, error }
            ));
            
            // フォールバック初期化
            this.initializeFallback(x, y);
        }
    }
    
    /**
     * 外観プロパティの初期化
     * @param {Object} config - 設定オブジェクト
     * @param {Object} particleConfig - パーティクル設定
     */
    initializeAppearance(config, particleConfig) {
        const sizeRange = particleConfig.APPEARANCE.SIZE_RANGE;
        
        this.size = config.size || random(sizeRange.min, sizeRange.max);
        this.maxSize = this.size * 2;
        this.minSize = this.size * 0.5;
        this.hue = config.hue || random(360);
        this.saturation = config.saturation || random(60, 100);
        this.brightness = config.brightness || 100;
        this.alpha = config.alpha || 100;
        this.maxAlpha = this.alpha;
    }
    
    /**
     * 物理特性の初期化
     * @param {Object} config - 設定オブジェクト
     * @param {Object} particleConfig - パーティクル設定
     */
    initializePhysics(config, particleConfig) {
        const lifespanRange = particleConfig.APPEARANCE.LIFESPAN_RANGE;
        
        this.mass = this.size * 0.1;
        this.lifespan = config.lifespan || random(lifespanRange.min, lifespanRange.max);
        this.maxLifespan = this.lifespan;
        this.damping = config.damping || particleConfig.PHYSICS.DEFAULT_DAMPING;
    }
    
    /**
     * 動作特性の初期化
     * @param {Object} config - 設定オブジェクト
     */
    initializeBehavior(config) {
        this.mode = config.mode || 'normal';
        this.trail = config.trail || false;
        this.pulsePhase = random(TWO_PI);
        this.rotationSpeed = random(-0.1, 0.1);
        this.rotation = 0;
    }
    
    /**
     * 特殊効果プロパティの初期化
     */
    initializeEffects() {
        this.target = null;
        this.isExploding = false;
        this.explosionForce = 0;
        this.glowIntensity = 1.0;
        this.energyLevel = 1.0;
    }
    
    /**
     * フォールバック初期化
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    initializeFallback(x, y) {
        this.position = createVector(x || 0, y || 0);
        this.previousPosition = createVector(x || 0, y || 0);
        this.velocity = createVector(random(-2, 2), random(-2, 2));
        this.acceleration = createVector(0, 0);
        this.size = random(2, 8);
        this.maxSize = this.size * 2;
        this.minSize = this.size * 0.5;
        this.hue = random(360);
        this.saturation = random(60, 100);
        this.brightness = 100;
        this.alpha = 100;
        this.maxAlpha = 100;
        this.mass = this.size * 0.1;
        this.lifespan = random(60, 180);
        this.maxLifespan = this.lifespan;
        this.damping = 0.98;
        this.mode = 'normal';
        this.trail = false;
        this.pulsePhase = random(TWO_PI);
        this.rotationSpeed = random(-0.1, 0.1);
        this.rotation = 0;
        this.target = null;
        this.isExploding = false;
        this.explosionForce = 0;
        this.glowIntensity = 1.0;
        this.energyLevel = 1.0;
        this.lastUpdateTime = performance.now();
        this.skipFrameCount = 0;
    }
    
    /**
     * パーティクルのリセット（オブジェクトプール用）
     * @param {number} x - 新しいX座標
     * @param {number} y - 新しいY座標
     * @param {Object} config - 新しい設定
     */
    reset(x, y, config = {}) {
        return ErrorUtils.safeExecute(() => {
            this.initialize(x, y, config);
            console.debug('Particle reset for object pool reuse');
        }, 'Particle.reset');
    }
    
    // 力を加える
    applyForce(force) {
        const f = p5.Vector.div(force, this.mass);
        this.acceleration.add(f);
    }
    
    // マウスへの引力/斥力
    attractToMouse(mouseX, mouseY, strength = 1) {
        const mouse = createVector(mouseX, mouseY);
        const force = p5.Vector.sub(mouse, this.position);
        const distance = force.mag();
        
        if (distance > 5 && distance < 200) {
            force.normalize();
            const mag = strength * this.mass / (distance * distance);
            force.mult(mag);
            this.applyForce(force);
        }
    }
    
    // 爆発エフェクト
    explode(centerX, centerY, force) {
        const explosion = p5.Vector.sub(this.position, createVector(centerX, centerY));
        explosion.normalize();
        explosion.mult(force);
        this.applyForce(explosion);
        this.isExploding = true;
        this.explosionForce = force;
    }
    
    // 更新処理
    update() {
        // 前の位置を記録（トレイル用）
        this.previousPosition.x = this.position.x;
        this.previousPosition.y = this.position.y;
        
        // 物理演算
        this.velocity.add(this.acceleration);
        this.velocity.mult(this.damping);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
        
        // 回転
        this.rotation += this.rotationSpeed;
        
        // ライフスパンの減少
        this.lifespan--;
        
        // アルファ値の更新（フェードアウト効果）
        if (this.lifespan < 30) {
            this.alpha = map(this.lifespan, 0, 30, 0, this.maxAlpha);
        }
        
        // サイズのパルス効果
        if (this.mode === 'pulse') {
            const pulse = sin(this.pulsePhase + frameCount * 0.1);
            this.size = map(pulse, -1, 1, this.minSize, this.maxSize);
        }
        
        // 色相の変化
        if (this.mode === 'rainbow') {
            this.hue = (this.hue + 2) % 360;
        }
        
        // 爆発効果の減衰
        if (this.isExploding) {
            this.explosionForce *= 0.95;
            if (this.explosionForce < 0.1) {
                this.isExploding = false;
            }
        }
        
        // 画面端での跳ね返り
        this.checkBounds();
    }
    
    // 画面端での処理
    checkBounds() {
        const margin = this.size;
        
        if (this.position.x < margin || this.position.x > width - margin) {
            this.velocity.x *= -0.8;
            this.position.x = constrain(this.position.x, margin, width - margin);
        }
        
        if (this.position.y < margin || this.position.y > height - margin) {
            this.velocity.y *= -0.8;
            this.position.y = constrain(this.position.y, margin, height - margin);
        }
    }
    
    // 描画処理
    display() {
        push();
        
        // トレイル効果
        if (this.trail && this.velocity.mag() > 0.5) {
            strokeWeight(this.size * 0.8);
            stroke(this.hue, this.saturation, this.brightness, this.alpha * 0.3);
            line(this.previousPosition.x, this.previousPosition.y, 
                 this.position.x, this.position.y);
        }
        
        // パーティクル本体
        translate(this.position.x, this.position.y);
        rotate(this.rotation);
        
        noStroke();
        
        // グロー効果
        for (let i = 3; i > 0; i--) {
            const glowSize = this.size * (1 + i * 0.5);
            const glowAlpha = this.alpha * (0.1 / i);
            fill(this.hue, this.saturation, this.brightness, glowAlpha);
            ellipse(0, 0, glowSize, glowSize);
        }
        
        // コア
        fill(this.hue, this.saturation * 0.5, 100, this.alpha);
        ellipse(0, 0, this.size, this.size);
        
        pop();
    }
    
    // パーティクルが生きているかチェック
    isDead() {
        return this.lifespan <= 0 || this.alpha <= 0;
    }
    
    // エフェクトモードの設定
    setMode(mode) {
        this.mode = mode;
        
        switch(mode) {
            case 'trail':
                this.trail = true;
                this.damping = 0.95;
                break;
            case 'pulse':
                this.pulsePhase = random(TWO_PI);
                break;
            case 'rainbow':
                this.hue = random(360);
                break;
            case 'gravity':
                this.damping = 0.99;
                break;
            case 'swirl':
                this.rotationSpeed = random(-0.2, 0.2);
                break;
        }
    }
}