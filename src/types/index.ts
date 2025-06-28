export interface Asset {
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

export interface Character {
  id: string;
  name: string;
  sprite: Asset;
  position: 'left' | 'center' | 'right';
  expression?: string;
}

export interface Choice {
  id: string;
  text: string;
  targetParagraphId: string;
  condition?: Condition;
}

export interface Condition {
  type: 'flag' | 'variable';
  key: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export type ParagraphType = 'start' | 'middle' | 'end';

export interface Paragraph {
  id: string;
  type: ParagraphType;
  title: string;
  content: {
    text: string;
    choices: Choice[];
    background?: Asset;
    characters?: Character[];
    bgm?: Asset;
  };
  position?: { x: number; y: number };
  metadata: {
    created: Date;
    modified: Date;
    tags?: string[];
  };
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ProjectSettings {
  defaultFont: string;
  defaultFontSize: number;
  themeColors: ThemeColors;
  resolution: { width: number; height: number };
}

export interface NovelProject {
  id: string;
  title: string;
  description: string;
  version: string;
  paragraphs: Paragraph[];
  assets: Asset[];
  characters: Character[];
  settings: ProjectSettings;
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
}

export interface EditorState {
  currentProject: NovelProject | null;
  selectedParagraphId: string | null;
  mode: 'editor' | 'flow' | 'preview' | 'assets';
  isModified: boolean;
}

// React Flow統合用の型定義
export interface ParagraphNodeData {
  paragraph: Paragraph;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface ChoiceEdgeData {
  choice?: Choice;
  condition?: Condition;
  onDelete?: (edgeId: string) => void;
}

export interface FlowState {
  selectedNodeId: string | null;
}

// アセット管理用の型定義
export interface AssetUploadOptions {
  category: Asset['category'];
  maxSize?: number;
  allowedFormats?: string[];
  autoOptimize?: boolean;
}

export interface AssetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  optimizedSize?: number;
}

export interface AssetLibraryFilter {
  type?: Asset['type'];
  category?: Asset['category'];
  searchTerm?: string;
  sortBy?: 'name' | 'uploadedAt' | 'lastUsed' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface AssetManagerState {
  assets: Asset[];
  isUploading: boolean;
  uploadProgress: number;
  selectedAssets: string[];
  filter: AssetLibraryFilter;
  previewAsset: Asset | null;
}