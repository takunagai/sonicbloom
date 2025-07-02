/**
 * アプリケーション設定とベストプラクティス定数定義
 * 全てのマジックナンバーと設定値を一元管理
 */

/**
 * アプリケーション全体の設定クラス
 */
class AppConfig {
    static get CANVAS() {
        return {
            /** デフォルトの背景アルファ値 */
            DEFAULT_BG_ALPHA: 20,
            /** フレームレート */
            TARGET_FPS: 60,
            /** ブレンドモード */
            BLEND_MODE: 'ADD'
        };
    }

    static get PARTICLES() {
        return {
            /** デフォルト最大パーティクル数 */
            MAX_COUNT: 1000,
            /** 初期パーティクル数 */
            INITIAL_COUNT: 200,
            /** 最小維持パーティクル数 */
            MIN_COUNT: 50,
            /** 自動生成頻度（確率） */
            AUTO_GENERATE_PROBABILITY: 0.1,
            /** 新規生成数の範囲 */
            NEW_GENERATION_RANGE: { min: 1, max: 5 },
            
            /** 物理パラメータ */
            PHYSICS: {
                /** デフォルト重力 */
                DEFAULT_GRAVITY: { x: 0, y: 0.1 },
                /** デフォルト減衰率 */
                DEFAULT_DAMPING: 0.98,
                /** 跳ね返り係数 */
                BOUNCE_FACTOR: 0.8
            },

            /** 外観パラメータ */
            APPEARANCE: {
                /** サイズ範囲 */
                SIZE_RANGE: { min: 2, max: 8 },
                /** 初期サイズ範囲 */
                INITIAL_SIZE_RANGE: { min: 3, max: 8 },
                /** ライフスパン範囲 */
                LIFESPAN_RANGE: { min: 60, max: 180 },
                /** 初期ライフスパン範囲 */
                INITIAL_LIFESPAN_RANGE: { min: 120, max: 240 },
                /** フェードアウト開始時間 */
                FADE_START_TIME: 30,
                /** グロー効果レイヤー数 */
                GLOW_LAYERS: 3
            },

            /** ドラッグ相互作用パラメータ */
            DRAG_INTERACTION: {
                /** 基本影響範囲（px） */
                BASE_INFLUENCE_RADIUS: 100,
                /** 強化影響範囲（px） */
                ENHANCED_INFLUENCE_RADIUS: 200,
                /** 近距離同期範囲（px） */
                SYNC_RADIUS: 50,
                /** 基本力の倍率 */
                BASE_FORCE_MULTIPLIER: 0.1,
                /** 強化力の倍率範囲 */
                ENHANCED_FORCE_RANGE: { min: 0.2, max: 0.8 },
                /** ドラッグ速度範囲（力計算用） */
                DRAG_SPEED_RANGE: { min: 0, max: 50 },
                /** 引力効果の強度 */
                ATTRACTION_STRENGTH: 0.3,
                /** 同期効果の強度 */
                SYNC_STRENGTH: 0.4,
                /** 最低ドラッグ速度（引力効果発動） */
                MIN_DRAG_SPEED_FOR_ATTRACTION: 5
            },

            /** 爆発エフェクトパラメータ */
            EXPLOSION: {
                /** パーティクル数範囲 */
                PARTICLE_COUNT_RANGE: { min: 30, max: 50 },
                /** 爆発力範囲 */
                FORCE_RANGE: { min: 5, max: 15 },
                /** 角度揺らぎ */
                ANGLE_VARIATION: 0.2,
                /** 影響範囲（px） */
                INFLUENCE_RADIUS: 150,
                /** ライフスパン範囲 */
                LIFESPAN_RANGE: { min: 60, max: 120 }
            }
        };
    }

    static get DRAG_TRAIL() {
        return {
            /** 最大軌跡数 */
            MAX_TRAILS: 10,
            /** 軌跡持続時間（フレーム）60fps × 3秒 */
            DURATION_FRAMES: 180,
            /** 最大軌跡セグメント数 */
            MAX_SEGMENTS: 500,
            /** クリーンアップ時の保持数 */
            CLEANUP_KEEP_COUNT: 300,
            /** 最近の軌跡影響時間（フレーム） */
            RECENT_INFLUENCE_FRAMES: 30,

            /** 描画パラメータ */
            RENDERING: {
                /** 線の太さ範囲 */
                THICKNESS_RANGE: { min: 2, max: 8 },
                /** 速度-太さマッピング範囲 */
                VELOCITY_RANGE: { min: 0, max: 20 },
                /** グラデーションレイヤー数 */
                GRADIENT_LAYERS: 3,
                /** 中心線の太さ係数 */
                CORE_THICKNESS_FACTOR: 0.3,
                /** 色相変化速度 */
                HUE_CHANGE_SPEED: 2,
                /** 彩度 */
                SATURATION: 80,
                /** 明度 */
                BRIGHTNESS: 100,
                /** アルファフェード係数 */
                ALPHA_FADE_FACTOR: 0.3
            }
        };
    }

