# 🌟 Interactive Particle Animation

<div align="center">

**感情を動かす調和の取れたインタラクティブパーティクルアニメーション**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![p5.js](https://img.shields.io/badge/p5.js-1.9.0-ED225D)](https://p5js.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Supported-blue)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

*音楽理論とビジュアルアートが融合した、感情に響く体験型デジタルアート*

[🚀 クイックスタート](#-クイックスタート) •
[🎮 使用方法](#-使用方法) •
[🛠️ 開発者向け](#️-開発者向け情報) •
[📚 ドキュメント](#-アーキテクチャ)

</div>

---

## 📖 概要

Interactive Particle Animationは、p5.jsとWeb Audio APIを活用して作られた、音と映像が調和したインタラクティブアート作品です。ペンタトニックスケールと黄金比に基づく音響理論と、物理演算によるパーティクルシステムが組み合わさり、ユーザーの操作に応じて美しい視覚・聴覚体験を生み出します。

### 🎯 プロジェクトの特徴

- **🎵 音楽理論に基づく音響システム**: ペンタトニックスケール、黄金比、倍音構造による調和の取れたサウンド
- **⚡ リアルタイム物理演算**: 高度なパーティクルシステムによる自然な動きと相互作用
- **🖱️ 直感的インタラクション**: マウス操作による即座の視覚・聴覚フィードバック
- **🎨 動的ビジュアルエフェクト**: 5種類の異なるエフェクトモードと3秒間のドラッグトレイル
- **🚀 最適化されたパフォーマンス**: オブジェクトプールとメモリ管理による滑らかな体験
- **🔧 設定駆動アーキテクチャ**: カスタマイズ可能な全パラメータと統一されたエラーハンドリング

---

## 🚀 クイックスタート

### ⚠️ 重要事項

このプロジェクトは**p5.soundライブラリ**を使用するため、ローカルHTTPサーバーでの実行が必須です。ファイルを直接ブラウザで開くとCORSエラーが発生します。

### 📥 セットアップ

このプロジェクトは外部依存関係がなく、p5.jsはCDN経由で読み込むため、`npm install`は不要です。

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd p5-interactive-animation

# 2. ローカルHTTPサーバーを起動（以下のいずれかの方法）

# 方法A: npmスクリプトを使用（Python3が必要）
npm run dev     # または npm start

# 方法B: Node.jsベースのHTTPサーバー（推奨）
npx serve .                     # ポート3000で起動
npx http-server -p 8000         # ポート8000で起動
npx live-server                 # 自動リロード機能付き

# 方法C: 他の言語の標準HTTPサーバー
python3 -m http.server 8000     # Python 3
python -m SimpleHTTPServer 8000 # Python 2
ruby -run -e httpd . -p 8000    # Ruby
```

### 🌐 アクセス

サーバー起動後、使用したサーバーに応じて以下のURLにアクセス：

| サーバー | デフォルトURL |
|---------|---------------|
| npm run dev | http://localhost:8000 |
| npx serve | http://localhost:3000 |
| npx http-server | http://localhost:8080 |
| npx live-server | http://localhost:8080 |
| python3 -m http.server | http://localhost:8000 |

### 📱 動作環境

- **ブラウザ**: Chrome, Firefox, Safari, Edge（Web Audio API対応）
- **OS**: Windows, macOS, Linux
- **推奨**: デスクトップ環境（マウス操作最適化）

---

## 🎮 使用方法

### 🖱️ 基本操作

| 操作 | 効果 | 説明 |
|------|------|------|
| **初回クリック** | 🔊 サウンドシステム開始 | Web Audio APIの制限により、最初のクリックで音声を有効化 |
| **クリック** | 💥 爆発エフェクト | クリック位置を中心とした爆発的パーティクル生成 |
| **ドラッグ** | 🌊 パーティクル操作 | マウス軌跡に沿ってパーティクルが引き寄せられ、3秒間の美しい軌跡を表示 |
| **Space** | ⏸️ 一時停止/再開 | アニメーションの停止・再開 |
| **R** | 🔄 リセット | 全パーティクルとエフェクトをリセット |
| **M** | 🔇/🔊 ミュート | サウンドシステムのオン/オフ |
| **D** | 📊 デバッグ情報 | パフォーマンス統計とシステム情報の表示 |

### 🎨 エフェクトモード

| キー | モード | 視覚効果 | 音響効果 | 特徴 |
|------|--------|----------|----------|------|
| **1** | 🎆 爆発 | 放射状拡散、リバーブ効果 | 低音衝撃 + 高音煌めき | バランスの取れた基本モード |
| **2** | 🌈 トレイル | 軌跡表示、ディレイエコー | ペンタトニック旋律 | 美しい軌跡と余韻のあるサウンド |
| **3** | 🌙 虹色パルス | 色相変化、倍音フィルター | ハーモニック和音 | 色彩豊かな視覚と豊かな音響 |
| **4** | 🌍 重力 | 重力シミュレーション | ピッチベンド | 物理的リアリティのある動き |
| **5** | 🌀 渦巻き | 回転運動、LFO変調 | 空間的パンニング | 動的で立体的な体験 |

### 🎵 サウンドシステム

#### 音響理論に基づく設計
- **基準周波数**: 432Hz（調和の取れた自然周波数）
- **スケール**: ペンタトニック（C-D-E-G-A）による癒しの音階
- **倍音構造**: 黄金比（1.618）に基づく美しい音色
- **空間音響**: ステレオパンニングによる立体音場

#### インタラクティブサウンド
- **位置連動**: マウス位置に応じた音程とパンニング
- **速度感応**: ドラッグ速度による音量とエフェクト強度
- **アンビエント**: 70BPMの心拍リズムによる安らぎ
- **リアルタイム合成**: 全サウンドがリアルタイム生成

---

## 🛠️ 開発者向け情報

### 📁 プロジェクト構成

```
p5-interactive-animation/
├── 📄 index.html                 # メインHTML（エントリーポイント）
├── 🎨 style.css                  # UIスタイル定義
├── 🖼️ sketch.js                  # p5.jsメインスケッチ（描画ループ）
├── ⚙️ config.js                  # 設定値一元管理・マジックナンバー排除
├── 🛡️ errorHandler.js            # 統一エラーハンドリング
├── 🔧 utils.js                   # ユーティリティ関数群
├── 🎵 soundSystem.js             # 音響システム（Web Audio API）
├── 💥 explosionStrategy.js       # 爆発エフェクト戦略パターン
├── 🏭 particleFactory.js         # パーティクル生成ファクトリーパターン
├── ✨ particleSystem.js          # パーティクル管理システム
├── 🔴 particle.js                # 個別パーティクル物理演算
├── 🌊 dragTrail.js               # ドラッグ軌跡管理
├── 📦 package.json               # Node.js依存関係
├── 🤖 CLAUDE.md                  # Claude Code向け開発ガイド
└── 📚 README.md                  # プロジェクトドキュメント
```

### 🏗️ 技術スタック

#### フロントエンド
- **p5.js 1.9.0**: クリエイティブコーディングフレームワーク（CDN経由）
- **p5.sound**: Web Audio API統合ライブラリ（CDN経由）
- **Web Audio API**: 高品質リアルタイム音声処理
- **Canvas API**: 高性能2Dグラフィックス描画
- **Vanilla JavaScript**: ES6+ モジュラー設計
- **HTML5 & CSS3**: レスポンシブUI

#### 開発・運用
- **HTTPサーバー**: CORS問題解決用（npm/npx）
- **Git**: バージョン管理
- **JSDoc**: コード内ドキュメント
- **モジュラー設計**: Factory/Strategy パターン実装

### 🎯 アーキテクチャ設計原則

#### 1. **設定駆動開発 (Configuration-Driven Development)**
```javascript
// すべての設定値は config.js で一元管理
const particleConfig = Config.PARTICLES;
const maxParticles = particleConfig.MAX_COUNT; // マジックナンバー排除
```

#### 2. **統一エラーハンドリング**
```javascript
// 全メソッドで統一されたエラーハンドリング
return ErrorUtils.safeExecute(() => {
    // 処理内容
}, 'methodName', fallbackValue);
```

#### 3. **パフォーマンス最適化**
- **オブジェクトプール**: メモリ効率的なパーティクル再利用
- **フレームスキップ**: 負荷に応じた描画最適化
- **バッチ処理**: 効率的なサウンド管理
- **メモリ監視**: 自動クリーンアップシステム

#### 4. **モジュラー設計**
- **単一責任**: 各クラスが明確な責任を持つ
- **疎結合**: 依存関係を最小限に抑制
- **再利用性**: コンポーネントベースの設計

### ⚙️ 設定とカスタマイズ

#### config.js での設定カスタマイズ

```javascript
// パーティクル設定例
Config.PARTICLES.MAX_COUNT = 2000;           // 最大パーティクル数
Config.CANVAS.TARGET_FPS = 120;              // 目標フレームレート
Config.SOUND.DEFAULT_MASTER_VOLUME = 0.8;    // 音量設定

// ドラッグトレイル設定例
Config.DRAG_TRAIL.DURATION_FRAMES = 240;     // 軌跡表示時間（4秒）
Config.DRAG_TRAIL.MAX_SEGMENTS = 1000;       // 最大軌跡セグメント数
```

#### 開発者向けデバッグ機能

```javascript
// パフォーマンス監視
const stats = particleSystem.getPerformanceStats();
console.log('FPS:', performanceMonitor.getFPS());

// エラー追跡
const errors = errorHandler.getErrorHistory();

// メモリ使用量確認
const memoryInfo = performance.memory;
```

### 🧪 テスト・品質保証

#### 品質チェック項目
- ✅ **構文チェック**: 全JSファイルのブラウザ互換性検証
- ✅ **パフォーマンス**: 60FPS維持、メモリリーク防止
- ✅ **ブラウザ互換性**: 主要ブラウザでの動作確認
- ✅ **アクセシビリティ**: キーボード操作、視覚的フィードバック
- ✅ **エラーハンドリング**: 統一エラーハンドリングによるクラッシュ防止
- ✅ **Web Audio API**: CORS制限とユーザーインタラクション要件の対応

#### パフォーマンス最適化指標
- **目標FPS**: 60fps (16.67ms/frame)
- **メモリ使用量**: <100MB（警告閾値）
- **音声レイテンシ**: <50ms
- **パーティクル最適数**: 200-1000個

---

## 🔧 トラブルシューティング

### 🔇 音声関連の問題

#### サウンドが再生されない
```bash
# チェック項目
1. ブラウザの音声設定を確認
2. 最初にクリックしてサウンドシステムを初期化
3. ミュート状態でないかMキーで確認
4. ブラウザコンソールでエラーメッセージを確認
```

#### 音声ノイズ・遅延
```bash
# 対処方法
1. ブラウザタブの数を減らす
2. 他の音声アプリケーションを終了
3. オーディオドライバーを更新
4. サンプリングレート設定を確認
```

### ⚡ パフォーマンス問題

#### フレームレート低下
```bash
# 診断・対処
1. Dキーでデバッグ情報を表示
2. パーティクル数を確認（>1000で重い）
3. Rキーでリセット
4. ブラウザのハードウェアアクセラレーションを確認
```

#### メモリ使用量増加
```bash
# メモリ最適化
1. 長時間使用後はページリフレッシュ
2. 他のブラウザタブを閉じる
3. ブラウザの拡張機能を無効化
4. システムメモリの空き容量を確認
```

### 🌐 ネットワーク・サーバー問題

#### CORSエラー
```bash
# 解決方法
❌ file:// プロトコルでは動作しません
✅ 必ずHTTPサーバー経由でアクセス
✅ npm start または npx serve を使用
✅ ポート8000または8080でアクセス
```

#### サーバー起動失敗
```bash
# 代替起動方法
npx serve .                     # serve パッケージ
npx http-server -p 8000         # http-server パッケージ
npx live-server                 # live-server パッケージ（自動リロード付き）
```

### 💻 開発環境問題

#### Hot Reload / ファイル変更が反映されない
```bash
# 対処方法
1. ブラウザのキャッシュをクリア（Ctrl+F5）
2. 開発者ツールでDisable cacheを有効化
3. サーバーを再起動
4. プライベートブラウジングモードで確認
```

---

## 📊 パフォーマンス仕様

### 🎯 システム要件

| 項目 | 最小要件 | 推奨要件 |
|------|----------|----------|
| **CPU** | Dual-core 2GHz | Quad-core 3GHz+ |
| **メモリ** | 4GB RAM | 8GB+ RAM |
| **GPU** | 統合グラフィック | 専用GPU |
| **ブラウザ** | Chrome 70+ | Chrome/Firefox最新版 |

### 📈 パフォーマンス指標

| メトリクス | 目標値 | 警告閾値 |
|------------|--------|----------|
| **フレームレート** | 60 FPS | <30 FPS |
| **メモリ使用量** | <50MB | >100MB |
| **音声レイテンシ** | <20ms | >50ms |
| **パーティクル数** | 200-500 | >1000 |
| **描画時間** | <8ms | >16ms |

---

## 🤝 コントリビューション

### 💡 貢献方法

1. **Issue報告**: バグ・機能要望の報告
2. **Pull Request**: コード改善・機能追加
3. **ドキュメント**: README・コメントの改善
4. **テスト**: 異なる環境での動作確認

### 📝 開発ガイドライン

詳細な開発ガイドラインは [CLAUDE.md](CLAUDE.md) を参照してください。

#### コーディング規約
```javascript
// ✅ 良い例
const particleConfig = Config.PARTICLES.APPEARANCE;
const isValidCoordinate = (x) => isFinite(x) && !isNaN(x);

// ❌ 悪い例
const pc = Config.PARTICLES.APPEARANCE;
const valid = (x) => x;
```

#### コミット規約
```bash
# Conventional Commits形式
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
perf: パフォーマンス改善
test: テスト追加
```

#### Pull Request要件
- [ ] コード品質チェック通過
- [ ] JSDoc追加済み
- [ ] パフォーマンステスト実行
- [ ] ブラウザ互換性確認
- [ ] README更新（必要に応じて）

---

## 📄 ライセンス・クレジット

### 📜 ライセンス
このプロジェクトは **MIT License** の下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご確認ください。

### 🙏 使用ライブラリ・技術

- **p5.js**: [MIT License](https://github.com/processing/p5.js/blob/main/license.txt)
- **p5.sound**: [LGPL](https://github.com/processing/p5.js-sound/blob/main/LICENSE.txt)
- **Web Audio API**: [W3C Standard](https://www.w3.org/TR/webaudio/)

### 🎵 音楽理論参考文献

- ペンタトニックスケール理論
- 黄金比と音響学の関係
- 倍音列と自然共鳴

---

## 🔗 関連リンク・参考資料

### 📚 技術ドキュメント
- [p5.js公式ドキュメント](https://p5js.org/reference/)
- [Web Audio API仕様](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas APIリファレンス](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

### 🎨 インスピレーション
- [Processing Foundation](https://processingfoundation.org/)
- [Creative Coding Community](https://www.openprocessing.org/)
- [Generative Art Resources](https://github.com/terkelg/awesome-creative-coding)

---

<div align="center">

**✨ 美しい音と映像の調和をお楽しみください ✨**

*Interactive Particle Animation - Where Art Meets Technology*

Made with ❤️ by [Your Name] | 🤖 Enhanced with [Claude Code](https://claude.ai/code)

</div>