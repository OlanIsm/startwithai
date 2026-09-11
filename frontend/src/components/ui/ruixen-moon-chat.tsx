"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Auto-resize textarea hook                                         */
/* ------------------------------------------------------------------ */
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

      textarea.style.height = `${minHeight}px`;
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

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Quick action data                                                 */
/* ------------------------------------------------------------------ */
const QUICK_ACTIONS = [
  { icon: <Code2 className="w-4 h-4" />, label: "Generate Code", prompt: "I want to build a full-stack dashboard with Next.js and Prisma" },
  { icon: <Rocket className="w-4 h-4" />, label: "Launch App", prompt: "A lightweight SaaS starter kit with auth, billing, and landing page" },
  { icon: <Layers className="w-4 h-4" />, label: "UI Components", prompt: "An accessible design system with React, Tailwind, and Radix UI" },
  { icon: <Palette className="w-4 h-4" />, label: "Theme Ideas", prompt: "A dark mode dashboard with liquid glass cards and blue accents" },
  { icon: <CircleUserRound className="w-4 h-4" />, label: "User Dashboard", prompt: "A customer analytics dashboard with real-time charts and activity log" },
  { icon: <MonitorIcon className="w-4 h-4" />, label: "Landing Page", prompt: "A high-conversion developer tools landing page with live interactive playground" },
  { icon: <FileUp className="w-4 h-4" />, label: "Upload Docs", prompt: "A documentation engine with markdown search, syntax highlighting, and API references" },
  { icon: <ImageIcon className="w-4 h-4" />, label: "Image Assets", prompt: "An AI image generation gallery with prompt sharing and preset filtering" },
];

/* ------------------------------------------------------------------ */
/*  Note: Liquid Glass SVG filter is loaded globally from layout.tsx   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function RuixenMoonChat({
  title = "CodeWithAI",
  subtitle = "Build something amazing — just start typing below.",
  placeholder = "Type your request...",
  initialMessage = "",
  onSubmit,
  isLoading = false,
  onBack,
  showBackButton = false,
}: RuixenMoonChatProps) {
  const [message, setMessage] = useState(initialMessage);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  const canSubmit = message.trim().length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    setTimeout(() => {
      adjustHeight();
      textareaRef.current?.focus();
    }, 10);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center bg-transparent">

      {/* Top Navigation */}
      {(showBackButton || !onSubmit) && (
        <header className="absolute top-0 left-0 right-0 w-full max-w-6xl mx-auto flex items-center justify-between z-10 px-4 sm:px-6 py-4">
          {showBackButton && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="group flex items-center gap-2 text-[#8A8A9A] hover:text-[#60A5FA] liquid-glass-sm rounded-full px-4 py-1.5 transition-all cursor-pointer border border-white/[0.08] hover:border-[#2563EB]/40"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
              <span className="font-bold text-[#F0F0F5] tracking-tight">CodeWithAI</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-[#8A8A9A] liquid-glass-sm px-3.5 py-1.5 rounded-full border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
            <span>Agentic Workflow</span>
          </div>
        </header>
      )}

      {/* Centered Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F0F0F5] tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[#8A8A9A] max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-[12vh] z-10 px-4">
        <div className="relative liquid-glass-input rounded-2xl border border-white/[0.08] focus-within:border-[#2563EB]/50 focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.15),inset_0_0_12px_rgba(37,99,235,0.08)] transition-all">
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
              "bg-transparent text-[#F0F0F5] text-base leading-relaxed",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-[#55556A] min-h-[48px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#55556A] hover:text-[#60A5FA] hover:bg-white/[0.04] rounded-lg w-8 h-8"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#55556A] hidden sm:inline mr-1">
                Enter ↵
              </span>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center justify-center rounded-xl px-4 py-2 transition-all duration-200",
                  canSubmit
                    ? "bg-[#2563EB] hover:bg-[#3B82F6] text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] cursor-pointer"
                    : "bg-white/[0.06] text-[#55556A] cursor-not-allowed opacity-70"
                )}
                aria-label="Send"
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
        <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
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

/* ------------------------------------------------------------------ */
/*  Quick action pill                                                 */
/* ------------------------------------------------------------------ */
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
      className="flex items-center gap-1.5 liquid-glass-pill border border-white/[0.08] text-[#8A8A9A] hover:text-[#60A5FA] hover:border-[#2563EB]/40 hover:bg-white/[0.12] transition-all text-xs py-1.5 px-3 h-auto"
    >
      <span className="text-[#3B82F6]">{icon}</span>
      <span>{label}</span>
    </Button>
  );
}
