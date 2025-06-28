import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { EditorState, NovelProject, Paragraph } from '@/types';
import { createEmptyProject, createEmptyParagraph } from '@utils/index';

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
  
  // Mode actions
  setMode: (mode: 'editor' | 'flow' | 'preview') => void;
  
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

          // TODO: Implement actual save logic (localStorage, API, etc.)
          console.log('Saving project:', currentProject);
          
          set({ isModified: false });
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

        // Mode actions
        setMode: (mode: 'editor' | 'flow' | 'preview') => {
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