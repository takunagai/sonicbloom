/**
 * パーティクルシステムクラス
 * パーティクルの生成、管理、物理演算、描画を統括
 * 設定値の一元管理とパフォーマンス最適化を実装
 */
class ParticleSystem {
    /**
     * ParticleSystemのコンストラクタ
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        try {
            // Config からの設定値取得
            const particleConfig = Config.PARTICLES;
            const effectsConfig = Config.EFFECTS;
            
            // 基本設定
            this.particles = [];
            this.maxParticles = options.maxParticles || particleConfig.MAX_COUNT;
            this.currentEffect = options.initialEffect || 1;
            this.time = 0;
            this.soundSystem = null;
            
            // 物理パラメータ
            this.gravity = createVector(
                particleConfig.PHYSICS.DEFAULT_GRAVITY.x, 
                particleConfig.PHYSICS.DEFAULT_GRAVITY.y
            );
            this.wind = createVector(0, 0);
            
            // エフェクト別の設定（Configから取得）
            this.effectConfigs = effectsConfig.CONFIGS;
            
            // パフォーマンス監視
            this.performanceStats = {
                updateTime: 0,
                renderTime: 0,
                particleCreationTime: 0,
                lastPerformanceCheck: 0
            };
            
            // オブジェクトプール（メモリ効率化）
            this.particlePool = [];
            this.maxPoolSize = Math.min(this.maxParticles * 2, 2000);
            
            // 自動パフォーマンス調整
            this.adaptiveSettings = {
                enabled: true,
                targetFPS: Config.CANVAS.TARGET_FPS,
                minParticles: particleConfig.MIN_COUNT,
                performanceHistory: []
            };
            
            console.log('✅ ParticleSystem initialized successfully');
        } catch (error) {
            errorHandler.handleError(new AppError(
                `ParticleSystem initialization failed: ${error.message}`,
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
        this.particles = [];
        this.maxParticles = 1000;
        this.currentEffect = 1;
        this.gravity = createVector(0, 0.1);
        this.wind = createVector(0, 0);
        this.time = 0;
        this.soundSystem = null;
        this.particlePool = [];
        this.maxPoolSize = 2000;
        
        // 最小限のエフェクト設定
        this.effectConfigs = {
            1: { mode: 'normal', trail: false, gravity: false, mouseAttraction: 0.5, bgAlpha: 20 },
            2: { mode: 'trail', trail: true, gravity: false, mouseAttraction: 1, bgAlpha: 10 },
            3: { mode: 'rainbow', trail: false, gravity: false, mouseAttraction: 0.8, bgAlpha: 5 },
            4: { mode: 'gravity', trail: false, gravity: true, mouseAttraction: 0.3, bgAlpha: 15 },
            5: { mode: 'swirl', trail: true, gravity: false, mouseAttraction: 1.2, bgAlpha: 25 }
        };
        
        this.performanceStats = {
            updateTime: 0, renderTime: 0, particleCreationTime: 0, lastPerformanceCheck: 0
        };
        
        this.adaptiveSettings = {
            enabled: true, targetFPS: 60, minParticles: 50, performanceHistory: []
        };
    }
    
    /**
     * サウンドシステムの設定
     * @param {SoundSystem} soundSystem - サウンドシステムインスタンス
     */
    setSoundSystem(soundSystem) {
        return ErrorUtils.safeExecute(() => {
            if (!soundSystem || typeof soundSystem.playEffectSound !== 'function') {
                throw new Error('Invalid sound system provided');
            }
            this.soundSystem = soundSystem;
            console.log('✅ Sound system connected to ParticleSystem');
        }, 'ParticleSystem.setSoundSystem');
    }
    
