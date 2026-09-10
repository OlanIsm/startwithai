import { Bot, UserRound } from "lucide-react";

interface ChatMessageProps {
  role: "assistant" | "user";
  children: React.ReactNode;
}

export function ChatMessage({ role, children }: ChatMessageProps) {
  return (
    <div className={`chat-message ${role}`}>
      <span className="message-avatar" aria-hidden="true">
        {role === "assistant" ? <Bot size={16} /> : <UserRound size={16} />}
      </span>
      <div>{children}</div>
    </div>
  );
}
