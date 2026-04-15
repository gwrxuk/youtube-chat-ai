"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Send, Link, Loader2, Youtube } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import VideoCard from "@/components/VideoCard";
import Sidebar from "@/components/Sidebar";
import CharacterGrid from "@/components/CharacterGrid";
import CharacterModal from "@/components/CharacterModal";
import {
  Character,
  loadCharacters,
  saveCustomCharacter,
  deleteCustomCharacter,
} from "@/lib/characters";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  contextType: "transcript" | "video" | "none";
  transcript?: string;
  videoBase64?: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: Message[];
  video: VideoInfo | null;
  characterId: string;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCharacters(loadCharacters());
  }, []);

  const charConversations = activeCharacter
    ? conversations.filter((c) => c.characterId === activeCharacter.id)
    : [];

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConv?.messages || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  function handleSelectCharacter(char: Character) {
    setActiveCharacter(char);
    setActiveId(null);
    setCurrentVideo(null);
  }

  function handleSaveCharacter(char: Character) {
    saveCustomCharacter(char);
    setCharacters(loadCharacters());
  }

  function handleDeleteCharacter(id: string) {
    deleteCustomCharacter(id);
    setCharacters(loadCharacters());
    setConversations((prev) => prev.filter((c) => c.characterId !== id));
    if (activeCharacter?.id === id) {
      setActiveCharacter(null);
      setActiveId(null);
    }
  }

  function createConversation(firstMsg?: string, video?: VideoInfo | null) {
    if (!activeCharacter) return "";
    const conv: Conversation = {
      id: genId(),
      title: video?.title || firstMsg?.slice(0, 40) || "New Chat",
      lastMessage: firstMsg || "",
      timestamp: Date.now(),
      messages: [],
      video: video || null,
      characterId: activeCharacter.id,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }

  async function handleLoadVideo() {
    if (!youtubeUrl.trim()) return;
    setLoadingVideo(true);

    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load video");
      }

      const data = await res.json();
      setCurrentVideo(data);
      setYoutubeUrl("");
      setShowUrlInput(false);

      if (!activeId) {
        createConversation(undefined, data);
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, video: data } : c))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load video";
      alert(msg);
    } finally {
      setLoadingVideo(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loadingChat || !activeCharacter) return;

    let convId = activeId;
    if (!convId) {
      convId = createConversation(text, currentVideo);
    }

    const userMsg: Message = { id: genId(), role: "user", content: text };
    const placeholderMsg: Message = {
      id: genId(),
      role: "assistant",
      content: "",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMsg, placeholderMsg],
              lastMessage: text,
              timestamp: Date.now(),
            }
          : c
      )
    );

    setInput("");
    setLoadingChat(true);

    try {
      const conv = conversations.find((c) => c.id === convId);
      const video = conv?.video || currentVideo;

      const chatMessages = [...(conv?.messages || []), userMsg].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      let videoContext = undefined;
      if (video) {
        const isFirstMessage = (conv?.messages || []).filter((m) => m.role === "user").length === 0;

        if (video.contextType === "transcript" && video.transcript) {
          videoContext = {
            type: "transcript" as const,
            transcript: isFirstMessage ? video.transcript : undefined,
            videoTitle: video.title,
          };
        } else if (video.contextType === "video" && video.videoBase64 && isFirstMessage) {
          videoContext = {
            type: "video" as const,
            videoBase64: video.videoBase64,
            videoTitle: video.title,
          };
        } else {
          videoContext = {
            type: "metadata" as const,
            videoTitle: video.title,
          };
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          videoContext,
          characterPersonality: activeCharacter.personality,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get response");
      }

      const data = await res.json();

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholderMsg.id
                    ? { ...m, content: data.reply }
                    : m
                ),
                title:
                  c.messages.length <= 2
                    ? video?.title || text.slice(0, 40)
                    : c.title,
              }
            : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholderMsg.id
                    ? { ...m, content: `Error: ${msg}` }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setLoadingChat(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function removeVideo() {
    setCurrentVideo(null);
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, video: null } : c))
      );
    }
  }

  // ─── Character selection screen ───
  if (!activeCharacter) {
    return (
      <>
        <CharacterGrid
          characters={characters}
          onSelect={handleSelectCharacter}
          onCreate={() => {
            setEditingChar(null);
            setModalOpen(true);
          }}
          onEdit={(char) => {
            setEditingChar(char);
            setModalOpen(true);
          }}
          onDelete={handleDeleteCharacter}
        />
        <CharacterModal
          character={editingChar}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveCharacter}
        />
      </>
    );
  }

  // ─── Chat screen ───
  const video = activeConv?.video || currentVideo;

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          character={activeCharacter}
          conversations={charConversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            const conv = conversations.find((c) => c.id === id);
            setCurrentVideo(conv?.video || null);
          }}
          onNew={() => {
            setActiveId(null);
            setCurrentVideo(null);
          }}
          onDelete={(id) => {
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (activeId === id) {
              setActiveId(null);
              setCurrentVideo(null);
            }
          }}
          onSwitchCharacter={() => {
            setActiveCharacter(null);
            setActiveId(null);
            setCurrentVideo(null);
          }}
        />

        <div className="flex-1 flex flex-col h-full">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-lg"
                  style={{ background: `${activeCharacter.color}15`, boxShadow: `0 8px 32px ${activeCharacter.color}15` }}
                >
                  {activeCharacter.avatar}
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {activeCharacter.name}
                </h1>
                <p className="text-gray-400 text-center max-w-md mb-2 text-sm">
                  {activeCharacter.tagline}
                </p>
                {activeCharacter.description && (
                  <p className="text-gray-500 text-center max-w-md mb-8 text-xs">
                    {activeCharacter.description}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    "Summarize this video for me",
                    "What are the key takeaways?",
                    "Explain the main argument",
                    "What music is playing?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-left text-sm text-gray-400 bg-surface-2 hover:bg-surface-3 border border-surface-4 rounded-xl px-4 py-3 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto py-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={
                      loadingChat && msg.role === "assistant" && !msg.content
                    }
                    characterAvatar={activeCharacter.avatar}
                    characterColor={activeCharacter.color}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-surface-3 bg-surface-1 px-4 py-3">
            <div className="max-w-3xl mx-auto">
              {video && (
                <div className="mb-3">
                  <VideoCard video={video} onRemove={removeVideo} />
                </div>
              )}

              {showUrlInput && (
                <div className="flex items-center gap-2 mb-3 bg-surface-2 rounded-xl px-3 py-2 border border-surface-4">
                  <Youtube size={18} className="text-red-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLoadVideo();
                      if (e.key === "Escape") setShowUrlInput(false);
                    }}
                    placeholder="Paste YouTube URL here..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
                    autoFocus
                  />
                  <button
                    onClick={handleLoadVideo}
                    disabled={loadingVideo || !youtubeUrl.trim()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    {loadingVideo ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load"
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 bg-surface-2 rounded-2xl px-4 py-3 border border-surface-4 focus-within:border-accent/50 transition-colors">
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
                    showUrlInput
                      ? "bg-red-600/20 text-red-400"
                      : "text-gray-500 hover:text-white hover:bg-surface-3"
                  }`}
                  title="Attach YouTube video"
                >
                  <Link size={18} />
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    video
                      ? `Ask ${activeCharacter.name} about "${video.title}"...`
                      : `Message ${activeCharacter.name}...`
                  }
                  rows={1}
                  className="flex-1 bg-transparent text-white text-sm outline-none resize-none max-h-32 placeholder:text-gray-500"
                  style={{ height: "auto", minHeight: "24px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loadingChat}
                  className="flex-shrink-0 p-2 bg-accent hover:bg-accent-dim disabled:opacity-30 text-white rounded-xl transition-colors"
                >
                  {loadingChat ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-gray-600 text-center mt-2">
                AI can make mistakes. Videos are processed via transcript or
                GPT-4o vision.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CharacterModal
        character={editingChar}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCharacter}
      />
    </>
  );
}
