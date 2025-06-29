import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../UI';
import { Trash2, Image, FileText } from 'lucide-react';
import { clsx } from '../../utils';

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
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            プロジェクトが読み込まれていません
          </p>
        </div>
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
      case 'start': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700';
      case 'end': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div className="editor-sidebar">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            パラグラフ
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {currentProject.paragraphs.length}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          シーンを編集・管理
        </p>
      </div>
      
      {/* Paragraph List */}
      <div className="overflow-y-auto">
        <div className="p-2 space-y-1">
          {currentProject.paragraphs.map((paragraph) => (
            <div
              key={paragraph.id}
              className={clsx(
                'group relative p-4 rounded-lg cursor-pointer transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                selectedParagraphId === paragraph.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'hover:shadow-sm'
              )}
              onClick={() => handleSelectParagraph(paragraph.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
                      getTypeColor(paragraph.type)
                    )}>
                      {getTypeLabel(paragraph.type)}
                    </span>
                    {paragraph.content.background && (
                      <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900 rounded border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                        <Image className="w-2 h-2 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    {paragraph.content.bgm && (
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded border border-green-200 dark:border-green-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-2">
                    {paragraph.title}
                  </h3>
                  
                  {/* Content Preview */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {paragraph.content.text || '本文なし'}
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      選択肢 {paragraph.content.choices.length}
                    </span>
                    {paragraph.content.text && (
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {paragraph.content.text.length}文字
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteParagraph(paragraph.id, e)}
                    className="p-1.5 h-auto hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                    disabled={currentProject.paragraphs.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              
              {/* Selected Indicator */}
              {selectedParagraphId === paragraph.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};