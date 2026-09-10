"use client";

import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GitBranch,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  PlusCircle,
  FolderGit2,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import RuixenMoonChat from "@/components/ui/ruixen-moon-chat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionStepper } from "@/components/questions/QuestionStepper";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ProductQuestion, SessionData, WorkflowGraph } from "@/types";

type Stage = "select_mode" | "idea" | "loading_questions" | "questions" | "building";

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
  const [stage, setStage] = useState<Stage>("select_mode");
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
    setStage("select_mode");
  };

  return (
    <main className="landing-shell min-h-screen">
      <nav className="landing-nav" aria-label="Main navigation">
        <button
          type="button"
          onClick={restart}
          className="brand bg-transparent border-0 cursor-pointer p-0 text-left"
          aria-label="CodeWithAI home"
        >
          <span className="brand-port"><span /></span>
          <span>CodeWithAI</span>
        </button>
        <div className="nav-status"><span /> Built for agentic workflows</div>
      </nav>

      <div id="top" className="landing-main flex-1 flex flex-col">
        {/* Step 1: Selection Mode (Start New Project vs Import Project) */}
        {stage === "select_mode" && (
          <div className="w-full max-w-5xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agentic Project Workspace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-2xl leading-tight">
              How would you like to start?
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 max-w-xl">
              Create an AI-guided architectural plan from scratch, or connect an existing codebase to generate telemetry.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-12 text-left">
              {/* Option 1: Start a New Project */}
              <button
                type="button"
                onClick={() => setStage("idea")}
                className="group relative flex flex-col justify-between p-7 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#0f172a]/90 to-[#090d16]/90 hover:border-cyan-400/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between w-full mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium">
                    Recommended
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    Start a New Project
                  </h2>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                    Brainstorm your app idea with our AI chat, configure technical decisions, and get an interactive dependency graph with an exportable PRD.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-cyan-400 group-hover:text-cyan-300">
                  <span>Start with AI Chat</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: Import Project (Coming Soon) */}
              <div className="relative flex flex-col justify-between p-7 rounded-2xl border border-neutral-800 bg-neutral-900/40 opacity-75 select-none text-left">
                <div className="flex items-start justify-between w-full mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400">
                    <FolderGit2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Coming Soon
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-neutral-200">
                    Import Existing Project
                  </h2>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                    Import a GitHub repo or local folder to automatically extract existing architecture, generate tests, and connect companion CLI telemetry.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-neutral-500">
                  <span>Available in upcoming release</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI Chat View (Ruixen Moon Chat Design) */}
        {stage === "idea" && (
          <div className="w-full flex-1 flex flex-col">
            {error && (
              <div className="max-w-3xl mx-auto w-full px-4 pt-4">
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-200 text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-xs text-red-300 hover:text-white underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            <RuixenMoonChat
              title="What are you building?"
              subtitle="Describe your idea or technical requirements. We'll map dependencies and build your PRD."
              initialMessage={store.idea}
              showBackButton={true}
              onBack={() => setStage("select_mode")}
              onSubmit={requestQuestions}
            />
          </div>
        )}

        {/* Step 3: Loading Questions */}
        {stage === "loading_questions" && (
          <section className="question-workspace loading-workspace flex-1" aria-live="polite">
            <div className="thinking-mark"><LoaderCircle className="spin" size={22} /></div>
            <h1>Finding the decisions that matter.</h1>
            <p>We’re analyzing your prompt and extracting the core technical specifications.</p>
            <div className="question-skeleton"><span /><span /><span /></div>
          </section>
        )}

        {/* Step 4: Questions & Building Canvas */}
        {(stage === "questions" || stage === "building") && (
          <section className="question-workspace flex-1">
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
