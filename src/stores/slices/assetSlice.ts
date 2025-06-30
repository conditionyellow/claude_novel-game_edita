/**
 * アセット状態管理スライス
 * アセットの管理、IndexedDB連携機能
 */

import type { StateCreator } from 'zustand';
import type { Asset, AssetCategory } from '../../types';
import { assetStorage } from '../../utils/assetStorageManager';

export interface AssetSlice {
  // Asset Actions
  addAsset: (asset: Asset) => void;
  addAssetWithFile: (asset: Asset, file: File) => Promise<Asset>;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => Promise<void>;
  getAssetsByCategory: (category: AssetCategory) => Asset[];
  getAssetsByType: (type: 'image' | 'audio') => Asset[];
  loadProjectAssets: (projectId: string) => Promise<void>;
  getAssetUrl: (assetId: string) => Promise<string>;
}

// ProjectSliceの参照が必要な場合の型定義
interface ProjectDependency {
  currentProject: {
    id: string;
    assets: Asset[];
    paragraphs: Array<{
      id: string;
      content: {
        background?: Asset;
        bgm?: Asset;
        characters?: Array<{ sprite: Asset }>;
      };
    }>;
    metadata: {
      modified: Date;
    };
  } | null;
  isModified: boolean;
  markAsModified: () => void;
}

export const createAssetSlice: StateCreator<
  AssetSlice & ProjectDependency,
  [],
  [],
  AssetSlice
> = (set, get) => ({
  // Asset Actions
  addAsset: (asset: Asset) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAssets = [...currentProject.assets, asset];
    
    set({
      currentProject: {
        ...currentProject,
        assets: updatedAssets,
        metadata: {
          ...currentProject.metadata,
          modified: new Date(),
        },
      },
      isModified: true,
    });
  },

  addAssetWithFile: async (asset: Asset, file: File): Promise<Asset> => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No current project');

    try {
      // IndexedDBに保存
      const url = await assetStorage.saveAsset(currentProject.id, asset, file);
      
      // URLを更新したアセットを作成
      const savedAsset: Asset = {
        ...asset,
        url,
        metadata: {
          ...asset.metadata,
          lastUsed: new Date()
        }
      };

      // Stateに保存
      const updatedAssets = [...currentProject.assets, savedAsset];
      
      set({
        currentProject: {
          ...currentProject,
          assets: updatedAssets,
          metadata: {
            ...currentProject.metadata,
            modified: new Date(),
          },
        },
        isModified: true,
      });

      return savedAsset;
    } catch (error) {
      console.error('Failed to save asset:', error);
      throw error;
    }
  },

  updateAsset: (id: string, updates: Partial<Asset>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedAssets = currentProject.assets.map(asset =>
      asset.id === id
        ? {
            ...asset,
            ...updates,
            metadata: {
              ...asset.metadata,
              ...updates.metadata,
            },
          }
        : asset
    );

    set({
      currentProject: {
        ...currentProject,
        assets: updatedAssets,
        metadata: {
          ...currentProject.metadata,
          modified: new Date(),
        },
      },
      isModified: true,
    });
  },

  deleteAsset: async (id: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      // IndexedDBからも削除
      await assetStorage.deleteAsset(currentProject.id, id);
    } catch (error) {
      console.error('Failed to delete asset from storage:', error);
      // ストレージ削除が失敗してもUI上は削除を進める
    }

    const updatedAssets = currentProject.assets.filter(asset => asset.id !== id);

    // アセットを使用しているパラグラフからも削除
    const updatedParagraphs = currentProject.paragraphs.map(paragraph => ({
      ...paragraph,
      content: {
        ...paragraph.content,
        background: paragraph.content.background?.id === id ? undefined : paragraph.content.background,
        bgm: paragraph.content.bgm?.id === id ? undefined : paragraph.content.bgm,
        characters: paragraph.content.characters?.filter(char => char.sprite.id !== id) || [],
      },
    }));

    set({
      currentProject: {
        ...currentProject,
        assets: updatedAssets,
        paragraphs: updatedParagraphs,
        metadata: {
          ...currentProject.metadata,
          modified: new Date(),
        },
      },
      isModified: true,
    });
  },

  getAssetsByCategory: (category: AssetCategory) => {
    const { currentProject } = get();
    if (!currentProject) return [];
    return currentProject.assets.filter(asset => asset.category === category);
  },

  getAssetsByType: (type: 'image' | 'audio') => {
    const { currentProject } = get();
    if (!currentProject) return [];
    if (type === 'image') {
      return currentProject.assets.filter(asset => ['background', 'character', 'other'].includes(asset.category));
    } else {
      return currentProject.assets.filter(asset => ['bgm', 'se'].includes(asset.category));
    }
  },

  loadProjectAssets: async (projectId: string) => {
    try {
      const assets = await assetStorage.getProjectAssets(projectId);
      const { currentProject } = get();
      
      if (currentProject && currentProject.id === projectId) {
        set({
          currentProject: {
            ...currentProject,
            assets,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load project assets:', error);
    }
  },

  getAssetUrl: async (assetId: string): Promise<string> => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No current project');

    try {
      return await assetStorage.getAssetUrl(currentProject.id, assetId);
    } catch (error) {
      console.error('Failed to get asset URL:', error);
      
      // フォールバック: stateからBase64 URLを取得
      const asset = currentProject.assets.find(a => a.id === assetId);
      if (asset && asset.url.startsWith('data:')) {
        return asset.url;
      }
      
      throw error;
    }
  },
});