"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, CircleDashed, OctagonAlert, Radio, Route } from "lucide-react";
import type { WorkflowNode } from "@/types";

const statusLabel = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export function CustomStepNode({ data, selected }: NodeProps<WorkflowNode>) {
  const StatusIcon =
    data.status === "done"
      ? Check
      : data.status === "blocked"
        ? OctagonAlert
        : data.status === "in_progress"
          ? Radio
          : CircleDashed;

  return (
    <article className={`workflow-node status-${data.status}${selected ? " is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-topline">
        <span className="node-port">{data.id}</span>
        <span className="node-phase">P{data.phase}</span>
      </div>
      <h3>{data.label}</h3>
      <p>{data.description}</p>
      <div className="node-status">
        <StatusIcon size={14} aria-hidden="true" />
        <span>{statusLabel[data.status]}</span>
        {data.dependencies.length > 0 && (
          <span className="dependency-count">
            <Route size={13} /> {data.dependencies.length}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </article>
  );
}
