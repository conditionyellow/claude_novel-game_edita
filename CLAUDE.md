# ノベルゲームエディタ

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
- **React Flow**: ビジュアルなノードエディタの実装 ⏳ 今後実装

#### データ管理
- **JSON形式**: 軽量で高速パース、ブラウザネイティブサポート ✅
- **LocalStorage**: リアルタイム保存とオフライン対応 ✅
- **IndexedDB**: 大容量データ対応 ⏳ 今後実装

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
├── スタート（開始点）
├── 中間（分岐・合流・ループ対応）
└── エンド（終了点・複数可）
```

## コアデータ構造

### パラグラフスキーマ

```typescript
interface Paragraph {
  id: string;
  type: 'start' | 'middle' | 'end';
  title: string;
  content: {
    text: string;
    choices: Choice[];
    background?: Asset;
    characters?: Character[];
    bgm?: Asset;
  };
  position?: { x: number; y: number }; // ビジュアルエディタ用
  metadata: {
    created: Date;
    modified: Date;
    tags?: string[];
  };
}

interface Choice {
  id: string;
  text: string;
  targetParagraphId: string;
  condition?: Condition; // 条件分岐用（将来拡張）
}

interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio';
  metadata: {
    size: number;
    format: string;
    duration?: number; // 音声ファイル用
  };
}

interface Character {
  id: string;
  name: string;
  sprite: Asset;
  position: 'left' | 'center' | 'right';
  expression?: string;
}
```

### プロジェクトスキーマ

```typescript
interface NovelProject {
  id: string;
  title: string;
  description: string;
  version: string;
  paragraphs: Paragraph[];
  assets: Asset[];
  characters: Character[];
  settings: {
    defaultFont: string;
    defaultFontSize: number;
    themeColors: ThemeColors;
    resolution: { width: number; height: number };
  };
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
}
```

### データフロー

```
エディタ → JSON Project File → ビルドシステム → HTML5 Game
    ↕                    ↕
  ローカルDB            CDN Assets
```

## 現在実装済み機能 ✅

### エディタコア機能
- **プロジェクト管理**: 新規作成、自動保存（LocalStorage）
- **パラグラフ編集**: タイトル、本文、タイプ変更
- **選択肢システム**: 追加、編集、削除、接続設定（1-5個）
- **新規パラグラフ作成**: 選択肢から直接新しいパラグラフを作成・接続
- **リアルタイム反映**: 編集内容の即座反映とサイドバー更新

### UI/UXコンポーネント
- **ツールバー**: モード切り替え（エディタ/フロー/プレビュー）、保存状態表示
- **サイドバー**: パラグラフ一覧、タイプ表示、選択・削除機能
- **メインエディタ**: パラグラフ詳細編集、選択肢管理
- **選択肢エディタ**: テキスト編集、接続先選択、新規作成ボタン

### 状態管理
- **Zustand Store**: プロジェクト状態、選択状態、編集状態の管理
- **型安全性**: TypeScript完全対応
- **永続化**: LocalStorage自動保存・復元

### バリデーション
- **データ整合性**: パラグラフ接続の検証
- **UI制限**: 最大選択肢数、必須フィールドチェック
- **エラー表示**: リアルタイムバリデーションメッセージ

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
- **リアルタイム保存**: 自動的なローカルストレージ保存 ✅
- **リッチテキストエディタ**: 本文の装飾（太字、色、サイズ等）⏳ 今後実装
- **アセット選択**: ドラッグ&ドロップによるファイル追加 ⏳ 今後実装

### ビジュアルフローエディタ

#### React Flow実装
```typescript
// ノードタイプ定義
const nodeTypes = {
  paragraph: ParagraphNode,
  start: StartNode,
  end: EndNode
};

