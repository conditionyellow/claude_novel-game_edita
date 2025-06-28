import React from 'react';
import { useEditorStore } from '@stores/editorStore';

export const Preview: React.FC = () => {
  const { currentProject } = useEditorStore();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">プロジェクトが読み込まれていません</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          プレビュー機能
        </h2>
        <p className="text-gray-600 mb-4">
          ゲームのプレビュー機能は今後実装予定です。
        </p>
        <div className="text-sm text-gray-500">
          <p>実装予定の機能:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>リアルタイムゲームプレビュー</li>
            <li>選択肢のテスト</li>
            <li>フロー検証</li>
            <li>レスポンシブ表示確認</li>
          </ul>
        </div>
      </div>
    </div>
  );
};