    static get SOUND() {
        return {
            /** デフォルトマスター音量 */
            DEFAULT_MASTER_VOLUME: 0.7,
            /** 最大同時再生音数 */
            MAX_ACTIVE_SOUNDS: 20,
            /** 基底周波数（Hz）- 432Hzは調和の取れた周波数 */
            BASE_FREQUENCY: 432,
            /** 黄金比（音響設計用） */
            GOLDEN_RATIO: 1.618,
            /** デフォルト倍音数 */
            DEFAULT_HARMONIC_COUNT: 5,
            /** アンビエント音のベース音量 */
            AMBIENT_BASE_VOLUME: 0.05,
            /** 心拍BPM */
            HEARTBEAT_BPM: 70,
            
            /** ペンタトニックスケール比率（C, D, E, G, A） */
            PENTATONIC_RATIOS: [1, 9/8, 5/4, 3/2, 5/3],

            /** 初期化設定 */
            INITIALIZATION: {
                /** p5.sound準備チェック間隔（ms） */
                P5_READY_CHECK_INTERVAL: 100,
                /** オーディオコンテキスト開始時のテスト音再生時間（ms） */
                TEST_SOUND_DURATION: 1000,
                /** アンビエント開始遅延（ms） */
                AMBIENT_START_DELAY: 500
            },

            /** エフェクトタイプ別設定 */
            EFFECT_TYPES: {
                1: { // 爆発エフェクト
                    type: 'explosion',
                    envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1 },
                    reverb: { wet: 0.5 }
                },
                2: { // トレイルエフェクト
                    type: 'trail',
                    envelope: { attack: 0.3, decay: 0.5, sustain: 0.4, release: 2 },
                    delay: { time: 0.3, feedback: 0.4 }
                },
                3: { // 虹色パルス
                    type: 'rainbow',
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.8 },
                    filter: { frequency: 800, resonance: 15 }
                },
                4: { // 重力シミュレーション
                    type: 'gravity',
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.3 },
                    pitchBend: { amount: 0.5 }
                },
                5: { // 渦巻きエフェクト
                    type: 'swirl',
                    envelope: { attack: 0.2, decay: 0.4, sustain: 0.3, release: 1.5 },
                    panning: { range: 0.8 }
                }
            },

            /** 波形タイプ */
            WAVEFORMS: {
                SINE: 'sine',
                TRIANGLE: 'triangle',
                SAWTOOTH: 'sawtooth',
                SQUARE: 'square',
                WHITE_NOISE: 'white'
            },

            /** エフェクトパラメータ */
            EFFECTS: {
                /** リバーブ設定 */
                REVERB: { duration: 3, decay: 2, reverse: false },
                /** ディレイ設定 */
                DELAY: { type: 'pingPong', maxTime: 2000 },
                /** LFO設定 */
                LFO: { frequency: 3, amplitude: 50 },
                /** フィルター設定 */
                FILTER: { type: 'bandpass', defaultFreq: 800, defaultRes: 15 },
                /** ハイパスフィルター */
                HIGH_PASS: { frequency: 2000 }
            },

            /** 音響パラメータ */
            AUDIO_PARAMS: {
                /** 爆発音 */
                EXPLOSION: {
                    bassFreqRange: { min: 40, max: 60 },
                    volumeBase: 0.5,
                    shimmerDuration: 500,
                    cleanupDelay: 2000
                },
                /** トレイル音 */
                TRAIL: {
                    octaveRange: { min: -1, max: 2 },
                    volumeBase: 0.2,
                    delayParams: { time: 0.3, feedback: 0.4, maxTime: 2000 },
                    cleanupDelay: 4000
                },
                /** ベル音（パーティクル生成） */
                BELL: {
                    partials: [1, 2.2, 3.6, 5.1],
                    volumeBase: 0.15,
                    cleanupDelay: 2000
                },
                /** アンビエント */
                AMBIENT: {
                    octaveShift: -2,  // 2オクターブ下
                    fadeInTime: 2,    // 2秒
                    fadeOutTime: 2
                },
                /** 心拍音 */
                HEARTBEAT: {
                    frequency: 60,
                    volume: 0.1,
                    duration: 200
                }
            },

            /** 音声マッピング */
            MAPPING: {
                /** 画面幅-周波数範囲（Hz） */
                SCREEN_TO_FREQUENCY: { min: 200, max: 800 },
                /** 速度-音量範囲 */
                VELOCITY_TO_VOLUME: { min: 0.1, max: 0.4 },
                /** パン範囲 */
                PAN_RANGE: { min: -1, max: 1 },
                /** パンニング範囲（制限版） */
                PAN_RANGE_LIMITED: { min: -0.5, max: 0.5 },
                /** Y座標-ピッチベンド範囲 */
                Y_TO_PITCH_BEND: { min: 0.5, max: 2 }
            },

            /** クリーンアップ設定 */
            CLEANUP: {
                /** 定期クリーンアップ間隔（ms） */
                INTERVAL: 10000,
                /** オーディオノード寿命の上限（ms） */
                MAX_NODE_LIFETIME: 10000
            },

            /** デバッグ設定 */
            DEBUG: {
                /** テスト音の周波数 */
                TEST_FREQUENCY: 440,
                /** ログレベル */
                LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
                /** パフォーマンス監視有効 */
                PERFORMANCE_MONITORING: true
            }
        };
    }

    static get PERFORMANCE() {
        return {
            /** パフォーマンス計測間隔（ms） */
            MEASUREMENT_INTERVAL: 1000,
            /** デバッグ情報更新間隔（フレーム） */
            DEBUG_UPDATE_INTERVAL: 60,
            /** メモリ使用量警告閾値（MB） */
            MEMORY_WARNING_THRESHOLD: 100,
            /** FPS警告閾値 */
            FPS_WARNING_THRESHOLD: 30
        };
    }

    static get UI() {
        return {
            /** デバッグキー */
            DEBUG_KEY: 68, // 'D'
            /** ポーズキー */
            PAUSE_KEY: 32, // Space
            /** リセットキー */
            RESET_KEY: 82, // 'R'
            /** ミュートキー */
            MUTE_KEY: 77, // 'M'
            
            /** エフェクト切り替えキー */
            EFFECT_KEYS: [49, 50, 51, 52, 53], // '1'-'5'
            
            /** ステータス表示色 */
            STATUS_COLORS: {
                SUCCESS: '#e8f5e8',
                WARNING: '#fff8e1',
                ERROR: '#ffeaea',
                INFO: '#f0f0f0'
            }
        };
    }

    static get EFFECTS() {
        return {
            /** エフェクト設定 */
            CONFIGS: {
                1: { // 爆発エフェクト
                    mode: 'normal',
                    trail: false,
                    gravity: false,
                    mouseAttraction: 0.5,
                    bgAlpha: 20
                },
                2: { // トレイルエフェクト
                    mode: 'trail',
                    trail: true,
                    gravity: false,
                    mouseAttraction: 1,
                    bgAlpha: 10
                },
                3: { // 虹色パルス
                    mode: 'rainbow',
                    trail: false,
                    gravity: false,
                    mouseAttraction: 0.8,
                    bgAlpha: 5
                },
                4: { // 重力シミュレーション
                    mode: 'gravity',
                    trail: false,
                    gravity: true,
                    mouseAttraction: 0.3,
                    bgAlpha: 15
                },
                5: { // 渦巻きエフェクト
                    mode: 'swirl',
                    trail: true,
                    gravity: false,
                    mouseAttraction: 1.2,
                    bgAlpha: 25
                }
            }
        };
    }

    /**
     * 設定値の検証
     * @param {string} category - 設定カテゴリ
     * @param {string} key - 設定キー
     * @param {*} value - 検証する値
     * @returns {boolean} 有効かどうか
     */
    static validateConfig(category, key, value) {
        try {
            const config = this[category];
            if (!config || !config[key]) return false;
            
            // 基本的な型チェック
            if (typeof value !== typeof config[key]) return false;
            
            return true;
        } catch (error) {
            console.warn(`Config validation failed: ${category}.${key}`, error);
            return false;
        }
    }

    /**
     * 設定値の安全な取得
     * @param {string} category - 設定カテゴリ
     * @param {string} key - 設定キー
     * @param {*} defaultValue - デフォルト値
     * @returns {*} 設定値
     */
    static safeGet(category, key, defaultValue = null) {
        try {
            const config = this[category];
            return config && config[key] !== undefined ? config[key] : defaultValue;
        } catch (error) {
            console.warn(`Config access failed: ${category}.${key}`, error);
            return defaultValue;
        }
    }
}

// グローバルアクセス用のエイリアス
window.Config = AppConfig;