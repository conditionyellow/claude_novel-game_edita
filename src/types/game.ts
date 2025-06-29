/**
 * ゲーム実行時の型定義
 * ランタイム、セーブデータ、プレイヤー状態に関する型
 */

import type { Paragraph } from './story';

export interface GameState {
  currentParagraphId: string;
  visitedParagraphs: string[];
  playerFlags: Record<string, boolean>;
  playerVariables: Record<string, number | string>;
  gameStartTime: Date;
  lastSaveTime?: Date;
}

export interface SaveData {
  id: string;
  slotNumber: number;
  gameState: GameState;
  timestamp: Date;
  screenshot?: string;
  playTime: number;
  description?: string;
}

export interface GameConfig {
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // ミリ秒
  maxSaveSlots: number;
  enableHistory: boolean;
  maxHistorySize: number;
  textSpeed: number; // 文字/秒
  autoAdvanceDelay: number; // ミリ秒
}

export interface GameHistory {
  paragraphs: Array<{
    paragraph: Paragraph;
    timestamp: Date;
    choiceSelected?: string;
  }>;
  maxSize: number;
}

export interface GameStats {
  totalPlayTime: number;
  paragraphsVisited: number;
  choicesMade: number;
  savesCreated: number;
  gamesCompleted: number;
  startDate: Date;
}

// ゲームビルド用の型
export interface BuildConfig {
  outputFormat: 'html' | 'zip' | 'app';
  includeAssets: boolean;
  optimizeAssets: boolean;
  generateThumbnails: boolean;
  compressionLevel: number;
  targetPlatform: 'web' | 'mobile' | 'desktop';
}

export interface BuildResult {
  success: boolean;
  outputPath?: string;
  fileSize?: number;
  buildTime: number;
  warnings: string[];
  errors: string[];
  assetManifest?: AssetManifest;
}

export interface AssetManifest {
  totalAssets: number;
  totalSize: number;
  assets: Array<{
    id: string;
    path: string;
    size: number;
    compressed: boolean;
  }>;
}

// プレビュー・デバッグ用の型
export interface DebugInfo {
  currentParagraph: Paragraph;
  gameState: GameState;
  performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
    assetLoadTime: number;
  };
  validationErrors: string[];
}