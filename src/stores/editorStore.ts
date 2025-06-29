/**
 * @deprecated このファイルは非推奨です。新しい分割されたstore（useAppStore）を使用してください
 * 下位互換性のために一時的に保持されています
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { EditorState, NovelProject, Paragraph, Asset } from '../types';
import { createEmptyProject, createEmptyParagraph } from '../utils';
import { assetStorage } from '../utils/assetStorageManager';
import { GameBuilder } from '../runtime/GameBuilder';

// 既存のLocalStorageデータをクリア（容量問題解決のため）
if (typeof window !== 'undefined') {
  localStorage.removeItem('novel-editor-store');
}

interface EditorStore extends EditorState {
  // Actions
  createNewProject: () => void;
  loadProject: (project: NovelProject) => void;
  updateProject: (updates: Partial<NovelProject>) => void;
  updateProjectTitle: (title: string) => void;
  saveProject: () => void;
  
  // Paragraph actions
  addParagraph: (type?: 'start' | 'middle' | 'end') => string | void;
  updateParagraph: (id: string, updates: Partial<Paragraph>) => void;
  deleteParagraph: (id: string) => void;
  selectParagraph: (id: string | null) => void;
  
  // Asset actions
  addAsset: (asset: Asset) => void;
  addAssetWithFile: (asset: Asset, file: File) => Promise<Asset>; // 新しいIndexedDB対応メソッド
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetsByCategory: (category: Asset['category']) => Asset[];
  getAssetsByType: (type: Asset['type']) => Asset[];
  loadProjectAssets: (projectId: string) => Promise<void>; // IndexedDBからアセット読み込み
  getAssetUrl: (assetId: string) => Promise<string>; // アセットURL取得
  
  // Mode actions
  setMode: (mode: 'editor' | 'flow' | 'preview' | 'assets') => void;
  
  // Utility actions
  markAsModified: () => void;
  clearModified: () => void;
  
  // Build actions
  buildGame: () => Promise<void>;
}

// LocalStorage永続化を無効化して容量問題を回避
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
        // Initial state
        currentProject: null,
        selectedParagraphId: null,
        mode: 'flow',
        isModified: false,

        // Project actions
        createNewProject: () => {
          const newProject = createEmptyProject();
          set({
            currentProject: newProject,
            selectedParagraphId: newProject.paragraphs[0]?.id || null,
            isModified: false,
            mode: 'flow',
          });
        },

        loadProject: async (project: NovelProject) => {
          try {
            console.log('プロジェクト読み込み開始:', project.title);
            
            // アセットURL再生成処理を実行
            const regeneratedProject = await regenerateAssetUrls(project);
            
            set({
              currentProject: regeneratedProject,
              selectedParagraphId: regeneratedProject.paragraphs[0]?.id || null,
              isModified: false,
              mode: 'editor',
            });
            
            console.log('プロジェクト読み込み完了:', regeneratedProject.title);
          } catch (error) {
            console.error('プロジェクト読み込みエラー:', error);
            // エラー時でも基本的な読み込みは実行
            set({
              currentProject: project,
              selectedParagraphId: project.paragraphs[0]?.id || null,
              isModified: false,
              mode: 'editor',
            });
          }
        },

        updateProject: (updates: Partial<NovelProject>) => {
          const { currentProject } = get();
          if (!currentProject) return;

          set({
            currentProject: {
              ...currentProject,
              ...updates,
              metadata: {
                ...currentProject.metadata,
                modified: new Date(),
              },
            },
            isModified: true,
          });
        },

        updateProjectTitle: (title: string) => {
          const { currentProject } = get();
          if (!currentProject) return;

          set({
            currentProject: {
              ...currentProject,
              title: title.trim(),
              metadata: {
                ...currentProject.metadata,
                modified: new Date(),
              },
            },
            isModified: true,
          });
        },

        saveProject: () => {
          const { currentProject } = get();
          if (!currentProject) return;

          try {
            // プロジェクトデータをJSONとしてエクスポート
            const projectData = JSON.stringify(currentProject, null, 2);
            
            // ファイル名を生成（プロジェクト名 + 日時）
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const fileName = `${currentProject.title}_${timestamp}.json`;
            
            // Blobを作成してダウンロード
            const blob = new Blob([projectData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 隠しリンクを作成してクリック
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // クリーンアップ
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('Project saved as:', fileName);
            set({ isModified: false });
          } catch (error) {
            console.error('Save error:', error);
            alert('プロジェクトの保存に失敗しました。');
          }
        },

        // Paragraph actions
        addParagraph: (type = 'middle') => {
          const { currentProject } = get();
          if (!currentProject) return;

          const newParagraph = createEmptyParagraph(type);
          const updatedParagraphs = [...currentProject.paragraphs, newParagraph];

          set({
            currentProject: {
              ...currentProject,
              paragraphs: updatedParagraphs,
              metadata: {
                ...currentProject.metadata,
                modified: new Date(),
              },
            },
            selectedParagraphId: newParagraph.id,
            isModified: true,
          });
          
          return newParagraph.id;
        },

        updateParagraph: (id: string, updates: Partial<Paragraph>) => {
          const { currentProject } = get();
          if (!currentProject) return;

          const updatedParagraphs = currentProject.paragraphs.map(paragraph =>
            paragraph.id === id
              ? {
                  ...paragraph,
                  ...updates,
                  metadata: {
                    ...paragraph.metadata,
                    modified: new Date(),
                  },
                }
              : paragraph
          );

          set({
            currentProject: {
              ...currentProject,
              paragraphs: updatedParagraphs,
              metadata: {
                ...currentProject.metadata,
                modified: new Date(),
              },
            },
            isModified: true,
          });
        },

        deleteParagraph: (id: string) => {
          const { currentProject, selectedParagraphId } = get();
          if (!currentProject) return;

          const updatedParagraphs = currentProject.paragraphs.filter(
            paragraph => paragraph.id !== id
          );

          // Clean up choices that point to the deleted paragraph
          const cleanedParagraphs = updatedParagraphs.map(paragraph => ({
            ...paragraph,
            content: {
              ...paragraph.content,
              choices: paragraph.content.choices.filter(
                choice => choice.targetParagraphId !== id
              ),
            },
          }));

          set({
            currentProject: {
              ...currentProject,
              paragraphs: cleanedParagraphs,
              metadata: {
                ...currentProject.metadata,
                modified: new Date(),
              },
            },
            selectedParagraphId:
              selectedParagraphId === id ? null : selectedParagraphId,
            isModified: true,
          });
        },

        selectParagraph: (id: string | null) => {
          set({ selectedParagraphId: id });
        },

        // Asset actions
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

        // 新しいIndexedDB対応アセット追加メソッド
        addAssetWithFile: async (asset: Asset, file: File): Promise<Asset> => {
          const { currentProject } = get();
          if (!currentProject) throw new Error('No current project');

          try {
            // IndexedDBに保存
            const url = await assetStorage.saveAsset(currentProject.id, asset, file);
            
            // URLを更新したアセットを作成
            const savedAsset: Asset = {
              ...asset,
              url, // IndexedDBから返されたObjectURL
              metadata: {
                ...asset.metadata,
                lastUsed: new Date()
              }
            };

            // メタデータをstateに保存（URLは動的に生成されるため除外してもよい）
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

        getAssetsByCategory: (category: Asset['category']) => {
          const { currentProject } = get();
          if (!currentProject) return [];
          return currentProject.assets.filter(asset => asset.category === category);
        },

        getAssetsByType: (type: Asset['type']) => {
          const { currentProject } = get();
          if (!currentProject) return [];
          return currentProject.assets.filter(asset => asset.type === type);
        },

        // IndexedDBからプロジェクトのアセット一覧を読み込み
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

        // アセットURL取得（IndexedDBから動的生成）
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

        // Mode actions
        setMode: (mode: 'editor' | 'flow' | 'preview' | 'assets') => {
          set({ mode });
        },

        // Utility actions
        markAsModified: () => {
          set({ isModified: true });
        },

        clearModified: () => {
          set({ isModified: false });
        },

        // ゲームビルド機能
        buildGame: async () => {
          const { currentProject } = get();
          if (!currentProject) {
            throw new Error('プロジェクトが読み込まれていません');
          }

          try {
            // ビルドプロセス開始の通知
            console.log('ビルド開始:', currentProject.title);
            console.log('パラグラフ数:', currentProject.paragraphs.length);
            console.log('アセット数:', currentProject.assets.length);
            
            // アセットの詳細をログ出力
            currentProject.assets.forEach((asset, index) => {
              console.log(`アセット ${index + 1}:`, {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                category: asset.category,
                url: asset.url ? asset.url.substring(0, 50) + '...' : 'なし',
                hasMetadata: !!asset.metadata
              });
            });

            alert('ゲームのビルドを開始しています...');

            // GameBuilderを使用してビルド
            const builder = new GameBuilder(currentProject);
            const gameArchive = await builder.buildGame();

            // ファイル名を生成
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const fileName = `${currentProject.title}_game_${timestamp}.zip`;

            // ZIPファイルをダウンロード
            const url = URL.createObjectURL(gameArchive);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // クリーンアップ
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(`ゲーム "${fileName}" のビルドが完了しました！\n\nアセット数: ${currentProject.assets.length}個\nパラグラフ数: ${currentProject.paragraphs.length}個`);
            console.log('Game built successfully:', fileName);
          } catch (error) {
            console.error('Build failed:', error);
            alert(`ビルドエラー: ${error.message}`);
            throw error;
          }
        },
      }),
    { name: 'EditorStore' }
  )
);

/**
 * アセットURL再生成関数
 * プロジェクト読み込み時にObjectURLが無効になっている可能性があるため、
 * IndexedDBから新しいURLを生成し直す
 */
