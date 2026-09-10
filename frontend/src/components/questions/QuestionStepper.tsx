interface QuestionStepperProps {
  current: number;
  total: number;
  complete?: boolean;
}

export function QuestionStepper({ current, total, complete = false }: QuestionStepperProps) {
  const progress = complete ? 100 : Math.round(((current + 1) / total) * 100);
  return (
    <div className="question-stepper" aria-label={`Question ${Math.min(current + 1, total)} of ${total}`}>
      <div className="stepper-copy">
        <span>{complete ? "Review" : `Question ${current + 1}`}</span>
        <span>{complete ? "Ready to map" : `${total} total`}</span>
      </div>
      <div className="stepper-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
