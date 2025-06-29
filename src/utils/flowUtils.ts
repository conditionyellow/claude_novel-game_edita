import { Node, Edge } from 'reactflow';
import { Paragraph, Choice, ParagraphNodeData, ChoiceEdgeData } from '../types';
import { generateId } from './index';

// 120点品質レイアウト用の定数
const HORIZONTAL_SPACING = 750; // より広い水平間隔
const VERTICAL_SPACING = 500;   // より広い垂直間隔
const MIN_NODE_SPACING = 450;   // より大きな最小間隔（実ノードサイズ考慮）
const NODE_WIDTH = 400;         // 実際のノード幅+十分なマージン
const NODE_HEIGHT = 250;        // 実際のノード高+十分なマージン
const GRID_CELL_SIZE = 50;      // グリッドセルサイズ
const COLLISION_ITERATIONS = 25; // 衝突回避最大試行回数（大幅増加）
const FORCE_MULTIPLIER = 1.5;   // 反発力倍率
const ADAPTIVE_SPACING = true;   // 適応的間隔調整

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

// 120点品質 - Multi-Phase Iterative Collision Resolution + Adaptive Force System
export const applyAutoLayout = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return nodes;

  console.log('=== 120-Point Quality Auto Layout Algorithm Start ===');
  console.log('Input nodes:', nodes.length);
  console.log('Input edges:', edges.length);

  // 高度ユーティリティ関数
  const distance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
  };

  // 改良された重複判定（より厳密）
  const isOverlapping = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dist = distance(pos1, pos2);
    return dist < MIN_NODE_SPACING;
  };

  // 重複度合いを計算（0-1の範囲）
  const getOverlapSeverity = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dist = distance(pos1, pos2);
    if (dist >= MIN_NODE_SPACING) return 0;
    return (MIN_NODE_SPACING - dist) / MIN_NODE_SPACING;
  };

  // 適応的反発力計算
  const calculateRepulsiveForce = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const dist = distance(pos1, pos2);
    if (dist >= MIN_NODE_SPACING) return { x: 0, y: 0 };
    
    const severity = getOverlapSeverity(pos1, pos2);
    const baseForce = (MIN_NODE_SPACING - dist) * FORCE_MULTIPLIER;
    const adaptiveForce = baseForce * (1 + severity * 2); // 重複が酷いほど強い力
    
    if (dist === 0) {
      // 完全重複の場合はランダム方向に押し出し
      const randomAngle = Math.random() * 2 * Math.PI;
      return {
        x: Math.cos(randomAngle) * adaptiveForce,
        y: Math.sin(randomAngle) * adaptiveForce
      };
    }
    
    const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
    return {
      x: Math.cos(angle) * adaptiveForce,
      y: Math.sin(angle) * adaptiveForce
    };
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

  // Step 2: 改良版初期配置（120点品質）
  const newNodes = [...nodes];
  const positions = new Map<string, { x: number; y: number }>();

  levels.forEach((nodeIds, level) => {
    const x = level * HORIZONTAL_SPACING + 150; // より大きな左マージン
    
    const nodesInLevel = nodeIds.length;
    console.log(`Level ${level}: Placing ${nodesInLevel} nodes`);
    
    if (nodesInLevel === 1) {
      // 単一ノード: 中央配置
      const y = 400; // より下に配置
      positions.set(nodeIds[0], { x, y });
      console.log(`Single node positioned at (${x}, ${y})`);
    } else if (nodesInLevel === 2) {
      // 2ノード: 大きな縦間隔で配置
      const startY = 250;
      nodeIds.forEach((nodeId, index) => {
        const y = startY + (index * VERTICAL_SPACING * 1.2); // 1.2倍の間隔
        positions.set(nodeId, { x, y });
        console.log(`Dual node ${index} positioned at (${x}, ${y})`);
      });
    } else if (nodesInLevel === 3) {
      // 3ノード: 十分な縦間隔で配置
      const startY = 200;
      nodeIds.forEach((nodeId, index) => {
        const y = startY + (index * VERTICAL_SPACING);
        positions.set(nodeId, { x, y });
        console.log(`Triple node ${index} positioned at (${x}, ${y})`);
      });
    } else {
      // 4ノード以上: 改良版2列グリッド（より大きな間隔）
      const startY = 150;
      const columnSpacing = NODE_WIDTH + 150; // より大きな列間隔
      const maxRowsPerColumn = Math.ceil(nodesInLevel / 2); // 2列に均等分散
      
      nodeIds.forEach((nodeId, index) => {
        const column = Math.floor(index / maxRowsPerColumn);
        const row = index % maxRowsPerColumn;
        const nodeX = x + (column * columnSpacing);
        const nodeY = startY + (row * VERTICAL_SPACING * 1.1); // 少し広めの行間隔
        positions.set(nodeId, { x: nodeX, y: nodeY });
        console.log(`Grid node ${index} positioned at (${nodeX}, ${nodeY}) - Col:${column}, Row:${row}`);
      });
    }
  });

  // Step 3: 高度衝突検出と解決（Multi-Phase Adaptive Force-Directed）
  console.log('Starting advanced collision resolution...');
  
  let totalCollisionsResolved = 0;
  
  for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration++) {
    let hasCollisions = false;
    let iterationCollisions = 0;
    const nodeIds = Array.from(positions.keys());
    const forces = new Map<string, { x: number; y: number }>();
    
    // 各ノードの受ける総合力を計算
    nodeIds.forEach(nodeId => {
      forces.set(nodeId, { x: 0, y: 0 });
    });
    
    // 全ペアで衝突チェックと力の計算
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const node1Id = nodeIds[i];
        const node2Id = nodeIds[j];
        const pos1 = positions.get(node1Id)!;
        const pos2 = positions.get(node2Id)!;
        
        if (isOverlapping(pos1, pos2)) {
          hasCollisions = true;
          iterationCollisions++;
          
          // 適応的反発力を計算
          const force1 = calculateRepulsiveForce(pos1, pos2);
          const force2 = { x: -force1.x, y: -force1.y };
          
          // 力を累積
          const currentForce1 = forces.get(node1Id)!;
          const currentForce2 = forces.get(node2Id)!;
          
          forces.set(node1Id, {
            x: currentForce1.x + force1.x,
            y: currentForce1.y + force1.y
          });
          
          forces.set(node2Id, {
            x: currentForce2.x + force2.x,
            y: currentForce2.y + force2.y
          });
          
          const severity = getOverlapSeverity(pos1, pos2);
          console.log(`Iteration ${iteration}: Collision ${node1Id}↔${node2Id}, severity: ${severity.toFixed(2)}`);
        }
      }
    }
    
    // 力を適用して位置を更新
    if (hasCollisions) {
      nodeIds.forEach(nodeId => {
        const force = forces.get(nodeId)!;
        if (force.x !== 0 || force.y !== 0) {
          const currentPos = positions.get(nodeId)!;
          
          // 減衰係数（反復回数が多いほど小さく）
          const dampingFactor = Math.max(0.3, 1.0 - (iteration / COLLISION_ITERATIONS));
          
          const newPos = {
            x: Math.max(100, currentPos.x + force.x * dampingFactor),
            y: Math.max(100, currentPos.y + force.y * dampingFactor)
          };
          
          positions.set(nodeId, newPos);
          console.log(`Node ${nodeId} moved by force (${force.x.toFixed(1)}, ${force.y.toFixed(1)}) to (${newPos.x.toFixed(1)}, ${newPos.y.toFixed(1)})`);
        }
      });
      
      totalCollisionsResolved += iterationCollisions;
    }
    
    if (!hasCollisions) {
      console.log(`🎯 Collision resolution completed in ${iteration + 1} iterations`);
      console.log(`📊 Total collisions resolved: ${totalCollisionsResolved}`);
      break;
    }
    
    if (iteration === COLLISION_ITERATIONS - 1) {
      console.warn(`⚠️  Maximum iterations reached. ${iterationCollisions} collisions remaining.`);
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

  // Step 5: 最終品質検証（120点システム）
  let finalCollisions = 0;
  let minDistance = Infinity;
  let maxSeverity = 0;
  const finalPositions = Array.from(positions.values());
  const nodeIds = Array.from(positions.keys());
  
  console.log('=== Final Quality Assessment ===');
  
  for (let i = 0; i < finalPositions.length; i++) {
    for (let j = i + 1; j < finalPositions.length; j++) {
      const dist = distance(finalPositions[i], finalPositions[j]);
      minDistance = Math.min(minDistance, dist);
      
      if (isOverlapping(finalPositions[i], finalPositions[j])) {
        finalCollisions++;
        const severity = getOverlapSeverity(finalPositions[i], finalPositions[j]);
        maxSeverity = Math.max(maxSeverity, severity);
        console.warn(`❌ Remaining collision: ${nodeIds[i]} ↔ ${nodeIds[j]}, distance: ${dist.toFixed(1)}px, severity: ${severity.toFixed(3)}`);
      }
    }
  }
  
  // 品質スコア計算（120点満点）
  let qualityScore = 120;
  
  // 衝突ペナルティ
  qualityScore -= finalCollisions * 30; // 1衝突 = -30点
  
  // 最小距離ボーナス/ペナルティ
  if (minDistance >= MIN_NODE_SPACING * 1.2) {
    qualityScore += 10; // 余裕ある配置 = +10点
  } else if (minDistance < MIN_NODE_SPACING * 0.8) {
    qualityScore -= 20; // 狭すぎる配置 = -20点
  }
  
  // 重複度ペナルティ
  qualityScore -= Math.floor(maxSeverity * 50); // 重複度に応じたペナルティ
  
  qualityScore = Math.max(0, Math.min(120, qualityScore));
  
  console.log('=== 120-Point Quality Auto Layout Algorithm Complete ===');
  console.log('📊 Results Summary:');
  console.log(`   • Output nodes: ${newNodes.length}`);
  console.log(`   • Final collisions: ${finalCollisions}`);
  console.log(`   • Minimum distance: ${minDistance.toFixed(1)}px (target: ${MIN_NODE_SPACING}px)`);
  console.log(`   • Maximum overlap severity: ${maxSeverity.toFixed(3)}`);
  console.log(`   • Quality score: ${qualityScore}/120 (${(qualityScore/120*100).toFixed(1)}%)`);
  
  if (finalCollisions === 0) {
    console.log('🎉 Perfect layout achieved! Zero collisions detected.');
  } else {
    console.log(`⚠️  ${finalCollisions} collision(s) remain. Consider increasing COLLISION_ITERATIONS.`);
  }

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