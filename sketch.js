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
    setupDrawerControls();
    setupInitialMessage();
    
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

// エフェクト切り替えの共通処理
function switchEffect(effectNumber) {
    // 有効な範囲チェック
    if (effectNumber < 1 || effectNumber > 5) {
        console.warn('Invalid effect number:', effectNumber);
        return;
    }
    
    console.log('🎨 Switching to effect:', effectNumber);
    
    // エフェクト設定
    currentEffect = effectNumber;
    particleSystem.setEffect(currentEffect);
    
    // 背景アルファ値の設定
    switch(effectNumber) {
        case 1: bgAlpha = 20; break;
        case 2: bgAlpha = 10; break;
        case 3: bgAlpha = 5; break;
        case 4: bgAlpha = 15; break;
        case 5: bgAlpha = 25; break;
    }
    
    // ボタンのアクティブ状態更新
    updateEffectButtonStates(effectNumber);
}

// エフェクトボタンのアクティブ状態を更新
function updateEffectButtonStates(activeEffect) {
    // 無効な値のチェック
    if (!activeEffect || activeEffect < 1 || activeEffect > 5) {
        console.warn('Invalid activeEffect for button update:', activeEffect);
        return;
    }
    
    const effectButtons = document.querySelectorAll('.effect-btn');
    
    // ボタンが存在しない場合の処理
    if (effectButtons.length === 0) {
        console.warn('No effect buttons found for state update');
        return;
    }
    
    effectButtons.forEach(button => {
        const buttonEffect = parseInt(button.dataset.effect);
        if (buttonEffect === activeEffect) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// キー押下時の処理
function keyPressed() {
    // Escapeキーでドロワーを閉じる
    if (keyCode === ESCAPE) {
        const drawerPanel = document.getElementById('info-drawer');
        if (drawerPanel && drawerPanel.classList.contains('active')) {
            console.log('🗂️ Closing drawer (Escape key)');
            closeDrawer();
            return; // 他の処理を実行しない
        }
    }
    
    switch(key) {
        case ' ':
            togglePause();
            break;
        case 'r':
        case 'R':
            particleSystem.reset();
            particleSystem.createInitialParticles();
            break;
        case '1':
            switchEffect(1);
            break;
        case '2':
            switchEffect(2);
            break;
        case '3':
            switchEffect(3);
            break;
        case '4':
            switchEffect(4);
            break;
        case '5':
            switchEffect(5);
            break;
        case 'm':
        case 'M':
            toggleMute();
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
    
    const pauseButton = document.getElementById('pause-button');
    const muteButton = document.getElementById('mute-button');
    const effectButtons = document.querySelectorAll('.effect-btn');
    
    if (!pauseButton) {
        console.error('❌ Pause button not found');
        return;
    }
    
    if (!muteButton) {
        console.error('❌ Mute button not found');
        return;
    }
    
    console.log('✅ Sound control elements found');
    
    // 停止/再開ボタンのイベントハンドラー
    pauseButton.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
        console.log('⏸️ Pause button clicked');
        togglePause();
    });
    
    // ミュートボタンのイベントハンドラー
    muteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
        console.log('🔇 Mute button clicked');
        
        // 共通関数を使用してミュート切り替え
        toggleMute();
    });
    
    // エフェクト切り替えボタンのイベントハンドラー
    effectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // パーティクル発射を防ぐ
            const effectNumber = parseInt(button.dataset.effect);
            console.log('🎨 Effect button clicked:', effectNumber);
            
            // 共通関数を使用してエフェクト切り替え
            switchEffect(effectNumber);
        });
    });
    
    // 初期エフェクトボタンの状態を設定
    updateEffectButtonStates(currentEffect);
    
    // 初期ミュートボタンの状態を設定
    const initialMuteState = soundSystem.isMuted ? soundSystem.isMuted() : false;
    updateMuteButtonIcon(initialMuteState);
    
    // サウンドコントロールエリア全体でのイベント伝播停止
    const soundControlsArea = document.querySelector('.sound-controls');
    if (soundControlsArea) {
        soundControlsArea.addEventListener('click', (e) => {
            e.stopPropagation(); // パーティクル発射を防ぐ
        });
        
        soundControlsArea.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // mousePressed()の呼び出しを防ぐ
        });
        
        soundControlsArea.addEventListener('mouseup', (e) => {
            e.stopPropagation(); // mouseReleased()の呼び出しを防ぐ
        });
    }
    
    console.log('✅ Sound controls initialized');
}

