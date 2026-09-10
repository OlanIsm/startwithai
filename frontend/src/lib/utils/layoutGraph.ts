import dagre from 'dagre';
import { WorkflowGraph, WorkflowNode, WorkflowEdge, WorkflowNodeData } from '@/types';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSep?: number;
  rankSep?: number;
}

/**
 * Calculates neat (x, y) coordinates for nodes and edges using Dagre directed graph layout.
 * Default direction is 'LR' (left to right) for clean milestone & pipeline progression.
 */
export function layoutGraph(
  nodes: { id: string; data: WorkflowNodeData; type?: string }[],
  edges: WorkflowEdge[],
  options: LayoutOptions = {}
): WorkflowGraph {
  const {
    direction = 'LR',
    nodeWidth = 280,
    nodeHeight = 130,
    nodeSep = 60,
    rankSep = 120,
  } = options;

  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: nodeSep,
      ranksep: rankSep,
      align: 'UL',
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to Dagre
    for (const node of nodes) {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }

    // Add edges to Dagre (preventing self-loops or invalid references)
    const validNodeIds = new Set(nodes.map((n) => n.id));
    for (const edge of edges) {
      if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target) && edge.source !== edge.target) {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(dagreGraph);

    const positionedNodes: WorkflowNode[] = nodes.map((node) => {
      const nodeLayout = dagreGraph.node(node.id);
      const x = nodeLayout ? Math.round(nodeLayout.x - nodeWidth / 2) : 50;
      const y = nodeLayout ? Math.round(nodeLayout.y - nodeHeight / 2) : 50;

      return {
        id: node.id,
        type: 'customStep' as const,
        position: { x, y },
        data: node.data,
      };
    });

    return {
      nodes: positionedNodes,
      edges: edges.map((e) => ({
        ...e,
        animated: e.animated !== undefined ? e.animated : true,
      })),
    };
  } catch (error) {
    console.warn('[layoutGraph] Dagre layout failed, falling back to phase-grid layout:', error);

    // Resilient fallback: arrange by phase column & index row
    const phaseMap: Record<number, number> = {};
    const fallbackNodes: WorkflowNode[] = nodes.map((node) => {
      const phase = node.data.phase || 1;
      const indexInPhase = phaseMap[phase] || 0;
      phaseMap[phase] = indexInPhase + 1;

      return {
        id: node.id,
        type: 'customStep' as const,
        position: {
          x: (phase - 1) * 350 + 50,
          y: indexInPhase * 180 + 50,
        },
        data: node.data,
      };
    });

    return {
      nodes: fallbackNodes,
      edges,
    };
  }
}