async function regenerateAssetUrls(project: NovelProject): Promise<NovelProject> {
  console.log('アセットURL再生成開始:', project.assets.length, '個のアセット');
  
  const regeneratedAssets: Asset[] = [];
  
  for (const asset of project.assets) {
    try {
      // ObjectURLが無効かチェック（blob:から始まるURL）
      if (asset.url.startsWith('blob:')) {
        console.log(`ObjectURL再生成中: ${asset.name}`);
        
        // IndexedDBから新しいURLを生成
        const newUrl = await assetStorage.getAssetUrl(project.id, asset.id);
        
        regeneratedAssets.push({
          ...asset,
          url: newUrl,
          metadata: {
            ...asset.metadata,
            lastUsed: new Date()
          }
        });
        
        console.log(`✅ URL再生成完了: ${asset.name}`);
      } else {
        // Base64や他の形式はそのまま維持
        regeneratedAssets.push(asset);
      }
    } catch (error) {
      console.warn(`⚠️ アセットURL再生成失敗: ${asset.name}`, error);
      // エラーの場合でも元のアセットを保持（UI表示エラーを防ぐ）
      regeneratedAssets.push(asset);
    }
  }
  
  console.log('アセットURL再生成完了:', regeneratedAssets.length, '個のアセット処理');
  
  return {
    ...project,
    assets: regeneratedAssets
  };
}