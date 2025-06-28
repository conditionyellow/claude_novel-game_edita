import { Asset } from '../types';

/**
 * アセットストレージの抽象化インターフェース
 * 将来的なCDN移行を見据えた設計
 */
export interface AssetStorage {
  // アセット保存
  saveAsset(projectId: string, asset: Asset, file: File): Promise<string>; // 保存されたURLを返す
  
  // アセット読み込み
  getAsset(projectId: string, assetId: string): Promise<Asset | null>;
  
  // アセット削除
  deleteAsset(projectId: string, assetId: string): Promise<void>;
  
  // プロジェクトの全アセット取得
  getProjectAssets(projectId: string): Promise<Asset[]>;
  
  // プロジェクト削除（アセット含む）
  deleteProject(projectId: string): Promise<void>;
  
  // アセットURL生成（アクセス用）
  getAssetUrl(projectId: string, assetId: string): Promise<string>;
  
  // ストレージ使用量取得
  getStorageInfo(): Promise<{
    used: number;
    total: number;
    available: number;
  }>;
}

/**
 * アセット保存パス生成ユーティリティ
 */
export class AssetPathUtil {
  static generateAssetPath(projectId: string, category: Asset['category'], fileName: string): string {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `projects/${projectId}/assets/${category}/${sanitizedFileName}`;
  }
  
  static parseAssetPath(path: string): {
    projectId: string;
    category: string;
    fileName: string;
  } | null {
    const match = path.match(/^projects\/([^\/]+)\/assets\/([^\/]+)\/(.+)$/);
    if (!match) return null;
    
    return {
      projectId: match[1],
      category: match[2],
      fileName: match[3]
    };
  }
  
  static generateProjectPath(projectId: string): string {
    return `projects/${projectId}`;
  }
}

/**
 * アセットメタデータ（IndexedDB保存用）
 */
export interface AssetMetadata extends Asset {
  projectId: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CDN設定（将来実装用）
 */
export interface CDNConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKey?: string;
  secretKey?: string;
  publicUrl: string;
}

/**
 * ストレージ設定
 */
export interface StorageConfig {
  type: 'indexeddb' | 'cdn' | 'hybrid';
  indexeddb?: {
    dbName: string;
    version: number;
    maxSize: number; // MB
  };
  cdn?: CDNConfig;
}

/**
 * デフォルト設定
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  type: 'indexeddb',
  indexeddb: {
    dbName: 'novel-editor-assets',
    version: 1,
    maxSize: 500 // 500MB
  }
};