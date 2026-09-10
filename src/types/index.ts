import type { Edge, Node } from "@xyflow/react";

export type NodeStatus = "pending" | "in_progress" | "done" | "blocked";

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface ProductQuestion {
  id: string;
  question: string;
  helperText?: string;
  multiSelect?: boolean;
  isMultiSelect?: boolean;
  type?: "single" | "multi";
  options: QuestionOption[];
}

export type Question = ProductQuestion;

export interface WorkflowNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  description: string;
  status: NodeStatus;
  phase: number;
  dependencies: string[];
  cliCommand: string;
  acceptanceCriteria?: string[];
}

export type WorkflowNode = Node<WorkflowNodeData, "customStep">;
export type WorkflowEdge = Edge;

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface SessionData {
  id: string;
  appName: string;
  rawPrompt: string;
  answers: Record<string, string | string[]>;
  graph: WorkflowGraph;
  prdMarkdown: string;
  createdAt: number;
  updatedAt?: number;
}

export interface UpdateStatusRequest {
  sessionId: string;
  stepId: string;
  status: NodeStatus;
  notes?: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  message?: string;
  updatedNode?: WorkflowNodeData;
  notes?: string;
}

export interface QuestionsRequest {
  idea: string;
}

export interface QuestionsResponse {
  questions: ProductQuestion[];
}

export interface WorkflowRequest {
  idea: string;
  answers: Record<string, string | string[]>;
  sessionId?: string;
}

export interface WorkflowResponse {
  sessionId: string;
  appName: string;
  graph: WorkflowGraph;
}

export interface PrdRequest {
  idea: string;
  answers: Record<string, string | string[]>;
  graph?: WorkflowGraph;
  sessionId?: string;
}

export interface PrdResponse {
  sessionId: string;
  markdown: string;
}
