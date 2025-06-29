/**
 * エディター関連の型定義
 * エディターの状態管理、UI状態、フロー編集に関する型
 */

import type { NovelProject } from './project';
import type { Paragraph, Choice, Condition } from './story';

export type EditorMode = 'editor' | 'flow' | 'preview' | 'assets';

export interface EditorState {
  currentProject: NovelProject | null;
  selectedParagraphId: string | null;
  mode: EditorMode;
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

// エディター操作用の型
export interface ParagraphUpdatePayload {
  title?: string;
  type?: Paragraph['type'];
  content?: Partial<Paragraph['content']>;
  position?: Paragraph['position'];
}

export interface ChoiceUpdatePayload {
  text?: string;
  targetParagraphId?: string;
  condition?: Condition;
}

// UI状態管理
export interface UIState {
  sidebarCollapsed: boolean;
  headerCollapsed: boolean;
  showDebugInfo: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// 操作履歴用の型
export interface EditorAction {
  type: 'CREATE_PARAGRAPH' | 'UPDATE_PARAGRAPH' | 'DELETE_PARAGRAPH' | 
        'CREATE_CHOICE' | 'UPDATE_CHOICE' | 'DELETE_CHOICE' |
        'ADD_ASSET' | 'DELETE_ASSET' | 'UPDATE_PROJECT';
  payload: any;
  timestamp: Date;
  reversible: boolean;
}

export interface EditorHistory {
  past: EditorAction[];
  present: EditorState;
  future: EditorAction[];
  maxHistorySize: number;
}

// バリデーション用の型
export interface EditorValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  paragraphId?: string;
  choiceId?: string;
  severity: 'low' | 'medium' | 'high';
}