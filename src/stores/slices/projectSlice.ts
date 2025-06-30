/**
 * プロジェクト状態管理スライス
 * プロジェクトのCRUD操作とパラグラフ管理
 */

import type { StateCreator } from 'zustand';
import type { NovelProject, Paragraph, Asset } from '../../types';
import { createEmptyProject, createEmptyParagraph } from '../../utils';
import { assetStorage } from '../../utils/assetStorageManager';

export interface ProjectSlice {
  // State
  currentProject: NovelProject | null;
  selectedParagraphId: string | null;
  isModified: boolean;

  // Project Actions
  createNewProject: () => void;
  loadProject: (project: NovelProject) => Promise<void>;
  updateProject: (updates: Partial<NovelProject>) => void;
  
  // Paragraph Actions
  addParagraph: (type?: 'start' | 'middle' | 'end') => string | void;
  updateParagraph: (id: string, updates: Partial<Paragraph>) => void;
  deleteParagraph: (id: string) => void;
  selectParagraph: (id: string | null) => void;
  
  // Utility Actions
  markAsModified: () => void;
  clearModified: () => void;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set, get) => ({
  // Initial State
  currentProject: null,
  selectedParagraphId: null,
  isModified: false,

  // Project Actions
  createNewProject: () => {
    const newProject = createEmptyProject();
    set({
      currentProject: newProject,
      selectedParagraphId: newProject.paragraphs[0]?.id || null,
      isModified: false,
    });
  },

  loadProject: async (project: NovelProject) => {
    // アセットURL再生成：ObjectURLが無効になっている可能性に対応
    const regeneratedProject = await regenerateAssetUrls(project);
    
    set({
      currentProject: regeneratedProject,
      selectedParagraphId: regeneratedProject.paragraphs[0]?.id || null,
      isModified: false,
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

  // Paragraph Actions
  addParagraph: (type = 'middle') => {
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
            content: updates.content 
              ? { ...paragraph.content, ...updates.content }
              : paragraph.content,
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

  // Utility Actions
  markAsModified: () => {
    set({ isModified: true });
  },

  clearModified: () => {
    set({ isModified: false });
  },
});

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