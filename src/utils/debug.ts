/**
 * デバッグユーティリティ
 * 開発時のログ出力とデバッグ情報管理
 */

import type { NovelProject, Paragraph, Asset, DebugInfo } from '../types';
import { MemoryManager } from './memoryManager';

export class DebugLogger {
  private static isDebugMode = process.env.NODE_ENV === 'development';

  /**
   * デバッグログの出力
   */
  static log(message: string, data?: any): void {
    if (this.isDebugMode) {
      console.log(`[Debug] ${message}`, data || '');
    }
  }

  /**
   * 警告ログの出力
   */
  static warn(message: string, data?: any): void {
    if (this.isDebugMode) {
      console.warn(`[Debug] ${message}`, data || '');
    }
  }

  /**
   * エラーログの出力
   */
  static error(message: string, error?: Error | any): void {
    console.error(`[Debug] ${message}`, error || '');
  }

  /**
   * パフォーマンス計測
   */
  static time(label: string): void {
    if (this.isDebugMode) {
      console.time(`[Debug] ${label}`);
    }
  }

  static timeEnd(label: string): void {
    if (this.isDebugMode) {
      console.timeEnd(`[Debug] ${label}`);
    }
  }

  /**
   * プロジェクト状態の詳細ログ
   */
  static logProjectState(project: NovelProject | null): void {
    if (!this.isDebugMode || !project) return;

    console.group('[Debug] Project State');
    console.log('Title:', project.title);
    console.log('Paragraphs:', project.paragraphs.length);
    console.log('Assets:', project.assets.length);
    console.log('Characters:', project.characters.length);
    
    // パラグラフの統計
    const paragraphStats = {
      start: project.paragraphs.filter(p => p.type === 'start').length,
      middle: project.paragraphs.filter(p => p.type === 'middle').length,
      end: project.paragraphs.filter(p => p.type === 'end').length,
    };
    console.log('Paragraph Types:', paragraphStats);

    // アセットの統計
    const assetStats = {
      images: project.assets.filter(a => a.type === 'image').length,
      audio: project.assets.filter(a => a.type === 'audio').length,
      totalSize: Math.round(
        project.assets.reduce((sum, a) => sum + a.metadata.size, 0) / 1024 / 1024
      ),
    };
    console.log('Asset Stats:', assetStats);

    console.groupEnd();
  }

  /**
   * パラグラフ接続の可視化
   */
  static logParagraphConnections(paragraphs: Paragraph[]): void {
    if (!this.isDebugMode) return;

    console.group('[Debug] Paragraph Connections');
    
    paragraphs.forEach(paragraph => {
      const connections = paragraph.content.choices.map(choice => ({
        text: choice.text,
        target: choice.targetParagraphId,
        targetTitle: paragraphs.find(p => p.id === choice.targetParagraphId)?.title || 'Unknown',
      }));

      console.log(`${paragraph.title} (${paragraph.type}):`, connections);
    });

    console.groupEnd();
  }

  /**
   * アセット使用状況の可視化
   */
  static logAssetUsage(project: NovelProject): void {
    if (!this.isDebugMode) return;

    console.group('[Debug] Asset Usage');

    const usedAssets = new Set<string>();
    
    project.paragraphs.forEach(paragraph => {
      if (paragraph.content.background) {
        usedAssets.add(paragraph.content.background.id);
      }
      if (paragraph.content.bgm) {
        usedAssets.add(paragraph.content.bgm.id);
      }
      paragraph.content.characters?.forEach(char => {
        usedAssets.add(char.sprite.id);
      });
    });

    const unusedAssets = project.assets.filter(asset => !usedAssets.has(asset.id));

    console.log('Total Assets:', project.assets.length);
    console.log('Used Assets:', usedAssets.size);
    console.log('Unused Assets:', unusedAssets.length);
    
    if (unusedAssets.length > 0) {
      console.warn('Unused Assets:', unusedAssets.map(a => a.name));
    }

    console.groupEnd();
  }

  /**
   * メモリ使用状況のログ
   */
  static logMemoryUsage(): void {
    if (!this.isDebugMode) return;

    const memoryInfo = MemoryManager.getMemoryInfo();
    if (memoryInfo) {
      console.log('[Debug] Memory Usage:', {
        used: `${memoryInfo.usedJSHeapSize}MB`,
        total: `${memoryInfo.totalJSHeapSize}MB`,
        limit: `${memoryInfo.jsHeapSizeLimit}MB`,
        usage: `${((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1)}%`,
      });
    }
  }
}

/**
 * デバッグ情報の取得
 */
export function getDebugInfo(
  project: NovelProject | null,
  selectedParagraphId: string | null
): DebugInfo | null {
  if (!project) return null;

  const selectedParagraph = selectedParagraphId 
    ? project.paragraphs.find(p => p.id === selectedParagraphId)
    : null;

  if (!selectedParagraph) return null;

  const memoryInfo = MemoryManager.getMemoryInfo();

  return {
    currentParagraph: selectedParagraph,
    gameState: {
      currentParagraphId: selectedParagraph.id,
      visitedParagraphs: [selectedParagraph.id],
      playerFlags: {},
      playerVariables: {},
      gameStartTime: new Date(),
    },
    performanceMetrics: {
      renderTime: 0,
      memoryUsage: memoryInfo?.usedJSHeapSize || 0,
      assetLoadTime: 0,
    },
    validationErrors: [],
  };
}

/**
 * 開発者コンソールでのデバッグコマンド
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugNovelEditor = {
    log: DebugLogger.log,
    warn: DebugLogger.warn,
    error: DebugLogger.error,
    logProject: DebugLogger.logProjectState,
    logConnections: DebugLogger.logParagraphConnections,
    logAssets: DebugLogger.logAssetUsage,
    logMemory: DebugLogger.logMemoryUsage,
    getMemoryInfo: MemoryManager.getMemoryInfo,
    forceGC: MemoryManager.forceGarbageCollection,
    cleanup: MemoryManager.cleanup,
  };

  console.log(
    '%c[Novel Editor] Debug commands available:',
    'color: #3b82f6; font-weight: bold;',
    '\n• debugNovelEditor.logProject(project) - プロジェクト状態ログ',
    '\n• debugNovelEditor.logConnections(paragraphs) - パラグラフ接続ログ',
    '\n• debugNovelEditor.logAssets(project) - アセット使用状況ログ',
    '\n• debugNovelEditor.logMemory() - メモリ使用量ログ',
    '\n• debugNovelEditor.forceGC() - ガベージコレクション強制実行',
    '\n• debugNovelEditor.cleanup() - リソースクリーンアップ',
    '\n• debugIndexedDB.checkIntegrity() - IndexedDB整合性チェック',
    '\n• debugIndexedDB.cleanup() - IndexedDB破損データ削除',
    '\n• debugIndexedDB.reset() - IndexedDB完全リセット',
    '\n• debugIndexedDB.report() - IndexedDB診断レポート'
  );
}