/**
 * プロジェクト状態管理スライス
 * プロジェクトのCRUD操作とパラグラフ管理
 */

import type { StateCreator } from 'zustand';
import type { NovelProject, Paragraph } from '../../types';
import { createEmptyProject, createEmptyParagraph } from '../../utils';

export interface ProjectSlice {
  // State
  currentProject: NovelProject | null;
  selectedParagraphId: string | null;
  isModified: boolean;

  // Project Actions
  createNewProject: () => void;
  loadProject: (project: NovelProject) => void;
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

  loadProject: (project: NovelProject) => {
    set({
      currentProject: project,
      selectedParagraphId: project.paragraphs[0]?.id || null,
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