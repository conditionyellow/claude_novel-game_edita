import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Node, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { useEditorStore } from '../../stores/editorStore';
import { ParagraphNode } from './ParagraphNode';
import { Button } from '../UI';
import { applyAutoLayout } from '../../utils/flowUtils';

// カスタムノードタイプの定義
const nodeTypes = {
  paragraph: ParagraphNode,
};

export const FlowEditor: React.FC = () => {
  const { currentProject, updateParagraph, selectParagraph, deleteParagraph } = useEditorStore();
  
  // デバッグモードでのみログ出力
  const DEBUG_MODE = false; // 本番では false に設定
  
  if (DEBUG_MODE) {
    console.log('FlowEditor - currentProject exists:', !!currentProject);
    console.log('FlowEditor - paragraphs count:', currentProject?.paragraphs?.length || 0);
  }

  
  // プロジェクトのパラグラフからノードを作成
  const createNodesFromParagraphs = useCallback(() => {
    if (DEBUG_MODE) console.log('createNodesFromParagraphs called');
    if (!currentProject) {
      if (DEBUG_MODE) console.log('No currentProject available');
      return [];
    }
    
    const nodes = currentProject.paragraphs.map((paragraph, index) => {
      const node = {
        id: paragraph.id,
        type: 'paragraph',
        position: paragraph.position || { x: 100 + (index * 400), y: 100 + (index * 300) },
        data: { 
          paragraph: paragraph,
          onSelect: (id: string) => {
            if (DEBUG_MODE) console.log('Node onSelect called with id:', id);
            selectParagraph(id);
          },
          onDelete: (id: string) => {
            if (DEBUG_MODE) console.log('Node onDelete called with id:', id);
            deleteParagraph(id);
          },
        },
        draggable: true,
      };
      if (DEBUG_MODE) console.log(`FlowEditor - Created node ${index + 1}:`, node);
      return node;
    });
    
    if (DEBUG_MODE) console.log('FlowEditor - Total nodes created:', nodes.length);
    if (DEBUG_MODE) console.log('FlowEditor - All nodes:', nodes);
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

  if (DEBUG_MODE) console.log('=================== FlowEditor Initialization ===================');
  const initialNodes = createNodesFromParagraphs();
  const initialEdges = createEdgesFromChoices();
  
  if (DEBUG_MODE) console.log('FlowEditor - Initial nodes result:', initialNodes);
  if (DEBUG_MODE) console.log('FlowEditor - Initial edges result:', initialEdges);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  if (DEBUG_MODE) console.log('FlowEditor - useNodesState result - nodes:', nodes);
  if (DEBUG_MODE) console.log('FlowEditor - useEdgesState result - edges:', edges);

  // 改善された自動レイアウト機能
  const autoLayout = useCallback(() => {
    if (!currentProject || currentProject.paragraphs.length === 0) return;

    if (DEBUG_MODE) console.log('自動レイアウト開始 - パラグラフ数:', currentProject.paragraphs.length);

    // 現在のノードとエッジを取得
    const currentNodes = nodes;
    const currentEdges = edges;

    if (DEBUG_MODE) console.log('現在のノード数:', currentNodes.length);
    if (DEBUG_MODE) console.log('現在のエッジ数:', currentEdges.length);

    // flowUtilsの高度なレイアウトアルゴリズムを適用
    const layoutedNodes = applyAutoLayout(currentNodes, currentEdges);

    if (DEBUG_MODE) console.log('レイアウト後のノード数:', layoutedNodes.length);

    // 計算された位置をパラグラフに反映
    layoutedNodes.forEach(node => {
      const paragraph = currentProject.paragraphs.find(p => p.id === node.id);
      if (paragraph) {
        if (DEBUG_MODE) console.log(`ノード ${paragraph.title} の位置を更新:`, node.position);
        updateParagraph(paragraph.id, {
          position: node.position
        });
      }
    });

    // ノードの位置を更新
    setNodes(layoutedNodes);

    if (DEBUG_MODE) console.log('自動レイアウト完了');
  }, [currentProject, updateParagraph, nodes, edges, setNodes]);
  
  // ドラッグ終了時のハンドラー
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const newPosition = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
    
    // Zustandストアに位置を保存
    updateParagraph(node.id, { position: newPosition });
  }, [updateParagraph]);

  // プロジェクトが変更された時にノードとエッジを更新
  useEffect(() => {
    if (DEBUG_MODE) console.log('FlowEditor - useEffect (project change) triggered');
    if (DEBUG_MODE) console.log('FlowEditor - currentProject in useEffect:', currentProject);
    if (currentProject) {
      const newNodes = createNodesFromParagraphs();
      const newEdges = createEdgesFromChoices();
      if (DEBUG_MODE) console.log('FlowEditor - Setting new nodes:', newNodes.length);
      if (DEBUG_MODE) console.log('FlowEditor - Setting new edges:', newEdges.length);
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

  if (DEBUG_MODE) console.log('=================== FlowEditor Rendering ReactFlow ===================');
  if (DEBUG_MODE) console.log('FlowEditor - Final nodes for rendering:', nodes);
  if (DEBUG_MODE) console.log('FlowEditor - Final edges for rendering:', edges);
  if (DEBUG_MODE) console.log('FlowEditor - nodeTypes:', nodeTypes);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
      {/* デバッグ情報表示 (DEBUG_MODEが有効な時のみ) */}
      {DEBUG_MODE && (
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
      )}
      
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
            {DEBUG_MODE && (
              <div className="mt-4 text-xs bg-gray-100 p-2 rounded">
                <div>Debug: Project exists = {!!currentProject}</div>
                <div>Debug: Paragraphs = {currentProject?.paragraphs?.length || 0}</div>
              </div>
            )}
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