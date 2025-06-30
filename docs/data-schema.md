# データ構造・型定義

## コアデータ構造

### パラグラフスキーマ

```typescript
interface Paragraph {
  id: string;
  type: 'title' | 'start' | 'middle' | 'end';
  title: string;
  content: {
    text: string;
    choices: Choice[];
    background?: Asset;
    characters?: Character[];
    bgm?: Asset;
    // タイトルパラグラフ専用フィールド
    titleImage?: Asset;
    titleColor?: string;
    titleFontSize?: number;
    showProjectTitle?: boolean;
  };
  position?: { x: number; y: number }; // ビジュアルエディタ用
  metadata: {
    created: Date;
    modified: Date;
    tags?: string[];
  };
}

// Phase 20追加: アセット管理拡張
interface ManagedAsset {
  asset: Asset;
  url: string;
  lastAccessed: number;
  refCount: number;
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
  category: 'background' | 'character' | 'bgm' | 'se' | 'other';
  metadata: {
    size: number;
    format: string;
    duration?: number;
    dimensions?: { width: number; height: number };
    uploadedAt: Date;
    lastUsed?: Date;
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
    titleScreen?: {
      bgm?: Asset;
    };
  };
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}
```

## アセット管理システム

### カテゴリ管理システム
```typescript
type AssetCategory = 'background' | 'character' | 'bgm' | 'se' | 'other';

interface AssetUploadOptions {
  category: AssetCategory;
  maxSize?: number;
  allowedFormats?: string[];
  autoOptimize?: boolean;
}
```

### IndexedDB構造化保存
```
IndexedDB: novel-editor-assets
├── assets テーブル: アセットメタデータ
├── files テーブル: Blobファイルデータ  
└── projects テーブル: プロジェクト情報

論理パス構造:
projects/{projectId}/assets/{category}/{fileName}
```

### CDN活用戦略
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

interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate: number;
  cacheKey: string;
}
```

## 状態管理スキーマ

### エディタストア型定義
```typescript
interface EditorStore {
  // プロジェクト状態
  currentProject: NovelProject | null;
  selectedParagraphId: string | null;
  isModified: boolean;
  
  // UI状態
  mode: 'editor' | 'flow' | 'preview' | 'assets';
  sidebarCollapsed: boolean;
  previewAsset: Asset | null;
  
  // アクション
  createProject: (title: string) => void;
  loadProject: (project: NovelProject) => Promise<void>;
  saveProject: () => void;
  updateProject: (updates: Partial<NovelProject>) => void;
  updateProjectTitle: (title: string) => void;
  
  // パラグラフ操作
  addParagraph: (paragraph: Omit<Paragraph, 'id' | 'metadata'>) => void;
  updateParagraph: (id: string, updates: Partial<Paragraph>) => void;
  deleteParagraph: (id: string) => void;
  selectParagraph: (id: string) => void;
  
  // アセット操作
  addAsset: (asset: Omit<Asset, 'id' | 'metadata'>) => void;
  addAssetWithFile: (file: File, category: AssetCategory) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetUrl: (id: string) => Promise<string>;
  loadProjectAssets: (projectId: string) => Promise<void>;
  
  // UI操作
  setMode: (mode: EditorStore['mode']) => void;
  toggleSidebar: () => void;
  setPreviewAsset: (asset: Asset | null) => void;
}
```

### ゲームランタイム型定義
```typescript
interface GameEngine {
  project: NovelProject;
  currentParagraphId: string;
  history: string[];
  saveData: SaveData;
  
  start: () => void;
  goToParagraph: (id: string) => void;
  makeChoice: (choiceId: string) => void;
  goBack: () => void;
  save: () => void;
  load: () => void;
  restart: () => void;
}

interface SaveData {
  currentParagraphId: string;
  history: string[];
  timestamp: Date;
  projectTitle: string;
  projectId: string;
}
```

## バリデーション型定義

### データ整合性チェック
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'missing_start' | 'orphaned_paragraph' | 'invalid_choice_target' | 'missing_asset';
  paragraphId?: string;
  choiceId?: string;
  assetId?: string;
  message: string;
}

interface ValidationWarning {
  type: 'unreachable_paragraph' | 'missing_end' | 'large_asset_size';
  paragraphId?: string;
  assetId?: string;
  message: string;
}
```

