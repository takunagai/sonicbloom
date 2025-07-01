// 感情を動かす調和の取れたサウンドシステム
// 音楽理論（ペンタトニックスケール、黄金比、倍音構造）に基づいた音生成

class SoundSystem {
    constructor() {
        this.isEnabled = true;
        this.masterVolume = 0.7;
        this.isMuted = false;
        this.isInitialized = false;
        
        // 音楽理論パラメータ
        this.goldenRatio = 1.618;
        this.baseFrequency = 432; // A4 = 432Hz（調和の取れた周波数）
        
        // ペンタトニックスケール（C, D, E, G, A）
        this.pentatonicRatios = [
            1,      // C
            9/8,    // D
            5/4,    // E
            3/2,    // G
            5/3     // A
        ];
        
        // エフェクト別の音響パラメータ
        this.effectParams = {
            1: { // 爆発エフェクト
                type: 'explosion',
                attackTime: 0.01,
                decayTime: 0.5,
                sustainLevel: 0.2,
                releaseTime: 1,
                reverbWet: 0.5
            },
            2: { // トレイルエフェクト
                type: 'trail',
                attackTime: 0.3,
                decayTime: 0.5,
                sustainLevel: 0.4,
                releaseTime: 2,
                delayTime: 0.3,
                delayFeedback: 0.4
            },
            3: { // 虹色パルス
                type: 'rainbow',
                attackTime: 0.1,
                decayTime: 0.3,
                sustainLevel: 0.5,
                releaseTime: 0.8,
                filterFreq: 800,
                filterRes: 15
            },
            4: { // 重力シミュレーション
                type: 'gravity',
                attackTime: 0.05,
                decayTime: 0.2,
                sustainLevel: 0.1,
                releaseTime: 0.3,
                pitchBendAmount: 0.5
            },
            5: { // 渦巻きエフェクト
                type: 'swirl',
                attackTime: 0.2,
                decayTime: 0.4,
                sustainLevel: 0.3,
                releaseTime: 1.5,
                panningRange: 0.8
            }
        };
        
        // オーディオエフェクト
        this.reverb = null;
        this.delay = null;
        this.filter = null;
        this.compressor = null;
        
        // アンビエント要素
        this.ambientOsc = null;
        this.ambientGain = null;
        this.rhythmPattern = null;
        this.heartbeatInterval = null;
        
        // パーティクル音マッピング
        this.particleSounds = new Map();
        this.maxActiveSounds = 20;
        
        // 初期化フラグ
        this.p5SoundReady = false;
    }
    
