/**
 * パーティクル生成ファクトリーパターン実装
 * 異なる種類のパーティクルを統一的に生成
 */

/**
 * パーティクルファクトリーの基底クラス
 */
class AbstractParticleFactory {
    /**
     * パーティクルを作成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} options - 作成オプション
     * @returns {Particle} 作成されたパーティクル
     */
    createParticle(x, y, options = {}) {
        throw new Error('AbstractParticleFactory.createParticle() must be implemented by subclass');
    }

    /**
     * パーティクル設定を作成
     * @param {Object} baseConfig - 基本設定
     * @returns {Object} パーティクル設定
     */
    createConfig(baseConfig = {}) {
        throw new Error('AbstractParticleFactory.createConfig() must be implemented by subclass');
    }

    /**
     * 座標の検証
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 有効かどうか
     */
    validateCoordinates(x, y) {
        return isFinite(x) && isFinite(y) && !isNaN(x) && !isNaN(y);
    }

    /**
     * デフォルト設定を取得
     * @returns {Object} デフォルト設定
     */
    getDefaultConfig() {
        const particleConfig = Config.PARTICLES;
        return {
            direction: { x: 0, y: 0 },
            speed: random(particleConfig.PHYSICS.SPEED_RANGE.min, particleConfig.PHYSICS.SPEED_RANGE.max),
            size: random(particleConfig.APPEARANCE.SIZE_RANGE.min, particleConfig.APPEARANCE.SIZE_RANGE.max),
            hue: random(particleConfig.APPEARANCE.HUE_RANGE),
            saturation: random(particleConfig.APPEARANCE.SATURATION_RANGE.min, particleConfig.APPEARANCE.SATURATION_RANGE.max),
            brightness: 100,
            alpha: random(60, 100),
            lifespan: random(particleConfig.APPEARANCE.LIFESPAN_RANGE.min, particleConfig.APPEARANCE.LIFESPAN_RANGE.max),
            mode: 'normal',
            trail: false,
            damping: particleConfig.PHYSICS.DEFAULT_DAMPING
        };
    }
}

/**
 * 基本パーティクルファクトリー
 * 通常のパーティクル生成用
 */
class BasicParticleFactory extends AbstractParticleFactory {
    constructor(effectConfig = {}) {
        super();
        this.effectConfig = effectConfig;
    }

    createParticle(x, y, options = {}) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid particle coordinates: x=${x}, y=${y}`);
        }

        const config = this.createConfig(options);
        return new Particle(x, y, config);
    }

    createConfig(baseConfig = {}) {
        const defaultConfig = this.getDefaultConfig();
        const config = { ...defaultConfig, ...baseConfig };

        // エフェクト設定の適用
        if (this.effectConfig.mode) {
            config.mode = this.effectConfig.mode;
        }
        if (this.effectConfig.trail !== undefined) {
            config.trail = this.effectConfig.trail;
        }

        return config;
    }
}

/**
 * 爆発パーティクルファクトリー
 * 爆発エフェクト用のパーティクル生成
 */
class ExplosionParticleFactory extends AbstractParticleFactory {
    constructor(explosionType = 'basic') {
        super();
        this.explosionType = explosionType;
    }

    createParticle(x, y, options = {}) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid explosion particle coordinates: x=${x}, y=${y}`);
        }

        const config = this.createConfig(options);
        return new Particle(x, y, config);
    }

    createConfig(baseConfig = {}) {
        const defaultConfig = this.getDefaultConfig();
        const explosionConfig = Config.PARTICLES.EXPLOSION;
        
        // 爆発パーティクル専用の設定
        const explosionDefaults = {
            size: random(explosionConfig.SIZE_RANGE?.min || 4, explosionConfig.SIZE_RANGE?.max || 10),
            hue: random(Config.PARTICLES.APPEARANCE.HUE_RANGE),
            saturation: 100,
            brightness: 100,
            alpha: 100,
            lifespan: random(explosionConfig.LIFESPAN_RANGE.min, explosionConfig.LIFESPAN_RANGE.max),
            trail: true,
            mode: baseConfig.mode || 'normal'
        };

        // パス爆発の場合の追加設定
        if (this.explosionType === 'path') {
            const pathConfig = Config.PARTICLES.PATH_EXPLOSION;
            explosionDefaults.size = random(pathConfig.SIZE_RANGE.min, pathConfig.SIZE_RANGE.max);
            explosionDefaults.lifespan = random(
                explosionConfig.LIFESPAN_RANGE.min * pathConfig.LIFESPAN_MULTIPLIER,
                explosionConfig.LIFESPAN_RANGE.max * pathConfig.LIFESPAN_MULTIPLIER
            );
            
            // パス追従設定
            if (baseConfig.followPath) {
                explosionDefaults.followPath = true;
                explosionDefaults.pathData = baseConfig.pathData;
                explosionDefaults.pathProgress = 0;
                explosionDefaults.pathInfluence = baseConfig.pathInfluence || 
                    random(Config.PARTICLES.PATH_FOLLOWING.INFLUENCE_RANGE.min, 
                           Config.PARTICLES.PATH_FOLLOWING.INFLUENCE_RANGE.max);
            }
        }

        return { ...defaultConfig, ...explosionDefaults, ...baseConfig };
    }
}

