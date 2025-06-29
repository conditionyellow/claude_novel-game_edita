/**
 * プロジェクト関連の型定義
 * ノベルプロジェクト全体の構造、設定、メタデータに関する型
 */

import type { Asset } from './asset';
import type { Character, Paragraph } from './story';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ProjectResolution {
  width: number;
  height: number;
}

export interface ProjectSettings {
  defaultFont: string;
  defaultFontSize: number;
  themeColors: ThemeColors;
  resolution: ProjectResolution;
}

export interface ProjectMetadata {
  created: Date;
  modified: Date;
  author: string;
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
  metadata: ProjectMetadata;
}

// プロジェクト操作用の型
export interface ProjectCreateOptions {
  title?: string;
  description?: string;
  author?: string;
  settings?: Partial<ProjectSettings>;
}

export interface ProjectUpdatePayload {
  title?: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// プロジェクトの統計情報
export interface ProjectStatistics {
  paragraphCount: number;
  assetCount: number;
  characterCount: number;
  totalTextLength: number;
  averageChoicesPerParagraph: number;
  assetsSizeTotal: number;
}