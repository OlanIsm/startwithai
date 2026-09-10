"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Connection,
  type EdgeChange,
  MiniMap,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";
import { CustomStepNode } from "./CustomStepNode";
import { CanvasToolbar } from "./CanvasToolbar";
import { NodeDetailModal } from "./NodeDetailModal";
import { useAppStore } from "@/lib/store/useAppStore";
import type { NodeStatus, WorkflowEdge, WorkflowNode, WorkflowNodeData } from "@/types";

const nodeTypes = { customStep: CustomStepNode };

function CanvasSurface() {
  const nodes = useAppStore((state) => state.nodes);
  const edges = useAppStore((state) => state.edges);
  const setNodes = useAppStore((state) => state.setNodes);
  const setEdges = useAppStore((state) => state.setEdges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [activeStatus, setActiveStatus] = useState<NodeStatus | "all">("all");

  const visibleNodes = useMemo(
    () => nodes.map((node) => ({ ...node, hidden: activeStatus !== "all" && node.data.status !== activeStatus })),
    [activeStatus, nodes],
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.filter((node) => !node.hidden).map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, hidden: !visibleIds.has(edge.source) || !visibleIds.has(edge.target) })),
    [edges, visibleIds],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<WorkflowEdge>[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges(addEdge({ ...connection, type: "smoothstep" }, edges)),
    [edges, setEdges],
  );

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node.data)}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep", style: { strokeWidth: 1.6 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#33413d" />
        <MiniMap
          className="canvas-minimap"
          nodeColor={(node) => {
            const status = (node.data as WorkflowNodeData).status;
            return status === "done" ? "#79c79b" : status === "blocked" ? "#ee786f" : status === "in_progress" ? "#efb34f" : "#66736f";
          }}
          maskColor="rgba(9, 14, 13, .76)"
          pannable
          zoomable
        />
        <CanvasToolbar activeStatus={activeStatus} onStatusChange={setActiveStatus} />
      </ReactFlow>
      <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasSurface />
    </ReactFlowProvider>
  );
}
