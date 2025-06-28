import { Asset } from '../types';
import { AssetStorage, StorageConfig, DEFAULT_STORAGE_CONFIG } from './assetStorage';
import { IndexedDBAssetStorage } from './indexedDBStorage';

/**
 * 将来のCDN実装プレースホルダー
 */
class CDNAssetStorage implements AssetStorage {
  async saveAsset(projectId: string, asset: Asset, file: File): Promise<string> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async getAsset(projectId: string, assetId: string): Promise<Asset | null> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async deleteAsset(projectId: string, assetId: string): Promise<void> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async getProjectAssets(projectId: string): Promise<Asset[]> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async deleteProject(projectId: string): Promise<void> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async getAssetUrl(projectId: string, assetId: string): Promise<string> {
    throw new Error('CDN storage not implemented yet');
  }
  
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    throw new Error('CDN storage not implemented yet');
  }
}

/**
 * アセットストレージマネージャー
 * 設定に基づいて適切なストレージ実装を提供
 */
export class AssetStorageManager {
  private static instance: AssetStorageManager | null = null;
  private storage: AssetStorage;
  private config: StorageConfig;
  
  private constructor(config: StorageConfig = DEFAULT_STORAGE_CONFIG) {
    this.config = config;
    this.storage = this.createStorage();
  }
  
  /**
   * シングルトンインスタンス取得
   */
  static getInstance(config?: StorageConfig): AssetStorageManager {
    if (!AssetStorageManager.instance) {
      AssetStorageManager.instance = new AssetStorageManager(config);
    }
    return AssetStorageManager.instance;
  }
  
  /**
   * 設定変更（ストレージタイプの切り替え）
   */
  static reconfigure(config: StorageConfig): AssetStorageManager {
    AssetStorageManager.instance = new AssetStorageManager(config);
    return AssetStorageManager.instance;
  }
  
  /**
   * ストレージ実装の作成
   */
  private createStorage(): AssetStorage {
    switch (this.config.type) {
      case 'indexeddb':
        return new IndexedDBAssetStorage(this.config);
      case 'cdn':
        return new CDNAssetStorage();
      case 'hybrid':
        // 将来実装: IndexedDB + CDN のハイブリッド
        return new IndexedDBAssetStorage(this.config);
      default:
        return new IndexedDBAssetStorage(this.config);
    }
  }
  
  /**
   * 現在のストレージ設定取得
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }
  
  /**
   * アセット保存
   */
  async saveAsset(projectId: string, asset: Asset, file: File): Promise<string> {
    try {
      return await this.storage.saveAsset(projectId, asset, file);
    } catch (error) {
      console.error('Failed to save asset:', error);
      throw new Error(`アセットの保存に失敗しました: ${asset.name}`);
    }
  }
  
  /**
   * アセット取得
   */
  async getAsset(projectId: string, assetId: string): Promise<Asset | null> {
    try {
      return await this.storage.getAsset(projectId, assetId);
    } catch (error) {
      console.error('Failed to get asset:', error);
      return null;
    }
  }
  
  /**
   * アセット削除
   */
  async deleteAsset(projectId: string, assetId: string): Promise<void> {
    try {
      await this.storage.deleteAsset(projectId, assetId);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw new Error('アセットの削除に失敗しました');
    }
  }
  
  /**
   * プロジェクトの全アセット取得
   */
  async getProjectAssets(projectId: string): Promise<Asset[]> {
    try {
      return await this.storage.getProjectAssets(projectId);
    } catch (error) {
      console.error('Failed to get project assets:', error);
      return [];
    }
  }
  
  /**
   * プロジェクト削除
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.storage.deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('プロジェクトの削除に失敗しました');
    }
  }
  
  /**
   * アセットURL取得
   */
  async getAssetUrl(projectId: string, assetId: string): Promise<string> {
    try {
      return await this.storage.getAssetUrl(projectId, assetId);
    } catch (error) {
      console.error('Failed to get asset URL:', error);
      throw new Error('アセットURLの取得に失敗しました');
    }
  }
  
  /**
   * ストレージ使用量取得
   */
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    try {
      return await this.storage.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, total: 0, available: 0 };
    }
  }
  
  /**
   * Base64 -> IndexedDB マイグレーション
   */
  async migrateFromBase64(projectId: string, assets: Asset[]): Promise<void> {
    console.log(`Migrating ${assets.length} assets from Base64 to IndexedDB...`);
    
    for (const asset of assets) {
      try {
        if (asset.url.startsWith('data:')) {
          // Base64データをBlobに変換
          const response = await fetch(asset.url);
          const blob = await response.blob();
          const file = new File([blob], asset.name, { type: asset.metadata.format });
          
          // IndexedDBに保存
          const newUrl = await this.saveAsset(projectId, asset, file);
          console.log(`Migrated asset: ${asset.name}`);
        }
      } catch (error) {
        console.error(`Failed to migrate asset ${asset.name}:`, error);
      }
    }
    
    console.log('Migration completed');
  }
  
  /**
   * CDN移行準備（将来実装）
   */
  async prepareCDNMigration(projectId: string): Promise<{
    assets: Asset[];
    totalSize: number;
    estimatedCost: number;
  }> {
    const assets = await this.getProjectAssets(projectId);
    const totalSize = assets.reduce((sum, asset) => sum + asset.metadata.size, 0);
    const estimatedCost = this.calculateCDNCost(totalSize);
    
    return {
      assets,
      totalSize,
      estimatedCost
    };
  }
  
  /**
   * CDNコスト計算（概算）
   */
  private calculateCDNCost(sizeInBytes: number): number {
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    const costPerGB = 0.023; // AWS S3概算 (USD)
    return sizeInGB * costPerGB;
  }
}

/**
 * グローバルインスタンス（便利関数）
 */
export const assetStorage = AssetStorageManager.getInstance();