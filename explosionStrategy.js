/**
 * 爆発エフェクト戦略パターン実装
 * 異なる種類の爆発を統一的に管理
 */

/**
 * 爆発戦略の基底クラス
 */
class ExplosionStrategy {
    /**
     * 爆発エフェクトを作成
     * @param {number} x - 爆発中心X座標
     * @param {number} y - 爆発中心Y座標
     * @param {Object} options - 追加オプション
     * @param {ParticleSystem} particleSystem - パーティクルシステム参照
     * @returns {Promise<Object>} 爆発結果
     */
    async create(x, y, options = {}, particleSystem) {
        throw new Error('ExplosionStrategy.create() must be implemented by subclass');
    }

    /**
     * 爆発パラメータの検証
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 有効かどうか
     */
    validateCoordinates(x, y) {
        return isFinite(x) && isFinite(y) && !isNaN(x) && !isNaN(y);
    }

    /**
     * 爆発音の再生
     * @param {Object} soundSystem - サウンドシステム
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playExplosionSound(soundSystem, x, y, intensity) {
        if (soundSystem && typeof soundSystem.playEffectSound === 'function') {
            soundSystem.playEffectSound('explosion', x, y, intensity);
        }
    }
}

/**
 * 基本爆発戦略
 * 従来のcreateExplosion相当
 */
class BasicExplosionStrategy extends ExplosionStrategy {
    async create(x, y, options = {}, particleSystem) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid explosion coordinates: x=${x}, y=${y}`);
        }

        const explosionConfig = Config.PARTICLES.EXPLOSION;
        const numParticles = options.particleCount || 
            random(explosionConfig.PARTICLE_COUNT_RANGE.min, explosionConfig.PARTICLE_COUNT_RANGE.max);
        const explosionForce = options.force || 
            random(explosionConfig.FORCE_RANGE.min, explosionConfig.FORCE_RANGE.max);

        console.log(`Creating basic explosion at (${x.toFixed(1)}, ${y.toFixed(1)}) with ${Math.floor(numParticles)} particles`);

        // 爆発音の再生
        this.playExplosionSound(particleSystem.soundSystem, x, y, explosionForce / explosionConfig.FORCE_RANGE.max);

        // 爆発パーティクルの生成
        const createdParticles = this.createBasicExplosionParticles(x, y, numParticles, explosionForce, particleSystem);

        // 既存パーティクルへの影響
        this.applyForceToExistingParticles(x, y, explosionForce, particleSystem);

        return {
            type: 'basic',
            particlesCreated: createdParticles,
            position: { x, y },
            force: explosionForce
        };
    }

    /**
     * 基本爆発パーティクルの作成
     */
    createBasicExplosionParticles(x, y, numParticles, explosionForce, particleSystem) {
        let createdCount = 0;
        const explosionConfig = Config.PARTICLES.EXPLOSION;

        for (let i = 0; i < numParticles; i++) {
            const angle = (TWO_PI / numParticles) * i + random(-explosionConfig.ANGLE_VARIATION, explosionConfig.ANGLE_VARIATION);
            const speed = random(explosionForce * 0.5, explosionForce);

            const particleConfig = particleSystem.createParticleConfig({
                direction: { x: cos(angle), y: sin(angle) },
                speed: speed,
                size: random(explosionConfig.SIZE_RANGE?.min || 4, explosionConfig.SIZE_RANGE?.max || 10),
                hue: random(Config.PARTICLES.APPEARANCE.HUE_RANGE),
                saturation: 100,
                brightness: 100,
                alpha: 100,
                lifespan: random(explosionConfig.LIFESPAN_RANGE.min, explosionConfig.LIFESPAN_RANGE.max),
                mode: particleSystem.effectConfigs[particleSystem.currentEffect].mode,
                trail: true
            });

            const particle = particleSystem.createParticle(x, y, particleConfig);
            if (particle && particleSystem.addParticle(particle)) {
                createdCount++;
            }
        }

        return createdCount;
    }

    /**
     * 既存パーティクルに爆発の影響を適用
     */
    applyForceToExistingParticles(x, y, explosionForce, particleSystem) {
        let affectedCount = 0;
        const influenceRadius = Config.PARTICLES.EXPLOSION.INFLUENCE_RADIUS;

        particleSystem.particles.forEach(p => {
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

        return affectedCount;
    }
}

/**
 * パス爆発戦略
 * 軌跡に沿った爆発エフェクト
 */
class PathExplosionStrategy extends ExplosionStrategy {
    async create(x, y, options = {}, particleSystem) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid explosion coordinates: x=${x}, y=${y}`);
        }

        if (!options.path || options.path.length < 2) {
            throw new Error('Invalid path: need at least 2 points');
        }

        const explosionConfig = Config.PARTICLES.EXPLOSION;
        const pathExplosionConfig = Config.PARTICLES.PATH_EXPLOSION;
        
        const multiplier = pathExplosionConfig.PARTICLE_COUNT_MULTIPLIER;
        const numParticles = options.particleCount || 
            random(explosionConfig.PARTICLE_COUNT_RANGE.min * multiplier, explosionConfig.PARTICLE_COUNT_RANGE.max * multiplier);
        const explosionForce = options.force || 
            random(explosionConfig.FORCE_RANGE.min, explosionConfig.FORCE_RANGE.max);

        // パスの方向と速度を計算
        const pathInfo = this.calculatePathDirection(options.path, pathExplosionConfig);

        console.log(`Creating path explosion at (${x.toFixed(1)}, ${y.toFixed(1)}) with ${Math.floor(numParticles)} particles`);

        // 爆発音の再生
        this.playExplosionSound(particleSystem.soundSystem, x, y, explosionForce / explosionConfig.FORCE_RANGE.max);

        // パス爆発パーティクルの生成
        const createdParticles = this.createPathExplosionParticles(
            x, y, numParticles, explosionForce, pathInfo, options.path, particleSystem
        );

        // 既存パーティクルへの影響
        const basicStrategy = new BasicExplosionStrategy();
        basicStrategy.applyForceToExistingParticles(x, y, explosionForce, particleSystem);

        return {
            type: 'path',
            particlesCreated: createdParticles,
            position: { x, y },
            force: explosionForce,
            pathInfo: pathInfo
        };
    }

    /**
     * パスの方向と速度を計算
     */
    calculatePathDirection(path, config) {
        const lastIndex = path.length - 1;
        const refPoints = config.DIRECTION_REFERENCE_POINTS;
        const prevIndex = Math.max(0, lastIndex - refPoints);
        
        const deltaX = path[lastIndex].x - path[prevIndex].x;
        const deltaY = path[lastIndex].y - path[prevIndex].y;
        
        return {
            direction: createVector(deltaX, deltaY).normalize(),
            velocity: Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        };
    }

    /**
     * パス爆発パーティクルの作成
     */
    createPathExplosionParticles(x, y, numParticles, explosionForce, pathInfo, path, particleSystem) {
        let createdCount = 0;
        const explosionConfig = Config.PARTICLES.EXPLOSION;
        const pathConfig = Config.PARTICLES.PATH_EXPLOSION;

        for (let i = 0; i < numParticles; i++) {
            // パスの方向を基準にした角度の計算
            const baseAngle = atan2(pathInfo.direction.y, pathInfo.direction.x);
            const spreadAngle = pathConfig.SPREAD_ANGLE;
            const angle = baseAngle + random(-spreadAngle, spreadAngle);

            // パスの速度に応じた初期速度
            const velocityCoeff = pathConfig.VELOCITY_COEFFICIENT;
            const baseSpeed = explosionForce + pathInfo.velocity * velocityCoeff;
            const speed = random(baseSpeed * 0.5, baseSpeed);

            const particleConfig = particleSystem.createParticleConfig({
                direction: { x: cos(angle), y: sin(angle) },
                speed: speed,
                size: random(pathConfig.SIZE_RANGE.min, pathConfig.SIZE_RANGE.max),
                hue: random(Config.PARTICLES.APPEARANCE.HUE_RANGE),
                saturation: 100,
                brightness: 100,
                alpha: 100,
                lifespan: random(
                    explosionConfig.LIFESPAN_RANGE.min * pathConfig.LIFESPAN_MULTIPLIER,
                    explosionConfig.LIFESPAN_RANGE.max * pathConfig.LIFESPAN_MULTIPLIER
                ),
                mode: particleSystem.effectConfigs[particleSystem.currentEffect].mode,
                trail: true,
                // パスに沿った動きのための追加プロパティ
                followPath: true,
                pathData: this.simplifyPath(path),
                pathProgress: 0,
                pathInfluence: random(
                    Config.PARTICLES.PATH_FOLLOWING.INFLUENCE_RANGE.min,
                    Config.PARTICLES.PATH_FOLLOWING.INFLUENCE_RANGE.max
                )
            });

            const particle = particleSystem.createParticle(x, y, particleConfig);
            if (particle && particleSystem.addParticle(particle)) {
                createdCount++;
            }
        }

        return createdCount;
    }

    /**
     * パスを簡略化（パフォーマンスのため）
     */
    simplifyPath(path) {
        const threshold = Config.PARTICLES.PATH_FOLLOWING.SIMPLIFICATION_THRESHOLD;
        if (path.length <= threshold) return [...path];

        const simplified = [];
        const step = Math.floor(path.length / threshold);

        for (let i = 0; i < path.length; i += step) {
            simplified.push({...path[i]});
        }

        // 最後の点を必ず含める
        if (simplified[simplified.length - 1] !== path[path.length - 1]) {
            simplified.push({...path[path.length - 1]});
        }

        return simplified;
    }
}

