"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import type { NodeStatus } from "@/types";

interface CanvasToolbarProps {
  activeStatus: NodeStatus | "all";
  onStatusChange: (status: NodeStatus | "all") => void;
}

export function CanvasToolbar({ activeStatus, onStatusChange }: CanvasToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="canvas-toolbar">
      <div className="zoom-controls" aria-label="Canvas zoom controls">
        <button type="button" onClick={() => zoomOut()} aria-label="Zoom out"><Minus size={17} /></button>
        <button type="button" onClick={() => zoomIn()} aria-label="Zoom in"><Plus size={17} /></button>
        <button type="button" onClick={() => fitView({ padding: 0.2 })} aria-label="Fit workflow"><LocateFixed size={17} /></button>
      </div>
      <label className="status-filter">
        <span>Status</span>
        <select value={activeStatus} onChange={(event) => onStatusChange(event.target.value as NodeStatus | "all")}>
          <option value="all">All steps</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
    </div>
  );
}
