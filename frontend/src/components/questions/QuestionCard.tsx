"use client";

import { Check, CornerDownRight } from "lucide-react";
import type { ProductQuestion } from "@/types";

interface QuestionCardProps {
  question: ProductQuestion;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const multi = question.multiSelect || question.type === "multi";
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const choose = (optionId: string) => {
    if (!multi) {
      onChange(optionId);
      return;
    }
    onChange(
      selected.includes(optionId)
        ? selected.filter((item) => item !== optionId)
        : [...selected, optionId],
    );
  };

  return (
    <fieldset className="question-card">
      <legend>{question.question}</legend>
      <p className="question-help">
        {question.helperText ?? (multi ? "Choose every option that applies." : "Choose the closest fit. You can refine it later.")}
      </p>
      <div className="option-list">
        {question.options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          const recommended = option.recommended || /\(recommended\)/i.test(option.label);
          const cleanLabel = option.label.replace(/\s*\(recommended\)/i, "");
          return (
            <button
              type="button"
              key={option.id}
              className={`option-row${isSelected ? " selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => choose(option.id)}
            >
              <span className="option-key">{String.fromCharCode(65 + index)}</span>
              <span className="option-copy">
                <span className="option-title">
                  {cleanLabel}
                  {recommended && <span className="recommended">Recommended</span>}
                </span>
                {option.description && <span className="option-description">{option.description}</span>}
              </span>
              <span className={`option-check${multi ? " square" : ""}`}>
                {isSelected && <Check size={15} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="question-mode">
        <CornerDownRight size={14} aria-hidden="true" />
        {multi ? "Multiple selections allowed" : "One selection"}
      </div>
    </fieldset>
  );
}