### フォームバリデーション
```typescript
interface FormValidation {
  paragraphTitle: {
    required: boolean;
    maxLength: number;
    pattern?: RegExp;
  };
  paragraphText: {
    maxLength: number;
    allowEmpty: boolean;
  };
  choiceText: {
    required: boolean;
    maxLength: number;
    minChoices: number;
    maxChoices: number;
  };
  assetUpload: {
    maxSize: number;
    allowedTypes: string[];
    requiredDimensions?: { width: number; height: number };
  };
}
```

## React Flow型定義

### ノード・エッジ型定義
```typescript
interface ParagraphNode extends Node {
  id: string;
  type: 'paragraph';
  data: {
    paragraph: Paragraph;
    isSelected: boolean;
    onSelect: (id: string) => void;
  };
  position: { x: number; y: number };
}

interface ChoiceEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: 'choice';
  data: {
    choice: Choice;
    label: string;
  };
  animated: boolean;
}
```

### フローレイアウト型定義
```typescript
interface FlowLayoutConfig {
  nodeSpacing: {
    horizontal: number;
    vertical: number;
  };
  layout: {
    algorithm: 'force-directed' | 'hierarchical' | 'grid';
    iterations: number;
    forceStrength: number;
  };
  collision: {
    minDistance: number;
    maxIterations: number;
    dampingFactor: number;
  };
}
```

## API型定義

### ビルドシステム
```typescript
interface BuildConfig {
  target: 'web' | 'mobile' | 'desktop';
  optimization: {
    minify: boolean;
    compression: boolean;
    assetOptimization: boolean;
  };
  output: {
    format: 'html' | 'zip' | 'pwa';
    filename: string;
    embedAssets: boolean;
  };
}

interface BuildResult {
  success: boolean;
  outputPath: string;
  size: number;
  assets: {
    embedded: Asset[];
    external: Asset[];
  };
  warnings: string[];
  errors: string[];
}
```

### エクスポート型定義
```typescript
interface ExportOptions {
  format: 'json' | 'zip' | 'html';
  includeAssets: boolean;
  compression: boolean;
  metadata: boolean;
}

interface ImportOptions {
  validateSchema: boolean;
  mergeAssets: boolean;
  preserveIds: boolean;
  migration: boolean;
}
```

## Phase 20 追加: グローバルアセット管理システム

### アセットURL管理型定義

```typescript
// グローバルアセットURL管理システム
interface GlobalAssetUrlManager {
  getStableUrl: (projectId: string, asset: Asset) => Promise<string>;
  getStableUrls: (projectId: string, assets: Asset[]) => Promise<Map<string, string>>;
  releaseUrl: (projectId: string, assetId: string) => void;
  cleanupProject: (projectId: string) => void;
  cleanup: () => void;
  getStats: () => AssetUrlStats;
}

interface ManagedAsset {
  asset: Asset;
  url: string;
  lastAccessed: number;
  refCount: number;
}

interface AssetUrlStats {
  totalCached: number;
  activeReferences: number;
  oldestAccess: number | null;
  newestAccess: number | null;
}

// アセット安定性管理設定
interface AssetStabilityConfig {
  cacheTimeout: number; // デフォルト: 30分
  cleanupInterval: number; // デフォルト: 10分
  maxCacheSize: number; // デフォルト: 1000個
  autoCleanup: boolean; // デフォルト: true
}
```

### アセット参照追跡型定義

```typescript
// URL有効性チェック結果
interface UrlValidationResult {
  isValid: boolean;
  url: string;
  timestamp: number;
  errorMessage?: string;
}

// キャッシュエントリ
interface UrlCacheEntry {
  url: string;
  validationResult: UrlValidationResult;
  expiresAt: number;
}

// プレビューシステム統合
interface StableAssetProvider {
  getAssetUrl: (assetId: string) => string | undefined;
  preloadAssets: (assetIds: string[]) => Promise<void>;
  clearCache: () => void;
}
```

### システム統合型定義

```typescript
// エディタ・プレビュー共通インターフェース
interface AssetValidationHook {
  validateAndRegenerateUrl: (asset: Asset) => Promise<Asset>;
  validatedAssets: Map<string, Asset>;
  clearValidationCache: () => void;
}

// 参照カウント管理
interface AssetReferenceManager {
  addReference: (projectId: string, assetId: string) => void;
  removeReference: (projectId: string, assetId: string) => void;
  getReferenceCount: (projectId: string, assetId: string) => number;
  getUnreferencedAssets: (projectId: string) => string[];
}

// メモリ効率化統計
interface MemoryEfficiencyMetrics {
  objectUrlCount: number;
  totalMemoryUsage: number;
  cacheHitRate: number;
  averageUrlLifetime: number;
  gcEvents: number;
}
```