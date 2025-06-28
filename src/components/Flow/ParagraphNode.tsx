import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paragraph } from '@/types';
import { clsx } from '@utils/index';
import { Edit, Trash2, Play } from 'lucide-react';

interface ParagraphNodeData {
  paragraph: Paragraph;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ParagraphNode: React.FC<NodeProps<ParagraphNodeData>> = ({
  data,
  selected,
}) => {
  const { paragraph, onSelect, onDelete } = data;

  const getNodeStyle = () => {
    switch (paragraph.type) {
      case 'start':
        return 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-900 shadow-green-200';
      case 'end':
        return 'border-red-400 bg-gradient-to-br from-red-50 to-red-100 text-red-900 shadow-red-200';
      default:
        return 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 shadow-blue-200';
    }
  };

  const getTypeIcon = () => {
    switch (paragraph.type) {
      case 'start':
        return <Play className="w-4 h-4" />;
      case 'end':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-blue-500 rounded-full" />;
    }
  };

  const getTypeLabel = () => {
    switch (paragraph.type) {
      case 'start':
        return 'スタート';
      case 'end':
        return 'エンド';
      default:
        return '中間';
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    // ドラッグ操作でない場合のみ選択処理を実行
    if (e.detail === 1 && onSelect) { // 単一クリックのみ
      onSelect(paragraph.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('このパラグラフを削除しますか？')) {
      onDelete(paragraph.id);
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={clsx(
        'relative border-2 rounded-2xl shadow-2xl min-w-56 max-w-72 transition-all duration-300 ease-out transform',
        getNodeStyle(),
        selected && 'ring-4 ring-blue-400 ring-offset-4 scale-105',
        'hover:shadow-2xl hover:scale-102 cursor-pointer group',
        'backdrop-blur-sm border-opacity-60'
      )}
      onClick={handleSelect}
    >
      {/* パラグラフタイプが end でない場合のアウトプットハンドル */}
      {paragraph.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 border-3 border-white shadow-xl transition-all duration-200 hover:scale-125"
        />
      )}

      {/* パラグラフタイプが start でない場合のインプットハンドル */}
      {paragraph.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-5 h-5 bg-gradient-to-r from-gray-400 to-gray-500 border-3 border-white shadow-xl transition-all duration-200 hover:scale-125"
        />
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-opacity-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white bg-opacity-70 group-hover:bg-opacity-90 transition-all duration-300 shadow-md">
            {getTypeIcon()}
          </div>
          <span className="text-sm font-semibold drop-shadow-sm">
            {getTypeLabel()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleSelect}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-2 text-gray-500 hover:text-blue-700 hover:bg-white hover:bg-opacity-60 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="編集"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-2 text-gray-500 hover:text-red-700 hover:bg-white hover:bg-opacity-60 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-base text-gray-900 leading-tight">
          {truncateText(paragraph.title, 28)}
        </h3>
        
        {paragraph.content.text && (
          <p className="text-sm text-gray-700 leading-relaxed bg-white bg-opacity-60 rounded-lg p-3 italic shadow-sm">
            "{truncateText(paragraph.content.text, 80)}"
          </p>
        )}

        {paragraph.content.choices.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-semibold text-gray-700 drop-shadow-sm">
                選択肢 {paragraph.content.choices.length}個
              </span>
            </div>
            <div className="space-y-2">
              {paragraph.content.choices.slice(0, 2).map((choice, index) => (
                <div
                  key={choice.id}
                  className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-800 font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <span className="inline-block w-5 h-5 bg-blue-500 text-white rounded-full text-center leading-5 mr-2 text-xs font-bold shadow-sm">
                    {index + 1}
                  </span>
                  {truncateText(choice.text, 24)}
                </div>
              ))}
              {paragraph.content.choices.length > 2 && (
                <div className="text-xs text-gray-500 text-center py-2 bg-white bg-opacity-50 rounded-lg shadow-sm">
                  +{paragraph.content.choices.length - 2}個の選択肢
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="px-4 pb-4 border-t border-opacity-30">
        <div className="flex items-center justify-between pt-3">
          <div className="text-xs text-gray-500 font-mono bg-white bg-opacity-50 px-2 py-1 rounded shadow-sm">
            ID: {paragraph.id.substring(0, 8)}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {new Date(paragraph.metadata.modified).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  );
};