    /**
     * 初期パーティクルの生成
     * 画面中央から放射状にパーティクルを配置
     */
    createInitialParticles() {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const config = Config.PARTICLES;
            const centerX = width / 2;
            const centerY = height / 2;
            const numParticles = Math.min(config.INITIAL_COUNT, this.maxParticles);
            
            console.log(`Creating ${numParticles} initial particles`);
            
            for (let i = 0; i < numParticles; i++) {
                const angle = (TWO_PI / numParticles) * i;
                const radius = random(50, 150);
                const x = centerX + cos(angle) * radius;
                const y = centerY + sin(angle) * radius;
                
                const particleConfig = this.createParticleConfig({
                    direction: { x: cos(angle), y: sin(angle) },
                    speed: random(0.5, 2),
                    size: random(config.APPEARANCE.INITIAL_SIZE_RANGE.min, config.APPEARANCE.INITIAL_SIZE_RANGE.max),
                    hue: (i * 360 / numParticles) % 360,
                    saturation: random(70, 100),
                    brightness: 100,
                    alpha: random(80, 100),
                    lifespan: random(config.APPEARANCE.INITIAL_LIFESPAN_RANGE.min, config.APPEARANCE.INITIAL_LIFESPAN_RANGE.max),
                    mode: this.effectConfigs[this.currentEffect].mode
                });
                
                const particle = this.createParticle(x, y, particleConfig);
                if (particle) {
                    this.addParticle(particle);
                }
            }
            
            console.log(`✅ Created ${this.particles.length} initial particles`);
        }, 'ParticleSystem.createInitialParticles', 50);
    }
    
    /**
     * パーティクル設定の作成
     * @param {Object} baseConfig - 基本設定
     * @returns {Object} 完全なパーティクル設定
     */
    createParticleConfig(baseConfig = {}) {
        const config = Config.PARTICLES;
        const defaultConfig = {
            direction: baseConfig.direction || { x: 0, y: 0 },
            speed: baseConfig.speed || random(0.5, 3),
            size: baseConfig.size || random(config.APPEARANCE.SIZE_RANGE.min, config.APPEARANCE.SIZE_RANGE.max),
            hue: baseConfig.hue || random(360),
            saturation: baseConfig.saturation || random(60, 100),
            brightness: baseConfig.brightness || 100,
            alpha: baseConfig.alpha || random(60, 100),
            lifespan: baseConfig.lifespan || random(config.APPEARANCE.LIFESPAN_RANGE.min, config.APPEARANCE.LIFESPAN_RANGE.max),
            mode: baseConfig.mode || this.effectConfigs[this.currentEffect].mode,
            trail: baseConfig.trail || this.effectConfigs[this.currentEffect].trail,
            damping: baseConfig.damping || config.PHYSICS.DEFAULT_DAMPING
        };
        
        return Object.assign(defaultConfig, baseConfig);
    }
    
    /**
     * パーティクルの作成（オブジェクトプール使用）
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {Object} config - パーティクル設定
     * @returns {Particle|null} 作成されたパーティクル
     */
    createParticle(x, y, config) {
        return ErrorUtils.safeExecute(() => {
            // オブジェクトプールから再利用
            let particle = this.particlePool.pop();
            
            if (particle) {
                // 既存パーティクルを再初期化
                particle.reset(x, y, config);
            } else {
                // 新しいパーティクルを作成
                particle = new Particle(x, y, config);
            }
            
            return particle;
        }, 'ParticleSystem.createParticle', null);
    }
    
    /**
     * パーティクルの追加
     * @param {Particle} particle - 追加するパーティクル
     * @returns {boolean} 追加に成功したかどうか
     */
    addParticle(particle) {
        return ErrorUtils.safeExecute(() => {
            if (!particle) {
                console.warn('Attempted to add null particle');
                return false;
            }
            
            if (this.particles.length >= this.maxParticles) {
                // 最大数に達している場合、最も古いパーティクルを削除
                const removedParticle = this.particles.shift();
                this.returnParticleToPool(removedParticle);
            }
            
            this.particles.push(particle);
            return true;
        }, 'ParticleSystem.addParticle', false);
    }
    
    /**
     * パーティクルをプールに返却
     * @param {Particle} particle - 返却するパーティクル
     */
    returnParticleToPool(particle) {
        if (particle && this.particlePool.length < this.maxPoolSize) {
            this.particlePool.push(particle);
        }
    }
    
    /**
     * 爆発エフェクトの作成
     * @param {number} x - 爆発の中心X座標
     * @param {number} y - 爆発の中心Y座標
     * @returns {boolean} 爆発エフェクトの作成に成功したかどうか
     */
    createExplosion(x, y) {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            // 座標の検証
            if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
                throw new Error(`Invalid explosion coordinates: x=${x}, y=${y}`);
            }
            
            const explosionConfig = Config.PARTICLES.EXPLOSION;
            const numParticles = random(explosionConfig.PARTICLE_COUNT_RANGE.min, explosionConfig.PARTICLE_COUNT_RANGE.max);
            const explosionForce = random(explosionConfig.FORCE_RANGE.min, explosionConfig.FORCE_RANGE.max);
            
            console.log(`Creating explosion at (${x.toFixed(1)}, ${y.toFixed(1)}) with ${Math.floor(numParticles)} particles`);
            
            // 爆発音の再生
            this.playExplosionSound(x, y, explosionForce);
            
            // 爆発パーティクルの生成
            const createdParticles = this.createExplosionParticles(x, y, numParticles, explosionForce);
            
            // 既存パーティクルへの影響
            this.applyExplosionForceToExistingParticles(x, y, explosionForce);
            
            console.log(`✅ Explosion created: ${createdParticles} new particles`);
            return true;
        }, 'ParticleSystem.createExplosion', 15);
    }
    
    /**
     * 爆発音の再生
     * @param {number} x - X座標
     * @param {number} y - Y座標 
     * @param {number} force - 爆発力
     */
    playExplosionSound(x, y, force) {
        ErrorUtils.safeExecute(() => {
            if (this.soundSystem && typeof this.soundSystem.playEffectSound === 'function') {
                const normalizedForce = force / Config.PARTICLES.EXPLOSION.FORCE_RANGE.max;
                this.soundSystem.playEffectSound(this.currentEffect, x, y, normalizedForce);
            }
        }, 'ParticleSystem.playExplosionSound');
    }
    
    /**
     * 爆発パーティクルの作成
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} numParticles - パーティクル数
     * @param {number} explosionForce - 爆発力
     * @returns {number} 作成されたパーティクル数
     */
    createExplosionParticles(x, y, numParticles, explosionForce) {
        let createdCount = 0;
        const explosionConfig = Config.PARTICLES.EXPLOSION;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (TWO_PI / numParticles) * i + random(-explosionConfig.ANGLE_VARIATION, explosionConfig.ANGLE_VARIATION);
            const speed = random(explosionForce * 0.5, explosionForce);
            
            const particleConfig = this.createParticleConfig({
                direction: { x: cos(angle), y: sin(angle) },
                speed: speed,
                size: random(4, 10),
                hue: random(360),
                saturation: 100,
                brightness: 100,
                alpha: 100,
                lifespan: random(explosionConfig.LIFESPAN_RANGE.min, explosionConfig.LIFESPAN_RANGE.max),
                mode: this.effectConfigs[this.currentEffect].mode,
                trail: true
            });
            
            const particle = this.createParticle(x, y, particleConfig);
            if (particle && this.addParticle(particle)) {
                createdCount++;
            }
        }
        
        return createdCount;
    }
    
    /**
     * 既存パーティクルに爆発の影響を適用
     * @param {number} x - 爆発中心X座標
     * @param {number} y - 爆発中心Y座標
     * @param {number} explosionForce - 爆発力
     */
    applyExplosionForceToExistingParticles(x, y, explosionForce) {
        let affectedCount = 0;
        const influenceRadius = Config.PARTICLES.EXPLOSION.INFLUENCE_RADIUS;
        
        this.particles.forEach(p => {
            if (!p.position) return;
            
            const distance = dist(p.position.x, p.position.y, x, y);
            if (distance < influenceRadius && distance > 0) {
                const force = map(distance, 0, influenceRadius, explosionForce, 0);
                if (typeof p.explode === 'function') {
                    p.explode(x, y, force);
                    affectedCount++;
                }
            }
        });
        
        if (affectedCount > 0) {
            console.debug(`Explosion affected ${affectedCount} existing particles`);
        }
    }
    
    /**
     * マウスによる力の適用（基本版）
     * @param {number} mouseX - 現在のマウスX座標
     * @param {number} mouseY - 現在のマウスY座標
     * @param {number} pmouseX - 前のマウスX座標
     * @param {number} pmouseY - 前のマウスY座標
     * @returns {number} 影響を受けたパーティクル数
     */
    applyForce(mouseX, mouseY, pmouseX, pmouseY) {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            // 座標の検証
            if (!this.validateMouseCoordinates(mouseX, mouseY, pmouseX, pmouseY)) {
                return 0;
            }
            
            const dragConfig = Config.PARTICLES.DRAG_INTERACTION;
            const force = createVector(mouseX - pmouseX, mouseY - pmouseY);
            force.mult(dragConfig.BASE_FORCE_MULTIPLIER);
            
            let affectedCount = 0;
            const influenceRadius = dragConfig.BASE_INFLUENCE_RADIUS;
            
            this.particles.forEach(particle => {
                if (!particle.position) return;
                
                const distance = dist(particle.position.x, particle.position.y, mouseX, mouseY);
                if (distance < influenceRadius && distance > 0) {
                    const scaledForce = p5.Vector.mult(force, map(distance, 0, influenceRadius, 1, 0));
                    if (typeof particle.applyForce === 'function') {
                        particle.applyForce(scaledForce);
                        affectedCount++;
                    }
                }
            });
            
            return affectedCount;
        }, 'ParticleSystem.applyForce', 5);
    }
    
    /**
     * 強化されたマウスによる力の適用
     * @param {number} mouseX - 現在のマウスX座標
     * @param {number} mouseY - 現在のマウスY座標
     * @param {number} pmouseX - 前のマウスX座標
     * @param {number} pmouseY - 前のマウスY座標
     * @returns {Object} 詳細な影響統計
     */
    applyEnhancedForce(mouseX, mouseY, pmouseX, pmouseY) {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            // 座標の検証
            if (!this.validateMouseCoordinates(mouseX, mouseY, pmouseX, pmouseY)) {
                return { totalAffected: 0, dragAffected: 0, attractionAffected: 0, syncAffected: 0 };
            }
            
            const dragConfig = Config.PARTICLES.DRAG_INTERACTION;
            const dragVector = createVector(mouseX - pmouseX, mouseY - pmouseY);
            const dragSpeed = dragVector.mag();
            
            // ドラッグ速度に基づく力の調整
            const forceMultiplier = map(
                dragSpeed,
                dragConfig.DRAG_SPEED_RANGE.min,
                dragConfig.DRAG_SPEED_RANGE.max,
                dragConfig.ENHANCED_FORCE_RANGE.min,
                dragConfig.ENHANCED_FORCE_RANGE.max
            );
            dragVector.mult(forceMultiplier);
            
            const stats = { totalAffected: 0, dragAffected: 0, attractionAffected: 0, syncAffected: 0 };
            const influenceRadius = dragConfig.ENHANCED_INFLUENCE_RADIUS;
            const syncRadius = dragConfig.SYNC_RADIUS;
            const minSpeedForAttraction = dragConfig.MIN_DRAG_SPEED_FOR_ATTRACTION;
            
            this.particles.forEach(particle => {
                if (!particle.position || typeof particle.applyForce !== 'function') return;
                
                const distance = dist(particle.position.x, particle.position.y, mouseX, mouseY);
                
                if (distance < influenceRadius && distance > 0) {
                    stats.totalAffected++;
                    
                    // 距離による力の減衰計算
                    const distanceRatio = map(distance, 0, influenceRadius, 1, 0.1);
                    
                    // 基本的なドラッグ力の適用
                    const dragForce = p5.Vector.mult(dragVector, distanceRatio);
                    particle.applyForce(dragForce);
                    stats.dragAffected++;
                    
                    // ドラッグ位置への引力効果（速いドラッグ時のみ）
                    if (dragSpeed > minSpeedForAttraction) {
                        const attraction = this.calculateAttractionForce(
                            particle, mouseX, mouseY, dragSpeed, distanceRatio, dragConfig
                        );
                        particle.applyForce(attraction);
                        stats.attractionAffected++;
                    }
                    
                    // 近距離でのドラッグ同期効果
                    if (distance < syncRadius) {
                        const syncForce = p5.Vector.mult(dragVector, dragConfig.SYNC_STRENGTH);
                        particle.applyForce(syncForce);
                        stats.syncAffected++;
                    }
                }
            });
            
            return stats;
        }, 'ParticleSystem.applyEnhancedForce', 8);
    }
    
    /**
     * マウス座標の検証
     * @param {number} mouseX - 現在のマウスX座標
     * @param {number} mouseY - 現在のマウスY座標
     * @param {number} pmouseX - 前のマウスX座標
     * @param {number} pmouseY - 前のマウスY座標
     * @returns {boolean} 座標が有効かどうか
     */
    validateMouseCoordinates(mouseX, mouseY, pmouseX, pmouseY) {
        const coords = [mouseX, mouseY, pmouseX, pmouseY];
        for (const coord of coords) {
            if (!isFinite(coord) || isNaN(coord)) {
                errorHandler.handleError(new AppError(
                    'Invalid mouse coordinates in ParticleSystem',
                    ErrorCategory.USER_INPUT,
                    ErrorLevel.WARN,
                    { mouseX, mouseY, pmouseX, pmouseY }
                ));
                return false;
            }
        }
        return true;
    }
    
    /**
     * 引力の計算
     * @param {Particle} particle - 対象パーティクル
     * @param {number} mouseX - マウスX座標
     * @param {number} mouseY - マウスY座標
     * @param {number} dragSpeed - ドラッグ速度
     * @param {number} distanceRatio - 距離比率
     * @param {Object} dragConfig - ドラッグ設定
     * @returns {p5.Vector} 引力ベクトル
     */
    calculateAttractionForce(particle, mouseX, mouseY, dragSpeed, distanceRatio, dragConfig) {
        const attraction = createVector(mouseX - particle.position.x, mouseY - particle.position.y);
        attraction.normalize();
        
        const attractionStrength = dragConfig.ATTRACTION_STRENGTH * distanceRatio * 
                                 (dragSpeed / dragConfig.DRAG_SPEED_RANGE.max);
        attraction.mult(attractionStrength);
        
        return attraction;
    }
    
    // システムの更新
    update() {
        this.time++;
        
        // パーティクルの更新
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // エフェクト設定に基づく処理
            const config = this.effectConfigs[this.currentEffect];
            
            // 重力の適用
            if (config.gravity) {
                particle.applyForce(this.gravity);
            }
            
            // マウスへの引力
            if (mouseIsPressed && config.mouseAttraction > 0) {
                particle.attractToMouse(mouseX, mouseY, config.mouseAttraction);
            }
            
            // 風の効果（サイン波で変化）
            if (this.currentEffect === 5) {
                this.wind.x = sin(this.time * 0.01) * 0.05;
                this.wind.y = cos(this.time * 0.015) * 0.03;
                particle.applyForce(this.wind);
            }
            
            particle.update();
            
            // 死んだパーティクルの削除
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        // パーティクル数の維持（エフェクトによって自動生成）
        if (this.particles.length < 50 && random() < 0.1) {
            this.generateNewParticles();
        }
    }
    
    // 新しいパーティクルの自動生成
    generateNewParticles() {
        const numNew = random(1, 5);
        
        for (let i = 0; i < numNew; i++) {
            let x, y;
            
            // エフェクトによって生成位置を変える
            switch(this.currentEffect) {
                case 1: // 中心から
                    x = width / 2 + random(-50, 50);
                    y = height / 2 + random(-50, 50);
                    break;
                case 2: // 画面端から
                    if (random() < 0.5) {
                        x = random() < 0.5 ? 0 : width;
                        y = random(height);
                    } else {
                        x = random(width);
                        y = random() < 0.5 ? 0 : height;
                    }
                    break;
                case 3: // ランダム
                    x = random(width);
                    y = random(height);
                    break;
                case 4: // 上部から
                    x = random(width);
                    y = -10;
                    break;
                case 5: // 円形に配置
                    const angle = random(TWO_PI);
                    const radius = min(width, height) * 0.4;
                    x = width / 2 + cos(angle) * radius;
                    y = height / 2 + sin(angle) * radius;
                    break;
            }
            
            const config = {
                speed: random(0.5, 3),
                size: random(2, 6),
                hue: (this.time * 2 + i * 60) % 360,
                saturation: random(60, 100),
                brightness: 100,
                alpha: random(60, 100),
                lifespan: random(120, 300),
                mode: this.effectConfigs[this.currentEffect].mode
            };
            
            this.addParticle(new Particle(x, y, config));
            
            // パーティクル生成音の再生
            if (this.soundSystem && random() < 0.3) {
                this.soundSystem.playInteractionSound('particleCreate', x, y);
            }
        }
    }
    
    // 描画処理
    display() {
        // カラーモードをHSBに設定
        push();
        colorMode(HSB, 360, 100, 100, 100);
        
        this.particles.forEach(particle => {
            particle.display();
        });
        
        pop();
    }
    
    // エフェクトの設定
    setEffect(effectNumber) {
        this.currentEffect = effectNumber;
        const config = this.effectConfigs[effectNumber];
        
        // 既存のパーティクルのモードを更新
        this.particles.forEach(particle => {
            particle.setMode(config.mode);
            particle.trail = config.trail;
        });
    }
    
    // システムのリセット
    reset() {
        this.particles = [];
        this.time = 0;
    }
    
    // パーティクル数の取得
    getParticleCount() {
        return this.particles.length;
    }
}