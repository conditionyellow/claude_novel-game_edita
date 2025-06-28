import React, { useRef } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../UI';
import { FileText, GitBranch, Eye, Save, FolderOpen, Plus, Image } from 'lucide-react';
import { NovelProject } from '../../types';

export const Toolbar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    currentProject, 
    isModified,
    saveProject,
    addParagraph,
    loadProject
  } = useEditorStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: 'editor' | 'flow' | 'preview' | 'assets') => {
    setMode(newMode);
  };

  const handleSave = () => {
    saveProject();
  };

  const handleAddParagraph = () => {
    addParagraph('middle');
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // JSONファイルのみ許可
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('JSONファイルを選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content) as NovelProject;
        
        // 基本的なバリデーション
        if (!projectData.id || !projectData.title || !Array.isArray(projectData.paragraphs)) {
          throw new Error('無効なプロジェクトファイル形式です。');
        }

        // プロジェクトをロード
        loadProject(projectData);
        alert(`プロジェクト "${projectData.title}" を読み込みました。`);
      } catch (error) {
        console.error('ファイル読み込みエラー:', error);
        alert('ファイルの読み込みに失敗しました。正しいプロジェクトファイルを選択してください。');
      }
    };

    reader.readAsText(file);
    // ファイル入力をリセット（同じファイルを再選択可能にする）
    event.target.value = '';
  };

  return (
    <div className="toolbar">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleOpenFile}>
          <FolderOpen className="w-4 h-4 mr-1" />
          開く
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSave}
          disabled={!isModified}
        >
          <Save className="w-4 h-4 mr-1" />
          保存
        </Button>
      </div>
      
      <div className="flex items-center gap-1 border-l border-gray-300 pl-4 ml-4">
        <Button
          variant={mode === 'editor' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('editor')}
        >
          <FileText className="w-4 h-4 mr-1" />
          エディタ
        </Button>
        <Button
          variant={mode === 'flow' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('flow')}
        >
          <GitBranch className="w-4 h-4 mr-1" />
          フロー
        </Button>
        <Button
          variant={mode === 'preview' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('preview')}
        >
          <Eye className="w-4 h-4 mr-1" />
          プレビュー
        </Button>
        <Button
          variant={mode === 'assets' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('assets')}
        >
          <Image className="w-4 h-4 mr-1" />
          アセット
        </Button>
      </div>

      <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddParagraph}
          disabled={!currentProject}
        >
          <Plus className="w-4 h-4 mr-1" />
          パラグラフ追加
        </Button>
      </div>

      <div className="flex-1" />

      <div className="text-sm text-gray-600">
        {currentProject?.title || 'プロジェクトなし'}
        {isModified && <span className="text-red-600 ml-1">*</span>}
      </div>
    </div>
  );
};