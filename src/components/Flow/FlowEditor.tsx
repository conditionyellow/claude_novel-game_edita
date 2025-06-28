import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Node, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { useEditorStore } from '@stores/editorStore';
import { ParagraphNode } from './ParagraphNode';
import { Button } from '@/components/UI';

// カスタムノードタイプの定義
const nodeTypes = {
  paragraph: ParagraphNode,
};

export const FlowEditor: React.FC = () => {
  const { currentProject, updateParagraph, selectParagraph, deleteParagraph } = useEditorStore();
  
  // デバッグ情報をコンソールに出力
  console.log('=================== FlowEditor Render Start ===================');
  console.log('FlowEditor - currentProject exists:', !!currentProject);
  console.log('FlowEditor - paragraphs count:', currentProject?.paragraphs?.length || 0);
  if (currentProject) {
    console.log('FlowEditor - project paragraphs:', currentProject.paragraphs.map(p => ({ id: p.id, title: p.title, type: p.type })));
  }
  console.log('FlowEditor - Methods available:', {
    updateParagraph: typeof updateParagraph,
    selectParagraph: typeof selectParagraph,
    deleteParagraph: typeof deleteParagraph
  });

  // 自動レイアウト機能
  const autoLayout = useCallback(() => {
    if (!currentProject) return;

    const startParagraphs = currentProject.paragraphs.filter(p => p.type === 'start');
    const middleParagraphs = currentProject.paragraphs.filter(p => p.type === 'middle');
    const endParagraphs = currentProject.paragraphs.filter(p => p.type === 'end');

    const nodeWidth = 300;
    const nodeHeight = 200;
    const horizontalSpacing = 400;
    const verticalSpacing = 250;

    let currentX = 100;
    let currentY = 100;

    // スタートノードを左端に配置
    startParagraphs.forEach((paragraph, index) => {
      updateParagraph(paragraph.id, {
        position: {
          x: currentX,
          y: currentY + (index * verticalSpacing)
        }
      });
    });

    currentX += horizontalSpacing;

    // 中間ノードを中央に配置
    middleParagraphs.forEach((paragraph, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      updateParagraph(paragraph.id, {
        position: {
          x: currentX + (col * horizontalSpacing),
          y: currentY + (row * verticalSpacing)
        }
      });
    });

    currentX += Math.max(1, Math.ceil(middleParagraphs.length / 3)) * horizontalSpacing;

    // エンドノードを右端に配置
    endParagraphs.forEach((paragraph, index) => {
      updateParagraph(paragraph.id, {
        position: {
          x: currentX,
          y: currentY + (index * verticalSpacing)
        }
      });
    });
  }, [currentProject, updateParagraph]);
  
  // プロジェクトのパラグラフからノードを作成
  const createNodesFromParagraphs = useCallback(() => {
    console.log('=================== createNodesFromParagraphs Called ===================');
    if (!currentProject) {
      console.log('FlowEditor - createNodesFromParagraphs: No currentProject available');
      return [];
    }
    
    console.log('FlowEditor - currentProject.paragraphs:', currentProject.paragraphs);
    
    const nodes = currentProject.paragraphs.map((paragraph, index) => {
      const node = {
        id: paragraph.id,
        type: 'paragraph',
        position: paragraph.position || { x: 100 + (index * 400), y: 100 + (index * 300) },
        data: { 
          paragraph: paragraph,
          onSelect: (id: string) => {
            console.log('Node onSelect called with id:', id);
            selectParagraph(id);
          },
          onDelete: (id: string) => {
            console.log('Node onDelete called with id:', id);
            deleteParagraph(id);
          },
        },
        draggable: true,
      };
      console.log(`FlowEditor - Created node ${index + 1}:`, node);
      return node;
    });
    
    console.log('FlowEditor - Total nodes created:', nodes.length);
    console.log('FlowEditor - All nodes:', nodes);
    return nodes;
  }, [currentProject, selectParagraph, deleteParagraph]);

  // パラグラフの選択肢からエッジを作成
  const createEdgesFromChoices = useCallback(() => {
    if (!currentProject) return [];
    
    const edges: any[] = [];
    
    currentProject.paragraphs.forEach((paragraph) => {
      paragraph.content.choices.forEach((choice, index) => {
        if (choice.targetParagraphId) {
          edges.push({
            id: `${paragraph.id}-${choice.id}`,
            source: paragraph.id,
            target: choice.targetParagraphId,
            label: choice.text,
            type: 'default',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            labelStyle: { 
              fill: '#374151', 
              fontSize: 12,
              background: '#ffffff',
              padding: '2px 4px',
              borderRadius: '4px'
            },
          });
        }
      });
    });
    
    return edges;
  }, [currentProject]);

  console.log('=================== FlowEditor Initialization ===================');
  const initialNodes = createNodesFromParagraphs();
  const initialEdges = createEdgesFromChoices();
  
  console.log('FlowEditor - Initial nodes result:', initialNodes);
  console.log('FlowEditor - Initial edges result:', initialEdges);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  console.log('FlowEditor - useNodesState result - nodes:', nodes);
  console.log('FlowEditor - useEdgesState result - edges:', edges);
  
  // ドラッグ終了時のハンドラー
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const newPosition = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
    
    // Zustandストアに位置を保存
    updateParagraph(node.id, { position: newPosition });
  }, [updateParagraph]);

  // プロジェクトが変更された時にノードとエッジを更新
  useEffect(() => {
    console.log('FlowEditor - useEffect (project change) triggered');
    console.log('FlowEditor - currentProject in useEffect:', currentProject);
    if (currentProject) {
      const newNodes = createNodesFromParagraphs();
      const newEdges = createEdgesFromChoices();
      console.log('FlowEditor - Setting new nodes:', newNodes.length);
      console.log('FlowEditor - Setting new edges:', newEdges.length);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [currentProject?.id, currentProject?.paragraphs, setNodes, setEdges, createNodesFromParagraphs, createEdgesFromChoices]);

  // パラグラフデータが変更された時にノードとエッジを更新
  useEffect(() => {
    if (currentProject) {
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const paragraph = currentProject.paragraphs.find(p => p.id === node.id);
          if (paragraph?.position) {
            return {
              ...node,
              position: paragraph.position,
              data: { 
                paragraph: paragraph,
                onSelect: (id: string) => selectParagraph(id),
                onDelete: (id: string) => deleteParagraph(id),
              }
            };
          }
          return node;
        })
      );
      
      // エッジも更新
      const newEdges = createEdgesFromChoices();
      setEdges(newEdges);
    }
  }, [currentProject?.paragraphs, setNodes, setEdges, selectParagraph, deleteParagraph, createEdgesFromChoices]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-xl mb-2">📄</div>
          <p>プロジェクトが選択されていません</p>
          <p className="text-sm">パラグラフを作成してフローを表示してください</p>
        </div>
      </div>
    );
  }

  console.log('=================== FlowEditor Rendering ReactFlow ===================');
  console.log('FlowEditor - Final nodes for rendering:', nodes);
  console.log('FlowEditor - Final edges for rendering:', edges);
  console.log('FlowEditor - nodeTypes:', nodeTypes);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
      {/* デバッグ情報表示 */}
      <div className="absolute top-4 left-4 z-50 bg-yellow-200 p-2 text-xs border border-yellow-400 rounded shadow-lg">
        <div><strong>DEBUG INFO:</strong></div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        <div>Project: {currentProject ? 'Loaded' : 'None'}</div>
        <div>Project ID: {currentProject?.id || 'N/A'}</div>
        <div>Paragraphs: {currentProject?.paragraphs?.length || 0}</div>
        {nodes.length > 0 && (
          <div>First Node ID: {nodes[0].id}</div>
        )}
      </div>
      
      {/* 自動レイアウトボタン */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={autoLayout}
          variant="secondary"
          size="sm"
          className="bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
        >
          自動レイアウト
        </Button>
      </div>

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2">ノードが見つかりません</h3>
            <p className="text-sm">プロジェクトにパラグラフを追加してください</p>
            <div className="mt-4 text-xs bg-gray-100 p-2 rounded">
              <div>Debug: Project exists = {!!currentProject}</div>
              <div>Debug: Paragraphs = {currentProject?.paragraphs?.length || 0}</div>
            </div>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-white"
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};