// ドロワーコントロールの初期化
function setupDrawerControls() {
    console.log('🗂️ Setting up drawer controls...');
    
    const drawerTrigger = document.getElementById('drawer-trigger');
    const drawerClose = document.getElementById('drawer-close');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerPanel = document.getElementById('info-drawer');
    
    if (!drawerTrigger || !drawerClose || !drawerOverlay || !drawerPanel) {
        console.error('❌ Drawer elements not found');
        return;
    }
    
    console.log('✅ Drawer control elements found');
    
    // ドロワーを開閉（トグル）
    drawerTrigger.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
        console.log('🗂️ Toggling drawer');
        toggleDrawer();
    });
    
    // ハンバーガーボタンの追加イベント制御
    drawerTrigger.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // mousePressed()の呼び出しを防ぐ
    });
    
    drawerTrigger.addEventListener('mouseup', (e) => {
        e.stopPropagation(); // mouseReleased()の呼び出しを防ぐ
    });
    
    // ドロワーを閉じる（閉じるボタン）
    drawerClose.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
        console.log('🗂️ Closing drawer (close button)');
        closeDrawer();
    });
    
    // ドロワーを閉じる（オーバーレイクリック）
    drawerOverlay.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
        console.log('🗂️ Closing drawer (overlay click)');
        closeDrawer();
    });
    
    // ドロワーパネル内のクリックでイベント伝播を停止
    drawerPanel.addEventListener('click', (e) => {
        e.stopPropagation(); // パーティクル発射を防ぐ
    });
    
    // ドロワーパネルの追加マウスイベント制御
    drawerPanel.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // mousePressed()の呼び出しを防ぐ
    });
    
    drawerPanel.addEventListener('mouseup', (e) => {
        e.stopPropagation(); // mouseReleased()の呼び出しを防ぐ
    });
    
    // モバイルデバイス対応：タッチイベントでも伝播を停止
    drawerPanel.addEventListener('touchstart', (e) => {
        e.stopPropagation(); // タッチ開始時のパーティクル発射を防ぐ
    });
    
    drawerPanel.addEventListener('touchend', (e) => {
        e.stopPropagation(); // タッチ終了時のパーティクル発射を防ぐ
    });
    
    // フォーカストラップの設定
    setupFocusTrap(drawerPanel);
    
    console.log('✅ Drawer controls initialized');
}

// ドロワーの開閉をトグル
function toggleDrawer() {
    const drawerPanel = document.getElementById('info-drawer');
    
    if (!drawerPanel) {
        console.error('❌ Drawer panel not found');
        return;
    }
    
    // 現在の状態を判定
    const isOpen = drawerPanel.classList.contains('active');
    
    if (isOpen) {
        console.log('🗂️ Closing drawer (toggle)');
        closeDrawer();
    } else {
        console.log('🗂️ Opening drawer (toggle)');
        openDrawer();
    }
}

