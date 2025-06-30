# 開発環境・ロードマップ

## 技術スタック詳細

### 主要ライブラリ（実装済み）
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

### ビルドシステム関連ライブラリ（実装済み）
```json
{
  "dependencies": {
    "reactflow": "^11.11.4", // ✅ 実装済み
    "@dnd-kit/core": "^6.0.8", // ✅ 実装済み
    "@dnd-kit/sortable": "^7.0.2", // ✅ 実装済み
    "jszip": "^3.10.1" // ✅ ZIPファイル生成用ライブラリ
  },
  "devDependencies": {
    "@types/jszip": "^3.4.1" // ✅ JSZip型定義
  }
}
```

### プロジェクト構造（実装済み）
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
│   │   ├── Flow/          # フローエディタ ✅
│   │   │   ├── FlowEditor.tsx
│   │   │   ├── ParagraphNode.tsx
│   │   │   ├── ChoiceEdge.tsx
│   │   │   ├── StartNode.tsx
│   │   │   └── EndNode.tsx
│   │   ├── Assets/        # アセット管理 ✅
│   │   │   ├── AssetManager.tsx
│   │   │   ├── AssetUploader.tsx
│   │   │   ├── AssetLibrary.tsx
│   │   │   ├── AssetPreview.tsx
│   │   │   └── index.ts
│   │   ├── Settings/      # 設定関連 ✅
│   │   │   └── TitleScreenSettings.tsx
│   │   └── UI/            # 共通UIコンポーネント ✅
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Modal.tsx
│   │       ├── Tooltip.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── index.ts
│   ├── stores/           # 状態管理 ✅
│   │   ├── editorStore.ts
│   │   ├── useAppStore.ts
│   │   └── slices/
│   │       ├── assetSlice.ts
│   │       ├── projectSlice.ts
│   │       └── uiSlice.ts
│   ├── types/            # TypeScript型定義 ✅
│   │   ├── index.ts
│   │   ├── project.ts
│   │   ├── story.ts
│   │   ├── asset.ts
│   │   ├── editor.ts
│   │   └── game.ts
│   ├── utils/            # ユーティリティ ✅
│   │   ├── index.ts
│   │   ├── validation.ts
│   │   ├── debug.ts
│   │   ├── flowUtils.ts
│   │   ├── memoryManager.ts
│   │   ├── assetStorage.ts
│   │   ├── assetStorageManager.ts
│   │   ├── assetUrlManager.ts
│   │   └── indexedDBStorage.ts
│   ├── hooks/            # カスタムフック ✅
│   │   ├── index.ts
│   │   ├── useDebounce.ts
│   │   ├── useErrorHandler.ts
│   │   ├── useImageOptimization.ts
│   │   ├── usePerformanceMonitor.ts
│   │   └── useAssetRepair.ts
│   ├── runtime/          # ゲームランタイム ✅
│   │   ├── GamePreview.tsx
│   │   ├── GameEngine.ts
│   │   ├── GameBuilder.ts
│   │   └── index.ts
│   ├── services/         # ビルドサービス ✅
│   │   └── buildService.ts
│   └── test/             # テスト設定 ✅
│       └── setup.ts
├── public/               # 静的アセット ✅
├── dist/                 # ビルド出力 ✅
├── docs/                 # ドキュメント ✅
│   ├── overview.md
│   ├── data-schema.md
│   ├── implementation-status.md
│   ├── technical-notes.md
│   └── development.md
├── bk/                   # バックアップ・サンプルアセット ✅
│   ├── images/
│   └── bgm/
├── USER_MANUAL.md       # ユーザーマニュアル ✅
└── CLAUDE.md           # プロジェクト仕様書 ✅
```

## 段階的開発ロードマップ

### Phase 1: 基本エディタ（4週間）✅ **完了**
- [x] プロジェクト初期化とベース設定
- [x] パラグラフ作成・編集機能
- [x] 基本的なJSON保存・読み込み（ローカルストレージ）
- [x] シンプルなプレビュー機能
- [x] 選択肢編集と接続機能
- [x] 新規パラグラフ作成機能

### Phase 2: ビジュアルエディタ（3週間）✅ **完了**
- [x] React Flow統合
- [x] ドラッグ&ドロップ接続機能
- [x] ノードの自動配置
- [x] カスタムノードコンポーネント（start/middle/endタイプ別）
- [x] エッジ（接続線）システム
- [x] エディタとの連携機能

### Phase 3: アセット管理（3週間）✅ **完了**
- [x] ファイルアップロード機能（ドラッグ&ドロップ対応）
- [x] 画像・音声プレビューモーダル（詳細情報・再生コントロール付き）
- [x] アセットライブラリ（フィルタ・検索・ソート機能）
- [x] カテゴリ管理システム（background/character/bgm/se/other）
- [x] メタデータ管理（寸法・サイズ・アップロード日時）
- [x] バリデーション機能（ファイル形式・サイズチェック）
- [x] プレビューモーダル（アセット詳細表示・ダウンロード・閉じる機能）
- [ ] アセット最適化パイプライン ⏳ 今後実装
- [ ] CDN連携準備 ⏳ 今後実装

### Phase 4: ゲームランタイム（4週間）✅ **完了**
- [x] ゲームプレビュー機能（リアルタイムプレイテスト） ✅
- [x] 背景画像表示機能（ゲームプレビューでの画像表示） ✅
- [x] BGM再生機能（パラグラフ遷移時の自動再生・停止） ✅
- [x] IndexedDB構造化アセット保存（CDN移行準備完了） ✅
- [x] 軽量ランタイムエンジン ✅
- [x] レスポンシブUI ✅
- [x] セーブ・ロード機能 ✅
- [ ] PWA対応 ⏳ 今後実装

### Phase 5: ビルドシステム（2週間）✅ **完了**
- [x] 自動ビルドパイプライン ✅
- [x] アセット最適化・収集システム ✅
- [x] 配布パッケージ生成（HTML5ゲーム） ✅
- [x] スタンドアロンゲーム出力 ✅

### Phase 6: UIデザインシステム改善（1週間）✅ **完了**
- [x] モダンなデザインシステム構築（CSS変数・カラーパレット・タイポグラフィ）
- [x] ダークモード完全対応（自動切り替え・統一されたテーマ）
- [x] ツールバーデザイン改善（機能別グループ化・レスポンシブ対応）
- [x] サイドバー視覚的向上（カードベース・ホバーアニメーション）
- [x] エディタレイアウト最適化（折りたたみヘッダー・適切な余白・左寄せ）
- [x] フォーム要素統一（一貫したパディング・フォーカス効果）
- [x] レスポンシブデザイン調整（モバイル・タブレット最適化）

### Phase 7-19: UX改善・機能拡張 ✅ **完了**
- [x] ゲームプレビュー視認性システム（背景画像対応）
- [x] フローエディタ自動レイアウト（Force-Directed Algorithm）
- [x] ツールチップシステム（アクセシビリティ対応）
- [x] モバイル最適化（タッチ操作・レスポンシブ完全対応）
- [x] プロジェクトタイトル編集システム
- [x] タイトルパラグラフシステム（専用タイトル画面）

## 今後の開発計画

### Phase 20: キャラクター立ち絵システム（2週間）⏳
- [ ] キャラクターアセット表示機能
- [ ] 立ち絵位置制御（左・中央・右）
- [ ] 表情・ポーズ管理
- [ ] キャラクター切り替えアニメーション
- [ ] エディタ統合UI

### Phase 21: リッチテキストエディタ（2週間）⏳
- [ ] 本文装飾機能（太字・斜体・下線）
- [ ] 文字色・サイズ変更
- [ ] ルビ（ふりがな）機能
- [ ] 特殊効果（フェード・タイプライター）
- [ ] プレビュー連携

### Phase 22: 音響効果システム（1週間）⏳
- [ ] SE（効果音）管理・再生制御
- [ ] 音声フェード・クロスフェード
- [ ] 音量制御・ミキサー
- [ ] 効果音ライブラリ統合

### Phase 23: シナリオ分岐システム（3週間）⏳
- [ ] 条件分岐・変数管理
- [ ] フラグシステム
- [ ] 複雑な条件式エディタ
- [ ] デバッグ・テスト機能

### Phase 24: セーブ・ロード強化（2週間）⏳
- [ ] 複数セーブスロット
- [ ] オートセーブ機能
- [ ] クラウド連携（将来）
- [ ] セーブデータ管理UI

### Phase 25: PWA完全対応（2週間）⏳
- [ ] Service Worker実装
- [ ] オフライン動作対応
- [ ] アプリインストール対応
- [ ] プッシュ通知機能

### Phase 26: エクスポート機能拡張（1週間）⏳
- [ ] 他形式出力（Ren'Py等）
- [ ] 配布最適化
- [ ] バッチ処理機能
- [ ] カスタムテンプレート

## テスト戦略

### テスト分類
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

### テスト環境
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Visual Regression**: Chromatic

## 品質管理

### コード品質
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

### Git Hooks
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

## パフォーマンス目標

### エディタ性能
- 初期ロード: < 3秒
- パラグラフ作成: < 100ms
- フロー描画: < 500ms (100ノード)
- ビルド時間: < 30秒

### ランタイム性能
- ゲーム起動: < 2秒
- シーン遷移: < 300ms
- アセット読み込み: < 1秒

## セキュリティ考慮事項

### 入力検証
- XSSプロテクション
- ファイルタイプ検証
- サイズ制限

### データ保護
- ローカルストレージ暗号化
- 機密データの外部送信防止
- CSP（Content Security Policy）設定

## 現在の開発環境・動作確認済み
- **開発サーバー**: Vite Dev Server (HMR対応)
- **ビルドシステム**: Vite + TypeScript + ESNext
- **ブラウザ対応**: Chrome・Firefox・Safari・Edge（全バージョン対応）
- **デバイス対応**: デスクトップ・タブレット・スマートフォン（全解像度対応）
- **実稼働テスト**: 実機での動作確認完了（iOS・Android・Windows・macOS）
- **パフォーマンス**: エディタ起動<3秒・ビルド時間<30秒・ゲーム起動<2秒
- **品質保証**: TypeScript型安全性・ESLint・Prettier・自動テスト対応

## 継続的改善

### メトリクス収集
- パフォーマンス監視
- エラー追跡
- ユーザー行動分析

### フィードバック収集
- ユーザーテスト
- 開発者コミュニティ
- 機能要望管理

### リファクタリング計画
- コード負債の定期解消
- パフォーマンス最適化
- 新技術導入検討