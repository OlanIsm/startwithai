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
  { icon: <Palette className="w-4 h-4" />, label: "Theme Ideas", prompt: "A dark-mode first portfolio with obsidian and cyan accents" },
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
    maxHeight: 180,
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
      className="relative w-full min-h-screen bg-cover bg-center flex flex-col items-center justify-between px-4 py-8 bg-[#070b14]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(30, 45, 75, 0.4) 0%, rgba(5, 8, 16, 0.95) 75%), url('https://cdn.21st.dev/assets/mirror/c3/c333918af688a4a8a3d004652e6c0ee219457a9d84d380eeb31f513d4b59a09f.png')",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      {/* Top Bar / Back button */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-2">
        {showBackButton && onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to options</span>
          </Button>
        ) : (
          <div />
        )}
      </div>

      {/* Centered AI Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-md">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-neutral-300 max-w-xl">
          {subtitle}
        </p>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-12">
        <div className="relative bg-neutral-950/75 backdrop-blur-xl rounded-2xl border border-neutral-700/60 shadow-2xl focus-within:border-neutral-500 transition-colors">
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
              "bg-transparent text-white text-base leading-relaxed",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[56px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800/60">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-lg w-9 h-9"
                title="Attach file (mocked)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 hidden sm:inline mr-1">
                Press Enter ↵ to send
              </span>
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center justify-center rounded-xl px-4 py-2 transition-all duration-200",
                  canSubmit
                    ? "bg-white text-black hover:bg-neutral-200 cursor-pointer shadow-md"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-70"
                )}
                aria-label="Send prompt"
              >
                {isLoading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin text-neutral-400" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mt-6">
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
      className="flex items-center gap-2 rounded-full border-neutral-800/80 bg-neutral-900/60 backdrop-blur text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all text-xs py-1.5 px-3.5 h-auto shadow-sm"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
