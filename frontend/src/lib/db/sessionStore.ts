import { SessionData, WorkflowNodeData, NodeStatus } from '@/types';

export interface TelemetryEvent {
  type: 'status_update' | 'session_init' | 'heartbeat';
  sessionId: string;
  timestamp: number;
  data: {
    node?: WorkflowNodeData;
    notes?: string;
    session?: SessionData;
    message?: string;
  };
}

type SessionEventListener = (event: TelemetryEvent) => void;

class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private listeners: Map<string, Set<SessionEventListener>> = new Map();

  constructor() {
    // Initialize with empty maps
  }

  /**
   * Get an existing session by ID
   */
  public getSession(id: string): SessionData | undefined {
    return this.sessions.get(id);
  }

  /**
   * Save or overwrite a complete session
   */
  public saveSession(session: SessionData): SessionData {
    const updated = {
      ...session,
      updatedAt: Date.now(),
    };
    this.sessions.set(session.id, updated);
    this.emit(session.id, {
      type: 'session_init',
      sessionId: session.id,
      timestamp: Date.now(),
      data: { session: updated },
    });
    return updated;
  }

  /**
   * Create or update a session with partial fields
   */
  public upsertSession(id: string, partial: Partial<SessionData>): SessionData {
    const existing = this.sessions.get(id);
    const updated: SessionData = {
      id,
      appName: partial.appName ?? existing?.appName ?? 'Untitled App',
      rawPrompt: partial.rawPrompt ?? existing?.rawPrompt ?? '',
      answers: partial.answers ?? existing?.answers ?? {},
      graph: partial.graph ?? existing?.graph ?? { nodes: [], edges: [] },
      prdMarkdown: partial.prdMarkdown ?? existing?.prdMarkdown ?? '',
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(id, updated);
    return updated;
  }

  /**
   * Update the status of a specific node within a session
   */
  public updateNodeStatus(
    sessionId: string,
    stepId: string,
    status: NodeStatus,
    notes?: string
  ): { session: SessionData; updatedNode: WorkflowNodeData } | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const nodeIndex = session.graph.nodes.findIndex(
      (n) => n.id === stepId || n.data.id === stepId
    );

    if (nodeIndex === -1) {
      return null;
    }

    const targetNode = session.graph.nodes[nodeIndex];
    const updatedNodeData: WorkflowNodeData = {
      ...targetNode.data,
      status,
    };

    session.graph.nodes[nodeIndex] = {
      ...targetNode,
      data: updatedNodeData,
    };

    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);

    // Notify all active SSE listeners for this session
    this.emit(sessionId, {
      type: 'status_update',
      sessionId,
      timestamp: Date.now(),
      data: {
        node: updatedNodeData,
        notes,
        session,
      },
    });

    return { session, updatedNode: updatedNodeData };
  }

  /**
   * Subscribe to real-time events for a session (SSE support)
   */
  public subscribe(sessionId: string, listener: SessionEventListener): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }

    const sessionListeners = this.listeners.get(sessionId)!;
    sessionListeners.add(listener);

    // Return unsubscription callback
    return () => {
      sessionListeners.delete(listener);
      if (sessionListeners.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }

  /**
   * Emit an event to all subscribers of a session
   */
  public emit(sessionId: string, event: TelemetryEvent): void {
    const sessionListeners = this.listeners.get(sessionId);
    if (sessionListeners) {
      for (const listener of sessionListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error(`[SessionStore] Error emitting to listener:`, err);
        }
      }
    }
  }

  /**
   * List all stored sessions
   */
  public listSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions (useful for tests)
   */
  public clear(): void {
    this.sessions.clear();
    this.listeners.clear();
  }
}

// Preserve session store instance across Next.js HMR reloads
const globalForStore = globalThis as unknown as {
  __codewithai_session_store__?: SessionStore;
};

export const sessionStore =
  globalForStore.__codewithai_session_store__ ?? new SessionStore();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.__codewithai_session_store__ = sessionStore;
}
