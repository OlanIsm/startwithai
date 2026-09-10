"use client";

import { ArrowLeft, Check, CircleDashed, FileText, LoaderCircle, Radio, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { PrdPreviewModal } from "@/components/prd/PrdPreviewModal";
import { useAppStore } from "@/lib/store/useAppStore";
import { useSessionStream } from "@/lib/store/useSessionStream";
import type { SessionData } from "@/types";

export default function CanvasPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const store = useAppStore();
  const [loading, setLoading] = useState(store.sessionId !== sessionId || store.nodes.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [prdOpen, setPrdOpen] = useState(false);
  const [prdLoading, setPrdLoading] = useState(false);
  const connection = useSessionStream(sessionId);

  useEffect(() => {
    if (store.sessionId === sessionId && store.nodes.length > 0) {
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("This workflow session could not be loaded.");
        const payload = (await response.json()) as SessionData | { session: SessionData };
        if (active) store.hydrateSession("session" in payload ? payload.session : payload);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Session unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [sessionId, store]);

  const counts = useMemo(() => ({
    done: store.nodes.filter((node) => node.data.status === "done").length,
    active: store.nodes.filter((node) => node.data.status === "in_progress").length,
    blocked: store.nodes.filter((node) => node.data.status === "blocked").length,
  }), [store.nodes]);
  const progress = store.nodes.length ? Math.round((counts.done / store.nodes.length) * 100) : 0;

  const openPrd = useCallback(async () => {
    if (store.prdMarkdown) {
      setPrdOpen(true);
      return;
    }
    setPrdLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error("The PRD could not be generated.");
      const payload = (await response.json()) as { prdMarkdown?: string; markdown?: string };
      const markdown = payload.prdMarkdown ?? payload.markdown;
      if (!markdown) throw new Error("The generated PRD was empty.");
      store.setPrdMarkdown(markdown);
      setPrdOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The PRD could not be generated.");
    } finally {
      setPrdLoading(false);
    }
  }, [sessionId, store]);

  if (loading) {
    return (
      <main className="canvas-state-page">
        <LoaderCircle className="spin" size={24} />
        <h1>Opening the signal board</h1>
        <p>Loading nodes, dependencies, and the latest agent state.</p>
      </main>
    );
  }

  if (error && store.nodes.length === 0) {
    return (
      <main className="canvas-state-page error-state">
        <TriangleAlert size={24} />
        <h1>Workflow unavailable</h1>
        <p>{error}</p>
        <Link href="/" className="primary-button"><ArrowLeft size={16} /> Return to your idea</Link>
      </main>
    );
  }

  return (
    <main className="canvas-page">
      <header className="canvas-header">
        <div className="canvas-title-group">
          <Link href="/" className="icon-button" aria-label="Return home"><ArrowLeft size={18} /></Link>
          <Link href="/" className="brand compact"><span className="brand-port"><span /></span><span>CodeWithAI</span></Link>
          <span className="header-rule" />
          <div className="canvas-project-title">
            <h1>{store.appName}</h1>
            <span>{sessionId}</span>
          </div>
        </div>
        <div className="canvas-header-actions">
          <div className={`stream-state ${connection}`} title={`Telemetry is ${connection}`}>
            <span /> {connection === "live" ? "Live" : connection === "polling" ? "Polling" : connection}
          </div>
          <button className="primary-button prd-button" type="button" onClick={openPrd} disabled={prdLoading}>
            {prdLoading ? <LoaderCircle className="spin" size={16} /> : <FileText size={16} />}
            {prdLoading ? "Generating" : "Open PRD"}
          </button>
        </div>
      </header>

      <section className="canvas-metrics" aria-label="Workflow progress">
        <div className="progress-copy"><span>Build progress</span><strong>{progress}%</strong></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="status-counts">
          <span><Check size={13} /> {counts.done} done</span>
          <span><Radio size={13} /> {counts.active} active</span>
          <span><CircleDashed size={13} /> {store.nodes.length - counts.done - counts.active - counts.blocked} queued</span>
          {counts.blocked > 0 && <span className="blocked-count"><TriangleAlert size={13} /> {counts.blocked} blocked</span>}
        </div>
      </section>

      {error && <div className="canvas-toast" role="alert">{error}</div>}
      <WorkflowCanvas />
      <PrdPreviewModal open={prdOpen} markdown={store.prdMarkdown} onClose={() => setPrdOpen(false)} />
    </main>
  );
}
