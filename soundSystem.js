/**
 * 感情を動かす調和の取れたサウンドシステム
 * 音楽理論（ペンタトニックスケール、黄金比、倍音構造）に基づいた音生成
 * 統一されたエラーハンドリングとパフォーマンス最適化を実装
 */
class SoundSystem {
    /**
     * SoundSystemのコンストラクタ
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        try {
            // 設定値の初期化（Config使用）
            const soundConfig = Config.SOUND;
            
            // 基本設定
            this.isEnabled = options.enabled !== undefined ? options.enabled : true;
            this.masterVolume = options.masterVolume || soundConfig.DEFAULT_MASTER_VOLUME;
            this.isMuted = options.muted || false;
            this.isInitialized = false;
            this.p5SoundReady = false;
            
            // 音楽理論パラメータ（Configから取得）
            this.goldenRatio = soundConfig.GOLDEN_RATIO;
            this.baseFrequency = soundConfig.BASE_FREQUENCY;
            this.pentatonicRatios = soundConfig.PENTATONIC_RATIOS;
            this.defaultHarmonicCount = soundConfig.DEFAULT_HARMONIC_COUNT;
            
            // エフェクト設定
            this.effectParams = soundConfig.EFFECT_TYPES;
            
            // オーディオエフェクト
            this.audioEffects = {
                reverb: null,
                delay: null,
                filter: null,
                compressor: null
            };
            
            // アンビエント要素
            this.ambientComponents = {
                oscillator: null,
                gain: null,
                heartbeatInterval: null
            };
            
            // アクティブサウンドの管理
            this.activeSounds = new Map();
            this.maxActiveSounds = soundConfig.MAX_ACTIVE_SOUNDS;
            this.soundIdCounter = 0;
            
            // パフォーマンス監視
            this.performanceStats = {
                totalSoundsCreated: 0,
                activeSoundCount: 0,
                lastCleanupTime: 0,
                initializationTime: 0,
                audioContextStartTime: 0
            };
            
            console.log('✅ SoundSystem constructor completed');
        } catch (error) {
            errorHandler.handleError(new AppError(
                `SoundSystem initialization failed: ${error.message}`,
                ErrorCategory.SOUND,
                ErrorLevel.ERROR,
                { options, error }
            ));
            
            // フォールバック初期化
            this.initializeFallbackSettings();
        }
    }
    
    /**
     * フォールバック設定の初期化
     */
    initializeFallbackSettings() {
        this.isEnabled = true;
        this.masterVolume = 0.7;
        this.isMuted = false;
        this.isInitialized = false;
        this.p5SoundReady = false;
        this.goldenRatio = 1.618;
        this.baseFrequency = 432;
        this.pentatonicRatios = [1, 9/8, 5/4, 3/2, 5/3];
        this.defaultHarmonicCount = 5;
        this.activeSounds = new Map();
        this.maxActiveSounds = 20;
        this.soundIdCounter = 0;
        this.audioEffects = {};
        this.ambientComponents = {};
        this.performanceStats = {
            totalSoundsCreated: 0, activeSoundCount: 0, lastCleanupTime: 0,
            initializationTime: 0, audioContextStartTime: 0
        };
    }
    
