// メインスケッチファイル

let particleSystem;
let soundSystem;
let isPaused = false;
let currentEffect = 1;
let performanceMonitor;
let bgAlpha = 20;

// キャンバスの設定
function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(RGB, 255, 255, 255, 100);
    
    // パーティクルシステムの初期化
    particleSystem = new ParticleSystem();
    performanceMonitor = new PerformanceMonitor();
    
    // サウンドシステムの初期化
    soundSystem = new SoundSystem();
    soundSystem.init();
    particleSystem.setSoundSystem(soundSystem);
    
    // 初期パーティクルの生成
    particleSystem.createInitialParticles();
    
    // アンビエントサウンドの開始
    setTimeout(() => {
        soundSystem.startAmbient();
    }, 1000);
    
    // UIコントロールの初期化
    setupSoundControls();
    
    // ブレンドモードの設定
    blendMode(ADD);
}

// メインループ
function draw() {
    performanceMonitor.update();
    
    // 背景の描画（トレイル効果）
    push();
    blendMode(BLEND);
    fill(0, 0, 0, bgAlpha);
    rect(0, 0, width, height);
    pop();
    
    if (!isPaused) {
        particleSystem.update();
    }
    
    particleSystem.display();
    
    // デバッグ情報の表示（開発時のみ）
    if (keyIsDown(68)) { // 'D' キー
        displayDebugInfo();
    }
}

// ウィンドウサイズ変更時の処理
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// マウスクリック時の処理
function mousePressed() {
    // 初回クリック時にサウンドシステムを初期化
    if (!soundSystem.isInitialized) {
        soundSystem.initOnUserGesture();
    }
    
    particleSystem.createExplosion(mouseX, mouseY);
    soundSystem.playInteractionSound('click', mouseX, mouseY);
}

// マウスドラッグ時の処理
function mouseDragged() {
    particleSystem.applyForce(mouseX, mouseY, pmouseX, pmouseY);
    const velocity = dist(mouseX, mouseY, pmouseX, pmouseY);
    soundSystem.playInteractionSound('drag', mouseX, mouseY, velocity);
}

// キー押下時の処理
function keyPressed() {
    switch(key) {
        case ' ':
            isPaused = !isPaused;
            break;
        case 'r':
        case 'R':
            particleSystem.reset();
            particleSystem.createInitialParticles();
            break;
        case '1':
            currentEffect = 1;
            particleSystem.setEffect(currentEffect);
            bgAlpha = 20;
            break;
        case '2':
            currentEffect = 2;
            particleSystem.setEffect(currentEffect);
            bgAlpha = 10;
            break;
        case '3':
            currentEffect = 3;
            particleSystem.setEffect(currentEffect);
            bgAlpha = 5;
            break;
        case '4':
            currentEffect = 4;
            particleSystem.setEffect(currentEffect);
            bgAlpha = 15;
            break;
        case '5':
            currentEffect = 5;
            particleSystem.setEffect(currentEffect);
            bgAlpha = 25;
            break;
        case 'm':
        case 'M':
            const isMuted = soundSystem.toggleMute();
            console.log('Sound ' + (isMuted ? 'muted' : 'unmuted'));
            break;
    }
}

// デバッグ情報の表示
function displayDebugInfo() {
    push();
    blendMode(BLEND);
    fill(255);
    noStroke();
    textAlign(LEFT);
    text(`FPS: ${performanceMonitor.getFPS()}`, 10, height - 40);
    text(`Particles: ${particleSystem.getParticleCount()}`, 10, height - 20);
    pop();
}

// サウンドコントロールの初期化
function setupSoundControls() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const muteButton = document.getElementById('mute-button');
    
    // ボリュームスライダーのイベントハンドラー
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        soundSystem.setMasterVolume(volume);
        volumeDisplay.textContent = `${e.target.value}%`;
    });
    
    // ミュートボタンのイベントハンドラー
    muteButton.addEventListener('click', () => {
        const isMuted = soundSystem.toggleMute();
        muteButton.textContent = isMuted ? '🔇' : '🔊';
        muteButton.classList.toggle('muted', isMuted);
        
        // ミュート時はボリュームスライダーを無効化
        volumeSlider.disabled = isMuted;
        volumeSlider.style.opacity = isMuted ? '0.4' : '0.8';
    });
}