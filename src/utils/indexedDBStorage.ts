import { Asset } from '../types';
import { 
  AssetStorage, 
  AssetMetadata, 
  AssetPathUtil, 
  StorageConfig,
  DEFAULT_STORAGE_CONFIG 
} from './assetStorage';

/**
 * IndexedDBベースのアセットストレージ実装
 */
export class IndexedDBAssetStorage implements AssetStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  
  constructor(config: StorageConfig = DEFAULT_STORAGE_CONFIG) {
    this.config = config;
  }
  
  /**
   * データベース初期化
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.config.indexeddb!.dbName, 
        this.config.indexeddb!.version
      );
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // アセットメタデータストア
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('projectId', 'projectId', { unique: false });
          assetStore.createIndex('category', 'category', { unique: false });
          assetStore.createIndex('filePath', 'filePath', { unique: true });
        }
        
        // ファイルデータストア
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'path' });
          fileStore.createIndex('projectId', 'projectId', { unique: false });
        }
        
        // プロジェクト情報ストア
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * アセット保存
   */
  async saveAsset(projectId: string, asset: Asset, file: File): Promise<string> {
    const db = await this.initDB();
    
    const filePath = AssetPathUtil.generateAssetPath(
      projectId, 
      asset.category, 
      asset.name
    );

    // 既存のファイルがあるかチェック
    const existingFile = await this.checkExistingFile(db, filePath);
    if (existingFile) {
      // 既存のファイルとメタデータを削除（ログは開発時のみ）
      await this.deleteExistingFile(db, filePath);
      await this.deleteExistingAssetMetadata(db, asset.id);
    }
    
    const metadata: AssetMetadata = {
      ...asset,
      projectId,
      filePath,
      fileSize: file.size,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const fileData = {
      path: filePath,
      projectId,
      data: file, // Blobとして保存
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets', 'files'], 'readwrite');
      
      transaction.oncomplete = () => {
        // オブジェクトURLを生成して返す
        const url = URL.createObjectURL(file);
        resolve(url);
      };
      
      transaction.onerror = (event) => {
        if (transaction.error?.name === 'ConstraintError') {
          reject(new Error(`ファイル名が重複しています: ${asset.name}`));
        } else {
          reject(transaction.error);
        }
      };
      
      // メタデータ保存
      const assetRequest = transaction.objectStore('assets').put(metadata);
      assetRequest.onerror = () => reject(assetRequest.error);
      
      // ファイルデータ保存
      const fileRequest = transaction.objectStore('files').put(fileData);
      fileRequest.onerror = () => reject(fileRequest.error);
    });
  }
  
  /**
   * アセット取得
   */
  async getAsset(projectId: string, assetId: string): Promise<Asset | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets'], 'readonly');
      const request = transaction.objectStore('assets').get(assetId);
      
      request.onsuccess = () => {
        const result = request.result as AssetMetadata | undefined;
        if (result && result.projectId === projectId) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * アセット削除
   */
  async deleteAsset(projectId: string, assetId: string): Promise<void> {
    const db = await this.initDB();
    const asset = await this.getAsset(projectId, assetId);
    
    if (!asset) return;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets', 'files'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      // メタデータ削除
      const assetRequest = transaction.objectStore('assets').delete(assetId);
      assetRequest.onerror = () => reject(assetRequest.error);
      
      // ファイルデータ削除
      const fileRequest = transaction.objectStore('files').delete((asset as AssetMetadata).filePath);
      fileRequest.onerror = () => reject(fileRequest.error);
    });
  }
  
  /**
   * プロジェクトの全アセット取得
   */
  async getProjectAssets(projectId: string): Promise<Asset[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets'], 'readonly');
      const index = transaction.objectStore('assets').index('projectId');
      const request = index.getAll(projectId);
      
      request.onsuccess = () => {
        resolve(request.result as Asset[]);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 既存ファイルの存在チェック
   */
  private async checkExistingFile(db: IDBDatabase, filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const request = transaction.objectStore('files').get(filePath);
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 既存ファイルの削除
   */
  private async deleteExistingFile(db: IDBDatabase, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readwrite');
      const request = transaction.objectStore('files').delete(filePath);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 既存アセットメタデータの削除
   */
  private async deleteExistingAssetMetadata(db: IDBDatabase, assetId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets'], 'readwrite');
      const request = transaction.objectStore('assets').delete(assetId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * プロジェクト削除
   */
  async deleteProject(projectId: string): Promise<void> {
    const db = await this.initDB();
    const assets = await this.getProjectAssets(projectId);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets', 'files', 'projects'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      // プロジェクト情報削除
      const projectRequest = transaction.objectStore('projects').delete(projectId);
      projectRequest.onerror = () => reject(projectRequest.error);
      
      // 各アセットを削除
      assets.forEach(asset => {
        const assetRequest = transaction.objectStore('assets').delete(asset.id);
        assetRequest.onerror = () => reject(assetRequest.error);
        
        const filePath = AssetPathUtil.generateAssetPath(projectId, asset.category, asset.name);
        const fileRequest = transaction.objectStore('files').delete(filePath);
        fileRequest.onerror = () => reject(fileRequest.error);
      });
    });
  }
  
  /**
   * アセットURL生成
   */
  async getAssetUrl(projectId: string, assetId: string): Promise<string> {
    const db = await this.initDB();
    const asset = await this.getAsset(projectId, assetId);
    
    if (!asset) {
      console.warn(`Asset not found in IndexedDB: ${assetId}`);
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const filePath = (asset as AssetMetadata).filePath;
      const request = transaction.objectStore('files').get(filePath);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          const url = URL.createObjectURL(result.data);
          resolve(url);
        } else {
          console.warn(`File data not found for asset: ${assetId}, path: ${filePath}`);
          reject(new Error(`File data not found for asset: ${assetId}`));
        }
      };
      
      request.onerror = () => {
        console.error(`Failed to get file data for asset: ${assetId}`, request.error);
        reject(request.error);
      };
    });
  }
  
  /**
   * ストレージ使用量取得
   */
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const available = total - used;
      
      return { used, total, available };
    }
    
    // フォールバック（概算）
    const maxSize = this.config.indexeddb!.maxSize * 1024 * 1024; // MB to bytes
    return {
      used: 0,
      total: maxSize,
      available: maxSize
    };
  }

  /**
   * ビルド用：アセットBlobを取得
   */
  async getAssetBlob(assetId: string): Promise<Blob | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['assets', 'files'], 'readonly');
      const assetRequest = transaction.objectStore('assets').get(assetId);
      
      assetRequest.onsuccess = () => {
        const asset = assetRequest.result as AssetMetadata | undefined;
        if (!asset) {
          resolve(null);
          return;
        }
        
        const fileRequest = transaction.objectStore('files').get(asset.filePath);
        fileRequest.onsuccess = () => {
          const result = fileRequest.result;
          if (result && result.data) {
            resolve(result.data as Blob);
          } else {
            resolve(null);
          }
        };
        
        fileRequest.onerror = () => reject(fileRequest.error);
      };
      
      assetRequest.onerror = () => reject(assetRequest.error);
    });
  }
}