import { Node, Edge } from 'reactflow';
import { Paragraph, Choice, ParagraphNodeData, ChoiceEdgeData } from '@/types';
import { generateId } from './index';

// 自動レイアウト用の定数
const HORIZONTAL_SPACING = 350;
const VERTICAL_SPACING = 250;

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

// 自動レイアウト（Dagre風の簡易版）
export const applyAutoLayout = (nodes: Node[], edges: Edge[]) => {
  const incomingEdges = new Map<string, Edge[]>();
  const outgoingEdges = new Map<string, Edge[]>();

  // エッジ情報を整理
  edges.forEach(edge => {
    const incoming = incomingEdges.get(edge.target) || [];
    incoming.push(edge);
    incomingEdges.set(edge.target, incoming);

    const outgoing = outgoingEdges.get(edge.source) || [];
    outgoing.push(edge);
    outgoingEdges.set(edge.source, outgoing);
  });

  // ルートノード（スタートノード）を見つける
  const rootNode = nodes.find(node => 
    (node.data as any)?.paragraph?.type === 'start' || 
    !incomingEdges.has(node.id)
  );

  if (!rootNode) return nodes;

  const positioned = new Set<string>();
  const newNodes = [...nodes];

  // 幅優先探索でレイアウト
  const queue: Array<{ nodeId: string; level: number; branchIndex: number }> = [
    { nodeId: rootNode.id, level: 0, branchIndex: 0 }
  ];

  while (queue.length > 0) {
    const { nodeId, level, branchIndex } = queue.shift()!;
    
    if (positioned.has(nodeId)) continue;
    positioned.add(nodeId);

    const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex >= 0) {
      newNodes[nodeIndex] = {
        ...newNodes[nodeIndex],
        position: {
          x: level * HORIZONTAL_SPACING,
          y: branchIndex * VERTICAL_SPACING,
        },
      };
    }

    // 子ノードをキューに追加
    const outgoing = outgoingEdges.get(nodeId) || [];
    outgoing.forEach((edge, index) => {
      if (!positioned.has(edge.target)) {
        queue.push({
          nodeId: edge.target,
          level: level + 1,
          branchIndex: branchIndex * outgoing.length + index,
        });
      }
    });
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