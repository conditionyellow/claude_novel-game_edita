import React from 'react';
import { useEditorStore } from '@stores/editorStore';
import { Button } from '@components/UI';
import { Trash2 } from 'lucide-react';
import { clsx } from '@utils/index';

export const Sidebar: React.FC = () => {
  const { 
    currentProject, 
    selectedParagraphId, 
    selectParagraph,
    deleteParagraph 
  } = useEditorStore();

  if (!currentProject) {
    return (
      <div className="editor-sidebar flex items-center justify-center">
        <p className="text-gray-500">プロジェクトが読み込まれていません</p>
      </div>
    );
  }

  const handleSelectParagraph = (id: string) => {
    selectParagraph(id);
  };

  const handleDeleteParagraph = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentProject.paragraphs.length <= 1) {
      alert('最後のパラグラフは削除できません');
      return;
    }
    if (confirm('このパラグラフを削除しますか？')) {
      deleteParagraph(id);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'start': return 'スタート';
      case 'end': return 'エンド';
      default: return '中間';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-100 text-green-800';
      case 'end': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="editor-sidebar">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">パラグラフ一覧</h2>
        <p className="text-sm text-gray-600 mt-1">
          {currentProject.paragraphs.length}個のパラグラフ
        </p>
      </div>
      
      <div className="overflow-y-auto">
        {currentProject.paragraphs.map((paragraph) => (
          <div
            key={paragraph.id}
            className={clsx(
              'p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
              selectedParagraphId === paragraph.id && 'bg-blue-50 border-blue-200'
            )}
            onClick={() => handleSelectParagraph(paragraph.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getTypeColor(paragraph.type)
                  )}>
                    {getTypeLabel(paragraph.type)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {paragraph.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {paragraph.content.text || '本文なし'}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  選択肢: {paragraph.content.choices.length}個
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteParagraph(paragraph.id, e)}
                  className="p-1 h-auto"
                  disabled={currentProject.paragraphs.length <= 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};