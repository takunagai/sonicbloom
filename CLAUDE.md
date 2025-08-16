# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

p5.js とWeb Audio APIを使用したインタラクティブパーティクルアニメーションプロジェクト。音楽理論（ペンタトニックスケール、黄金比）に基づいたサウンドシステムと物理演算による高度なパーティクルシステムを組み合わせた体験型デジタルアート作品。

## 開発コマンド

### サーバー起動
```bash
# 推奨方法（CORSエラー回避のため必須）
python3 start-server.py

# または npm経由
npm start
npm run dev
npm run serve
```

### アクセス
- メイン: http://localhost:8000
- 代替: http://localhost:8080

### 重要注意事項
- **ローカルHTTPサーバーでの実行が必須**（p5.soundライブラリのCORS制限のため）
- ファイルを直接ブラウザで開くとCORSエラーで動作しない

## アーキテクチャ設計

### 1. 設定駆動開発 (Configuration-Driven Development)
すべての設定値とマジックナンバーは `config.js` で一元管理：

```javascript
// ❌ マジックナンバーの直接使用を避ける
const maxParticles = 1000;

// ✅ Config経由で設定値を使用
const maxParticles = Config.PARTICLES.MAX_COUNT;
```

### 2. 統一エラーハンドリング
`errorHandler.js` による一貫したエラー処理：

```javascript
// 全メソッドで統一されたエラーハンドリングパターンを使用
return ErrorUtils.safeExecute(() => {
    // 処理内容
}, 'methodName', fallbackValue);
```

### 3. モジュラー設計パターン
- **Factory Pattern**: `particleFactory.js` - パーティクル生成の抽象化
- **Strategy Pattern**: `explosionStrategy.js` - エフェクトロジックの分離
- **Observer Pattern**: ParticleSystem ↔ SoundSystem 間の疎結合通信

### 4. パフォーマンス最適化
- **オブジェクトプール**: メモリ効率的なパーティクル再利用
- **フレームスキップ**: 負荷に応じた描画最適化  
- **バッチ処理**: サウンド管理の効率化
- **メモリ監視**: 自動クリーンアップシステム

## 主要クラス構成

```
sketch.js               # p5.jsメインループ・エントリーポイント
├── ParticleSystem      # パーティクル管理統括クラス
│   ├── ParticleFactory # パーティクル生成ファクトリー
│   └── ExplosionManager# 爆発エフェクト管理
├── SoundSystem         # Web Audio API音響システム
├── DragTrail          # ドラッグ軌跡管理
└── PerformanceMonitor  # パフォーマンス監視
```

### コアシステム責務
- **sketch.js**: p5.js描画ループ、グローバル変数管理、UIイベント処理
- **particleSystem.js**: パーティクル生成・更新・描画・物理演算統括
- **soundSystem.js**: 音楽理論ベースのリアルタイム音響生成
- **config.js**: 全設定値・定数の一元管理（マジックナンバー排除）
- **errorHandler.js**: 統一エラーハンドリング・ロギングシステム

## コーディング規約

### 設定値の参照
```javascript
// ✅ 推奨：Config経由での設定参照
const particleConfig = Config.PARTICLES;
const maxCount = particleConfig.MAX_COUNT;

// ❌ 非推奨：マジックナンバーの直接使用
const maxCount = 1000;
```

### エラーハンドリングパターン
```javascript
// ✅ 推奨：統一エラーハンドリング使用
const result = ErrorUtils.safeExecute(() => {
    return someRiskyOperation();
}, 'operationName', defaultValue);

// ❌ 非推奨：個別try-catch
try {
    const result = someRiskyOperation();
} catch (error) {
    console.error(error);
}
```

### パフォーマンス考慮事項
- 新機能追加時は必ずパフォーマンス指標を確認
- 目標値：60fps、メモリ使用量<100MB、パーティクル数1000個以下
- デバッグモード（Dキー）でリアルタイム監視可能

## 音響システム設計

### 音楽理論ベース設計
- **基準周波数**: 432Hz（調和の取れた自然周波数）
- **スケール**: ペンタトニック（C-D-E-G-A）
- **倍音構造**: 黄金比（1.618）による美しい音色
- **空間音響**: ステレオパンニング対応

### エフェクトタイプ
1. **爆発** - 放射状拡散＋リバーブ
2. **トレイル** - 軌跡表示＋ディレイエコー  
3. **虹色パルス** - 色相変化＋倍音フィルター
4. **重力** - 物理シミュレーション＋ピッチベンド
5. **渦巻き** - 回転運動＋LFO変調

## 開発時の注意点

### ファイル変更時の確認事項
1. **config.js変更時**: 関連する全クラスでの設定値使用箇所を確認
2. **新クラス追加時**: エラーハンドリングの統一パターン実装
3. **パフォーマンス**: 新機能のFPS・メモリ使用量への影響測定
4. **音響機能変更時**: Web Audio API制限（ユーザーインタラクション必須）の考慮

### デバッグ機能
- **Dキー**: デバッグ情報表示（FPS、パーティクル数、メモリ使用量）
- **Spaceキー**: 一時停止/再開
- **Rキー**: 全リセット
- **Mキー**: ミュート切り替え
- **1-5キー**: エフェクトモード切り替え

### 既知の制約
- **CORS制限**: 必ずHTTPサーバー経由でアクセス（file://は不可）
- **Web Audio API**: 初回ユーザーインタラクション（クリック）後にサウンド開始
- **ブラウザ依存**: Chrome/Firefox/Safari/Edge対応、Web Audio API必須
- **パフォーマンス**: パーティクル数1000個超過時にFPS低下の可能性

## ファイル変更の影響範囲

### config.js変更時の影響
- 全クラスが Config 参照のため、設定変更は全体に影響
- 特に PARTICLES, SOUND, DRAG_TRAIL の変更は要注意

### particleSystem.js変更時の影響  
- sketch.js の描画ループ
- soundSystem.js の音響連携
- dragTrail.js のパーティクル連携

### soundSystem.js変更時の影響
- particleSystem.js の音響フィードバック
- UI の音量コントロール
- Web Audio API 初期化タイミング

この設計により、保守性とパフォーマンスを両立した拡張可能なアーキテクチャを実現している。