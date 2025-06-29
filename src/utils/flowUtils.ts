import { Node, Edge } from 'reactflow';
import { Paragraph, Choice, ParagraphNodeData, ChoiceEdgeData } from '../types';
import { generateId } from './index';

// 自動レイアウト用の定数
const HORIZONTAL_SPACING = 500;
const VERTICAL_SPACING = 300;
const MIN_NODE_SPACING = 200; // 最小ノード間隔
const NODE_WIDTH = 300; // ノード幅
const NODE_HEIGHT = 200; // ノード高さ

// パラグラフからフローノードを作成
export const createFlowNode = (
  paragraph: Paragraph,
  position: { x: number; y: number },
  onSelect?: (id: string) => void,
  onDelete?: (id: string) => void
): Node<ParagraphNodeData> => {
  const getNodeType = (type: string) => {
    switch (type) {
      case 'start':
        return 'startNode';
      case 'end':
        return 'endNode';
      default:
        return 'paragraphNode';
    }
  };

  return {
    id: paragraph.id,
    type: getNodeType(paragraph.type),
    position,
    data: {
      paragraph,
      onSelect,
      onDelete,
    },
    draggable: true,
    selectable: true,
  };
};

// 選択肢からフローエッジを作成
export const createFlowEdge = (
  sourceId: string,
  targetId: string,
  choice: Choice,
  onDelete?: (edgeId: string) => void
): Edge<ChoiceEdgeData> => {
  return {
    id: generateId(),
    source: sourceId,
    target: targetId,
    type: 'choice',
    animated: false,
    data: {
      choice,
      onDelete,
    },
    className: 'react-flow__edge-choice',
  };
};

// パラグラフ配列からフローデータを生成
export const convertParagraphsToFlow = (
  paragraphs: Paragraph[],
  onSelectNode?: (id: string) => void,
  onDeleteNode?: (id: string) => void,
  onDeleteEdge?: (edgeId: string) => void
) => {
  // ノードの生成
  const nodes: Node<ParagraphNodeData>[] = [];
  const edges: Edge<ChoiceEdgeData>[] = [];

  // スタートノードを見つける
  const startParagraph = paragraphs.find(p => p.type === 'start');
  if (!startParagraph) {
    return { nodes, edges };
  }

  // レイアウト計算のためのグラフ構造を作成
  const paragraphMap = new Map(paragraphs.map(p => [p.id, p]));
  const visited = new Set<string>();
  const positions = new Map<string, { x: number; y: number }>();

  // 階層的レイアウトを計算
  const calculateLayout = (paragraphId: string, level: number = 0, branchIndex: number = 0) => {
    if (visited.has(paragraphId)) return;
    visited.add(paragraphId);

    const paragraph = paragraphMap.get(paragraphId);
    if (!paragraph) return;

    // 位置を計算
    const x = level * HORIZONTAL_SPACING;
    const y = branchIndex * VERTICAL_SPACING;
    positions.set(paragraphId, { x, y });

    // 子ノードを処理
    paragraph.content.choices.forEach((choice, index) => {
      if (choice.targetParagraphId) {
        calculateLayout(choice.targetParagraphId, level + 1, branchIndex + index);
      }
    });
  };

  // スタートノードから開始
  calculateLayout(startParagraph.id);

  // 未接続のノードも配置
  paragraphs.forEach((paragraph, index) => {
    if (!positions.has(paragraph.id)) {
      positions.set(paragraph.id, {
        x: 0,
        y: (index + 1) * VERTICAL_SPACING,
      });
    }
  });

  // ノードを作成
  paragraphs.forEach(paragraph => {
    const position = positions.get(paragraph.id) || { x: 0, y: 0 };
    nodes.push(createFlowNode(paragraph, position, onSelectNode, onDeleteNode));
  });

  // エッジを作成
  paragraphs.forEach(paragraph => {
    paragraph.content.choices.forEach(choice => {
      if (choice.targetParagraphId && paragraphMap.has(choice.targetParagraphId)) {
        edges.push(createFlowEdge(
          paragraph.id,
          choice.targetParagraphId,
          choice,
          onDeleteEdge
        ));
      }
    });
  });

  return { nodes, edges };
};

