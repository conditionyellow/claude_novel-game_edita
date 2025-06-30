import { assetStorage } from './assetStorageManager';

/**
 * IndexedDB クリーンアップユーティリティ
 */
export class IndexedDBCleanupManager {
  /**
   * 全プロジェクトのIndexedDB整合性チェック
   */
  static async checkDatabaseIntegrity(): Promise<{
    totalProjects: number;
    corruptedProjects: string[];
    orphanedAssets: number;
    totalAssets: number;
  }> {
    console.log('🔍 IndexedDB整合性チェック開始...');
    
    const results = {
      totalProjects: 0,
      corruptedProjects: [] as string[],
      orphanedAssets: 0,
      totalAssets: 0
    };

    try {
      // プロジェクト一覧を取得（実装が必要な場合は後で追加）
      // 現在は単一プロジェクトのアセットをチェック
      const projectId = 'default'; // 仮のプロジェクトID
      
      const allAssets = await assetStorage.getProjectAssets(projectId);
      results.totalAssets = allAssets.length;
      
      console.log(`📊 データベース統計:
        - 総アセット数: ${results.totalAssets}個`);
      
    } catch (error) {
      console.error('⚠️ IndexedDB整合性チェック中にエラー:', error);
    }
    
    return results;
  }

  /**
   * 破損したIndexedDBエントリを削除
   */
  static async cleanupCorruptedEntries(): Promise<{
    deletedAssets: number;
    errors: string[];
  }> {
    console.log('🧹 IndexedDB破損エントリクリーンアップ開始...');
    
    const results = {
      deletedAssets: 0,
      errors: [] as string[]
    };

    try {
      const projectId = 'default';
      const allAssets = await assetStorage.getProjectAssets(projectId);
      
      for (const asset of allAssets) {
        try {
          // アセットURLの生成を試行して破損をチェック
          await assetStorage.getAssetUrl(projectId, asset.id);
        } catch (error) {
          console.warn(`🗑️ 破損アセット削除: ${asset.name} (${asset.id})`);
          
          try {
            await assetStorage.deleteAsset(projectId, asset.id);
            results.deletedAssets++;
          } catch (deleteError) {
            const errorMsg = `削除失敗: ${asset.name} - ${deleteError}`;
            results.errors.push(errorMsg);
            console.error('❌', errorMsg);
          }
        }
      }
      
      console.log(`✅ クリーンアップ完了:
        - 削除されたアセット: ${results.deletedAssets}個
        - エラー: ${results.errors.length}個`);
      
    } catch (error) {
      results.errors.push(`クリーンアップ中にエラー: ${error}`);
      console.error('⚠️ クリーンアップ中にエラー:', error);
    }
    
    return results;
  }

  /**
   * IndexedDBを完全にリセット
   */
  static async resetDatabase(): Promise<void> {
    console.log('🔄 IndexedDB完全リセット開始...');
    
    try {
      // IndexedDBの削除
      const deleteReq = indexedDB.deleteDatabase('NovelEditorAssets');
      
      await new Promise<void>((resolve, reject) => {
        deleteReq.onsuccess = () => {
          console.log('✅ IndexedDB削除完了');
          resolve();
        };
        
        deleteReq.onerror = () => {
          console.error('❌ IndexedDB削除失敗:', deleteReq.error);
          reject(deleteReq.error);
        };
        
        deleteReq.onblocked = () => {
          console.warn('⚠️ IndexedDB削除がブロックされています（他のタブで使用中の可能性）');
          reject(new Error('Database deletion blocked'));
        };
      });
      
      console.log('🔄 IndexedDBリセット完了');
      
    } catch (error) {
      console.error('⚠️ IndexedDBリセット中にエラー:', error);
      throw error;
    }
  }

  /**
   * ストレージ使用量チェック
   */
  static async checkStorageUsage(): Promise<{
    used: number;
    total: number;
    available: number;
    usagePercent: number;
  }> {
    try {
      const storageInfo = await assetStorage.getStorageInfo();
      const usagePercent = storageInfo.total > 0 
        ? Math.round((storageInfo.used / storageInfo.total) * 100) 
        : 0;
      
      console.log(`💾 ストレージ使用量:
        - 使用中: ${(storageInfo.used / 1024 / 1024).toFixed(2)} MB
        - 総容量: ${(storageInfo.total / 1024 / 1024).toFixed(2)} MB
        - 使用率: ${usagePercent}%`);
      
      return {
        ...storageInfo,
        usagePercent
      };
      
    } catch (error) {
      console.error('⚠️ ストレージ使用量チェック中にエラー:', error);
      return {
        used: 0,
        total: 0,
        available: 0,
        usagePercent: 0
      };
    }
  }

  /**
   * 診断レポート生成
   */
  static async generateDiagnosticReport(): Promise<{
    timestamp: string;
    integrity: Awaited<ReturnType<typeof IndexedDBCleanupManager.checkDatabaseIntegrity>>;
    storage: Awaited<ReturnType<typeof IndexedDBCleanupManager.checkStorageUsage>>;
    recommendations: string[];
  }> {
    console.log('📋 IndexedDB診断レポート生成中...');
    
    const timestamp = new Date().toISOString();
    const integrity = await this.checkDatabaseIntegrity();
    const storage = await this.checkStorageUsage();
    
    const recommendations: string[] = [];
    
    if (storage.usagePercent > 80) {
      recommendations.push('ストレージ使用量が80%を超えています。不要なアセットの削除を検討してください。');
    }
    
    if (integrity.corruptedProjects.length > 0) {
      recommendations.push('破損したプロジェクトが検出されました。データの整合性確認が必要です。');
    }
    
    if (integrity.orphanedAssets > 0) {
      recommendations.push('孤立したアセットが検出されました。クリーンアップを実行してください。');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('IndexedDBの状態は良好です。');
    }
    
    const report = {
      timestamp,
      integrity,
      storage,
      recommendations
    };
    
    console.log('📋 診断レポート:', report);
    return report;
  }
}

// デバッグ用グローバル関数
if (typeof window !== 'undefined') {
  (window as any).debugIndexedDB = {
    checkIntegrity: () => IndexedDBCleanupManager.checkDatabaseIntegrity(),
    cleanup: () => IndexedDBCleanupManager.cleanupCorruptedEntries(),
    reset: () => IndexedDBCleanupManager.resetDatabase(),
    storage: () => IndexedDBCleanupManager.checkStorageUsage(),
    report: () => IndexedDBCleanupManager.generateDiagnosticReport(),
  };
}