    // システムの初期化
    init() {
        if (this.isInitialized) return;
        
        try {
            // p5.soundのコンテキストが存在するか確認
            if (typeof p5 === 'undefined' || !p5.Reverb) {
                console.warn('p5.sound is not ready yet. Retrying...');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            // オーディオコンテキストの状態を確認
            if (getAudioContext().state !== 'running') {
                console.log('Audio context is not running. Will initialize on user interaction.');
                this.isInitialized = false;
                this.p5SoundReady = false;
                return;
            }
            
            // マスターボリューム設定
            masterVolume(this.masterVolume);
            
            // リバーブの初期化
            this.reverb = new p5.Reverb();
            this.reverb.set(3, 2, false);
            
            // ディレイの初期化
            this.delay = new p5.Delay();
            this.delay.setType('pingPong');
            
            // フィルターの初期化
            this.filter = new p5.BandPass();
            
            // コンプレッサーの初期化
            this.compressor = new p5.Compressor();
            
            // アンビエント要素の初期化
            this.initAmbientSound();
            
            this.isInitialized = true;
            this.p5SoundReady = true;
            
            console.log('SoundSystem initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SoundSystem:', error);
            this.isEnabled = false;
        }
    }
    
    // ユーザーインタラクション時の初期化
    initOnUserGesture() {
        if (this.isInitialized) return;
        
        // オーディオコンテキストを再開
        userStartAudio().then(() => {
            this.init();
        }).catch(error => {
            console.error('Failed to start audio:', error);
        });
    }
    
    // アンビエントサウンドの初期化
    initAmbientSound() {
        // 基底音（ドローン）の生成
        this.ambientOsc = new p5.Oscillator('sine');
        this.ambientOsc.freq(this.baseFrequency / 4); // 2オクターブ下
        this.ambientGain = new p5.Gain();
        this.ambientOsc.disconnect();
        this.ambientOsc.connect(this.ambientGain);
        this.ambientGain.connect(this.reverb);
        
        // 心拍リズムの開始
        this.startHeartbeatRhythm();
    }
    
    // 心拍リズムの生成（60-80 BPM）
    startHeartbeatRhythm() {
        if (!this.p5SoundReady) return;
        
        const bpm = 70;
        const interval = 60000 / bpm;
        
        // 既存のインターバルをクリア
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isEnabled && !this.isMuted && this.p5SoundReady) {
                this.playHeartbeat();
            }
        }, interval);
    }
    
    // 心拍音の再生
    playHeartbeat() {
        try {
            const osc = new p5.Oscillator('sine');
            const env = new p5.Envelope();
            
            osc.freq(60);
            env.setADSR(0.01, 0.1, 0.2, 0.1);
            env.setRange(0.1, 0);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                try {
                    osc.stop();
                    osc.dispose();
                    env.dispose();
                } catch (e) {
                    // クリーンアップ時のエラーは無視
                }
            }, 200);
        } catch (error) {
            console.error('Error in playHeartbeat:', error);
        }
    }
    
    // ペンタトニックスケールの周波数を取得
    getPentatonicFrequency(index, octave = 0) {
        const ratio = this.pentatonicRatios[index % this.pentatonicRatios.length];
        const octaveMultiplier = Math.pow(2, octave);
        return this.baseFrequency * ratio * octaveMultiplier;
    }
    
    // 倍音構造を持つ音色の生成
    createHarmonicOscillator(fundamental, harmonicCount = 5) {
        const oscillators = [];
        const gains = [];
        
        for (let i = 0; i < harmonicCount; i++) {
            const osc = new p5.Oscillator('sine');
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
    }
    
    // エフェクトサウンドの再生
    playEffectSound(effectType, x, y, intensity = 1) {
        if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
        
        try {
            // アクティブな音の数を制限（実装簡略化）
            
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
            }
        } catch (error) {
            console.error('Error playing effect sound:', error);
        }
    }
    
    // 爆発音の生成
    playExplosionSound(x, y, intensity) {
        try {
            // 低周波の衝撃音
            const bassOsc = new p5.Oscillator('sawtooth');
            const bassEnv = new p5.Envelope();
            
            bassOsc.freq(40 + random(0, 20));
            bassEnv.setADSR(0.01, 0.3, 0.1, 1);
            bassEnv.setRange(0.5 * intensity, 0);
            
            // 高周波の煌めき
            const shimmerOsc = new p5.Noise('white');
            const shimmerEnv = new p5.Envelope();
            const shimmerFilter = new p5.HighPass();
            
            shimmerFilter.freq(2000);
            shimmerOsc.disconnect();
            shimmerOsc.connect(shimmerFilter);
            shimmerFilter.connect(this.reverb);
            
            shimmerEnv.setADSR(0.01, 0.1, 0.05, 0.5);
            shimmerEnv.setRange(0.3 * intensity, 0);
            
            // パンニング設定
            const pan = map(x, 0, width, -1, 1);
            bassOsc.pan(pan);
            
            // 再生
            bassOsc.start();
            shimmerOsc.start();
            bassEnv.play(bassOsc);
            shimmerEnv.play(shimmerOsc);
            
            // クリーンアップ
            setTimeout(() => {
                try {
                    bassOsc.stop();
                    shimmerOsc.stop();
                    bassOsc.dispose();
                    shimmerOsc.dispose();
                    bassEnv.dispose();
                    shimmerEnv.dispose();
                    shimmerFilter.dispose();
                } catch (e) {
                    // クリーンアップ時のエラーは無視
                }
            }, 2000);
        } catch (error) {
            console.error('Error in playExplosionSound:', error);
        }
    }
    
    // トレイル音の生成
    playTrailSound(x, y, intensity) {
        const noteIndex = floor(random(5));
        const octave = floor(random(-1, 2));
        const freq = this.getPentatonicFrequency(noteIndex, octave);
        
        const osc = new p5.Oscillator('triangle');
        const env = new p5.Envelope();
        
        osc.freq(freq);
        env.setADSR(0.3, 0.5, 0.4, 2);
        env.setRange(0.2 * intensity, 0);
        
        // ディレイ効果
        osc.disconnect();
        osc.connect(this.delay);
        this.delay.process(osc, 0.3, 0.4, 2000);
        
        // パンニング
        const pan = map(x, 0, width, -1, 1);
        osc.pan(pan);
        
        osc.start();
        env.play(osc);
        
        setTimeout(() => {
            osc.stop();
            osc.dispose();
            env.dispose();
        }, 4000);
    }
    
    // 虹色パルス音の生成
    playRainbowSound(x, y, intensity) {
        const { oscillators, gains } = this.createHarmonicOscillator(
            this.getPentatonicFrequency(floor(random(5))),
            3
        );
        
        const env = new p5.Envelope();
        env.setADSR(0.1, 0.3, 0.5, 0.8);
        env.setRange(0.3 * intensity, 0);
        
        // フィルター効果
        const filter = new p5.Filter();
        filter.setType('bandpass');
        filter.freq(800);
        filter.res(15);
        
        gains.forEach(gain => {
            gain.connect(filter);
        });
        
        oscillators.forEach(osc => {
            osc.start();
            env.play(osc);
        });
        
        setTimeout(() => {
            oscillators.forEach(osc => {
                osc.stop();
                osc.dispose();
            });
            gains.forEach(gain => gain.dispose());
            filter.dispose();
            env.dispose();
        }, 2000);
    }
    
    // 重力音の生成
    playGravitySound(x, y, intensity) {
        const freq = this.getPentatonicFrequency(floor(random(5)), -1);
        const osc = new p5.Oscillator('sine');
        const env = new p5.Envelope();
        
        osc.freq(freq);
        env.setADSR(0.05, 0.2, 0.1, 0.3);
        env.setRange(0.4 * intensity, 0);
        
        // ピッチベンド効果
        const pitchBend = map(y, 0, height, 2, 0.5);
        osc.freq(freq * pitchBend);
        
        osc.start();
        env.play(osc);
        
        setTimeout(() => {
            osc.stop();
            osc.dispose();
            env.dispose();
        }, 1000);
    }
    
    // 渦巻き音の生成
    playSwirlSound(x, y, intensity) {
        const noteIndex = floor(random(5));
        const freq = this.getPentatonicFrequency(noteIndex, 0);
        
        const osc = new p5.Oscillator('sine');
        const env = new p5.Envelope();
        const lfo = new p5.Oscillator('sine');
        
        osc.freq(freq);
        env.setADSR(0.2, 0.4, 0.3, 1.5);
        env.setRange(0.25 * intensity, 0);
        
        // LFOによる周波数変調
        lfo.freq(3);
        lfo.amp(50);
        lfo.start();
        osc.freq(lfo);
        
        // 回転パンニング
        const pan = sin(frameCount * 0.05) * 0.8;
        osc.pan(pan);
        
        osc.start();
        env.play(osc);
        
        setTimeout(() => {
            osc.stop();
            lfo.stop();
            osc.dispose();
            lfo.dispose();
            env.dispose();
        }, 3000);
    }
    
    // インタラクション音の再生
    playInteractionSound(type, x, y, velocity = 1) {
        if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
        
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
        }
    }
    
    // クリック音（和音）
    playClickSound(x, y) {
        const rootIndex = floor(random(5));
        const chordType = random() > 0.5 ? 'major' : 'minor';
        
        // 和音の構成音
        const intervals = chordType === 'major' ? [0, 2, 4] : [0, 2, 3];
        const frequencies = intervals.map(i => 
            this.getPentatonicFrequency((rootIndex + i) % 5, 0)
        );
        
        frequencies.forEach((freq, i) => {
            const osc = new p5.Oscillator('triangle');
            const env = new p5.Envelope();
            
            osc.freq(freq);
            env.setADSR(0.01, 0.2, 0.3, 0.5);
            env.setRange(0.2, 0);
            
            const pan = map(x, 0, width, -0.5, 0.5);
            osc.pan(pan);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                osc.stop();
                osc.dispose();
                env.dispose();
            }, 1000);
        });
    }
    
    // ドラッグ音（連続的な音程変化）
    playDragSound(x, y, velocity) {
        const freq = map(x, 0, width, 200, 800);
        const vol = map(velocity, 0, 20, 0.1, 0.4);
        
        const osc = new p5.Oscillator('sine');
        const env = new p5.Envelope();
        
        osc.freq(freq);
        env.setADSR(0.05, 0.1, vol, 0.1);
        env.setRange(vol, 0);
        
        osc.start();
        env.play(osc);
        
        setTimeout(() => {
            osc.stop();
            osc.dispose();
            env.dispose();
        }, 300);
    }
    
    // パーティクル生成音（ベル/チャイム）
    playParticleCreateSound(x, y) {
        const freq = this.getPentatonicFrequency(floor(random(5)), 1);
        
        // ベル音の倍音構造
        const partials = [1, 2.2, 3.6, 5.1];
        
        partials.forEach((partial, i) => {
            const osc = new p5.Oscillator('sine');
            const env = new p5.Envelope();
            
            osc.freq(freq * partial);
            env.setADSR(0.01, 0.3 - i * 0.05, 0, 0.5);
            env.setRange(0.15 / (i + 1), 0);
            
            osc.start();
            env.play(osc);
            
            setTimeout(() => {
                osc.stop();
                osc.dispose();
                env.dispose();
            }, 2000);
        });
    }
    
    // アンビエントサウンドの開始
    startAmbient() {
        if (!this.isEnabled || this.isMuted || !this.p5SoundReady) return;
        
        if (this.ambientOsc && !this.ambientOsc.started) {
            this.ambientOsc.start();
            this.ambientGain.amp(0.05, 2);
        }
    }
    
    // アンビエントサウンドの停止
    stopAmbient() {
        if (this.ambientOsc && this.ambientOsc.started) {
            this.ambientGain.amp(0, 2);
            setTimeout(() => {
                this.ambientOsc.stop();
            }, 2000);
        }
    }
    
    // 古いサウンドのクリーンアップ
    cleanupOldSounds() {
        // 実装簡略化（実際のプロジェクトではより詳細な管理が必要）
        console.log('Cleanup old sounds - implementation simplified');
    }
    
    // マスターボリュームの設定
    setMasterVolume(volume) {
        this.masterVolume = constrain(volume, 0, 1);
        if (this.p5SoundReady) {
            masterVolume(this.masterVolume);
        }
    }
    
    // ミュートの切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAmbient();
        } else {
            this.startAmbient();
        }
        return this.isMuted;
    }
    
    // サウンドシステムの無効化
    disable() {
        this.isEnabled = false;
        this.stopAmbient();
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }
    
    // サウンドシステムの有効化
    enable() {
        this.isEnabled = true;
        if (this.isInitialized && !this.isMuted) {
            this.startAmbient();
            this.startHeartbeatRhythm();
        }
    }
}