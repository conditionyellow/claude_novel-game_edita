import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { GamePreview } from '../../runtime';

export const Preview: React.FC = () => {
  const { currentProject } = useEditorStore();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">プロジェクトが読み込まれていません</p>
      </div>
    );
  }

  return <GamePreview project={currentProject} />;
};