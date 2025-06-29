/**
 * 統合アプリケーションストア
 * 分割されたsliceを組み合わせて単一のstoreとして提供
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProjectSlice } from './slices/projectSlice';
import type { AssetSlice } from './slices/assetSlice';
import type { UISlice } from './slices/uiSlice';
import { createProjectSlice } from './slices/projectSlice';
import { createAssetSlice } from './slices/assetSlice';
import { createUISlice } from './slices/uiSlice';
import { buildService } from '../services/buildService';
import type { BuildResult, OperationResult } from '../types';

// 統合されたStore型
export interface AppStore extends ProjectSlice, AssetSlice, UISlice {
  // Build Actions (Service経由)
  buildGame: () => Promise<BuildResult>;
  saveProject: () => Promise<OperationResult<string>>;
}

// LocalStorage永続化を無効化（容量問題解決のため）
if (typeof window !== 'undefined') {
  localStorage.removeItem('novel-editor-store');
}

export const useAppStore = create<AppStore>()(
  devtools(
    (...args) => {
      const [, get] = args;
      
      return {
        // Project Slice
        ...createProjectSlice(...args),
        
        // Asset Slice
        ...createAssetSlice(...args),
        
        // UI Slice  
        ...createUISlice(...args),

        // Build Actions (Service Integration)
        buildGame: async (): Promise<BuildResult> => {
          const { currentProject } = get();
          if (!currentProject) {
            return {
              success: false,
              buildTime: 0,
              warnings: [],
              errors: ['プロジェクトが読み込まれていません'],
            };
          }

          try {
            const result = await buildService.buildGame(currentProject);
            
            if (result.success) {
              // ビルド成功時の通知
              alert(`ゲーム "${result.outputPath}" のビルドが完了しました！\n\nファイルサイズ: ${Math.round(result.fileSize! / 1024)} KB\nビルド時間: ${result.buildTime}ms`);
            } else {
              // ビルド失敗時の通知
              alert(`ビルドエラー: ${result.errors.join('\n')}`);
            }

            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`ビルドエラー: ${errorMessage}`);
            
            return {
              success: false,
              buildTime: 0,
              warnings: [],
              errors: [errorMessage],
            };
          }
        },

        saveProject: async (): Promise<OperationResult<string>> => {
          const { currentProject, clearModified } = get();
          if (!currentProject) {
            return {
              success: false,
              error: 'プロジェクトが読み込まれていません',
            };
          }

          try {
            const result = await buildService.saveProject(currentProject);
            
            if (result.success) {
              clearModified();
              console.log('Project saved as:', result.data);
            }

            return result;
          } catch (error) {
            console.error('Save error:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      };
    },
    { name: 'AppStore' }
  )
);

// 下位互換性のためのエイリアス
export const useEditorStore = useAppStore;