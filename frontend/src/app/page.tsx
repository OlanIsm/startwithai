"use client";

import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GitBranch,
  LoaderCircle,
  RotateCcw,
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
        if (payload.appName) store.setAppName(payload.appName);
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
    <main className="w-screen h-screen max-h-screen overflow-hidden bg-[#050508] text-[#F0F0F5] flex flex-col justify-between select-none">
      {/* Animated wave background image */}
      <div className="page-bg" aria-hidden="true" />

      {/* ============================================================
          View 1: Select Mode
          ============================================================ */}
      {stage === "select_mode" && (
        <div className="w-full h-full flex flex-col justify-between px-6 py-6 sm:py-8 relative overflow-hidden">

          {/* Navigation */}
          <nav className="w-full max-w-6xl mx-auto flex items-center justify-between z-10" aria-label="Main navigation">
            <button
              type="button"
              onClick={restart}
              className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer p-0 text-left"
              aria-label="CodeWithAI home"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/40 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              </div>
              <span className="font-bold text-lg text-[#F0F0F5] tracking-tight">CodeWithAI</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-[#8A8A9A] liquid-glass-sm px-3.5 py-1.5 rounded-full border border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
              <span>Built for agentic workflows</span>
            </div>
          </nav>

          {/* Central Content */}
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center my-auto z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#60A5FA] text-xs font-semibold mb-5">
              <span>Agentic Project Workspace</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F0F0F5] max-w-2xl leading-tight">
              How would you like to start?
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#8A8A9A] max-w-lg">
              Create an AI-guided architectural plan from scratch, or connect an existing codebase to generate telemetry.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl mt-8 sm:mt-10 text-left">
              {/* Card 1: Start New */}
              <button
                type="button"
                onClick={() => setStage("idea")}
                className="group relative flex flex-col justify-between p-6 rounded-2xl liquid-glass border border-white/[0.08] hover:border-[#2563EB]/50 hover:shadow-[0_12px_32px_-8px_rgba(37,99,235,0.2)] transition-all duration-200 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#2563EB]/12 border border-[#2563EB]/25 flex items-center justify-center text-[#60A5FA] group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2563EB]/12 text-[#60A5FA] border border-[#2563EB]/25 font-semibold">
                    Recommended
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#F0F0F5] group-hover:text-[#60A5FA] transition-colors">
                    Start a New Project
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#8A8A9A] leading-relaxed">
                    Brainstorm your app idea with our AI chat, configure technical decisions, and get an interactive dependency graph with an exportable PRD.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#60A5FA] group-hover:text-[#93C5FD]">
                  <span>Start with AI Chat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform stroke-[2.2]" />
                </div>
              </button>

              {/* Card 2: Import (Coming Soon) */}
              <div className="relative flex flex-col justify-between p-6 rounded-2xl liquid-glass border border-white/[0.05] opacity-60 select-none text-left">
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#55556A]">
                    <FolderGit2 className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#55556A] border border-white/[0.06] flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Coming Soon
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#8A8A9A]">
                    Import Existing Project
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#55556A] leading-relaxed">
                    Import a GitHub repo or local folder to automatically extract existing architecture, generate tests, and connect companion CLI telemetry.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#55556A]">
                  <span>Available in upcoming release</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full text-center text-xs text-[#55556A] py-2 z-10">
            © {new Date().getFullYear()} CodeWithAI • Continuous telemetry & PRD synthesis
          </footer>
        </div>
      )}

      {/* ============================================================
          View 2: Chat (Idea Input)
          ============================================================ */}
      {stage === "idea" && (
        <div className="w-screen h-screen max-h-screen overflow-hidden flex flex-col relative">
          {error && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 max-w-lg w-full px-4 z-50">
              <div className="p-3 liquid-glass-sm border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs text-red-400 hover:text-red-200 font-semibold underline cursor-pointer ml-3"
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
            isLoading={false}
          />
        </div>
      )}

      {/* ============================================================
          View 3: Loading Questions
          ============================================================ */}
      {stage === "loading_questions" && (
        <div className="w-screen h-screen max-h-screen overflow-hidden flex flex-col items-center justify-center text-center px-4 bg-[#050508] relative">

          <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/12 border border-[#2563EB]/25 flex items-center justify-center text-[#60A5FA] mb-5 z-10">
            <LoaderCircle className="w-6 h-6 animate-spin text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F0F0F5] z-10">Finding the decisions that matter.</h1>
          <p className="mt-2 text-sm sm:text-base text-[#8A8A9A] max-w-md z-10">
            We&apos;re analyzing your prompt and extracting the core technical specifications.
          </p>
          <div className="flex gap-2 mt-8 z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-pulse [animation-delay:0.2s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA] animate-pulse [animation-delay:0.4s]" />
          </div>
        </div>
      )}

      {/* ============================================================
          View 4: Questions & Building
          ============================================================ */}
      {(stage === "questions" || stage === "building") && (
        <div className="w-screen h-screen max-h-screen overflow-hidden flex flex-col justify-between px-4 sm:px-6 py-4 bg-[#050508] relative">

          {/* Header */}
          <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-3 border-b border-white/[0.06] z-10">
            <button
              type="button"
              onClick={restart}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8A8A9A] hover:text-[#60A5FA] liquid-glass-sm border border-white/[0.08] px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start over
            </button>
            <div className="text-xs text-[#8A8A9A] font-medium">
              Step {store.currentQuestion + 1} of {store.questions.length}
            </div>
          </header>

          {/* Question Panel */}
          <div className="w-full max-w-2xl mx-auto my-auto flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)] py-2 pr-1 z-10">
            <div className="p-3 liquid-glass-sm border border-white/[0.08] rounded-xl text-xs text-[#8A8A9A] flex items-center gap-2">
              <span className="font-semibold text-[#F0F0F5]">Project Idea:</span>
              <span className="truncate">{store.idea}</span>
            </div>

            <div className="liquid-glass border border-white/[0.08] rounded-2xl p-6 sm:p-7">
              <QuestionStepper current={store.currentQuestion} total={store.questions.length} complete={inSummary} />
              {!inSummary && current ? (
                <QuestionCard
                  question={current}
                  value={store.answers[current.id]}
                  onChange={(value) => store.answerQuestion(current.id, value)}
                />
              ) : (
                <div className="answer-summary">
                  <div className="summary-heading flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                    <FileText className="w-5 h-5 text-[#60A5FA]" />
                    <h2 className="text-lg font-bold text-[#F0F0F5]">Your product decisions</h2>
                  </div>
                  <div className="summary-list flex flex-col gap-2.5">
                    {store.questions.map((question) => {
                      const raw = store.answers[question.id];
                      const ids = Array.isArray(raw) ? raw : [raw];
                      const labels = ids.map((id) => question.options.find((option) => option.id === id)?.label ?? id).filter(Boolean);
                      return (
                        <div key={question.id} className="p-3.5 rounded-xl liquid-glass-row border border-white/[0.06] flex flex-col gap-1">
                          <span className="text-xs text-[#8A8A9A] font-medium">{question.question}</span>
                          <strong className="text-sm text-[#F0F0F5]">{labels.join(", ")}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg">{error}</div>}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl liquid-glass-sm border border-white/[0.08] text-xs font-semibold text-[#8A8A9A] hover:text-[#F0F0F5] hover:border-white/[0.15] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                  type="button"
                  onClick={() => store.setCurrentQuestion(Math.max(0, store.currentQuestion - 1))}
                  disabled={store.currentQuestion === 0 || stage === "building"}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                {inSummary ? (
                  <button
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
                    type="button"
                    onClick={buildWorkflow}
                    disabled={stage === "building"}
                  >
                    {stage === "building" ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                    {stage === "building" ? "Routing your workflow..." : "Build workflow"}
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
                    type="button"
                    onClick={() => store.setCurrentQuestion(store.currentQuestion + 1)}
                    disabled={!answered}
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <footer className="w-full text-center text-xs text-[#55556A] py-2 z-10">
            CodeWithAI Decision Architecture
          </footer>
        </div>
      )}
    </main>
  );
}
