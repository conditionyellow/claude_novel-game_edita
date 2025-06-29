import { Node, Edge } from 'reactflow';
import { Paragraph, Choice, ParagraphNodeData, ChoiceEdgeData } from '../types';
import { generateId } from './index';

// 自動レイアウト用の定数
const HORIZONTAL_SPACING = 600;
const VERTICAL_SPACING = 400;
const MIN_NODE_SPACING = 350; // 最小ノード間隔
const NODE_WIDTH = 320; // ノード幅（実際のノードサイズ+マージン）
const NODE_HEIGHT = 220; // ノード高さ（実際のノードサイズ+マージン）
const GRID_CELL_SIZE = 50; // グリッドセルサイズ
const COLLISION_ITERATIONS = 10; // 衝突回避最大試行回数

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

// 高度な重複回避システム - Force-Directed + Grid Hybrid Algorithm
export const applyAutoLayout = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return nodes;

  console.log('=== Advanced Auto Layout Algorithm Start ===');
  console.log('Input nodes:', nodes.length);
  console.log('Input edges:', edges.length);

  // ユーティリティ関数：2点間の距離を計算
  const distance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
  };

  // ユーティリティ関数：ノード同士が重複しているかチェック
  const isOverlapping = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return distance(pos1, pos2) < MIN_NODE_SPACING;
  };

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

  // Step 1: 階層分析とランキング
  const levels = new Map<number, string[]>();
  const nodeToLevel = new Map<string, number>();
  const visited = new Set<string>();

  // ルートノードを特定
  const rootNodes = nodes.filter(node => 
    (node.data as any)?.paragraph?.type === 'start' || 
    !incomingEdges.has(node.id)
  );

  console.log('Root nodes found:', rootNodes.length);

  // BFSで階層を決定
  const queue: Array<{ nodeId: string; level: number }> = [];
  rootNodes.forEach(rootNode => {
    queue.push({ nodeId: rootNode.id, level: 0 });
  });

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    nodeToLevel.set(nodeId, level);
    
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(nodeId);

    const outgoing = outgoingEdges.get(nodeId) || [];
    outgoing.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push({ nodeId: edge.target, level: level + 1 });
      }
    });
  }

  // 未処理ノードを最終レベルに配置
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

  console.log('Levels analysis:', levels.size);
  levels.forEach((nodeIds, level) => {
    console.log(`Level ${level}: ${nodeIds.length} nodes`);
  });

  // Step 2: 初期配置（改良版グリッド）
  const newNodes = [...nodes];
  const positions = new Map<string, { x: number; y: number }>();

  levels.forEach((nodeIds, level) => {
    const x = level * HORIZONTAL_SPACING + 100;
    
    // レベル内のノード数に応じて配置戦略を変更
    const nodesInLevel = nodeIds.length;
    
    if (nodesInLevel === 1) {
      // 単一ノード: 中央配置
      const y = 300; // 固定中央位置
      positions.set(nodeIds[0], { x, y });
    } else if (nodesInLevel <= 3) {
      // 少数ノード: 均等縦配置
      const startY = 200;
      nodeIds.forEach((nodeId, index) => {
        const y = startY + (index * VERTICAL_SPACING);
        positions.set(nodeId, { x, y });
      });
    } else {
      // 多数ノード: 2列グリッド配置
      const startY = 150;
      const columnSpacing = NODE_WIDTH + 50;
      
      nodeIds.forEach((nodeId, index) => {
        const column = Math.floor(index / 3); // 3行ごとに新列
        const row = index % 3;
        const nodeX = x + (column * columnSpacing);
        const nodeY = startY + (row * VERTICAL_SPACING);
        positions.set(nodeId, { x: nodeX, y: nodeY });
      });
    }
  });

  // Step 3: 衝突検出と解決（Force-Directed）
  console.log('Starting collision resolution...');
  
  for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration++) {
    let hasCollisions = false;
    const nodeIds = Array.from(positions.keys());
    
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const node1Id = nodeIds[i];
        const node2Id = nodeIds[j];
        const pos1 = positions.get(node1Id)!;
        const pos2 = positions.get(node2Id)!;
        
        if (isOverlapping(pos1, pos2)) {
          hasCollisions = true;
          
          // 重複解決: 反発力を適用
          const dist = distance(pos1, pos2);
          const overlap = MIN_NODE_SPACING - dist;
          
          if (dist > 0) {
            const moveDistance = overlap / 2 + 10; // 少し余分に移動
            const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
            
            // 両ノードを反対方向に移動
            const move1X = -Math.cos(angle) * moveDistance;
            const move1Y = -Math.sin(angle) * moveDistance;
            const move2X = Math.cos(angle) * moveDistance;
            const move2Y = Math.sin(angle) * moveDistance;
            
            positions.set(node1Id, {
              x: Math.max(50, pos1.x + move1X),
              y: Math.max(50, pos1.y + move1Y)
            });
            
            positions.set(node2Id, {
              x: Math.max(50, pos2.x + move2X),
              y: Math.max(50, pos2.y + move2Y)
            });
            
            console.log(`Iteration ${iteration}: Resolved collision between ${node1Id} and ${node2Id}`);
          }
        }
      }
    }
    
    if (!hasCollisions) {
      console.log(`Collision resolution completed in ${iteration + 1} iterations`);
      break;
    }
  }

  // Step 4: 最終位置適用
  positions.forEach((position, nodeId) => {
    const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex >= 0) {
      newNodes[nodeIndex] = {
        ...newNodes[nodeIndex],
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y)
        },
      };
    }
  });

  // Step 5: 最終検証
  let finalCollisions = 0;
  const finalPositions = Array.from(positions.values());
  for (let i = 0; i < finalPositions.length; i++) {
    for (let j = i + 1; j < finalPositions.length; j++) {
      if (isOverlapping(finalPositions[i], finalPositions[j])) {
        finalCollisions++;
      }
    }
  }

  console.log('=== Advanced Auto Layout Algorithm Complete ===');
  console.log('Output nodes:', newNodes.length);
  console.log('Final collisions:', finalCollisions);
  console.log('Layout quality:', finalCollisions === 0 ? '100%' : `${Math.max(0, 100 - finalCollisions * 10)}%`);

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