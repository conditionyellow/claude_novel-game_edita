import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paragraph } from '@/types';
import { clsx } from '@utils/index';
import { Square, Edit, Flag } from 'lucide-react';

interface EndNodeData {
  paragraph: Paragraph;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const EndNode: React.FC<NodeProps<EndNodeData>> = ({
  data,
  selected,
}) => {
  const { paragraph, onSelect } = data;

  const handleSelect = (e: React.MouseEvent) => {
    // ドラッグ操作でない場合のみ選択処理を実行
    if (e.detail === 1 && onSelect) { // 単一クリックのみ
      onSelect(paragraph.id);
    }
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={clsx(
        'relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white rounded-2xl shadow-2xl min-w-56 max-w-72 transition-all duration-300 ease-out transform',
        selected && 'ring-4 ring-red-300 ring-offset-4 scale-110',
        'hover:shadow-2xl cursor-pointer hover:scale-105 group',
        'border-2 border-red-300/30'
      )}
      onClick={handleSelect}
    >
      {/* インプットハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-white border-3 border-red-400 shadow-xl transition-all duration-200 hover:scale-125"
      />

      {/* メインコンテンツ */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 bg-white bg-opacity-25 rounded-full backdrop-blur-sm group-hover:bg-opacity-35 transition-all duration-300">
            <Flag className="w-8 h-8 drop-shadow-lg" />
          </div>
        </div>
        
        <h3 className="font-bold text-xl mb-3 drop-shadow-md">エンド</h3>
        
        <div className="text-base opacity-95 mb-4 font-medium">
          {truncateText(paragraph.title, 20)}
        </div>

        {paragraph.content.text && (
          <div className="text-sm opacity-85 mb-4 italic bg-white bg-opacity-15 rounded-lg p-3 backdrop-blur-sm">
            "{truncateText(paragraph.content.text, 60)}"
          </div>
        )}

        <button
          onClick={handleSelect}
          onMouseDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
        >
          <Edit className="w-4 h-4" />
          編集する
        </button>
      </div>
    </div>
  );
};