import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from 'reactflow';
import { X } from 'lucide-react';
import { Choice } from '@/types';

interface ChoiceEdgeData {
  choice?: Choice;
  onDelete?: (edgeId: string) => void;
}

export const ChoiceEdge: React.FC<EdgeProps<ChoiceEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = () => {
    if (data?.onDelete) {
      data.onDelete(id);
    } else {
      setEdges((edges) => edges.filter((edge) => edge.id !== id));
    }
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // エッジの色とスタイルを動的に決定
  const getEdgeStyle = () => {
    if (selected) {
      return {
        stroke: '#3b82f6',
        strokeWidth: 4,
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
      };
    }
    return {
      stroke: 'url(#choice-gradient)',
      strokeWidth: 3,
      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
    };
  };

  return (
    <>
      {/* グラデーション定義 */}
      <defs>
        <linearGradient id="choice-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <marker
          id="choice-arrow"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={selected ? '#3b82f6' : '#6366f1'}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>

      <BaseEdge
        path={edgePath}
        style={getEdgeStyle()}
        markerEnd="url(#choice-arrow)"
        className="animate-pulse-slow hover:animate-none transition-all duration-300"
      />
      
      {data?.choice && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan group"
          >
            <div
              className={`
                relative bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm
                ${selected ? 'ring-4 ring-indigo-300 ring-offset-2 scale-110' : 'hover:scale-105'}
                transition-all duration-300 ease-out
                max-w-40 min-w-32
              `}
            >
              {/* 背景デコレーション */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-indigo-50 rounded-xl opacity-60"></div>
              
              {/* コンテンツ */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm"></div>
                    <span className="text-xs font-bold text-indigo-700 drop-shadow-sm">
                      選択肢
                    </span>
                  </div>
                  {selected && (
                    <button
                      onClick={handleDelete}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                      title="削除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-indigo-800 leading-tight font-medium bg-white bg-opacity-60 rounded-lg p-2 shadow-sm">
                  "{truncateText(data.choice.text, 25)}"
                </div>
              </div>

              {/* ホバー時のアニメーション効果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};