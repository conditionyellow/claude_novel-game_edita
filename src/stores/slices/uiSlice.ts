/**
 * UI状態管理スライス
 * エディターのUI状態、モード管理
 */

import type { StateCreator } from 'zustand';
import type { EditorMode } from '../../types';

// ローカル型定義（types/editor.tsから移動）
interface UIState {
  sidebarCollapsed: boolean;
  headerCollapsed: boolean;
  showDebugInfo: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface UISlice {
  // State
  mode: EditorMode;
  ui: UIState;

  // Mode Actions
  setMode: (mode: EditorMode) => void;
  
  // UI Actions
  toggleSidebar: () => void;
  toggleHeader: () => void;
  toggleDebugInfo: () => void;
  setTheme: (theme: UIState['theme']) => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  // Initial State
  mode: 'flow',
  ui: {
    sidebarCollapsed: false,
    headerCollapsed: false,
    showDebugInfo: false,
    theme: 'auto',
  },

  // Mode Actions
  setMode: (mode: EditorMode) => {
    set({ mode });
  },

  // UI Actions
  toggleSidebar: () => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        sidebarCollapsed: !ui.sidebarCollapsed,
      },
    });
  },

  toggleHeader: () => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        headerCollapsed: !ui.headerCollapsed,
      },
    });
  },

  toggleDebugInfo: () => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        showDebugInfo: !ui.showDebugInfo,
      },
    });
  },

  setTheme: (theme: UIState['theme']) => {
    const { ui } = get();
    set({
      ui: {
        ...ui,
        theme,
      },
    });
  },
});