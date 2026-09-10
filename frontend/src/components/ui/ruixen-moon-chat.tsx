"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
  LoaderCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export interface RuixenMoonChatProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  initialMessage?: string;
  onSubmit?: (message: string) => void;
  isLoading?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const QUICK_ACTIONS = [
  { icon: <Code2 className="w-4 h-4" />, label: "Generate Code", prompt: "I want to build a full-stack dashboard with Next.js and Prisma" },
  { icon: <Rocket className="w-4 h-4" />, label: "Launch App", prompt: "A lightweight SaaS starter kit with auth, billing, and landing page" },
  { icon: <Layers className="w-4 h-4" />, label: "UI Components", prompt: "An accessible design system with React, Tailwind, and Radix UI" },
  { icon: <Palette className="w-4 h-4" />, label: "Theme Ideas", prompt: "An off-white and vivid orange light theme with warm accents" },
  { icon: <CircleUserRound className="w-4 h-4" />, label: "User Dashboard", prompt: "A customer analytics dashboard with real-time charts and activity log" },
  { icon: <MonitorIcon className="w-4 h-4" />, label: "Landing Page", prompt: "A high-conversion developer tools landing page with live interactive playground" },
  { icon: <FileUp className="w-4 h-4" />, label: "Upload Docs", prompt: "A documentation engine with markdown search, syntax highlighting, and API references" },
  { icon: <ImageIcon className="w-4 h-4" />, label: "Image Assets", prompt: "An AI image generation gallery with prompt sharing and preset filtering" },
];

export default function RuixenMoonChat({
  title = "Start with AI",
  subtitle = "Build something amazing — just describe what you want to create.",
  placeholder = "Describe your application idea, features, or architecture...",
  initialMessage = "",
  onSubmit,
  isLoading = false,
  onBack,
  showBackButton = false,
}: RuixenMoonChatProps) {
  const [message, setMessage] = useState(initialMessage);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 140,
  });

  const canSubmit = message.trim().length > 0 && !isLoading;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    if (onSubmit) {
      onSubmit(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (promptText: string) => {
    setMessage(promptText);
    setTimeout(() => {
      adjustHeight();
      textareaRef.current?.focus();
    }, 10);
  };

  return (
    <div
      className="relative w-screen h-screen max-h-screen overflow-hidden flex flex-col items-center justify-between px-4 sm:px-6 py-5 sm:py-6 bg-[#F6F6F6] select-none"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 90% 55% at 50% -8%, rgba(254, 141, 1, 0.22) 0%, rgba(235, 92, 0, 0.10) 40%, rgba(246, 246, 246, 0) 100%), radial-gradient(circle at 50% 0%, rgba(254, 141, 1, 0.15) 0%, rgba(246, 246, 246, 1) 75%)",
      }}
    >
      {/* Top Sunrise Arc Line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[130vw] sm:w-[110vw] h-[280px] pointer-events-none rounded-[100%] border-b border-[#FE8D01]/30 shadow-[0_8px_32px_rgba(254,141,1,0.18)]"
        aria-hidden="true"
      />

      {/* Top Bar / Navigation */}
      <header className="w-full max-w-6xl flex items-center justify-between z-10">
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 text-[#5A5A5A] hover:text-[#B23904] bg-white/80 hover:bg-white border border-[#E8E5E1] hover:border-[#FE8D01]/50 rounded-full px-4 py-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back to options</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FE8D01] shadow-[0_0_8px_#FE8D01]" />
            <span className="font-bold text-[#1A1A1A]">CodeWithAI</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-medium text-[#5A5A5A] bg-white/80 border border-[#E8E5E1] px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FE8D01] shadow-[0_0_6px_#FE8D01]" />
          <span>Agentic Workflow</span>
        </div>
      </header>

      {/* Centered AI Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-4 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FE8D01]/30 bg-[#FE8D01]/10 text-[#EB5C00] text-xs font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#FE8D01]" />
          <span>Intelligent System Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1A1A1A]">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#5A5A5A] max-w-xl font-normal leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-4 sm:mb-6 z-10">
        <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E8E2DD] shadow-[0_12px_36px_-6px_rgba(235,92,0,0.12),0_4px_12px_rgba(0,0,0,0.03)] focus-within:border-[#FE8D01] focus-within:ring-2 focus-within:ring-[#FE8D01]/20 transition-all">
          <Textarea
            ref={textareaRef}
            value={message}
            disabled={isLoading}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full px-5 py-4 resize-none border-none",
              "bg-transparent text-[#1A1A1A] text-base leading-relaxed",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[56px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#F0EBE7]">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-[#EB5C00] hover:bg-[#FFF5EC] rounded-lg w-8 h-8"
                title="Attach file (mocked)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 hidden sm:inline mr-1">
                Press Enter ↵ to send
              </span>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center justify-center rounded-xl px-4 py-2 transition-all duration-200",
                  canSubmit
                    ? "bg-[#FE8D01] hover:bg-[#EB5C00] text-white shadow-md shadow-[#FE8D01]/25 cursor-pointer"
                    : "bg-[#ECE7E3] text-neutral-400 cursor-not-allowed opacity-70"
                )}
                aria-label="Send prompt"
              >
                {isLoading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4 stroke-[2.5]" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-4 sm:mt-5">
          {QUICK_ACTIONS.map((action) => (
            <QuickAction
              key={action.label}
              icon={action.icon}
              label={action.label}
              onClick={() => handleQuickAction(action.prompt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-[#E6E0DA] bg-white/80 backdrop-blur text-[#3A3A3A] hover:text-[#B23904] hover:border-[#FE8D01] hover:bg-[#FFF9F4] transition-all text-xs py-1.5 px-3 h-auto shadow-2xs"
    >
      <span className="text-[#FE8D01]">{icon}</span>
      <span>{label}</span>
    </Button>
  );
}
