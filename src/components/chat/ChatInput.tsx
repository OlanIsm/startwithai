"use client";

import { ArrowUp, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, KeyboardEvent, useState } from "react";

interface ChatInputProps {
  onSubmit: (idea: string) => Promise<void> | void;
  isLoading?: boolean;
  initialValue?: string;
}

const prompts = [
  "A client portal for a small architecture studio",
  "An inventory app for independent coffee shops",
  "A study planner that adapts to exam dates",
];

export function ChatInput({ onSubmit, isLoading = false, initialValue = "" }: ChatInputProps) {
  const [value, setValue] = useState(initialValue);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const idea = value.trim();
    if (!idea || isLoading) return;
    void onSubmit(idea);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="idea-composer">
      <form onSubmit={submit} className="composer-shell">
        <div className="composer-label">
          <Sparkles size={15} aria-hidden="true" />
          Start with the rough version
        </div>
        <label className="sr-only" htmlFor="product-idea">
          Describe your product idea
        </label>
        <textarea
          id="product-idea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          maxLength={1200}
          placeholder="Describe what you want to build, who it helps, and what makes it useful…"
          disabled={isLoading}
        />
        <div className="composer-footer">
          <span>{value.length}/1200 · Enter to send</span>
          <button className="send-button" type="submit" disabled={!value.trim() || isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={18} /> : <ArrowUp size={18} />}
            <span>{isLoading ? "Shaping questions" : "Clarify my idea"}</span>
          </button>
        </div>
      </form>
      <div className="prompt-suggestions" aria-label="Example ideas">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => setValue(prompt)} disabled={isLoading}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
