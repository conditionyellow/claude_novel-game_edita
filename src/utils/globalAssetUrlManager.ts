/**
 * グローバルアセットURL管理システム
 * エディタとプレビューで共通のObjectURLを管理し、安定性を確保
 */

import { Asset } from '../types';
import { assetStorage } from './assetStorageManager';
import { isObjectUrlValid } from './assetUrlManager';

interface ManagedAsset {
  asset: Asset;
  url: string;
  lastAccessed: number;
  refCount: number;
}

export class GlobalAssetUrlManager {
  private static instance: GlobalAssetUrlManager | null = null;
  private urlCache = new Map<string, ManagedAsset>();
  private cleanupInterval: number | null = null;
  
  private constructor() {
    // 10分間隔でクリーンアップ
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupUnusedUrls();
    }, 10 * 60 * 1000);
  }

  static getInstance(): GlobalAssetUrlManager {
    if (!GlobalAssetUrlManager.instance) {
      GlobalAssetUrlManager.instance = new GlobalAssetUrlManager();
    }
    return GlobalAssetUrlManager.instance;
  }

  /**
   * アセットの安定したURLを取得
   */
  async getStableUrl(projectId: string, asset: Asset): Promise<string> {
    const cacheKey = `${projectId}:${asset.id}`;
    const cached = this.urlCache.get(cacheKey);
    
    // キャッシュされたURLが存在し、最近生成されたものは有効性チェックをスキップ
    if (cached) {
      const timeSinceCreated = Date.now() - cached.lastAccessed;
      const skipValidation = timeSinceCreated < 30000; // 30秒以内は検証スキップ
      
      if (skipValidation || await this.isUrlValid(cached.url)) {
        cached.lastAccessed = Date.now();
        cached.refCount++;
        console.log(`📋 安定URL取得（キャッシュ）: ${asset.name} - 参照回数: ${cached.refCount}${skipValidation ? ' (検証スキップ)' : ''}`);
        return cached.url;
      }
    }

    // 新しいURLを生成
    try {
      const newUrl = await assetStorage.getAssetUrl(projectId, asset.id);
      
      // 古いURLがあれば解放
      if (cached) {
        URL.revokeObjectURL(cached.url);
      }
      
      // 新しいURLをキャッシュ
      this.urlCache.set(cacheKey, {
        asset: { ...asset, url: newUrl },
        url: newUrl,
        lastAccessed: Date.now(),
        refCount: 1
      });
      
      console.log(`🔧 安定URL生成: ${asset.name} - ${newUrl.substring(0, 50)}...`);
      return newUrl;
    } catch (error) {
      console.error(`❌ 安定URL生成失敗: ${asset.name}`, error);
      
      // フォールバック: 元のURLを返す
      if (asset.url) {
        return asset.url;
      }
      
      throw error;
    }
  }

  /**
   * 複数アセットの安定URLを一括取得
   */
  async getStableUrls(projectId: string, assets: Asset[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    
    for (const asset of assets) {
      try {
        const url = await this.getStableUrl(projectId, asset);
        urlMap.set(asset.id, url);
      } catch (error) {
        console.warn(`⚠️ アセット${asset.name}のURL取得失敗:`, error);
      }
    }
    
    return urlMap;
  }

  /**
   * アセットの使用終了を通知（参照カウント減少）
   */
  releaseUrl(projectId: string, assetId: string): void {
    const cacheKey = `${projectId}:${assetId}`;
    const cached = this.urlCache.get(cacheKey);
    
    if (cached) {
      cached.refCount = Math.max(0, cached.refCount - 1);
      console.log(`📉 URL参照解放: ${cached.asset.name} - 残り参照: ${cached.refCount}`);
      
      // 参照カウントが0になってから5分後に削除
      if (cached.refCount === 0) {
        setTimeout(() => {
          const current = this.urlCache.get(cacheKey);
          if (current && current.refCount === 0) {
            URL.revokeObjectURL(current.url);
            this.urlCache.delete(cacheKey);
            console.log(`🗑️ 未使用URL削除: ${current.asset.name}`);
          }
        }, 5 * 60 * 1000);
      }
    }
  }

  /**
   * URLの有効性をチェック
   */
  private async isUrlValid(url: string): Promise<boolean> {
    if (!url.startsWith('blob:')) {
      return true; // Base64などは常に有効とみなす
    }
    
    try {
      // 軽量なHEADリクエストで確認（音声ファイル対応改善）
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      // HEADが失敗した場合は無効とみなす
      return false;
    }
  }

  /**
   * 古いURLのクリーンアップ
   */
  private cleanupUnusedUrls(): void {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 30 * 60 * 1000; // 30分
    
    let cleanedCount = 0;
    for (const [key, managed] of this.urlCache.entries()) {
      // 30分以上アクセスされていない且つ参照カウントが0
      if (now - managed.lastAccessed > CLEANUP_THRESHOLD && managed.refCount === 0) {
        URL.revokeObjectURL(managed.url);
        this.urlCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 クリーンアップ完了: ${cleanedCount}個のURLを削除`);
    }
  }

  /**
   * プロジェクト変更時のクリーンアップ
   */
  cleanupProject(projectId: string): void {
    let cleanedCount = 0;
    for (const [key, managed] of this.urlCache.entries()) {
      if (key.startsWith(`${projectId}:`)) {
        URL.revokeObjectURL(managed.url);
        this.urlCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🗑️ プロジェクト${projectId}のURL全削除: ${cleanedCount}個`);
    }
  }

  /**
   * 全URLクリーンアップ（アプリ終了時等）
   */
  cleanup(): void {
    for (const [key, managed] of this.urlCache.entries()) {
      URL.revokeObjectURL(managed.url);
    }
    this.urlCache.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log('🧹 全アセットURLクリーンアップ完了');
  }

  /**
   * 統計情報取得
   */
  getStats(): {
    totalCached: number;
    activeReferences: number;
    oldestAccess: number | null;
    newestAccess: number | null;
  } {
    let activeReferences = 0;
    let oldestAccess: number | null = null;
    let newestAccess: number | null = null;
    
    for (const managed of this.urlCache.values()) {
      if (managed.refCount > 0) {
        activeReferences += managed.refCount;
      }
      
      if (oldestAccess === null || managed.lastAccessed < oldestAccess) {
        oldestAccess = managed.lastAccessed;
      }
      
      if (newestAccess === null || managed.lastAccessed > newestAccess) {
        newestAccess = managed.lastAccessed;
      }
    }
    
    return {
      totalCached: this.urlCache.size,
      activeReferences,
      oldestAccess,
      newestAccess
    };
  }
}

// グローバルインスタンス
export const globalAssetUrlManager = GlobalAssetUrlManager.getInstance();

// ページアンロード時のクリーンアップ
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalAssetUrlManager.cleanup();
  });
}