// ドロワーを開く
function openDrawer() {
    const drawerTrigger = document.getElementById('drawer-trigger');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerPanel = document.getElementById('info-drawer');
    
    if (drawerTrigger && drawerOverlay && drawerPanel) {
        // アクティブ状態を設定
        drawerOverlay.classList.add('active');
        drawerPanel.classList.add('active');
        
        // アクセシビリティ属性を更新
        drawerTrigger.setAttribute('aria-expanded', 'true');
        
        // ボタンアイコンを更新
        updateDrawerButtonIcon(true);
        
        // フォーカスをドロワー内に移動
        setTimeout(() => {
            const firstFocusable = drawerPanel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
        
        console.log('✅ Drawer opened');
    }
}

// ドロワーを閉じる
function closeDrawer() {
    const drawerTrigger = document.getElementById('drawer-trigger');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerPanel = document.getElementById('info-drawer');
    
    if (drawerTrigger && drawerOverlay && drawerPanel) {
        // アクティブ状態を解除
        drawerOverlay.classList.remove('active');
        drawerPanel.classList.remove('active');
        
        // アクセシビリティ属性を更新
        drawerTrigger.setAttribute('aria-expanded', 'false');
        
        // ボタンアイコンを更新
        updateDrawerButtonIcon(false);
        
        // フォーカスをトリガーボタンに戻す
        drawerTrigger.focus();
        
        console.log('✅ Drawer closed');
    }
}

// ドロワーボタンのアイコンを更新
function updateDrawerButtonIcon(isOpen) {
    const drawerTrigger = document.getElementById('drawer-trigger');
    const hamburgerIcon = drawerTrigger ? drawerTrigger.querySelector('.hamburger-icon') : null;
    
    if (!hamburgerIcon) {
        console.warn('⚠️ Hamburger icon element not found');
        return;
    }
    
    if (isOpen) {
        // ドロワーが開いている場合：×アイコン
        hamburgerIcon.textContent = '×';
        hamburgerIcon.style.fontSize = '24px'; // 少し大きく表示
        console.log('🔄 Button icon changed to close (×)');
    } else {
        // ドロワーが閉じている場合：ハンバーガーアイコン
        hamburgerIcon.textContent = '☰';
        hamburgerIcon.style.fontSize = '20px'; // 元のサイズ
        console.log('🔄 Button icon changed to hamburger (☰)');
    }
}

// ミュート状態をトグル
function toggleMute() {
    // ミュート状態を切り替え
    const isMuted = soundSystem.toggleMute();
    
    // ボタンアイコンを更新
    updateMuteButtonIcon(isMuted);
    
    // 状態をログ出力
    console.log(`🔇 Sound ${isMuted ? 'muted' : 'unmuted'}`);
}

// ミュートボタンのアイコンを更新
function updateMuteButtonIcon(isMuted) {
    const muteButton = document.getElementById('mute-button');
    
    if (!muteButton) {
        console.warn('⚠️ Mute button element not found');
        return;
    }
    
    // アイコンとアクセシビリティ属性を更新
    if (isMuted) {
        muteButton.textContent = '🔇';
        muteButton.setAttribute('aria-label', 'ミュート解除');
        console.log('🔄 Button icon changed to muted (🔇)');
    } else {
        muteButton.textContent = '🔈';
        muteButton.setAttribute('aria-label', 'ミュート');
        console.log('🔄 Button icon changed to unmuted (🔈)');
    }
}

// 一時停止をトグル
function togglePause() {
    // 一時停止状態を切り替え
    isPaused = !isPaused;
    
    // ボタンアイコンを更新
    updatePauseButtonIcon();
    
    // 状態をログ出力
    console.log(`🎬 Animation ${isPaused ? 'paused' : 'resumed'}`);
}

// 停止/再開ボタンのアイコンを更新
function updatePauseButtonIcon() {
    const pauseButton = document.getElementById('pause-button');
    
    if (!pauseButton) {
        console.warn('⚠️ Pause button element not found');
        return;
    }
    
    if (isPaused) {
        // 一時停止中：再開ボタンを表示
        pauseButton.textContent = '▶️';
        pauseButton.setAttribute('aria-label', '再開');
        console.log('🔄 Button icon changed to play (▶️)');
    } else {
        // 動作中：停止ボタンを表示
        pauseButton.textContent = '⏸️';
        pauseButton.setAttribute('aria-label', '一時停止');
        console.log('🔄 Button icon changed to pause (⏸️)');
    }
}

// 初期メッセージの表示制御
function setupInitialMessage() {
    console.log('💬 Setting up initial message...');
    
    const initialMessage = document.getElementById('initial-message');
    let isMessageHidden = false;
    
    if (!initialMessage) {
        console.error('❌ Initial message element not found');
        return;
    }
    
    // 初期メッセージを表示
    console.log('✅ Initial message displayed');
    
    // 任意の場所での最初のクリックで非表示にする
    document.addEventListener('click', function hideInitialMessage(e) {
        if (!isMessageHidden) {
            console.log('💬 Hiding initial message on first click');
            
            // フェードアウトアニメーション
            initialMessage.classList.add('hidden');
            isMessageHidden = true;
            
            // アニメーション完了後にイベントリスナーを削除
            setTimeout(() => {
                document.removeEventListener('click', hideInitialMessage);
                console.log('✅ Initial message permanently hidden');
            }, 500); // CSSのtransition時間と合わせる
        }
    });
    
    console.log('✅ Initial message controls initialized');
}

// フォーカストラップの設定
function setupFocusTrap(drawerPanel) {
    drawerPanel.addEventListener('keydown', (e) => {
        // ドロワーが開いていない場合は何もしない
        if (!drawerPanel.classList.contains('active')) {
            return;
        }
        
        // Tabキーが押された場合のフォーカス制御
        if (e.key === 'Tab') {
            const focusableElements = drawerPanel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                // Shift + Tab: 前の要素へ
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: 次の要素へ
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}