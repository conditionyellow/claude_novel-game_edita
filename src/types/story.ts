/**
 * ストーリー関連の型定義
 * パラグラフ、選択肢、条件分岐、キャラクターに関する型
 */

import type { Asset } from './asset';

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

export type ParagraphType = 'title' | 'start' | 'middle' | 'end';

export interface ParagraphContent {
  text: string;
  choices: Choice[];
  background?: Asset;
  characters?: Character[];
  bgm?: Asset;
  // タイトルパラグラフ専用設定
  titleImage?: Asset;
  titleColor?: string;
  titleFontSize?: number;
  showProjectTitle?: boolean;
}

export interface ParagraphMetadata {
  created: Date;
  modified: Date;
  tags?: string[];
}

export interface ParagraphPosition {
  x: number;
  y: number;
}

export interface Paragraph {
  id: string;
  type: ParagraphType;
  title: string;
  content: ParagraphContent;
  position?: ParagraphPosition;
  metadata: ParagraphMetadata;
}

// ヘルパー型定義
export type CharacterPosition = Character['position'];
export type ConditionOperator = Condition['operator'];
export type ConditionType = Condition['type'];