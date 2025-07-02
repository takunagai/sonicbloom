// メインスケッチファイル

let particleSystem;
let soundSystem;
let dragTrail;
let isPaused = false;
let currentEffect = 1;
let performanceMonitor;
let bgAlpha = 20;
let isDragging = false;
let currentDragPath = [];

// キャンバスの設定
function setup() {
    createCanvas(windowWidth, windowHeight);
    const colorConfig = Config.CANVAS.COLOR_MODE;
    colorMode(RGB, colorConfig.R_MAX, colorConfig.G_MAX, colorConfig.B_MAX, colorConfig.A_MAX);
    
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
    if (keyIsDown(Config.UI.DEBUG_KEY_CODE)) {
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
    
    // ドラッグ開始の準備（まだドラッグかクリックか不明）
    isDragging = false;
    currentDragPath = [{x: mouseX, y: mouseY}];
}

// マウスドラッグ時の処理
function mouseDragged() {
    // ドラッグ中フラグを設定
    isDragging = true;
    
    // ドラッグパスにポイントを追加
    currentDragPath.push({x: mouseX, y: mouseY});
    
    // ドラッグ軌跡を記録
    dragTrail.addPoint(mouseX, mouseY, pmouseX, pmouseY);
    
    // 強化されたパーティクルへの力の適用
    particleSystem.applyEnhancedForce(mouseX, mouseY, pmouseX, pmouseY);
    
    const velocity = dist(mouseX, mouseY, pmouseX, pmouseY);
    soundSystem.playInteractionSound('drag', mouseX, mouseY, velocity);
}

// マウスリリース時の処理
function mouseReleased() {
    if (isDragging && currentDragPath.length > 1) {
        // ドラッグ終点で爆発を作成（非同期処理）
        const endPoint = currentDragPath[currentDragPath.length - 1];
        particleSystem.createPathExplosion(endPoint.x, endPoint.y, currentDragPath)
            .then(() => {
                // サウンド再生
                soundSystem.playInteractionSound('explosion', endPoint.x, endPoint.y);
            })
            .catch(error => {
                console.error('Path explosion failed:', error);
            });
    } else {
        // 通常のクリック時は起点で爆発（非同期処理）
        particleSystem.createExplosion(mouseX, mouseY)
            .then(() => {
                // 少し遅延してサウンド再生を試行
                setTimeout(() => {
                    soundSystem.playInteractionSound('click', mouseX, mouseY);
                }, Config.UI.TIMING.SOUND_DELAY_MS);
            })
            .catch(error => {
                console.error('Basic explosion failed:', error);
            });
    }
    
    // ドラッグ状態をリセット
    isDragging = false;
    currentDragPath = [];
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
    const debugPos = Config.UI.DEBUG_POSITION;
    push();
    blendMode(BLEND);
    fill(255);
    noStroke();
    textAlign(LEFT);
    text(`FPS: ${performanceMonitor.getFPS()}`, debugPos.X, height - debugPos.Y_OFFSET_FPS);
    text(`Particles: ${particleSystem.getParticleCount()}`, debugPos.X, height - debugPos.Y_OFFSET_PARTICLES);
    text(`Drag Trails: ${dragTrail.getTrailCount()}`, debugPos.X, height - debugPos.Y_OFFSET_TRAILS);
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
        const volume = e.target.value / Config.UI.VOLUME.SLIDER_SCALE;
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
        volumeSlider.style.opacity = isMuted ? Config.UI.VOLUME.MUTED_OPACITY : Config.UI.VOLUME.NORMAL_OPACITY;
    });
    
    console.log('✅ Sound controls initialized');
}