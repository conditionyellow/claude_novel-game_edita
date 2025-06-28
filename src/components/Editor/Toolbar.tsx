import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../UI';
import { FileText, GitBranch, Eye, Save, FolderOpen, Plus, Image } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    currentProject, 
    isModified,
    saveProject,
    addParagraph 
  } = useEditorStore();

  const handleModeChange = (newMode: 'editor' | 'flow' | 'preview' | 'assets') => {
    setMode(newMode);
  };

  const handleSave = () => {
    saveProject();
  };

  const handleAddParagraph = () => {
    addParagraph('middle');
  };

  return (
    <div className="toolbar">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <FolderOpen className="w-4 h-4 mr-1" />
          開く
        </Button>
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