"use client";

import { ArrowLeft, ArrowRight, Check, Circle, FileText, GitBranch, LoaderCircle, Radio, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionStepper } from "@/components/questions/QuestionStepper";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ProductQuestion, SessionData, WorkflowGraph } from "@/types";

type Stage = "idea" | "loading_questions" | "questions" | "building";

interface WorkflowResponse {
  sessionId?: string;
  id?: string;
  appName?: string;
  graph?: WorkflowGraph;
  prdMarkdown?: string;
  session?: SessionData;
}

export default function HomePage() {
  const router = useRouter();
  const store = useAppStore();
  const [stage, setStage] = useState<Stage>("idea");
  const [error, setError] = useState<string | null>(null);
  const inSummary = store.questions.length > 0 && store.currentQuestion === store.questions.length;
  const current = store.questions[store.currentQuestion];

  const answered = useMemo(() => {
    if (!current) return true;
    const answer = store.answers[current.id];
    return Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
  }, [current, store.answers]);

  const requestQuestions = async (idea: string) => {
    setError(null);
    store.setIdea(idea);
    setStage("loading_questions");
    try {
      const response = await fetch("/api/ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (!response.ok) throw new Error("The question service did not respond.");
      const payload = (await response.json()) as { questions?: ProductQuestion[] } | ProductQuestion[];
      const questions = Array.isArray(payload) ? payload : payload.questions;
      if (!questions?.length) throw new Error("No clarification questions were returned.");
      store.setQuestions(questions.slice(0, 5));
      setStage("questions");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not shape your questions. Please try again.");
      setStage("idea");
    }
  };

  const buildWorkflow = async () => {
    setError(null);
    setStage("building");
    try {
      const response = await fetch("/api/ai/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: store.idea, answers: store.answers }),
      });
      if (!response.ok) throw new Error("The workflow could not be generated.");
      const payload = (await response.json()) as WorkflowResponse;
      const session = payload.session;
      const sessionId = payload.sessionId ?? payload.id ?? session?.id;
      const graph = payload.graph ?? session?.graph;
      if (!sessionId || !graph) throw new Error("The workflow response was incomplete.");
      if (session) store.hydrateSession(session);
      else {
        store.setSessionId(sessionId);
        store.setGraph({
          nodes: graph.nodes.map((node) => ({ ...node, type: "customStep" as const })),
          edges: graph.edges,
        });
        store.setPrdMarkdown(payload.prdMarkdown ?? "");
      }
      router.push(`/canvas/${sessionId}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not build your workflow. Please try again.");
      setStage("questions");
    }
  };

  const restart = () => {
    store.reset();
    setError(null);
    setStage("idea");
  };

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#top" className="brand" aria-label="CodeWithAI home">
          <span className="brand-port"><span /></span>
          <span>CodeWithAI</span>
        </a>
        <div className="nav-status"><span /> Built for agentic workflows</div>
      </nav>

      <div id="top" className="landing-main">
        {stage === "idea" && (
          <div className="idea-stage">
            <section className="hero-copy">
              <h1>Turn a loose idea into a buildable system.</h1>
              <p>
                Answer a few decisions. Get a dependency map, an agent-ready PRD, and a live view of the work as it ships.
              </p>
              <div className="flow-proof" aria-label="CodeWithAI product flow">
                <div><Sparkles size={17} /><span><b>Idea</b><small>your raw prompt</small></span></div>
                <span className="flow-line" />
                <div><GitBranch size={17} /><span><b>Plan</b><small>ordered dependencies</small></span></div>
                <span className="flow-line active" />
                <div><Radio size={17} /><span><b>Ship</b><small>live agent telemetry</small></span></div>
              </div>
            </section>

            <section className="signal-board" aria-label="Illustrative workflow preview">
              <div className="board-head"><span>Example signal path</span><span>Live preview</span></div>
              <div className="board-grid">
                <div className="demo-node node-a"><span className="demo-port">SET-01</span><b>Product schema</b><small><Check size={12} /> done</small></div>
                <div className="demo-node node-b"><span className="demo-port">API-02</span><b>Core endpoints</b><small><Radio size={12} /> in progress</small></div>
                <div className="demo-node node-c"><span className="demo-port">UI-03</span><b>Client surfaces</b><small><Circle size={12} /> pending</small></div>
                <svg className="demo-wires" viewBox="0 0 620 330" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M155 76 C250 76 225 163 310 163" />
                  <path d="M390 163 C470 163 445 257 535 257" />
                  <circle cx="310" cy="163" r="3" />
                </svg>
              </div>
              <div className="board-foot"><span>3 phases</span><span>8 dependencies traced</span><span><i /> stream connected</span></div>
            </section>

            <section className="composer-area">
              <ChatInput onSubmit={requestQuestions} />
              {error && <div className="inline-error" role="alert">{error}</div>}
            </section>
          </div>
        )}

        {stage === "loading_questions" && (
          <section className="question-workspace loading-workspace" aria-live="polite">
            <div className="thinking-mark"><LoaderCircle className="spin" size={22} /></div>
            <h1>Finding the decisions that matter.</h1>
            <p>We’re reading your idea and removing questions that won’t change the build.</p>
            <div className="question-skeleton"><span /><span /><span /></div>
          </section>
        )}

        {(stage === "questions" || stage === "building") && (
          <section className="question-workspace">
            <div className="question-context">
              <button className="text-button" type="button" onClick={restart}><RotateCcw size={14} /> Start over</button>
              <ChatMessage role="user">{store.idea}</ChatMessage>
              <ChatMessage role="assistant">
                {inSummary ? "That’s enough signal. Review the decisions below, then I’ll route the build." : "I found a few decisions that will materially change your build plan."}
              </ChatMessage>
            </div>

            <div className="question-panel">
              <QuestionStepper current={store.currentQuestion} total={store.questions.length} complete={inSummary} />
              {!inSummary && current ? (
                <QuestionCard
                  question={current}
                  value={store.answers[current.id]}
                  onChange={(value) => store.answerQuestion(current.id, value)}
                />
              ) : (
                <div className="answer-summary">
                  <div className="summary-heading"><FileText size={20} /><h2>Your product decisions</h2></div>
                  <div className="summary-list">
                    {store.questions.map((question) => {
                      const raw = store.answers[question.id];
                      const ids = Array.isArray(raw) ? raw : [raw];
                      const labels = ids.map((id) => question.options.find((option) => option.id === id)?.label ?? id).filter(Boolean);
                      return (
                        <div key={question.id}>
                          <span>{question.question}</span>
                          <strong>{labels.join(", ")}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {error && <div className="inline-error" role="alert">{error}</div>}
              <div className="question-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => store.setCurrentQuestion(Math.max(0, store.currentQuestion - 1))}
                  disabled={store.currentQuestion === 0 || stage === "building"}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                {inSummary ? (
                  <button className="primary-button" type="button" onClick={buildWorkflow} disabled={stage === "building"}>
                    {stage === "building" ? <LoaderCircle className="spin" size={17} /> : <GitBranch size={17} />}
                    {stage === "building" ? "Routing your workflow" : "Build workflow"}
                  </button>
                ) : (
                  <button className="primary-button" type="button" onClick={() => store.setCurrentQuestion(store.currentQuestion + 1)} disabled={!answered}>
                    Continue <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
