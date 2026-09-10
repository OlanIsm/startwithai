"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "./useAppStore";
import type { NodeStatus, SessionData } from "@/types";

type ConnectionState = "connecting" | "live" | "polling" | "offline";

interface StatusEvent {
  stepId?: string;
  nodeId?: string;
  status?: NodeStatus;
  updatedNode?: { id: string; status: NodeStatus };
  session?: SessionData;
}

export function useSessionStream(sessionId: string | null) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const updateNodeStatus = useAppStore((state) => state.updateNodeStatus);
  const hydrateSession = useAppStore((state) => state.hydrateSession);

  useEffect(() => {
    if (!sessionId) return;

    let disposed = false;
    let pollingTimer: ReturnType<typeof setInterval> | undefined;
    const applyPayload = (payload: StatusEvent) => {
      if (payload.session) hydrateSession(payload.session);
      const nodeId = payload.stepId ?? payload.nodeId ?? payload.updatedNode?.id;
      const status = payload.status ?? payload.updatedNode?.status;
      if (nodeId && status) updateNodeStatus(nodeId, status);
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Session unavailable");
        const payload = (await response.json()) as SessionData | { session: SessionData };
        hydrateSession("session" in payload ? payload.session : payload);
        if (!disposed) setConnection("polling");
      } catch {
        if (!disposed) setConnection("offline");
      }
    };

    const beginPolling = () => {
      if (pollingTimer) return;
      void poll();
      pollingTimer = setInterval(poll, 5000);
    };

    const stream = new EventSource(`/api/session/${sessionId}/stream`);
    stream.onopen = () => {
      setConnection("live");
      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = undefined;
    };
    stream.onmessage = (event) => {
      try {
        applyPayload(JSON.parse(event.data) as StatusEvent);
      } catch {
        // Ignore heartbeat/non-JSON events without disrupting the stream.
      }
    };
    stream.onerror = () => {
      setConnection("polling");
      beginPolling();
    };

    return () => {
      disposed = true;
      stream.close();
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [hydrateSession, sessionId, updateNodeStatus]);

  return connection;
}
