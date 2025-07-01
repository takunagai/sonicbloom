// パーティクルシステムクラス

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
        this.currentEffect = 1;
        this.gravity = createVector(0, 0.1);
        this.wind = createVector(0, 0);
        this.time = 0;
        this.soundSystem = null;
        
        // エフェクト別の設定
        this.effectConfigs = {
            1: { // 爆発エフェクト
                mode: 'normal',
                trail: false,
                gravity: false,
                mouseAttraction: 0.5
            },
            2: { // トレイルエフェクト
                mode: 'trail',
                trail: true,
                gravity: false,
                mouseAttraction: 1
            },
            3: { // 虹色パルス
                mode: 'rainbow',
                trail: false,
                gravity: false,
                mouseAttraction: 0.8
            },
            4: { // 重力シミュレーション
                mode: 'gravity',
                trail: false,
                gravity: true,
                mouseAttraction: 0.3
            },
            5: { // 渦巻きエフェクト
                mode: 'swirl',
                trail: true,
                gravity: false,
                mouseAttraction: 1.2
            }
        };
    }
    
    // サウンドシステムの設定
    setSoundSystem(soundSystem) {
        this.soundSystem = soundSystem;
    }
    
    // 初期パーティクルの生成
    createInitialParticles() {
        const centerX = width / 2;
        const centerY = height / 2;
        const numParticles = min(200, this.maxParticles);
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (TWO_PI / numParticles) * i;
            const radius = random(50, 150);
            const x = centerX + cos(angle) * radius;
            const y = centerY + sin(angle) * radius;
            
            const config = {
                direction: { x: cos(angle), y: sin(angle) },
                speed: random(0.5, 2),
                size: random(3, 8),
                hue: (i * 360 / numParticles) % 360,
                saturation: random(70, 100),
                brightness: 100,
                alpha: random(80, 100),
                lifespan: random(120, 240),
                mode: this.effectConfigs[this.currentEffect].mode
            };
            
            this.addParticle(new Particle(x, y, config));
        }
    }
    
    // パーティクルの追加
    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }
    
    // 爆発エフェクトの作成
    createExplosion(x, y) {
        const numParticles = random(30, 50);
        const explosionForce = random(5, 15);
        
        // 爆発音の再生
        if (this.soundSystem) {
            this.soundSystem.playEffectSound(this.currentEffect, x, y, explosionForce / 15);
        }
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (TWO_PI / numParticles) * i + random(-0.2, 0.2);
            const speed = random(explosionForce * 0.5, explosionForce);
            
            const config = {
                direction: { x: cos(angle), y: sin(angle) },
                speed: speed,
                size: random(4, 10),
                hue: random(360),
                saturation: 100,
                brightness: 100,
                alpha: 100,
                lifespan: random(60, 120),
                mode: this.effectConfigs[this.currentEffect].mode,
                trail: true
            };
            
            const particle = new Particle(x, y, config);
            this.addParticle(particle);
        }
        
        // 既存のパーティクルにも爆発の影響を与える
        this.particles.forEach(p => {
            const distance = dist(p.position.x, p.position.y, x, y);
            if (distance < 150 && distance > 0) {
                const force = map(distance, 0, 150, explosionForce, 0);
                p.explode(x, y, force);
            }
        });
    }
    
    // マウスによる力の適用
    applyForce(mouseX, mouseY, pmouseX, pmouseY) {
        const force = createVector(mouseX - pmouseX, mouseY - pmouseY);
        force.mult(0.1);
        
        this.particles.forEach(particle => {
            const distance = dist(particle.position.x, particle.position.y, mouseX, mouseY);
            if (distance < 100) {
                const scaledForce = p5.Vector.mult(force, map(distance, 0, 100, 1, 0));
                particle.applyForce(scaledForce);
            }
        });
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