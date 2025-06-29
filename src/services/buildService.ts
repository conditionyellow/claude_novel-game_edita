/**
 * ゲームビルドサービス
 * プロジェクトからゲームファイルを生成・エクスポートする機能
 */

import type { NovelProject, BuildResult, BuildConfig, OperationResult } from '../types';
import { GameBuilder } from '../runtime/GameBuilder';

export class BuildService {
  private static instance: BuildService;

  static getInstance(): BuildService {
    if (!BuildService.instance) {
      BuildService.instance = new BuildService();
    }
    return BuildService.instance;
  }

  private constructor() {}

  /**
   * ゲームをビルドしてZIPファイルとしてダウンロード
   */
  async buildGame(project: NovelProject, config?: Partial<BuildConfig>): Promise<BuildResult> {
    const startTime = Date.now();
    
    try {
      // ビルド設定のデフォルト値
      const buildConfig: BuildConfig = {
        outputFormat: 'zip',
        includeAssets: true,
        optimizeAssets: false,
        generateThumbnails: false,
        compressionLevel: 6,
        targetPlatform: 'web',
        ...config,
      };

      console.log('ビルド開始:', {
        project: project.title,
        paragraphs: project.paragraphs.length,
        assets: project.assets.length,
        config: buildConfig,
      });

      // GameBuilderでビルド実行
      const builder = new GameBuilder(project);
      const gameArchive = await builder.buildGame();

      // ファイル名生成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `${project.title}_game_${timestamp}.zip`;

      // ダウンロード処理
      const outputPath = await this.downloadFile(gameArchive, fileName);

      const buildTime = Date.now() - startTime;
      const fileSize = gameArchive.size;

      const result: BuildResult = {
        success: true,
        outputPath,
        fileSize,
        buildTime,
        warnings: [],
        errors: [],
      };

      console.log('ビルド完了:', result);
      return result;

    } catch (error) {
      const buildTime = Date.now() - startTime;
      
      const result: BuildResult = {
        success: false,
        buildTime,
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };

      console.error('ビルド失敗:', result);
      return result;
    }
  }

  /**
   * プロジェクトをJSONファイルとして保存
   */
  async saveProject(project: NovelProject): Promise<OperationResult<string>> {
    try {
      const projectData = JSON.stringify(project, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `${project.title}_${timestamp}.json`;
      
      const blob = new Blob([projectData], { type: 'application/json' });
      const outputPath = await this.downloadFile(blob, fileName);

      return {
        success: true,
        data: outputPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * ファイルをダウンロード
   */
  private async downloadFile(blob: Blob, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // クリーンアップ
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        resolve(fileName);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ビルド前のプロジェクト検証
   */
  validateProject(project: NovelProject): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本検証
    if (!project.title.trim()) {
      errors.push('プロジェクトタイトルが設定されていません');
    }

    if (project.paragraphs.length === 0) {
      errors.push('パラグラフが作成されていません');
    }

    // パラグラフ検証
    const startParagraphs = project.paragraphs.filter(p => p.type === 'start');
    if (startParagraphs.length === 0) {
      errors.push('スタートパラグラフが設定されていません');
    } else if (startParagraphs.length > 1) {
      warnings.push('スタートパラグラフが複数設定されています');
    }

    const endParagraphs = project.paragraphs.filter(p => p.type === 'end');
    if (endParagraphs.length === 0) {
      warnings.push('エンドパラグラフが設定されていません');
    }

    // 選択肢の検証
    project.paragraphs.forEach(paragraph => {
      if (paragraph.type !== 'end' && paragraph.content.choices.length === 0) {
        warnings.push(`パラグラフ "${paragraph.title}" に選択肢がありません`);
      }

      paragraph.content.choices.forEach(choice => {
        if (!choice.targetParagraphId) {
          errors.push(`パラグラフ "${paragraph.title}" の選択肢 "${choice.text}" に接続先が設定されていません`);
        } else {
          const targetExists = project.paragraphs.some(p => p.id === choice.targetParagraphId);
          if (!targetExists) {
            errors.push(`パラグラフ "${paragraph.title}" の選択肢 "${choice.text}" の接続先が存在しません`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// シングルトンインスタンスをエクスポート
export const buildService = BuildService.getInstance();