/**
 * 爆発管理クラス
 * Strategy パターンの Context クラス
 */
class ExplosionManager {
    constructor() {
        this.strategies = new Map([
            ['basic', new BasicExplosionStrategy()],
            ['path', new PathExplosionStrategy()]
        ]);
    }

    /**
     * 戦略を追加
     * @param {string} name - 戦略名
     * @param {ExplosionStrategy} strategy - 戦略インスタンス
     */
    addStrategy(name, strategy) {
        if (!(strategy instanceof ExplosionStrategy)) {
            throw new Error('Strategy must extend ExplosionStrategy');
        }
        this.strategies.set(name, strategy);
    }

    /**
     * 爆発エフェクトを作成
     * @param {string} type - 爆発タイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} options - オプション
     * @param {ParticleSystem} particleSystem - パーティクルシステム
     * @returns {Promise<Object>} 爆発結果
     */
    async createExplosion(type, x, y, options = {}, particleSystem) {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            throw new Error(`Unknown explosion type: ${type}`);
        }

        return ErrorUtils.executeWithPerformanceMonitoring(async () => {
            return await strategy.create(x, y, options, particleSystem);
        }, `ExplosionManager.createExplosion(${type})`, 15);
    }

    /**
     * 利用可能な爆発タイプを取得
     * @returns {Array<string>} 爆発タイプのリスト
     */
    getAvailableTypes() {
        return Array.from(this.strategies.keys());
    }
}