/**
 * @deprecated このファイルは非推奨です。新しい分割されたstore（useAppStore）を使用してください
 * 下位互換性のために一時的に保持されています
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { EditorState, NovelProject, Paragraph, Asset, ParagraphType } from '../types';
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
  saveProject: () => void;
  
  // Paragraph actions
  addParagraph: (type?: ParagraphType) => string | void;
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
          const DEBUG_PROJECT_LOAD = false; // プロジェクト読み込みデバッグモード
          
          try {
            if (DEBUG_PROJECT_LOAD) console.log('プロジェクト読み込み開始:', project.title);
            
            // 古いプロジェクトデータにタイトル画面設定がない場合はデフォルト値を追加
            const projectWithDefaults = {
              ...project,
              settings: {
                ...project.settings,
                titleScreen: project.settings.titleScreen || {
                  backgroundImage: undefined,
                  titleImage: undefined,
                  bgm: undefined,
                  showProjectTitle: true,
                  titlePosition: 'center' as const,
                  titleColor: '#ffffff',
                  titleFontSize: 48,
                }
              }
            };
            
            // アセットURL再生成処理を実行
            const regeneratedProject = await regenerateAssetUrls(projectWithDefaults);
            
            // 破損アセットのクリーンアップ
            const cleanedProject = await cleanupCorruptedAssets(regeneratedProject);
            
            set({
              currentProject: cleanedProject,
              selectedParagraphId: cleanedProject.paragraphs[0]?.id || null,
              isModified: false,
              mode: 'editor',
            });
            
            if (DEBUG_PROJECT_LOAD) console.log('プロジェクト読み込み完了:', cleanedProject.title);
          } catch (error) {
            console.error('プロジェクト読み込みエラー:', error);
            // エラー時でも基本的な読み込みは実行
            const projectWithDefaults = {
              ...project,
              settings: {
                ...project.settings,
                titleScreen: project.settings.titleScreen || {
                  backgroundImage: undefined,
                  titleImage: undefined,
                  bgm: undefined,
                  showProjectTitle: true,
                  titlePosition: 'center' as const,
                  titleColor: '#ffffff',
                  titleFontSize: 48,
                }
              }
            };
            set({
              currentProject: projectWithDefaults,
              selectedParagraphId: projectWithDefaults.paragraphs[0]?.id || null,
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
        addParagraph: (type: ParagraphType = 'middle') => {
          const { currentProject } = get();
          if (!currentProject) return;

          // タイトルパラグラフの重複チェック
          if (type === 'title') {
            const existingTitleParagraph = currentProject.paragraphs.find(p => p.type === 'title');
            if (existingTitleParagraph) {
              console.warn('タイトルパラグラフは1つのプロジェクトに1つまでしか作成できません');
              return null;
            }
          }

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

          const DEBUG_BUILD = false; // ビルドデバッグモード
          
          try {
            // ビルドプロセス開始の通知
            console.log('ビルド開始:', currentProject.title);
            if (DEBUG_BUILD) console.log('パラグラフ数:', currentProject.paragraphs.length);
            if (DEBUG_BUILD) console.log('アセット数:', currentProject.assets.length);
            
            // アセットの詳細をログ出力（デバッグモード時のみ）
            if (DEBUG_BUILD) {
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
            }

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
            if (DEBUG_BUILD) console.log('Game built successfully:', fileName);
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
 * 破損アセットのクリーンアップ関数
 */
async function cleanupCorruptedAssets(project: NovelProject): Promise<NovelProject> {
  const DEBUG_CLEANUP = false; // クリーンアップデバッグモード
  
  if (DEBUG_CLEANUP) console.log('破損アセットクリーンアップ開始');
  
  const validAssets = project.assets.filter(asset => {
    // コンソールエラーが出たアセットIDをチェック
    const isCorrupted = ['EkQWHH1uCyI3Zy3iE0_UK', 'mOdDk9pe9wqfPYAASENJy'].includes(asset.id);
    if (isCorrupted) {
      if (DEBUG_CLEANUP) console.log(`破損アセットを削除: ${asset.name} (ID: ${asset.id})`);
      return false;
    }
    return true;
  });

  if (validAssets.length !== project.assets.length) {
    if (DEBUG_CLEANUP) console.log(`${project.assets.length - validAssets.length}個の破損アセットを削除しました`);
    
    // パラグラフからも破損アセット参照を削除
    const cleanedParagraphs = project.paragraphs.map(paragraph => ({
      ...paragraph,
      content: {
        ...paragraph.content,
        background: validAssets.find(a => a.id === paragraph.content.background?.id) ? paragraph.content.background : undefined,
        bgm: validAssets.find(a => a.id === paragraph.content.bgm?.id) ? paragraph.content.bgm : undefined,
        titleImage: validAssets.find(a => a.id === paragraph.content.titleImage?.id) ? paragraph.content.titleImage : undefined,
        characters: paragraph.content.characters?.filter(char => 
          validAssets.find(a => a.id === char.sprite.id)
        ) || []
      }
    }));

    return {
      ...project,
      assets: validAssets,
      paragraphs: cleanedParagraphs
    };
  }

  return project;
}

/**
 * アセットURL再生成関数
 * プロジェクト読み込み時にObjectURLが無効になっている可能性があるため、
 * IndexedDBから新しいURLを生成し直す
 */
async function regenerateAssetUrls(project: NovelProject): Promise<NovelProject> {
  const DEBUG_ASSETS = false; // アセット処理デバッグモード
  
  if (DEBUG_ASSETS) console.log('アセットURL再生成開始:', project.assets.length, '個のアセット');
  
  const regeneratedAssets: Asset[] = [];
  
  for (const asset of project.assets) {
    try {
      // ObjectURLが無効かチェック（blob:から始まるURL）
      if (asset.url.startsWith('blob:')) {
        if (DEBUG_ASSETS) console.log(`ObjectURL再生成中: ${asset.name}`);
        
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
        
        if (DEBUG_ASSETS) console.log(`✅ URL再生成完了: ${asset.name}`);
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
  
  if (DEBUG_ASSETS) console.log('アセットURL再生成完了:', regeneratedAssets.length, '個のアセット処理');
  
  return {
    ...project,
    assets: regeneratedAssets
  };
}