// グリッドベース自動レイアウト（重複完全回避）
export const applyAutoLayout = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return nodes;

  console.log('=== Auto Layout Algorithm Start ===');
  console.log('Input nodes:', nodes.length);
  console.log('Input edges:', edges.length);

  // エッジ情報を整理
  const incomingEdges = new Map<string, Edge[]>();
  const outgoingEdges = new Map<string, Edge[]>();

  edges.forEach(edge => {
    const incoming = incomingEdges.get(edge.target) || [];
    incoming.push(edge);
    incomingEdges.set(edge.target, incoming);

    const outgoing = outgoingEdges.get(edge.source) || [];
    outgoing.push(edge);
    outgoingEdges.set(edge.source, outgoing);
  });

  // ノードを階層別に分類
  const levels = new Map<number, string[]>();
  const nodeToLevel = new Map<string, number>();
  const visited = new Set<string>();

  // ルートノード（スタートノードまたは入力エッジなし）を見つける
  const rootNodes = nodes.filter(node => 
    (node.data as any)?.paragraph?.type === 'start' || 
    !incomingEdges.has(node.id)
  );

  console.log('Root nodes found:', rootNodes.length);

  // BFSで階層を決定
  const queue: Array<{ nodeId: string; level: number }> = [];
  
  // ルートノードを処理
  rootNodes.forEach(rootNode => {
    queue.push({ nodeId: rootNode.id, level: 0 });
  });

  // 孤立ノードも処理対象に追加
  nodes.forEach(node => {
    if (!incomingEdges.has(node.id) && !outgoingEdges.has(node.id)) {
      queue.push({ nodeId: node.id, level: 0 });
    }
  });

  // BFSで階層決定
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    nodeToLevel.set(nodeId, level);
    
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(nodeId);

    // 子ノードを次のレベルに追加
    const outgoing = outgoingEdges.get(nodeId) || [];
    outgoing.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push({ nodeId: edge.target, level: level + 1 });
      }
    });
  }

  // 処理されていないノードを最下位レベルに配置
  const maxLevel = Math.max(...Array.from(levels.keys()), -1) + 1;
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      if (!levels.has(maxLevel)) {
        levels.set(maxLevel, []);
      }
      levels.get(maxLevel)!.push(node.id);
      nodeToLevel.set(node.id, maxLevel);
    }
  });

  console.log('Levels created:', levels.size);
  levels.forEach((nodeIds, level) => {
    console.log(`Level ${level}: ${nodeIds.length} nodes`);
  });

  // グリッドベース配置
  const newNodes = [...nodes];
  const occupiedPositions = new Set<string>();

  // 各レベルのノードを配置
  levels.forEach((nodeIds, level) => {
    const x = level * HORIZONTAL_SPACING + 100; // 左端マージン
    
    // 各レベル内でのY座標を均等配置
    nodeIds.forEach((nodeId, indexInLevel) => {
      let y = indexInLevel * VERTICAL_SPACING + 100;
      
      // 重複チェック & 位置調整
      let positionKey = `${x}-${y}`;
      let attempts = 0;
      while (occupiedPositions.has(positionKey) && attempts < 50) {
        y += VERTICAL_SPACING / 2; // 半分の間隔で調整
        positionKey = `${x}-${y}`;
        attempts++;
      }
      
      occupiedPositions.add(positionKey);
      
      const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
      if (nodeIndex >= 0) {
        newNodes[nodeIndex] = {
          ...newNodes[nodeIndex],
          position: { x, y },
        };
        console.log(`Positioned node ${nodeId} at (${x}, ${y}) - Level ${level}, Index ${indexInLevel}`);
      }
    });
  });

  console.log('=== Auto Layout Algorithm Complete ===');
  console.log('Output nodes:', newNodes.length);
  console.log('Occupied positions:', occupiedPositions.size);

  return newNodes;
};

// フローからパラグラフ位置を更新
export const updateParagraphPositions = (
  paragraphs: Paragraph[],
  nodes: Node[]
): Paragraph[] => {
  const nodePositions = new Map(
    nodes.map(node => [node.id, node.position])
  );

  return paragraphs.map(paragraph => ({
    ...paragraph,
    position: nodePositions.get(paragraph.id) || paragraph.position || { x: 0, y: 0 },
  }));
};