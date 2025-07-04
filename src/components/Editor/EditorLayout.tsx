import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useEditorStore } from '../../stores/editorStore';
import type { Asset } from '../../types';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { ParagraphEditor } from './ParagraphEditor';
import { FlowEditor } from '../Flow/FlowEditor';
import { Preview } from './Preview';
import { AssetManager } from '../Assets';


export const EditorLayout: React.FC = () => {
  const { mode, currentProject, createNewProject, addAsset, addAssetWithFile, deleteAsset } = useEditorStore();

  useEffect(() => {
    // 初回起動時に新しいプロジェクトを作成
    if (!currentProject) {
      createNewProject();
    }
  }, [currentProject, createNewProject]);

  // Phase 20: 初期アセット検証システム無効化（グローバルマネージャーに統合済み）
  // グローバルアセットURL管理システムが必要時に自動で安定URLを提供するため、
  // プロアクティブ検証は不要

  // 新しいIndexedDB対応のアセットアップロード
  const handleAssetUpload = async (asset: Asset, file: File) => {
    try {
      await addAssetWithFile(asset, file);
    } catch (error) {
      console.error('Asset upload failed:', error);
      // フォールバック: 従来のBase64方式
      addAsset(asset);
    }
  };

  const renderMainContent = () => {
    switch (mode) {
      case 'flow':
        try {
          return (
            <div className="w-full h-full">
              <ReactFlowProvider>
                <FlowEditor />
              </ReactFlowProvider>
            </div>
          );
        } catch (error) {
          console.error('EditorLayout - FlowEditor error:', error);
          return (
            <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-2xl">⚠</span>
                </div>
                <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                  フローエディターエラー
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  フローエディターの読み込みに失敗しました
                </p>
              </div>
            </div>
          );
        }
      case 'preview':
        return <Preview />;
      case 'assets':
        return (
          <div className="h-full">
            <AssetManager
              assets={currentProject?.assets || []}
              onAssetUpload={handleAssetUpload}
              onAssetDelete={deleteAsset}
              onAssetSelect={(_asset) => {
                // 将来的にはアセット編集モーダルなどを開く
              }}
              mode="manage"
              className="h-full"
            />
          </div>
        );
      default:
        return <ParagraphEditor />;
    }
  };

  return (
    <div className="editor-container">
      <Toolbar />
      <div className="editor-main">
        <Sidebar />
        <div className="editor-content">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};