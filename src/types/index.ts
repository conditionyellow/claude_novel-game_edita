/**
 * 型定義の統合エクスポート
 * 全ての型定義を一箇所から利用できるように re-export
 */

// アセット関連
export type {
  Asset,
  AssetMetadata,
  AssetDimensions,
  AssetUploadOptions,
  AssetValidationResult,
  AssetLibraryFilter,
  AssetManagerState,
  AssetCategory,
  AssetSortField,
  SortOrder,
} from './asset';

// アセット関連ユーティリティ関数
export { isImageAsset, isAudioAsset } from './asset';

// ストーリー関連
export type {
  Character,
  Choice,
  Condition,
  ParagraphType,
  ParagraphContent,
  ParagraphMetadata,
  ParagraphPosition,
  Paragraph,
  CharacterPosition,
  ConditionOperator,
  ConditionType,
} from './story';

// プロジェクト関連
export type {
  ThemeColors,
  ProjectResolution,
  TitleScreenSettings,
  ProjectSettings,
  ProjectMetadata,
  NovelProject,
  ProjectCreateOptions,
  ProjectUpdatePayload,
  ProjectValidationResult,
  ProjectStatistics,
} from './project';

// エディター関連
export type {
  EditorMode,
  EditorState,
  ParagraphNodeData,
  ChoiceEdgeData,
  FlowState,
  ParagraphUpdatePayload,
  ChoiceUpdatePayload,
  UIState,
  EditorAction,
  EditorHistory,
  EditorValidationError,
} from './editor';

// ゲーム実行時関連
export type {
  GameState,
  SaveData,
  GameConfig,
  GameHistory,
  GameStats,
  BuildConfig,
  BuildResult,
  AssetManifest,
  DebugInfo,
} from './game';

// 共通ユーティリティ型
export type ID = string;
export type Timestamp = Date;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 一般的な操作結果型
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// 非同期操作の状態
export interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}