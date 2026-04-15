"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  characterAvatar?: string;
  characterColor?: string;
}

export default function ChatMessage({
  role,
  content,
  isStreaming,
  characterAvatar,
  characterColor,
}: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 py-4 px-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={
          isUser
            ? undefined
            : { background: `${characterColor || "#22c55e"}20` }
        }
      >
        {isUser ? (
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent-light flex items-center justify-center">
            <User size={18} />
          </div>
        ) : (
          <span className="text-base">{characterAvatar || "🤖"}</span>
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent/15 text-white rounded-tr-sm"
            : "bg-surface-2 text-gray-200 rounded-tl-sm"
        }`}
      >
        {isStreaming && !content ? (
          <div className="flex gap-1 py-1">
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        ) : (
          <div className="markdown-body text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
