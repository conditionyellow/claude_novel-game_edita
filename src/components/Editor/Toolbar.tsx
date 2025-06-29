import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Button, Tooltip, Input } from '../UI';
import { FileText, GitBranch, Eye, Save, FolderOpen, Plus, Image, Download, Edit3 } from 'lucide-react';
import { NovelProject } from '../../types';

export const Toolbar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    currentProject, 
    isModified,
    saveProject,
    addParagraph,
    loadProject,
    buildGame,
    updateProjectTitle
  } = useEditorStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const handleModeChange = (newMode: 'editor' | 'flow' | 'preview' | 'assets') => {
    setMode(newMode);
  };

  const handleSave = () => {
    saveProject();
  };

  const handleAddParagraph = () => {
    addParagraph('middle');
  };

  const handleBuildGame = async () => {
    if (!currentProject) {
      alert('プロジェクトが読み込まれていません。');
      return;
    }

    try {
      await buildGame();
    } catch (error) {
      console.error('ビルドエラー:', error);
      alert('ゲームのビルドに失敗しました。');
    }
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
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content) as NovelProject;
        
        // 基本的なバリデーション
        if (!projectData.id || !projectData.title || !Array.isArray(projectData.paragraphs)) {
          throw new Error('無効なプロジェクトファイル形式です。');
        }

        // プロジェクトをロード（非同期）
        await loadProject(projectData);
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

  const handleTitleEdit = () => {
    if (!currentProject) return;
    setEditingTitle(currentProject.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (!editingTitle.trim()) {
      alert('タイトルは空にできません。');
      return;
    }
    updateProjectTitle(editingTitle);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  return (
    <div className="toolbar">
      {/* Left Section - File Operations */}
      <div className="flex items-center">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 gap-1">
          <Tooltip content="プロジェクトファイルを開く" position="bottom">
            <Button variant="ghost" size="sm" onClick={handleOpenFile} className="h-8">
              <FolderOpen className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">開く</span>
            </Button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Tooltip content="プロジェクトを保存" position="bottom" disabled={!isModified}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              disabled={!isModified}
              className="h-8"
            >
              <Save className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">保存</span>
            </Button>
          </Tooltip>
          <Tooltip content="ゲームをビルドして出力" position="bottom" disabled={!currentProject}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBuildGame}
              disabled={!currentProject}
              className="h-8"
            >
              <Download className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">ビルド</span>
            </Button>
          </Tooltip>
        </div>
      </div>
      
      {/* Center Section - Mode Navigation */}
      <div className="flex items-center justify-center flex-1">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
          <Tooltip content="パラグラフエディタ - ストーリーの編集" position="bottom">
            <Button
              variant={mode === 'editor' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('editor')}
              className="h-8 px-4"
            >
              <FileText className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">エディタ</span>
            </Button>
          </Tooltip>
          <Tooltip content="フローエディタ - ストーリーの構造を視覚的に編集" position="bottom">
            <Button
              variant={mode === 'flow' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('flow')}
              className="h-8 px-4"
            >
              <GitBranch className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">フロー</span>
            </Button>
          </Tooltip>
          <Tooltip content="ゲームプレビュー - 作成したゲームをテストプレイ" position="bottom">
            <Button
              variant={mode === 'preview' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('preview')}
              className="h-8 px-4"
            >
              <Eye className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">プレビュー</span>
            </Button>
          </Tooltip>
          <Tooltip content="アセット管理 - 画像・音声ファイルの管理" position="bottom">
            <Button
              variant={mode === 'assets' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('assets')}
              className="h-8 px-4"
            >
              <Image className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">アセット</span>
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Right Section - Actions & Status */}
      <div className="flex items-center gap-4">
        <Tooltip content="新しいパラグラフを追加" position="bottom" disabled={!currentProject}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddParagraph}
            disabled={!currentProject}
            className="h-8"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2 hidden lg:inline">パラグラフ追加</span>
          </Button>
        </Tooltip>
        
        <div className="flex items-center gap-3 text-sm border-l border-gray-300 dark:border-gray-600 pl-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              currentProject 
                ? isModified 
                  ? 'bg-amber-400 animate-pulse' 
                  : 'bg-green-400'
                : 'bg-gray-400'
            }`} />
            
            {/* タイトル表示・編集エリア */}
            {isEditingTitle && currentProject ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="h-6 text-sm min-w-[200px]"
                  placeholder="プロジェクトタイトル"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleTitleSave}
                  className="h-6 px-2 text-xs"
                >
                  保存
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleTitleCancel}
                  className="h-6 px-2 text-xs"
                >
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:inline">
                  {currentProject?.title || 'プロジェクトなし'}
                </span>
                {currentProject && (
                  <Tooltip content="タイトルを編集" position="bottom">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTitleEdit}
                      className="h-6 w-6 p-0 opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}
            
            {isModified && (
              <span className="text-amber-600 dark:text-amber-400 text-xs hidden sm:inline">
                未保存
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};