/**
 * トレイルパーティクルファクトリー
 * ドラッグトレイル用のパーティクル生成
 */
class TrailParticleFactory extends AbstractParticleFactory {
    createParticle(x, y, options = {}) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid trail particle coordinates: x=${x}, y=${y}`);
        }

        const config = this.createConfig(options);
        return new Particle(x, y, config);
    }

    createConfig(baseConfig = {}) {
        const defaultConfig = this.getDefaultConfig();
        
        // トレイルパーティクル専用の設定
        const trailDefaults = {
            trail: true,
            mode: 'trail',
            damping: 0.95,
            size: random(2, 6),
            alpha: random(40, 80),
            lifespan: random(30, 90)
        };

        return { ...defaultConfig, ...trailDefaults, ...baseConfig };
    }
}

/**
 * 初期パーティクルファクトリー
 * アプリケーション起動時のパーティクル生成用
 */
class InitialParticleFactory extends AbstractParticleFactory {
    createParticle(x, y, options = {}) {
        if (!this.validateCoordinates(x, y)) {
            throw new Error(`Invalid initial particle coordinates: x=${x}, y=${y}`);
        }

        const config = this.createConfig(options);
        return new Particle(x, y, config);
    }

    createConfig(baseConfig = {}) {
        const defaultConfig = this.getDefaultConfig();
        const particleConfig = Config.PARTICLES;
        
        // 初期パーティクル専用の設定
        const initialDefaults = {
            size: random(particleConfig.APPEARANCE.INITIAL_SIZE_RANGE.min, particleConfig.APPEARANCE.INITIAL_SIZE_RANGE.max),
            alpha: random(80, 100),
            lifespan: random(particleConfig.APPEARANCE.INITIAL_LIFESPAN_RANGE.min, particleConfig.APPEARANCE.INITIAL_LIFESPAN_RANGE.max),
            speed: random(0.5, 2)
        };

        return { ...defaultConfig, ...initialDefaults, ...baseConfig };
    }
}

/**
 * パーティクルファクトリー管理クラス
 * Factory Method パターンの実装
 */
class ParticleFactoryManager {
    constructor() {
        this.factories = new Map();
        this.currentEffectConfig = {};
        this.initializeFactories();
    }

    /**
     * ファクトリーの初期化
     */
    initializeFactories() {
        this.factories.set('basic', new BasicParticleFactory());
        this.factories.set('explosion', new ExplosionParticleFactory('basic'));
        this.factories.set('pathExplosion', new ExplosionParticleFactory('path'));
        this.factories.set('trail', new TrailParticleFactory());
        this.factories.set('initial', new InitialParticleFactory());
    }

    /**
     * ファクトリーを追加
     * @param {string} type - ファクトリータイプ
     * @param {AbstractParticleFactory} factory - ファクトリーインスタンス
     */
    addFactory(type, factory) {
        if (!(factory instanceof AbstractParticleFactory)) {
            throw new Error('Factory must extend AbstractParticleFactory');
        }
        this.factories.set(type, factory);
    }

    /**
     * エフェクト設定を更新
     * @param {Object} effectConfig - エフェクト設定
     */
    updateEffectConfig(effectConfig) {
        this.currentEffectConfig = effectConfig;
        
        // 基本ファクトリーにエフェクト設定を適用
        const basicFactory = new BasicParticleFactory(effectConfig);
        this.factories.set('basic', basicFactory);
    }

    /**
     * パーティクルを作成
     * @param {string} type - パーティクルタイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} options - 作成オプション
     * @returns {Particle} 作成されたパーティクル
     */
    createParticle(type, x, y, options = {}) {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Unknown particle type: ${type}. Available types: ${Array.from(this.factories.keys()).join(', ')}`);
        }

        return ErrorUtils.safeExecute(() => {
            return factory.createParticle(x, y, options);
        }, `ParticleFactoryManager.createParticle(${type})`, null);
    }

    /**
     * パーティクル設定を作成
     * @param {string} type - パーティクルタイプ
     * @param {Object} baseConfig - 基本設定
     * @returns {Object} パーティクル設定
     */
    createConfig(type, baseConfig = {}) {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Unknown particle type: ${type}`);
        }

        return factory.createConfig(baseConfig);
    }

    /**
     * 複数のパーティクルを一括作成
     * @param {string} type - パーティクルタイプ
     * @param {Array} positions - 位置配列 [{x, y, options}, ...]
     * @returns {Array} 作成されたパーティクル配列
     */
    createMultipleParticles(type, positions) {
        const particles = [];
        const factory = this.factories.get(type);
        
        if (!factory) {
            throw new Error(`Unknown particle type: ${type}`);
        }

        for (const pos of positions) {
            try {
                const particle = factory.createParticle(pos.x, pos.y, pos.options || {});
                if (particle) {
                    particles.push(particle);
                }
            } catch (error) {
                console.warn(`Failed to create particle at (${pos.x}, ${pos.y}):`, error);
            }
        }

        return particles;
    }

    /**
     * 利用可能なパーティクルタイプを取得
     * @returns {Array<string>} パーティクルタイプのリスト
     */
    getAvailableTypes() {
        return Array.from(this.factories.keys());
    }

    /**
     * ファクトリーの統計情報を取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        return {
            factoryCount: this.factories.size,
            availableTypes: this.getAvailableTypes(),
            currentEffectConfig: this.currentEffectConfig
        };
    }
}

/**
 * パーティクル生成ヘルパー関数群
 */
class ParticleCreationHelpers {
    /**
     * 円形配置でパーティクルを生成
     * @param {ParticleFactoryManager} manager - ファクトリーマネージャー
     * @param {string} type - パーティクルタイプ
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} count - パーティクル数
     * @param {number} radius - 半径
     * @param {Object} baseOptions - 基本オプション
     * @returns {Array} 作成されたパーティクル配列
     */
    static createCircularLayout(manager, type, centerX, centerY, count, radius, baseOptions = {}) {
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (TWO_PI / count) * i;
            const x = centerX + cos(angle) * radius;
            const y = centerY + sin(angle) * radius;
            
            const options = {
                ...baseOptions,
                direction: { x: cos(angle), y: sin(angle) }
            };
            
            positions.push({ x, y, options });
        }
        
        return manager.createMultipleParticles(type, positions);
    }

    /**
     * 放射状爆発パターンでパーティクルを生成
     * @param {ParticleFactoryManager} manager - ファクトリーマネージャー
     * @param {string} type - パーティクルタイプ
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} count - パーティクル数
     * @param {number} force - 爆発力
     * @param {Object} baseOptions - 基本オプション
     * @returns {Array} 作成されたパーティクル配列
     */
    static createExplosionPattern(manager, type, centerX, centerY, count, force, baseOptions = {}) {
        const positions = [];
        const explosionConfig = Config.PARTICLES.EXPLOSION;
        
        for (let i = 0; i < count; i++) {
            const angle = (TWO_PI / count) * i + random(-explosionConfig.ANGLE_VARIATION, explosionConfig.ANGLE_VARIATION);
            const speed = random(force * 0.5, force);
            
            const options = {
                ...baseOptions,
                direction: { x: cos(angle), y: sin(angle) },
                speed: speed
            };
            
            positions.push({ x: centerX, y: centerY, options });
        }
        
        return manager.createMultipleParticles(type, positions);
    }

    /**
     * ランダム配置でパーティクルを生成
     * @param {ParticleFactoryManager} manager - ファクトリーマネージャー
     * @param {string} type - パーティクルタイプ
     * @param {number} count - パーティクル数
     * @param {Object} bounds - 境界 {x, y, width, height}
     * @param {Object} baseOptions - 基本オプション
     * @returns {Array} 作成されたパーティクル配列
     */
    static createRandomLayout(manager, type, count, bounds, baseOptions = {}) {
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            const x = random(bounds.x, bounds.x + bounds.width);
            const y = random(bounds.y, bounds.y + bounds.height);
            
            positions.push({ x, y, options: baseOptions });
        }
        
        return manager.createMultipleParticles(type, positions);
    }
}