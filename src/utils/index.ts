import { nanoid } from 'nanoid';
import { Paragraph, Choice, NovelProject, ParagraphType } from '../types';

export const generateId = (): string => nanoid();

export const createEmptyParagraph = (type: ParagraphType = 'middle'): Paragraph => ({
  id: generateId(),
  type,
  title: `${
    type === 'title' ? 'タイトル' :
    type === 'start' ? 'スタート' : 
    type === 'end' ? 'エンド' : '中間'
  }パラグラフ`,
  content: {
    text: type === 'title' ? 'ゲームのタイトル画面です' : '',
    choices: (type === 'end' || type === 'title') ? [] : [createEmptyChoice()],
    background: undefined,
    characters: [],
    bgm: undefined,
    // タイトルパラグラフのデフォルト設定
    ...(type === 'title' && {
      titleImage: undefined,
      titleColor: '#ffffff',
      titleFontSize: 48,
      showProjectTitle: true,
    }),
  },
  position: { x: 0, y: 0 },
  metadata: {
    created: new Date(),
    modified: new Date(),
    tags: [],
  },
});

export const createEmptyChoice = (): Choice => ({
  id: generateId(),
  text: '次へ',
  targetParagraphId: '',
});

export const createEmptyProject = (): NovelProject => ({
  id: generateId(),
  title: '新しいプロジェクト',
  description: '',
  version: '1.0.0',
  paragraphs: [createEmptyParagraph('start')],
  assets: [],
  characters: [],
  settings: {
    defaultFont: 'Noto Sans JP',
    defaultFontSize: 16,
    themeColors: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#f59e0b',
    },
    resolution: { width: 1280, height: 720 },
    titleScreen: {
      backgroundImage: undefined,
      titleImage: undefined,
      bgm: undefined,
      showProjectTitle: true,
      titlePosition: 'center',
      titleColor: '#ffffff',
      titleFontSize: 48,
    },
  },
  metadata: {
    created: new Date(),
    modified: new Date(),
    author: '',
  },
});

export const validateParagraph = (paragraph: Paragraph): string[] => {
  const errors: string[] = [];
  
  if (!paragraph.title.trim()) {
    errors.push('タイトルが入力されていません');
  }
  
  if (!paragraph.content.text.trim()) {
    errors.push('本文が入力されていません');
  }
  
  if (paragraph.type !== 'end' && paragraph.type !== 'title' && paragraph.content.choices.length === 0) {
    errors.push('選択肢が設定されていません');
  }
  
  paragraph.content.choices.forEach((choice, index) => {
    if (!choice.text.trim()) {
      errors.push(`選択肢${index + 1}のテキストが入力されていません`);
    }
    if (!choice.targetParagraphId) {
      errors.push(`選択肢${index + 1}の接続先が設定されていません`);
    }
  });
  
  return errors;
};

export const validateProject = (project: NovelProject): string[] => {
  const errors: string[] = [];
  
  if (!project.title.trim()) {
    errors.push('プロジェクトタイトルが入力されていません');
  }
  
  const startParagraphs = project.paragraphs.filter(p => p.type === 'start');
  if (startParagraphs.length === 0) {
    errors.push('スタートパラグラフが存在しません');
  } else if (startParagraphs.length > 1) {
    errors.push('スタートパラグラフが複数存在します');
  }
  
  const titleParagraphs = project.paragraphs.filter(p => p.type === 'title');
  if (titleParagraphs.length > 1) {
    errors.push('タイトルパラグラフが複数存在します。タイトルパラグラフは1つまでしか作成できません');
  }
  
  const endParagraphs = project.paragraphs.filter(p => p.type === 'end');
  if (endParagraphs.length === 0) {
    errors.push('エンドパラグラフが存在しません');
  }
  
  // 各パラグラフのバリデーション
  project.paragraphs.forEach(paragraph => {
    const paragraphErrors = validateParagraph(paragraph);
    errors.push(...paragraphErrors.map(error => `${paragraph.title}: ${error}`));
  });
  
  // 孤立ノードの検出
  const reachableIds = new Set<string>();
  const traverse = (paragraphId: string) => {
    if (reachableIds.has(paragraphId)) return;
    reachableIds.add(paragraphId);
    
    const paragraph = project.paragraphs.find(p => p.id === paragraphId);
    if (paragraph) {
      paragraph.content.choices.forEach(choice => {
        if (choice.targetParagraphId) {
          traverse(choice.targetParagraphId);
        }
      });
    }
  };
  
  startParagraphs.forEach(start => traverse(start.id));
  
  const unreachableParagraphs = project.paragraphs.filter(
    p => p.type !== 'start' && p.type !== 'title' && !reachableIds.has(p.id)
  );
  
  unreachableParagraphs.forEach(paragraph => {
    errors.push(`${paragraph.title}: 到達不可能なパラグラフです`);
  });
  
  return errors;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// 新しいユーティリティのエクスポート
export { ValidationService, validateProject as validateProjectNew, validateParagraphs, validateForEditor } from './validation';
export { MemoryManager } from './memoryManager';
export { DebugLogger, getDebugInfo } from './debug';