// エッジ（接続線）設定
const edgeTypes = {
  choice: ChoiceEdge,
  conditional: ConditionalEdge
};
```

#### 機能
- **ドラッグ&ドロップ**: パラグラフ配置と接続
- **自動レイアウト**: アルゴリズムによる整列
- **ズーム・パン**: 大規模プロジェクト対応
- **選択・複数選択**: 一括操作対応
- **ミニマップ**: 全体把握用

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

## アセット管理システム

### 開発時の管理

#### ローカルファイル構造
```
project/
├── paragraphs.json
├── assets/
│   ├── images/
│   │   ├── backgrounds/
│   │   └── characters/
│   └── audio/
│       ├── bgm/
│       └── se/
└── metadata.json
```

#### アセット処理パイプライン
1. **アップロード**: ドラッグ&ドロップ、ファイル選択
2. **最適化**: 画像リサイズ、音声圧縮
3. **バリデーション**: ファイル形式、サイズチェック
4. **インデックス化**: メタデータ抽出と登録

### 配布時の管理

#### CDN活用戦略
```typescript
interface AssetDeployment {
  strategy: 'cdn' | 'embedded' | 'hybrid';
  cdn: {
    provider: 'cloudfront' | 'cloudflare' | 'custom';
    caching: CacheConfig;
    compression: boolean;
  };
  fallback: {
    embedded: Asset[]; // 小サイズファイル
    lazy: boolean; // 遅延読み込み
  };
}
```

#### 最適化手法
- **画像**: WebP変換、Progressive JPEG
- **音声**: MP3/OGG変換、ビットレート調整
- **遅延読み込み**: Intersection Observer使用
- **キャッシュ戦略**: Service Worker実装

### アセット参照システム

```typescript
// アセット参照の実装
class AssetManager {
  async loadAsset(id: string): Promise<Asset> {
    // 1. ローカルキャッシュ確認
    // 2. CDNから取得
    // 3. フォールバック処理
  }
  
