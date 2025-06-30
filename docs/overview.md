# ノベルゲームエディタ - プロジェクト概要

## プロジェクト概要

### 目的
映画のシーンに似た「パラグラフ」という単位を基本構造とした、Webベースのノベルゲーム作成・編集ツールの開発。
エディタで作成したゲームは、PCブラウザやスマートフォンでプレイ可能なHTML5ゲームとして出力される。

### 主要機能
- **パラグラフベースエディタ**: 本文、選択肢、画像、BGMを含むシーン単位での編集
- **ビジュアルフローエディタ**: ドラッグ&ドロップによるパラグラフ間の関係性編集
- **マルチプラットフォーム対応**: Web/スマホブラウザでのプレイ
- **ビルド機能**: 完成したゲームの配布可能な形式での出力

### 技術スタック選択理由

#### フロントエンド
- **React + TypeScript**: コンポーネント化と型安全性の確保 ✅
- **Vite**: 高速なビルドとHMR（Hot Module Replacement） ✅
- **Zustand**: 軽量状態管理ライブラリ ✅
- **React Flow**: ビジュアルなノードエディタの実装 ✅

#### データ管理
- **JSON形式**: 軽量で高速パース、ブラウザネイティブサポート ✅
- **手動保存方式**: JSONファイルダウンロード/アップロードによるプロジェクト管理 ✅
- **IndexedDB**: 構造化アセット保存、CDN移行準備完了 ✅

#### スタイリング
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク ✅
- **Responsive Design**: モバイル対応 ✅

### アーキテクチャ概念

```
パラグラフ（シーン）
├── 本文（可変長テキスト）
├── 選択肢（1-5個）
├── 画像（背景・立ち絵）
└── BGM

パラグラフタイプ
├── タイトル（タイトル画面・1プロジェクト1つまで）
├── スタート（開始点）
├── 中間（分岐・合流・ループ対応）
└── エンド（終了点・複数可）
```

### データフロー

```
エディタ → JSON Project File → ビルドシステム → HTML5 Game
    ↕                    ↕
  ローカルDB            CDN Assets
```

## エディタ機能仕様

### パラグラフ編集画面

#### レイアウト構成
```
┌─────────────────┬─────────────────┐
│ ツールバー      │ プレビュー      │
├─────────────────┼─────────────────┤
│ パラグラフリスト│ 編集エリア      │
│                 │ - 本文入力      │
│                 │ - 選択肢編集    │
│                 │ - アセット設定  │
└─────────────────┴─────────────────┘
```

#### 編集機能
- **パラグラフ編集**: タイトル、本文、タイプ（スタート/中間/エンド）の編集 ✅
- **選択肢管理**: 動的な追加・削除・並び替え（最大5個） ✅
- **接続先設定**: 既存パラグラフまたは新規パラグラフ作成での接続 ✅
- **手動保存**: JSONファイルによる保存・読み込み ✅
- **背景画像設定**: アセットライブラリからの画像選択・プレビュー・削除 ✅
- **BGM設定**: 音声アセット選択・プレビュー再生・削除 ✅
- **リッチテキストエディタ**: 本文の装飾（太字、色、サイズ等）⏳ 今後実装
- **アセット選択**: ドラッグ&ドロップによるファイル追加 ✅

### ビジュアルフローエディタ ✅

#### React Flow実装
```typescript
// カスタムノードタイプ定義
const nodeTypes = {
  paragraph: ParagraphNode, // start/middle/endタイプ対応
};

// エッジ（接続線）自動生成
const createEdgesFromChoices = () => {
  // 選択肢からターゲットパラグラフへの接続線を自動生成
  // ラベル付き、アニメーション対応
};
```

#### 実装済み機能 ✅
- **ドラッグ&ドロップ**: パラグラフ配置と位置保存
- **自動レイアウト**: start→middle→endの論理的配置
- **カスタムノード**: タイプ別視覚的区別（色・アイコン）
- **エッジシステム**: 選択肢からの自動接続線生成
- **エディタ連携**: ノードクリックでパラグラフ編集
- **リアルタイム更新**: パラグラフ変更の即座反映

### UI/UXコンポーネント設計

```typescript
// 主要コンポーネント構成
interface EditorComponents {
  Toolbar: {
    FileMenu: React.FC;
    EditMenu: React.FC;
    ViewMenu: React.FC;
  };
  Sidebar: {
    ParagraphList: React.FC;
    AssetLibrary: React.FC;
    ProjectSettings: React.FC;
  };
  MainArea: {
    FlowEditor: React.FC;
    ParagraphEditor: React.FC;
    Preview: React.FC;
  };
  Modal: {
    AssetUpload: React.FC;
    Export: React.FC;
    Settings: React.FC;
  };
}
```

## ビルドシステム

### HTML5ゲームランタイム設計

#### アーキテクチャ
```
Novel Game Runtime
├── Game Engine (Lightweight)
│   ├── Scene Manager
│   ├── Asset Loader
│   ├── Audio Manager
│   └── Save/Load System
├── UI Components
│   ├── Text Display
│   ├── Choice Buttons
│   ├── Image Renderer
│   └── Menu System
└── Data Layer
    ├── Story Data (JSON)
    ├── Save Data (LocalStorage)
    └── Settings (LocalStorage)
```

#### 出力ファイル構成（実装済み） ✅
```
プロジェクト名_game_日付.zip
├── index.html          # スタンドアロンHTML（CSS・JS・データ全て埋め込み）
└── assets/             # アセットファイル
    ├── background/     # 背景画像
    ├── character/      # キャラクター画像
    ├── bgm/           # BGM音声ファイル
    ├── se/            # 効果音ファイル
    └── other/         # その他ファイル
```

### レスポンシブ対応

#### ブレークポイント設計
```css
/* デスクトップ優先アプローチ */
.game-container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  /* タブレット対応 */
}

@media (max-width: 480px) {
  /* スマートフォン対応 */
}
```

#### タッチ操作対応
```typescript
interface TouchControls {
  tap: () => void;          // テキスト送り
  longPress: () => void;    // メニュー表示
  swipe: {
    left: () => void;       // 履歴表示
    right: () => void;      // 早送り
  };
}
```

### PWA機能実装

#### Service Worker
```typescript
// キャッシュ戦略
const CACHE_STRATEGY = {
  runtime: 'cache-first',     // ランタイム
  assets: 'stale-while-revalidate', // アセット
  data: 'network-first'       // ストーリーデータ
};
```

#### Web App Manifest
```json
{
  "name": "Generated Novel Game",
  "short_name": "Novel",
  "description": "Interactive novel game",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [...]
}
```