"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="w-72 h-full bg-surface-1 border-r border-surface-3 flex flex-col">
      <div className="p-4 border-b border-surface-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-accent hover:bg-accent-dim text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer mb-1 transition-colors ${
              activeId === conv.id
                ? "bg-accent/15 text-white"
                : "text-gray-400 hover:bg-surface-2 hover:text-gray-200"
            }`}
          >
            <MessageSquare size={16} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.title}</p>
              <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-surface-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-accent-light text-sm font-bold">YT</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">YouTube Chat AI</p>
            <p className="text-xs text-gray-500">GPT-4o Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
