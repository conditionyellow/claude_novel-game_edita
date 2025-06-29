/**
 * バリデーション機能
 * 統一されたデータ検証ロジック
 */

import type { 
  NovelProject, 
  Paragraph, 
  Asset, 
  ProjectValidationResult,
  EditorValidationError 
} from '../types';

export class ValidationService {
  /**
   * プロジェクト全体のバリデーション
   */
  static validateProject(project: NovelProject): ProjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 基本項目の検証
    if (!project.title.trim()) {
      errors.push('プロジェクトタイトルが設定されていません');
    }

    if (!project.description.trim()) {
      warnings.push('プロジェクトの説明が設定されていません');
    }

    if (!project.metadata.author.trim()) {
      warnings.push('作者名が設定されていません');
    }

    // パラグラフの検証
    const paragraphValidation = this.validateParagraphs(project.paragraphs);
    errors.push(...paragraphValidation.errors);
    warnings.push(...paragraphValidation.warnings);
    suggestions.push(...paragraphValidation.suggestions);

    // アセットの検証
    const assetValidation = this.validateAssets(project.assets);
    warnings.push(...assetValidation.warnings);
    suggestions.push(...assetValidation.suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * パラグラフ群のバリデーション
   */
  static validateParagraphs(paragraphs: Paragraph[]): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (paragraphs.length === 0) {
      errors.push('パラグラフが作成されていません');
      return { errors, warnings, suggestions };
    }

    // タイプ別カウント
    const startParagraphs = paragraphs.filter(p => p.type === 'start');
    const endParagraphs = paragraphs.filter(p => p.type === 'end');
    const middleParagraphs = paragraphs.filter(p => p.type === 'middle');

    // スタートパラグラフの検証
    if (startParagraphs.length === 0) {
      errors.push('スタートパラグラフが設定されていません');
    } else if (startParagraphs.length > 1) {
      warnings.push('スタートパラグラフが複数設定されています');
    }

    // エンドパラグラフの検証
    if (endParagraphs.length === 0) {
      warnings.push('エンドパラグラフが設定されていません');
    }

    // 各パラグラフの詳細検証
    paragraphs.forEach(paragraph => {
      const paragraphErrors = this.validateSingleParagraph(paragraph, paragraphs);
      errors.push(...paragraphErrors.errors);
      warnings.push(...paragraphErrors.warnings);
    });

    // 孤立パラグラフの検出
    const reachableParagraphIds = this.getReachableParagraphs(paragraphs);
    const orphanedParagraphs = paragraphs.filter(p => 
      p.type !== 'start' && !reachableParagraphIds.has(p.id)
    );

    if (orphanedParagraphs.length > 0) {
      warnings.push(`到達不可能なパラグラフがあります: ${orphanedParagraphs.map(p => p.title).join(', ')}`);
    }

    // 提案
    if (middleParagraphs.length > 10) {
      suggestions.push('パラグラフ数が多くなっています。章分けを検討してみてください');
    }

    if (paragraphs.some(p => p.content.text.length > 1000)) {
      suggestions.push('長いテキストのパラグラフがあります。分割を検討してみてください');
    }

    return { errors, warnings, suggestions };
  }

  /**
   * 単一パラグラフのバリデーション
   */
  static validateSingleParagraph(
    paragraph: Paragraph, 
    allParagraphs: Paragraph[]
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // タイトル検証
    if (!paragraph.title.trim()) {
      errors.push(`パラグラフ ID:${paragraph.id} にタイトルが設定されていません`);
    }

    // 本文検証
    if (!paragraph.content.text.trim()) {
      warnings.push(`パラグラフ "${paragraph.title}" に本文が設定されていません`);
    }

    // 選択肢検証
    if (paragraph.type !== 'end') {
      if (paragraph.content.choices.length === 0) {
        warnings.push(`パラグラフ "${paragraph.title}" に選択肢がありません`);
      }

      paragraph.content.choices.forEach(choice => {
        if (!choice.text.trim()) {
          errors.push(`パラグラフ "${paragraph.title}" に空の選択肢があります`);
        }

        if (!choice.targetParagraphId) {
          errors.push(`パラグラフ "${paragraph.title}" の選択肢 "${choice.text}" に接続先が設定されていません`);
        } else {
          const targetExists = allParagraphs.some(p => p.id === choice.targetParagraphId);
          if (!targetExists) {
            errors.push(`パラグラフ "${paragraph.title}" の選択肢 "${choice.text}" の接続先が存在しません`);
          }
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * アセット群のバリデーション
   */
  static validateAssets(assets: Asset[]): {
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (assets.length === 0) {
      suggestions.push('アセットが登録されていません。背景画像やBGMを追加してみてください');
      return { warnings, suggestions };
    }

    // ファイルサイズの警告
    const largeAssets = assets.filter(asset => asset.metadata.size > 5 * 1024 * 1024); // 5MB超
    if (largeAssets.length > 0) {
      warnings.push(`大きなファイルがあります: ${largeAssets.map(a => a.name).join(', ')}`);
    }

    // 未使用アセットの検出（簡易版）
    const totalSize = assets.reduce((sum, asset) => sum + asset.metadata.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB超
      suggestions.push('アセットの総容量が大きくなっています。不要なファイルがないか確認してください');
    }

    // カテゴリ別の提案
    const backgrounds = assets.filter(a => a.category === 'background');
    const bgms = assets.filter(a => a.category === 'bgm');

    if (backgrounds.length === 0) {
      suggestions.push('背景画像がありません。パラグラフの雰囲気を演出してみてください');
    }

    if (bgms.length === 0) {
      suggestions.push('BGMがありません。音楽でゲームの臨場感を高めてみてください');
    }

    return { warnings, suggestions };
  }

  /**
   * 到達可能なパラグラフIDを取得
   */
  private static getReachableParagraphs(paragraphs: Paragraph[]): Set<string> {
    const reachable = new Set<string>();
    const visited = new Set<string>();

    const startParagraphs = paragraphs.filter(p => p.type === 'start');
    
    const traverse = (paragraphId: string) => {
      if (visited.has(paragraphId)) return;
      visited.add(paragraphId);
      reachable.add(paragraphId);

      const paragraph = paragraphs.find(p => p.id === paragraphId);
      if (!paragraph) return;

      paragraph.content.choices.forEach(choice => {
        if (choice.targetParagraphId) {
          traverse(choice.targetParagraphId);
        }
      });
    };

    startParagraphs.forEach(p => traverse(p.id));
    
    return reachable;
  }

  /**
   * エディター用リアルタイムバリデーション
   */
  static validateForEditor(
    currentProject: NovelProject | null
  ): EditorValidationError[] {
    const errors: EditorValidationError[] = [];

    if (!currentProject) {
      return [{
        type: 'error',
        message: 'プロジェクトが読み込まれていません',
        severity: 'high',
      }];
    }

    const validation = this.validateProject(currentProject);

    // エラーを変換
    validation.errors.forEach(error => {
      errors.push({
        type: 'error',
        message: error,
        severity: 'high',
      });
    });

    validation.warnings.forEach(warning => {
      errors.push({
        type: 'warning',
        message: warning,
        severity: 'medium',
      });
    });

    return errors;
  }
}

// ユーティリティ関数
export const validateProject = ValidationService.validateProject;
export const validateParagraphs = ValidationService.validateParagraphs;
export const validateForEditor = ValidationService.validateForEditor;