  preloadAssets(paragraphId: string): Promise<Asset[]> {
    // 次のパラグラフのアセットを先読み
  }
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

#### 出力ファイル構成
```
game-output/
├── index.html          # エントリーポイント
├── game.js             # ランタイムエンジン
├── story.json          # ストーリーデータ
├── assets/             # 最適化済みアセット
│   ├── images/
│   └── audio/
├── manifest.json       # PWA設定
└── sw.js              # Service Worker
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

## 開発環境・実装計画

### 技術スタック詳細

#### 主要ライブラリ（実装済み）
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.2",
    "zustand": "^4.4.1",
    "react-hook-form": "^7.45.4",
    "lucide-react": "^0.279.0",
    "nanoid": "^4.0.2",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^4.4.5",
    "@vitejs/plugin-react": "^4.0.3",
    "tailwindcss": "latest",
    "@tailwindcss/postcss": "latest",
    "autoprefixer": "latest",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0",
    "@testing-library/react": "^13.4.0"
  }
}
```

#### 今後追加予定
```json
{
  "dependencies": {
    "reactflow": "^11.10.1",
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2"
  }
}
```

#### プロジェクト構造（実装済み）
```
novel-game-editor/
├── src/
│   ├── components/        # UIコンポーネント ✅
│   │   ├── Editor/        # パラグラフエディタ関連 ✅
│   │   │   ├── EditorLayout.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ParagraphEditor.tsx
│   │   │   ├── ChoiceEditor.tsx
│   │   │   └── Preview.tsx
│   │   ├── Flow/          # フローエディタ（基本構造のみ） ⏳
│   │   │   └── FlowEditor.tsx
│   │   └── UI/            # 共通UIコンポーネント ✅
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       └── index.ts
│   ├── stores/           # 状態管理 ✅
│   │   └── editorStore.ts
│   ├── types/            # TypeScript型定義 ✅
│   │   └── index.ts
│   ├── utils/            # ユーティリティ ✅
│   │   └── index.ts
│   ├── hooks/            # カスタムフック ⏳
│   ├── runtime/          # ゲームランタイム ⏳
│   └── test/             # テスト設定 ✅
│       └── setup.ts
├── public/               # 静的アセット ✅
├── dist/                 # ビルド出力 ✅
├── docs/                 # ドキュメント ⏳
└── CLAUDE.md            # プロジェクト仕様書 ✅
```

### 段階的開発ロードマップ

#### Phase 1: 基本エディタ（4週間）✅ **完了**
- [x] プロジェクト初期化とベース設定
- [x] パラグラフ作成・編集機能
- [x] 基本的なJSON保存・読み込み（ローカルストレージ）
- [x] シンプルなプレビュー機能
- [x] 選択肢編集と接続機能
- [x] 新規パラグラフ作成機能

#### Phase 2: ビジュアルエディタ（3週間）
- [ ] React Flow統合
- [ ] ドラッグ&ドロップ接続機能
- [ ] ノードの自動配置
- [ ] フロー検証（孤立ノード検出等）

#### Phase 3: アセット管理（3週間）
- [ ] ファイルアップロード機能
- [ ] 画像・音声プレビュー
- [ ] アセット最適化パイプライン
- [ ] CDN連携準備

#### Phase 4: ゲームランタイム（4週間）
- [ ] 軽量ランタイムエンジン
- [ ] レスポンシブUI
- [ ] セーブ・ロード機能
- [ ] PWA対応

#### Phase 5: ビルドシステム（2週間）
- [ ] 自動ビルドパイプライン
- [ ] アセット最適化
- [ ] 配布パッケージ生成
- [ ] デプロイメント自動化

### テスト戦略

#### テスト分類
```typescript
// ユニットテスト
describe('ParagraphEditor', () => {
  test('should create new paragraph', () => {});
  test('should validate choice connections', () => {});
});

// 統合テスト
describe('FlowEditor Integration', () => {
  test('should connect paragraphs correctly', () => {});
});

// E2Eテスト
describe('Editor Workflow', () => {
  test('should create and build complete game', () => {});
});
```

#### テスト環境
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Visual Regression**: Chromatic

### 品質管理

#### コード品質
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

#### Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### パフォーマンス目標

#### エディタ性能
- 初期ロード: < 3秒
- パラグラフ作成: < 100ms
- フロー描画: < 500ms (100ノード)
- ビルド時間: < 30秒

#### ランタイム性能
- ゲーム起動: < 2秒
- シーン遷移: < 300ms
- アセット読み込み: < 1秒

### セキュリティ考慮事項

#### 入力検証
- XSSプロテクション
- ファイルタイプ検証
- サイズ制限

#### データ保護
- ローカルストレージ暗号化
- 機密データの外部送信防止
- CSP（Content Security Policy）設定

---

## 開発状況サマリー

### ✅ 完了済み機能
1. **基本エディタ機能**: パラグラフ作成・編集・削除
2. **選択肢システム**: 追加・編集・接続（1-5個制限）
3. **新規パラグラフ作成**: 選択肢から直接作成・接続
4. **リアルタイム保存**: LocalStorage自動保存
5. **UI/UXシステム**: Tailwind CSS + 共通コンポーネント
6. **状態管理**: Zustand + TypeScript型安全性
7. **プロジェクト構造**: モジュラー設計

### ⏳ 次回実装予定
1. **ビジュアルフローエディタ**: React Flow統合
2. **アセット管理**: 画像・音声ファイル対応
3. **ゲームプレビュー**: リアルタイムプレイテスト
4. **エクスポート機能**: HTML5ゲーム出力
5. **リッチテキストエディタ**: 本文装飾機能

### 🚀 現在の開発環境
- **ローカルサーバー**: Python HTTP Server (port 8000)
- **ビルドシステム**: Vite + TypeScript
- **開発モード**: HMR対応
- **ブラウザ対応**: Chrome, Firefox, Safari
- **レスポンシブ**: PC/タブレット/スマホ対応

---

このCLAUDE.mdは、ノベルゲームエディタの包括的な設計書として、開発チーム全体での認識統一と効率的な開発進行を支援します。