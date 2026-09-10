"use client";

import { Check, Clipboard, Terminal, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WorkflowNodeData } from "@/types";

interface NodeDetailModalProps {
  node: WorkflowNodeData | null;
  onClose: () => void;
}

export function NodeDetailModal({ node, onClose }: NodeDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!node) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [node, onClose]);

  if (!node) return null;

  const copyCommand = async () => {
    await navigator.clipboard.writeText(node.cliCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <aside className="node-inspector" aria-label={`Details for ${node.label}`}>
      <div className="inspector-head">
        <div>
          <span className="inspector-id">{node.id}</span>
          <h2>{node.label}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close inspector">
          <X size={18} />
        </button>
      </div>
      <div className="inspector-scroll">
        <section>
          <div className="section-label">Build brief</div>
          <p>{node.description}</p>
          <div className="detail-strip">
            <span>Phase {node.phase}</span>
            <span className={`status-text status-${node.status}`}>{node.status.replace("_", " ")}</span>
          </div>
        </section>
        <section>
          <div className="section-label">Acceptance criteria</div>
          {node.acceptanceCriteria?.length ? (
            <ul className="criteria-list">
              {node.acceptanceCriteria.map((criterion) => (
                <li key={criterion}>
                  <span><Check size={14} /></span>{criterion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">Acceptance criteria will appear when the generated plan includes them.</p>
          )}
        </section>
        {node.dependencies.length > 0 && (
          <section>
            <div className="section-label">Depends on</div>
            <div className="dependency-list">
              {node.dependencies.map((dependency) => <code key={dependency}>{dependency}</code>)}
            </div>
          </section>
        )}
        <section>
          <div className="section-label"><Terminal size={14} /> Agent telemetry command</div>
          <div className="command-block">
            <code>{node.cliCommand}</code>
            <button type="button" onClick={copyCommand} aria-label="Copy CLI command">
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <p className="command-help">Run this when the task state changes to update the canvas live.</p>
        </section>
      </div>
    </aside>
  );
}
