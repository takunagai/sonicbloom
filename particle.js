// パーティクルクラス

class Particle {
    constructor(x, y, config = {}) {
        // 位置
        this.position = createVector(x, y);
        this.previousPosition = createVector(x, y);
        
        // 速度と加速度
        const dir = config.direction || randomDirection();
        const speed = config.speed || random(1, 5);
        this.velocity = createVector(dir.x * speed, dir.y * speed);
        this.acceleration = createVector(0, 0);
        
        // 外観
        this.size = config.size || random(2, 8);
        this.maxSize = this.size * 2;
        this.minSize = this.size * 0.5;
        this.hue = config.hue || random(360);
        this.saturation = config.saturation || random(60, 100);
        this.brightness = config.brightness || 100;
        this.alpha = config.alpha || 100;
        this.maxAlpha = this.alpha;
        
        // 物理特性
        this.mass = this.size * 0.1;
        this.lifespan = config.lifespan || random(60, 180);
        this.maxLifespan = this.lifespan;
        this.damping = config.damping || 0.98;
        
        // 動作特性
        this.mode = config.mode || 'normal';
        this.trail = config.trail || false;
        this.pulsePhase = random(TWO_PI);
        this.rotationSpeed = random(-0.1, 0.1);
        this.rotation = 0;
        
        // 特殊効果用
        this.target = null;
        this.isExploding = false;
        this.explosionForce = 0;
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