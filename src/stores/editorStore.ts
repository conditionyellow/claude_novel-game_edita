import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { EditorState, NovelProject, Paragraph, Asset } from '../types';
import { createEmptyProject, createEmptyParagraph } from '../utils';

interface EditorStore extends EditorState {
  // Actions
  createNewProject: () => void;
  loadProject: (project: NovelProject) => void;
  updateProject: (updates: Partial<NovelProject>) => void;
  saveProject: () => void;
  
  // Paragraph actions
  addParagraph: (type?: 'start' | 'middle' | 'end') => string | void;
  updateParagraph: (id: string, updates: Partial<Paragraph>) => void;
  deleteParagraph: (id: string) => void;
  selectParagraph: (id: string | null) => void;
  
  // Asset actions
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetsByCategory: (category: Asset['category']) => Asset[];
  getAssetsByType: (type: Asset['type']) => Asset[];
  
  // Mode actions
  setMode: (mode: 'editor' | 'flow' | 'preview' | 'assets') => void;
  
  // Utility actions
  markAsModified: () => void;
  clearModified: () => void;
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    persist(
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

        loadProject: (project: NovelProject) => {
          set({
            currentProject: project,
            selectedParagraphId: project.paragraphs[0]?.id || null,
            isModified: false,
            mode: 'editor',
          });
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

        deleteAsset: (id: string) => {
          const { currentProject } = get();
          if (!currentProject) return;

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
      }),
      {
        name: 'novel-editor-store',
        partialize: (state) => ({
          currentProject: state.currentProject,
          selectedParagraphId: state.selectedParagraphId,
          mode: state.mode,
        }),
      }
    ),
    { name: 'EditorStore' }
  )
);