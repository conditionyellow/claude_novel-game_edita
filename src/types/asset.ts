/**
 * アセット関連の型定義
 * 画像・音声ファイルの管理、メタデータ、アップロード処理に関する型
 */

export interface Asset {
  id: string;
  name: string;
  url: string;
  category: 'background' | 'character' | 'bgm' | 'se' | 'other';
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  size: number;
  format: string;
  duration?: number;
  dimensions?: AssetDimensions;
  uploadedAt: Date;
  lastUsed?: Date;
}

export interface AssetDimensions {
  width: number;
  height: number;
}

export interface AssetUploadOptions {
  category: Asset['category'];
  maxSize?: number;
  allowedFormats?: string[];
  autoOptimize?: boolean;
}

export interface AssetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  optimizedSize?: number;
}

export interface AssetLibraryFilter {
  category?: Asset['category'];
  searchTerm?: string;
  sortBy?: 'name' | 'uploadedAt' | 'lastUsed' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface AssetManagerState {
  assets: Asset[];
  isUploading: boolean;
  uploadProgress: number;
  selectedAssets: string[];
  filter: AssetLibraryFilter;
  previewAsset: Asset | null;
}

export type AssetCategory = Asset['category'];
export type AssetSortField = AssetLibraryFilter['sortBy'];
export type SortOrder = AssetLibraryFilter['sortOrder'];

// Helper function to determine if asset is image or audio based on category
export const isImageAsset = (category: AssetCategory): boolean => {
  return ['background', 'character', 'other'].includes(category);
};

export const isAudioAsset = (category: AssetCategory): boolean => {
  return ['bgm', 'se'].includes(category);
};