import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useEditorStore } from '../../stores/editorStore';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { ParagraphEditor } from './ParagraphEditor';
import { FlowEditor } from '../Flow/FlowEditor';
import { Preview } from './Preview';
import { AssetManager } from '../Assets';

export const EditorLayout: React.FC = () => {
  const { mode, currentProject, createNewProject, addAsset, deleteAsset } = useEditorStore();
  
  console.log('=================== EditorLayout Render ===================');
  console.log('EditorLayout - Current mode:', mode);
  console.log('EditorLayout - Current project exists:', !!currentProject);
  console.log('EditorLayout - Current project:', currentProject);
  if (currentProject) {
    console.log('EditorLayout - Project paragraphs:', currentProject.paragraphs.length);
  }

  useEffect(() => {
    // 初回起動時に新しいプロジェクトを作成
    if (!currentProject) {
      createNewProject();
    }
  }, [currentProject, createNewProject]);

  const renderMainContent = () => {
    // 画面に直接情報を表示
    const debugOverlay = (
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'orange',
        color: 'black',
        padding: '10px',
        border: '2px solid red',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        <div>EditorLayout Debug:</div>
        <div>Mode: {mode}</div>
        <div>Project: {currentProject ? 'Loaded' : 'Not Loaded'}</div>
        <div>Project ID: {currentProject?.id || 'None'}</div>
      </div>
    );
    
    switch (mode) {
      case 'flow':
        console.log('EditorLayout - Rendering FLOW mode');
        try {
          return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {debugOverlay}
              <div style={{ background: 'lightblue', padding: '10px', fontSize: '12px', borderBottom: '2px solid darkblue' }}>
                <strong>FLOW MODE ACTIVE</strong> - FlowEditor should render below:
              </div>
              <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                <ReactFlowProvider>
                  <FlowEditor />
                </ReactFlowProvider>
              </div>
            </div>
          );
        } catch (error) {
          console.error('EditorLayout - FlowEditor error:', error);
          return (
            <div style={{ position: 'relative' }}>
              {debugOverlay}
              <div style={{ color: 'red', padding: '20px' }}>
                <h3>FlowEditor Error:</h3>
                <pre>{String(error)}</pre>
                <div>Stack: {error instanceof Error ? error.stack : 'No stack'}</div>
              </div>
            </div>
          );
        }
      case 'preview':
        return (
          <div style={{ position: 'relative' }}>
            {debugOverlay}
            <Preview />
          </div>
        );
      case 'assets':
        return (
          <div className="h-full">
            <AssetManager
              assets={currentProject?.assets || []}
              onAssetUpload={addAsset}
              onAssetDelete={deleteAsset}
              mode="manage"
              className="h-full"
            />
          </div>
        );
      default:
        return (
          <div style={{ position: 'relative' }}>
            {debugOverlay}
            <ParagraphEditor />
          </div>
        );
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