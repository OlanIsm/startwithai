"use client";

import { create } from "zustand";
import type {
  NodeStatus,
  ProductQuestion,
  SessionData,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
} from "@/types";

type Answer = string | string[];

interface AppState {
  idea: string;
  questions: ProductQuestion[];
  answers: Record<string, Answer>;
  currentQuestion: number;
  sessionId: string | null;
  appName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  prdMarkdown: string;
  setIdea: (idea: string) => void;
  setQuestions: (questions: ProductQuestion[]) => void;
  answerQuestion: (questionId: string, answer: Answer) => void;
  setCurrentQuestion: (index: number) => void;
  setSessionId: (id: string) => void;
  setGraph: (graph: WorkflowGraph) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setPrdMarkdown: (markdown: string) => void;
  hydrateSession: (session: SessionData) => void;
  reset: () => void;
}

const initialState = {
  idea: "",
  questions: [] as ProductQuestion[],
  answers: {} as Record<string, Answer>,
  currentQuestion: 0,
  sessionId: null as string | null,
  appName: "Untitled product",
  nodes: [] as WorkflowNode[],
  edges: [] as WorkflowEdge[],
  prdMarkdown: "",
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setIdea: (idea) => set({ idea }),
  setQuestions: (questions) => set({ questions, currentQuestion: 0, answers: {} }),
  answerQuestion: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setSessionId: (sessionId) => set({ sessionId }),
  setGraph: (graph) => set({ nodes: graph.nodes, edges: graph.edges }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId || node.data.id === nodeId
          ? { ...node, data: { ...node.data, status } }
          : node,
      ),
    })),
  setPrdMarkdown: (prdMarkdown) => set({ prdMarkdown }),
  hydrateSession: (session) =>
    set({
      idea: session.rawPrompt,
      answers: session.answers,
      sessionId: session.id,
      appName: session.appName,
      nodes: session.graph.nodes,
      edges: session.graph.edges,
      prdMarkdown: session.prdMarkdown,
    }),
  reset: () => set(initialState),
}));