    /**
     * システムの初期化
     * p5.soundの準備とオーディオエフェクトの設定
     */
    init() {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const startTime = performance.now();
            
            console.log('🔧 SoundSystem.init() called, isInitialized:', this.isInitialized);
            
            if (this.isInitialized) return true;
            
            // p5.soundの可用性確認
            if (!this.checkP5SoundAvailability()) {
                this.scheduleRetryInit();
                return false;
            }
            
            // オーディオコンテキストの状態確認
            const audioContext = this.getAudioContext();
            if (!this.validateAudioContext(audioContext)) {
                return false;
            }
            
            // オーディオエフェクトの初期化
            this.initializeAudioEffects();
            
            // アンビエントサウンドの準備
            this.initializeAmbientSound();
            
            // マスターボリューム設定
            this.applyMasterVolume();
            
            this.isInitialized = true;
            this.p5SoundReady = true;
            this.performanceStats.initializationTime = performance.now() - startTime;
            
            console.log('🎉 SoundSystem initialized successfully!');
            this.updateSoundStatus('🟢 サウンドシステム: 初期化完了', Config.UI.STATUS_COLORS.SUCCESS);
            
            return true;
        }, 'SoundSystem.init', 100);
    }
    
    /**
     * p5.soundの可用性確認
     * @returns {boolean} 利用可能かどうか
     */
    checkP5SoundAvailability() {
        return ErrorUtils.safeExecute(() => {
            console.log('🔍 Checking p5.sound availability...');
            console.log('- typeof p5:', typeof p5);
            console.log('- p5.Reverb exists:', typeof p5 !== 'undefined' && !!p5.Reverb);
            console.log('- p5.Oscillator exists:', typeof p5 !== 'undefined' && !!p5.Oscillator);
            
            return typeof p5 !== 'undefined' && p5.Reverb && p5.Oscillator;
        }, 'SoundSystem.checkP5SoundAvailability', false);
    }
    
    /**
     * 初期化の再試行をスケジュール
     */
    scheduleRetryInit() {
        const retryInterval = Config.SOUND.INITIALIZATION.P5_READY_CHECK_INTERVAL;
        console.warn(`❌ p5.sound is not ready yet. Retrying in ${retryInterval}ms...`);
        setTimeout(() => this.init(), retryInterval);
    }
    
    /**
     * オーディオコンテキストの取得と検証
     * @returns {AudioContext|null} オーディオコンテキスト
     */
    getAudioContext() {
        return ErrorUtils.safeExecute(() => {
            if (typeof getAudioContext !== 'function') {
                throw new Error('getAudioContext function not available');
            }
            return getAudioContext();
        }, 'SoundSystem.getAudioContext', null);
    }
    
    /**
     * オーディオコンテキストの状態検証
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @returns {boolean} 有効かどうか
     */
    validateAudioContext(audioContext) {
        return ErrorUtils.safeExecute(() => {
            if (!audioContext) {
                throw new Error('Audio context not available');
            }
            
            console.log('🔊 Audio Context Details:');
            console.log('- State:', audioContext.state);
            console.log('- Sample Rate:', audioContext.sampleRate);
            console.log('- Current Time:', audioContext.currentTime);
            
            if (audioContext.state !== 'running') {
                console.log('⏸️ Audio context is not running. Will initialize on user interaction.');
                this.updateSoundStatus('🟡 サウンドシステム: クリックして開始', Config.UI.STATUS_COLORS.WARNING);
                return false;
            }
            
            return true;
        }, 'SoundSystem.validateAudioContext', false);
    }
    
    /**
     * オーディオエフェクトの初期化
     * リバーブ、ディレイ、フィルター、コンプレッサーを設定
     */
    initializeAudioEffects() {
        return ErrorUtils.safeExecute(() => {
            const effectsConfig = Config.SOUND.EFFECTS;
            
            // リバーブの初期化
            console.log('🔧 Initializing Reverb...');
            this.audioEffects.reverb = new p5.Reverb();
            const reverbSettings = effectsConfig.REVERB;
            this.audioEffects.reverb.set(reverbSettings.duration, reverbSettings.decay, reverbSettings.reverse);
            console.log('✅ Reverb initialized');
            
            // ディレイの初期化
            console.log('🔧 Initializing Delay...');
            this.audioEffects.delay = new p5.Delay();
            this.audioEffects.delay.setType(effectsConfig.DELAY.type);
            console.log('✅ Delay initialized');
            
            // フィルターの初期化
            console.log('🔧 Initializing Filter...');
            this.audioEffects.filter = new p5.BandPass();
            console.log('✅ Filter initialized');
            
            // コンプレッサーの初期化
            console.log('🔧 Initializing Compressor...');
            this.audioEffects.compressor = new p5.Compressor();
            console.log('✅ Compressor initialized');
            
        }, 'SoundSystem.initializeAudioEffects');
    }
    
    /**
     * アンビエントサウンドの初期化
     * 基底音と心拍リズムを設定
     */
    initializeAmbientSound() {
        return ErrorUtils.safeExecute(() => {
            const ambientConfig = Config.SOUND.AUDIO_PARAMS.AMBIENT;
            
            console.log('🔧 Initializing Ambient Sound...');
            
            // 基底音（ドローン）の生成
            this.ambientComponents.oscillator = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const octaveShift = Math.pow(2, ambientConfig.octaveShift);
            this.ambientComponents.oscillator.freq(this.baseFrequency * octaveShift);
            
            this.ambientComponents.gain = new p5.Gain();
            this.ambientComponents.oscillator.disconnect();
            this.ambientComponents.oscillator.connect(this.ambientComponents.gain);
            this.ambientComponents.gain.connect(this.audioEffects.reverb);
            
            // 心拍リズムの開始
            this.startHeartbeatRhythm();
            
            console.log('✅ Ambient Sound initialized');
        }, 'SoundSystem.initializeAmbientSound');
    }
    
    /**
     * マスターボリュームの適用
     */
    applyMasterVolume() {
        return ErrorUtils.safeExecute(() => {
            console.log('🔊 Setting master volume to:', this.masterVolume);
            this.setP5MasterVolume(this.masterVolume);
            console.log('✅ Master volume set');
        }, 'SoundSystem.applyMasterVolume');
    }
    
    /**
     * ユーザーインタラクション時の初期化
     * オーディオコンテキストの開始とテスト音再生
     */
    initOnUserGesture() {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const startTime = performance.now();
            
            console.log('🎤 Initializing sound on user gesture...');
            this.updateSoundStatus('🟡 サウンドシステム: 音声コンテキスト開始中...', Config.UI.STATUS_COLORS.WARNING);
            
            this.startAudioContext().then(() => {
                console.log('✅ Audio context started successfully');
                this.performanceStats.audioContextStartTime = performance.now() - startTime;
                
                if (!this.isInitialized) {
                    this.init();
                }
                
                this.updateSoundStatus('🟢 サウンドシステム: テスト音再生中...', Config.UI.STATUS_COLORS.SUCCESS);
                
                // テスト音の再生
                this.playTestSound();
                
                // アンビエントサウンドの開始（遅延）
                const ambientDelay = Config.SOUND.INITIALIZATION.AMBIENT_START_DELAY;
                setTimeout(() => {
                    this.startAmbient();
                    this.updateSoundStatus('🎵 サウンドシステム: 動作中', Config.UI.STATUS_COLORS.SUCCESS);
                }, ambientDelay);
                
            }).catch(error => {
                errorHandler.handleError(new AppError(
                    `Failed to start audio: ${error.message}`,
                    ErrorCategory.SOUND,
                    ErrorLevel.ERROR,
                    { error }
                ));
                this.updateSoundStatus('🔴 サウンドシステム: 音声コンテキストエラー', Config.UI.STATUS_COLORS.ERROR);
            });
        }, 'SoundSystem.initOnUserGesture', 200);
    }
    
    /**
     * オーディオコンテキストの開始
     * @returns {Promise<AudioContext>} 開始されたオーディオコンテキスト
     */
    async startAudioContext() {
        const audioContext = this.getAudioContext();
        if (!audioContext) {
            throw new Error('Audio context not available');
        }
        
        console.log('🔊 Current audio context state:', audioContext.state);
        
        // p5.soundのuserStartAudioを試行
        try {
            if (typeof userStartAudio === 'function') {
                console.log('🎵 Trying p5.sound userStartAudio...');
                await userStartAudio();
                console.log('✅ p5.sound userStartAudio succeeded');
            }
        } catch (error) {
            console.warn('⚠️ p5.sound userStartAudio failed:', error);
        }
        
        // Web Audio APIのresumeを直接実行
        if (audioContext.state === 'suspended') {
            console.log('🔄 Audio context still suspended, trying direct resume...');
            try {
                await audioContext.resume();
                console.log('✅ Audio context resumed successfully');
            } catch (error) {
                console.error('❌ Failed to resume audio context:', error);
                throw error;
            }
        }
        
        // 最終状態確認
        console.log('🔊 Final audio context state:', audioContext.state);
        
        if (audioContext.state !== 'running') {
            throw new Error(`Audio context failed to start. State: ${audioContext.state}`);
        }
        
        return audioContext;
    }
    
    /**
     * サウンドステータスの表示更新
     * @param {string} message - 表示メッセージ
     * @param {string} backgroundColor - 背景色
     */
    updateSoundStatus(message, backgroundColor = Config.UI.STATUS_COLORS.INFO) {
        return ErrorUtils.safeExecute(() => {
            const statusElement = document.getElementById('sound-status-text');
            const statusContainer = document.getElementById('sound-status');
            
            if (statusElement) {
                statusElement.textContent = message;
            }
            
            if (statusContainer) {
                statusContainer.style.backgroundColor = backgroundColor;
            }
            
            console.log('📊 Sound status updated:', message);
        }, 'SoundSystem.updateSoundStatus');
    }
    
    /**
     * p5.soundのマスターボリューム設定（バージョン対応）
     * @param {number} volume - ボリューム値（0-1）
     * @returns {boolean} 設定成功かどうか
     */
    setP5MasterVolume(volume) {
        return ErrorUtils.safeExecute(() => {
            console.log('🔊 Attempting to set p5.sound master volume:', volume);
            
            // p5.sound 1.9.0+では outputVolume、旧版では masterVolume
            const volumeSetters = [
                { name: 'outputVolume', func: outputVolume },
                { name: 'masterVolume', func: masterVolume },
                { name: 'window.outputVolume', func: window.outputVolume },
                { name: 'window.masterVolume', func: window.masterVolume }
            ];
            
            for (const setter of volumeSetters) {
                if (typeof setter.func === 'function') {
                    console.log(`✅ Using ${setter.name}`);
                    setter.func(volume);
                    return true;
                }
            }
            
            console.warn('❌ No p5.sound volume function found, volume control disabled');
            return false;
        }, 'SoundSystem.setP5MasterVolume', false);
    }
    
    /**
     * テスト音の再生（デバッグ用）
     * オーディオシステムの動作確認
     */
    playTestSound() {
        return ErrorUtils.safeExecute(() => {
            console.log('🧪 Playing test sound...');
            
            if (!this.isEnabled || this.isMuted) {
                console.log('❌ Test sound skipped due to state (enabled:', this.isEnabled, 'muted:', this.isMuted, ')');
                return;
            }
            
            const testConfig = Config.SOUND.DEBUG;
            const testDuration = Config.SOUND.INITIALIZATION.TEST_SOUND_DURATION;
            const envelope = Config.SOUND.AUDIO_PARAMS.HEARTBEAT; // テスト用のエンベロープとして流用
            
            const testOsc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const testEnv = new p5.Envelope();
            
            console.log(`🔊 p5.sound test: Creating ${testConfig.TEST_FREQUENCY}Hz sine wave`);
            testOsc.freq(testConfig.TEST_FREQUENCY);
            testEnv.setADSR(envelope.attack || 0.1, envelope.decay || 0.3, envelope.sustain || 0.3, envelope.release || 0.5);
            testEnv.setRange(0.3, 0);
            
            console.log('▶️ Starting p5 test oscillator');
            testOsc.start();
            testEnv.play(testOsc);
            
            setTimeout(() => {
                console.log('⏹️ Stopping p5 test oscillator');
                this.cleanupAudioNode(testOsc, testEnv, 'test sound');
                console.log('✅ p5.sound test completed successfully');
            }, testDuration);
            
        }, 'SoundSystem.playTestSound');
    }
    
    /**
     * 心拍リズムの開始
     * 60-80 BPMの生体リズムに基づく
     */
    startHeartbeatRhythm() {
        return ErrorUtils.safeExecute(() => {
            if (!this.p5SoundReady) return;
            
            const bpm = Config.SOUND.HEARTBEAT_BPM;
            const interval = 60000 / bpm;
            
            // 既存のインターバルをクリア
            if (this.ambientComponents.heartbeatInterval) {
                clearInterval(this.ambientComponents.heartbeatInterval);
            }
            
            this.ambientComponents.heartbeatInterval = setInterval(() => {
                if (this.isEnabled && !this.isMuted && this.p5SoundReady) {
                    this.playHeartbeat();
                }
            }, interval);
            
            console.log(`🫀 Heartbeat rhythm started at ${bpm} BPM`);
        }, 'SoundSystem.startHeartbeatRhythm');
    }
    
    /**
     * 心拍音の再生
     * 低周波での短い音響パルス
     */
    playHeartbeat() {
        return ErrorUtils.safeExecute(() => {
            const heartbeatConfig = Config.SOUND.AUDIO_PARAMS.HEARTBEAT;
            
            const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const env = new p5.Envelope();
            
            osc.freq(heartbeatConfig.frequency);
            env.setADSR(0.01, 0.1, 0.2, 0.1);
            env.setRange(heartbeatConfig.volume, 0);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                this.cleanupAudioNode(osc, env, 'heartbeat');
            }, heartbeatConfig.duration);
        }, 'SoundSystem.playHeartbeat');
    }
    
    /**
     * ペンタトニックスケールの周波数を取得
     * @param {number} index - スケール内のインデックス
     * @param {number} octave - オクターブシフト
     * @returns {number} 周波数（Hz）
     */
    getPentatonicFrequency(index, octave = 0) {
        return ErrorUtils.safeExecute(() => {
            if (!isFinite(index) || !isFinite(octave)) {
                throw new Error(`Invalid parameters: index=${index}, octave=${octave}`);
            }
            
            const ratio = this.pentatonicRatios[index % this.pentatonicRatios.length];
            const octaveMultiplier = Math.pow(2, octave);
            return this.baseFrequency * ratio * octaveMultiplier;
        }, 'SoundSystem.getPentatonicFrequency', this.baseFrequency);
    }
    
    /**
     * 倍音構造を持つオシレーターの作成
     * @param {number} fundamental - 基本周波数
     * @param {number} harmonicCount - 倍音数
     * @returns {Object} オシレーターと音量制御のセット
     */
    createHarmonicOscillator(fundamental, harmonicCount = null) {
        return ErrorUtils.safeExecute(() => {
            if (!isFinite(fundamental) || fundamental <= 0) {
                throw new Error(`Invalid fundamental frequency: ${fundamental}`);
            }
            
            const count = harmonicCount || this.defaultHarmonicCount;
            const oscillators = [];
            const gains = [];
            
            for (let i = 0; i < count; i++) {
                const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
                const gain = new p5.Gain();
                
                // 倍音の周波数と振幅
                const harmonic = i + 1;
                const freq = fundamental * harmonic;
                const amp = 1 / (harmonic * this.goldenRatio);
                
                osc.freq(freq);
                gain.setInput(osc);
                gain.amp(amp);
                
                oscillators.push(osc);
                gains.push(gain);
            }
            
            return { oscillators, gains };
        }, 'SoundSystem.createHarmonicOscillator', { oscillators: [], gains: [] });
    }
    
    /**
     * エフェクトサウンドの再生
     * @param {number} effectType - エフェクトタイプ（1-5）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度（0-1）
     */
    playEffectSound(effectType, x, y, intensity = 1) {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
            
            // 座標とパラメータの検証
            if (!this.validateSoundParameters(effectType, x, y, intensity)) return;
            
            // アクティブサウンド数の制限
            if (!this.checkActiveSoundLimit()) return;
            
            const params = this.effectParams[effectType];
            if (!params) {
                console.warn(`Unknown effect type: ${effectType}`);
                return;
            }
            
            switch (params.type) {
                case 'explosion':
                    this.playExplosionSound(x, y, intensity);
                    break;
                case 'trail':
                    this.playTrailSound(x, y, intensity);
                    break;
                case 'rainbow':
                    this.playRainbowSound(x, y, intensity);
                    break;
                case 'gravity':
                    this.playGravitySound(x, y, intensity);
                    break;
                case 'swirl':
                    this.playSwirlSound(x, y, intensity);
                    break;
                default:
                    console.warn(`Unhandled effect type: ${params.type}`);
            }
        }, 'SoundSystem.playEffectSound', 20);
    }
    
    /**
     * サウンドパラメータの検証
     * @param {number} effectType - エフェクトタイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     * @returns {boolean} 有効かどうか
     */
    validateSoundParameters(effectType, x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const params = [effectType, x, y, intensity];
            for (const param of params) {
                if (!isFinite(param) || isNaN(param)) {
                    errorHandler.handleError(new AppError(
                        'Invalid sound parameters',
                        ErrorCategory.SOUND,
                        ErrorLevel.WARN,
                        { effectType, x, y, intensity }
                    ));
                    return false;
                }
            }
            return true;
        }, 'SoundSystem.validateSoundParameters', false);
    }
    
    /**
     * アクティブサウンド数の制限チェック
     * @returns {boolean} 再生可能かどうか
     */
    checkActiveSoundLimit() {
        if (this.activeSounds.size >= this.maxActiveSounds) {
            console.debug(`Active sound limit reached: ${this.activeSounds.size}`);
            this.performSoundCleanup();
            return this.activeSounds.size < this.maxActiveSounds;
        }
        return true;
    }
    
    /**
     * 爆発音の生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playExplosionSound(x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const explosionConfig = Config.SOUND.AUDIO_PARAMS.EXPLOSION;
            const mappingConfig = Config.SOUND.MAPPING;
            
            // 低周波の衝撃音
            const bassOsc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SAWTOOTH);
            const bassEnv = new p5.Envelope();
            
            const bassFreq = explosionConfig.bassFreqRange.min + 
                           random(0, explosionConfig.bassFreqRange.max - explosionConfig.bassFreqRange.min);
            bassOsc.freq(bassFreq);
            
            const explosionEnv = this.effectParams[1].envelope;
            bassEnv.setADSR(explosionEnv.attack, explosionEnv.decay, explosionEnv.sustain, explosionEnv.release);
            bassEnv.setRange(explosionConfig.volumeBase * intensity, 0);
            
            // 高周波の煌めき
            const shimmerOsc = new p5.Noise(Config.SOUND.WAVEFORMS.WHITE_NOISE);
            const shimmerEnv = new p5.Envelope();
            const shimmerFilter = new p5.HighPass();
            
            shimmerFilter.freq(Config.SOUND.EFFECTS.HIGH_PASS.frequency);
            shimmerOsc.disconnect();
            shimmerOsc.connect(shimmerFilter);
            shimmerFilter.connect(this.audioEffects.reverb);
            
            shimmerEnv.setADSR(0.01, 0.1, 0.05, 0.5);
            shimmerEnv.setRange(0.3 * intensity, 0);
            
            // パンニング設定
            const pan = map(x, 0, width, mappingConfig.PAN_RANGE.min, mappingConfig.PAN_RANGE.max);
            bassOsc.pan(pan);
            
            // サウンドID生成と追跡
            const soundId = this.generateSoundId('explosion');
            this.trackActiveSound(soundId, [bassOsc, shimmerOsc, bassEnv, shimmerEnv, shimmerFilter]);
            
            // 再生
            bassOsc.start();
            shimmerOsc.start();
            bassEnv.play(bassOsc);
            shimmerEnv.play(shimmerOsc);
            
            // クリーンアップ
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, explosionConfig.cleanupDelay);
            
        }, 'SoundSystem.playExplosionSound');
    }
    
    /**
     * トレイル音の生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playTrailSound(x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const trailConfig = Config.SOUND.AUDIO_PARAMS.TRAIL;
            const mappingConfig = Config.SOUND.MAPPING;
            
            const noteIndex = floor(random(5));
            const octave = floor(random(trailConfig.octaveRange.min, trailConfig.octaveRange.max));
            const freq = this.getPentatonicFrequency(noteIndex, octave);
            
            const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.TRIANGLE);
            const env = new p5.Envelope();
            
            osc.freq(freq);
            const trailEnv = this.effectParams[2].envelope;
            env.setADSR(trailEnv.attack, trailEnv.decay, trailEnv.sustain, trailEnv.release);
            env.setRange(trailConfig.volumeBase * intensity, 0);
            
            // ディレイ効果
            osc.disconnect();
            osc.connect(this.audioEffects.delay);
            const delayParams = trailConfig.delayParams;
            this.audioEffects.delay.process(osc, delayParams.time, delayParams.feedback, delayParams.maxTime);
            
            // パンニング
            const pan = map(x, 0, width, mappingConfig.PAN_RANGE.min, mappingConfig.PAN_RANGE.max);
            osc.pan(pan);
            
            const soundId = this.generateSoundId('trail');
            this.trackActiveSound(soundId, [osc, env]);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, trailConfig.cleanupDelay);
            
        }, 'SoundSystem.playTrailSound');
    }
    
    /**
     * 虹色パルス音の生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playRainbowSound(x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const { oscillators, gains } = this.createHarmonicOscillator(
                this.getPentatonicFrequency(floor(random(5))),
                3
            );
            
            const env = new p5.Envelope();
            const rainbowEnv = this.effectParams[3].envelope;
            env.setADSR(rainbowEnv.attack, rainbowEnv.decay, rainbowEnv.sustain, rainbowEnv.release);
            env.setRange(0.3 * intensity, 0);
            
            // フィルター効果
            const filter = new p5.Filter();
            const filterConfig = Config.SOUND.EFFECTS.FILTER;
            filter.setType(filterConfig.type);
            filter.freq(filterConfig.defaultFreq);
            filter.res(filterConfig.defaultRes);
            
            gains.forEach(gain => {
                gain.connect(filter);
            });
            
            const soundId = this.generateSoundId('rainbow');
            this.trackActiveSound(soundId, [...oscillators, ...gains, filter, env]);
            
            oscillators.forEach(osc => {
                osc.start();
                env.play(osc);
            });
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, Config.SOUND.AUDIO_PARAMS.BELL.cleanupDelay);
            
        }, 'SoundSystem.playRainbowSound');
    }
    
    /**
     * 重力音の生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playGravitySound(x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const mappingConfig = Config.SOUND.MAPPING;
            
            const freq = this.getPentatonicFrequency(floor(random(5)), -1);
            const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const env = new p5.Envelope();
            
            osc.freq(freq);
            const gravityEnv = this.effectParams[4].envelope;
            env.setADSR(gravityEnv.attack, gravityEnv.decay, gravityEnv.sustain, gravityEnv.release);
            env.setRange(0.4 * intensity, 0);
            
            // ピッチベンド効果
            const pitchBend = map(y, 0, height, 
                mappingConfig.Y_TO_PITCH_BEND.max, mappingConfig.Y_TO_PITCH_BEND.min);
            osc.freq(freq * pitchBend);
            
            const soundId = this.generateSoundId('gravity');
            this.trackActiveSound(soundId, [osc, env]);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, 1000);
            
        }, 'SoundSystem.playGravitySound');
    }
    
    /**
     * 渦巻き音の生成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} intensity - 強度
     */
    playSwirlSound(x, y, intensity) {
        return ErrorUtils.safeExecute(() => {
            const lfoConfig = Config.SOUND.EFFECTS.LFO;
            
            const noteIndex = floor(random(5));
            const freq = this.getPentatonicFrequency(noteIndex, 0);
            
            const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const env = new p5.Envelope();
            const lfo = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            
            osc.freq(freq);
            const swirlEnv = this.effectParams[5].envelope;
            env.setADSR(swirlEnv.attack, swirlEnv.decay, swirlEnv.sustain, swirlEnv.release);
            env.setRange(0.25 * intensity, 0);
            
            // LFOによる周波数変調
            lfo.freq(lfoConfig.frequency);
            lfo.amp(lfoConfig.amplitude);
            lfo.start();
            osc.freq(lfo);
            
            // 回転パンニング
            const pan = sin(frameCount * 0.05) * this.effectParams[5].panning.range;
            osc.pan(pan);
            
            const soundId = this.generateSoundId('swirl');
            this.trackActiveSound(soundId, [osc, env, lfo]);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, 3000);
            
        }, 'SoundSystem.playSwirlSound');
    }
    
    /**
     * インタラクション音の再生
     * @param {string} type - インタラクションタイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} velocity - 速度
     */
    playInteractionSound(type, x, y, velocity = 1) {
        return ErrorUtils.safeExecute(() => {
            if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
            
            if (!this.validateSoundParameters(1, x, y, velocity)) return;
            
            switch (type) {
                case 'click':
                    this.playClickSound(x, y);
                    break;
                case 'drag':
                    this.playDragSound(x, y, velocity);
                    break;
                case 'particleCreate':
                    this.playParticleCreateSound(x, y);
                    break;
                default:
                    console.warn(`Unknown interaction sound type: ${type}`);
            }
        }, 'SoundSystem.playInteractionSound');
    }
    
    /**
     * クリック音の再生（和音）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    playClickSound(x, y) {
        return ErrorUtils.safeExecute(() => {
            console.log('🎵 PlayClickSound called:', { x, y, enabled: this.isEnabled, muted: this.isMuted, ready: this.p5SoundReady });
            
            if (!this.isEnabled || this.isMuted) {
                console.log('❌ Click sound skipped due to state');
                return;
            }
            
            const mappingConfig = Config.SOUND.MAPPING;
            const rootIndex = floor(random(5));
            const chordType = random() > 0.5 ? 'major' : 'minor';
            
            console.log('🎼 Generating chord:', { rootIndex, chordType });
            
            // 和音の構成音
            const intervals = chordType === 'major' ? [0, 2, 4] : [0, 2, 3];
            const frequencies = intervals.map(i => 
                this.getPentatonicFrequency((rootIndex + i) % 5, 0)
            );
            
            console.log('🎶 Frequencies:', frequencies);
            
            const soundNodes = [];
            const soundId = this.generateSoundId('click');
            
            frequencies.forEach((freq, i) => {
                console.log(`🔊 Creating oscillator ${i}: ${freq.toFixed(2)}Hz`);
                
                const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.TRIANGLE);
                const env = new p5.Envelope();
                
                osc.freq(freq);
                env.setADSR(0.01, 0.2, 0.3, 0.5);
                env.setRange(0.2, 0);
                
                const pan = map(x, 0, width, mappingConfig.PAN_RANGE_LIMITED.min, mappingConfig.PAN_RANGE_LIMITED.max);
                osc.pan(pan);
                
                soundNodes.push(osc, env);
                
                console.log(`▶️ Starting oscillator ${i}`);
                osc.start();
                env.play(osc);
            });
            
            this.trackActiveSound(soundId, soundNodes);
            
            setTimeout(() => {
                console.log('⏹️ Stopping click sound');
                this.cleanupSoundById(soundId);
                console.log('✅ Click sound generation completed');
            }, 1000);
            
        }, 'SoundSystem.playClickSound');
    }
    
    /**
     * ドラッグ音の再生（連続的な音程変化）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} velocity - ドラッグ速度
     */
    playDragSound(x, y, velocity) {
        return ErrorUtils.safeExecute(() => {
            const mappingConfig = Config.SOUND.MAPPING;
            
            const freq = map(x, 0, width, mappingConfig.SCREEN_TO_FREQUENCY.min, mappingConfig.SCREEN_TO_FREQUENCY.max);
            const vol = map(velocity, 0, 20, mappingConfig.VELOCITY_TO_VOLUME.min, mappingConfig.VELOCITY_TO_VOLUME.max);
            
            const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
            const env = new p5.Envelope();
            
            osc.freq(freq);
            env.setADSR(0.05, 0.1, vol, 0.1);
            env.setRange(vol, 0);
            
            const soundId = this.generateSoundId('drag');
            this.trackActiveSound(soundId, [osc, env]);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, 300);
            
        }, 'SoundSystem.playDragSound');
    }
    
    /**
     * パーティクル生成音の再生（ベル/チャイム）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    playParticleCreateSound(x, y) {
        return ErrorUtils.safeExecute(() => {
            const bellConfig = Config.SOUND.AUDIO_PARAMS.BELL;
            const freq = this.getPentatonicFrequency(floor(random(5)), 1);
            
            const soundNodes = [];
            const soundId = this.generateSoundId('particleCreate');
            
            // ベル音の倍音構造
            bellConfig.partials.forEach((partial, i) => {
                const osc = new p5.Oscillator(Config.SOUND.WAVEFORMS.SINE);
                const env = new p5.Envelope();
                
                osc.freq(freq * partial);
                env.setADSR(0.01, 0.3 - i * 0.05, 0, 0.5);
                env.setRange(bellConfig.volumeBase / (i + 1), 0);
                
                soundNodes.push(osc, env);
                
                osc.start();
                env.play(osc);
            });
            
            this.trackActiveSound(soundId, soundNodes);
            
            setTimeout(() => {
                this.cleanupSoundById(soundId);
            }, bellConfig.cleanupDelay);
            
        }, 'SoundSystem.playParticleCreateSound');
    }
    
    /**
     * アンビエントサウンドの開始
     */
    startAmbient() {
        return ErrorUtils.safeExecute(() => {
            if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
            
            const ambientConfig = Config.SOUND.AUDIO_PARAMS.AMBIENT;
            
            if (this.ambientComponents.oscillator && !this.ambientComponents.oscillator.started) {
                this.ambientComponents.oscillator.start();
                this.ambientComponents.gain.amp(Config.SOUND.AMBIENT_BASE_VOLUME, ambientConfig.fadeInTime);
                console.log('🌌 Ambient sound started');
            }
        }, 'SoundSystem.startAmbient');
    }
    
    /**
     * アンビエントサウンドの停止
     */
    stopAmbient() {
        return ErrorUtils.safeExecute(() => {
            const ambientConfig = Config.SOUND.AUDIO_PARAMS.AMBIENT;
            
            if (this.ambientComponents.oscillator && this.ambientComponents.oscillator.started) {
                this.ambientComponents.gain.amp(0, ambientConfig.fadeOutTime);
                setTimeout(() => {
                    if (this.ambientComponents.oscillator) {
                        this.ambientComponents.oscillator.stop();
                    }
                }, ambientConfig.fadeOutTime * 1000);
                console.log('🌌 Ambient sound stopped');
            }
        }, 'SoundSystem.stopAmbient');
    }
    
    /**
     * サウンドIDの生成
     * @param {string} type - サウンドタイプ
     * @returns {string} 一意のサウンドID
     */
    generateSoundId(type) {
        return `${type}_${++this.soundIdCounter}_${Date.now()}`;
    }
    
    /**
     * アクティブサウンドの追跡
     * @param {string} soundId - サウンドID
     * @param {Array} audioNodes - オーディオノードの配列
     */
    trackActiveSound(soundId, audioNodes) {
        this.activeSounds.set(soundId, {
            nodes: audioNodes,
            createdAt: performance.now(),
            type: soundId.split('_')[0]
        });
        
        this.performanceStats.totalSoundsCreated++;
        this.performanceStats.activeSoundCount = this.activeSounds.size;
    }
    
    /**
     * サウンドのクリーンアップ（ID指定）
     * @param {string} soundId - サウンドID
     */
    cleanupSoundById(soundId) {
        return ErrorUtils.safeExecute(() => {
            const soundData = this.activeSounds.get(soundId);
            if (!soundData) return;
            
            soundData.nodes.forEach(node => {
                if (node && typeof node.stop === 'function') {
                    node.stop();
                }
                if (node && typeof node.dispose === 'function') {
                    node.dispose();
                }
            });
            
            this.activeSounds.delete(soundId);
            this.performanceStats.activeSoundCount = this.activeSounds.size;
            
        }, `SoundSystem.cleanupSoundById(${soundId})`);
    }
    
    /**
     * オーディオノードのクリーンアップ（汎用）
     * @param {...Object} nodes - クリーンアップするノード
     */
    cleanupAudioNode(...nodes) {
        return ErrorUtils.safeExecute(() => {
            nodes.forEach(node => {
                if (node && typeof node.stop === 'function') {
                    node.stop();
                }
                if (node && typeof node.dispose === 'function') {
                    node.dispose();
                }
            });
        }, 'SoundSystem.cleanupAudioNode');
    }
    
    /**
     * 古いサウンドのクリーンアップ
     * パフォーマンス維持のための定期クリーンアップ
     */
    performSoundCleanup() {
        return ErrorUtils.executeWithPerformanceMonitoring(() => {
            const now = performance.now();
            const maxLifetime = Config.SOUND.CLEANUP.MAX_NODE_LIFETIME;
            let cleanedCount = 0;
            
            for (const [soundId, soundData] of this.activeSounds.entries()) {
                if (now - soundData.createdAt > maxLifetime) {
                    this.cleanupSoundById(soundId);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                console.debug(`Cleaned up ${cleanedCount} old sounds`);
            }
            
            this.performanceStats.lastCleanupTime = now;
        }, 'SoundSystem.performSoundCleanup', 10);
    }
    
    /**
     * マスターボリュームの設定
     * @param {number} volume - ボリューム値（0-1）
     */
    setMasterVolume(volume) {
        return ErrorUtils.safeExecute(() => {
            this.masterVolume = constrain(volume, 0, 1);
            console.log('🔊 Setting master volume to:', this.masterVolume);
            
            if (this.p5SoundReady) {
                this.setP5MasterVolume(this.masterVolume);
            } else {
                console.log('⚠️ p5.sound not ready, volume will be set when initialized');
            }
        }, 'SoundSystem.setMasterVolume');
    }
    
    /**
     * ミュートの切り替え
     * @returns {boolean} 現在のミュート状態
     */
    toggleMute() {
        return ErrorUtils.safeExecute(() => {
            this.isMuted = !this.isMuted;
            console.log('🔇 Mute toggled:', this.isMuted);
            
            if (this.isMuted) {
                this.stopAmbient();
                this.updateSoundStatus('🔇 サウンドシステム: ミュート中', Config.UI.STATUS_COLORS.INFO);
            } else {
                this.startAmbient();
                this.updateSoundStatus('🎵 サウンドシステム: 動作中', Config.UI.STATUS_COLORS.SUCCESS);
            }
            
            return this.isMuted;
        }, 'SoundSystem.toggleMute', this.isMuted);
    }
    
    /**
     * サウンドシステムの無効化
     */
    disable() {
        return ErrorUtils.safeExecute(() => {
            this.isEnabled = false;
            this.stopAmbient();
            
            if (this.ambientComponents.heartbeatInterval) {
                clearInterval(this.ambientComponents.heartbeatInterval);
                this.ambientComponents.heartbeatInterval = null;
            }
            
            // 全アクティブサウンドのクリーンアップ
            for (const soundId of this.activeSounds.keys()) {
                this.cleanupSoundById(soundId);
            }
            
            console.log('🔇 SoundSystem disabled');
        }, 'SoundSystem.disable');
    }
    
    /**
     * サウンドシステムの有効化
     */
    enable() {
        return ErrorUtils.safeExecute(() => {
            this.isEnabled = true;
            
            if (this.isInitialized && !this.isMuted) {
                this.startAmbient();
                this.startHeartbeatRhythm();
            }
            
            console.log('🔊 SoundSystem enabled');
        }, 'SoundSystem.enable');
    }
    
    /**
     * パフォーマンス統計の取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        return ErrorUtils.safeExecute(() => {
            return {
                ...this.performanceStats,
                activeSounds: this.activeSounds.size,
                maxActiveSounds: this.maxActiveSounds,
                memoryEstimate: this.activeSounds.size * 1024, // 概算（バイト）
                isInitialized: this.isInitialized,
                isEnabled: this.isEnabled,
                isMuted: this.isMuted
            };
        }, 'SoundSystem.getPerformanceStats', {});
    }
    
    /**
     * システム状態の取得
     * @returns {Object} システム状態
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isEnabled,
            isMuted: this.isMuted,
            p5SoundReady: this.p5SoundReady,
            masterVolume: this.masterVolume,
            activeSounds: this.activeSounds.size,
            performanceStats: this.getPerformanceStats()
        };
    }
}