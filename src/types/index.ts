export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio';
  metadata: {
    size: number;
    format: string;
    duration?: number;
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
  mode: 'editor' | 'flow' | 'preview';
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