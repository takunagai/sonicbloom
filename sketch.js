// メインスケッチファイル

let particleSystem;
let soundSystem;
let dragTrail;
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
    
    // ドラッグ軌跡システムの初期化
    dragTrail = new DragTrail();
    
    // サウンドシステムの初期化
    soundSystem = new SoundSystem();
    soundSystem.init();
    particleSystem.setSoundSystem(soundSystem);
    
    // 初期パーティクルの生成
    particleSystem.createInitialParticles();
    
    // アンビエントサウンドは最初のユーザーインタラクション後に開始
    console.log('Setup completed. Click to start sound system.');
    
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
        dragTrail.update();
    }
    
    // ドラッグ軌跡の描画（パーティクルより背面）
    dragTrail.display();
    
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
    console.log('Mouse pressed - initializing sound system');
    
    // 毎回ユーザーインタラクション時の初期化を試行
    soundSystem.initOnUserGesture();
    
    particleSystem.createExplosion(mouseX, mouseY);
    
    // 少し遅延してサウンド再生を試行
    setTimeout(() => {
        soundSystem.playInteractionSound('click', mouseX, mouseY);
    }, 100);
}

// マウスドラッグ時の処理
function mouseDragged() {
    // ドラッグ軌跡を記録
    dragTrail.addPoint(mouseX, mouseY, pmouseX, pmouseY);
    
    // 強化されたパーティクルへの力の適用
    particleSystem.applyEnhancedForce(mouseX, mouseY, pmouseX, pmouseY);
    
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
    text(`FPS: ${performanceMonitor.getFPS()}`, 10, height - 60);
    text(`Particles: ${particleSystem.getParticleCount()}`, 10, height - 40);
    text(`Drag Trails: ${dragTrail.getTrailCount()}`, 10, height - 20);
    pop();
}

// サウンドコントロールの初期化
function setupSoundControls() {
    console.log('🎛️ Setting up sound controls...');
    
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const muteButton = document.getElementById('mute-button');
    
    if (!volumeSlider || !volumeDisplay || !muteButton) {
        console.error('❌ Sound control elements not found');
        return;
    }
    
    console.log('✅ Sound control elements found');
    
    // ボリュームスライダーのイベントハンドラー
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        console.log('🔊 Volume slider changed to:', volume);
        soundSystem.setMasterVolume(volume);
        volumeDisplay.textContent = `${e.target.value}%`;
    });
    
    // ミュートボタンのイベントハンドラー
    muteButton.addEventListener('click', () => {
        console.log('🔇 Mute button clicked');
        const isMuted = soundSystem.toggleMute();
        console.log('🔇 Mute state:', isMuted);
        muteButton.textContent = isMuted ? '🔇' : '🔊';
        muteButton.classList.toggle('muted', isMuted);
        
        // ミュート時はボリュームスライダーを無効化
        volumeSlider.disabled = isMuted;
        volumeSlider.style.opacity = isMuted ? '0.4' : '0.8';
    });
    
    console.log('✅ Sound controls initialized');
}