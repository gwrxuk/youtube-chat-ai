"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Character,
  randomColor,
  randomAvatar,
} from "@/lib/characters";

interface Props {
  character?: Character | null;
  open: boolean;
  onClose: () => void;
  onSave: (char: Character) => void;
}

export default function CharacterModal({ character, open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [color, setColor] = useState("#7c5cfc");

  useEffect(() => {
    if (character) {
      setName(character.name);
      setTagline(character.tagline);
      setDescription(character.description);
      setPersonality(character.personality);
      setAvatar(character.avatar);
      setColor(character.color);
    } else {
      setName("");
      setTagline("");
      setDescription("");
      setPersonality("");
      setAvatar(randomAvatar());
      setColor(randomColor());
    }
  }, [character, open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !personality.trim()) return;

    const id = character?.id || `char_${Date.now().toString(36)}`;
    onSave({
      id,
      name: name.trim(),
      tagline: tagline.trim() || `Chat with ${name.trim()}`,
      description: description.trim(),
      personality: personality.trim(),
      avatar,
      color,
      createdAt: character?.createdAt || Date.now(),
    });
    onClose();
  }

  const EMOJI_PICKS = ["🤖", "🧠", "🎭", "🦊", "🐉", "👻", "🧙", "🎸", "🔬", "📚", "🎬", "🎨", "⚡", "🌙", "🔥", "💎", "🦄", "🐺", "🎯", "🌊"];
  const COLOR_PICKS = ["#7c5cfc", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#ec4899", "#8b5cf6", "#f97316", "#14b8a6", "#6366f1"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-1 border border-surface-3 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-3">
          <h2 className="text-lg font-semibold text-white">
            {character ? "Edit Character" : "Create Character"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-3 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: `${color}20` }}
            >
              {avatar}
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1.5">Avatar</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PICKS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setAvatar(e)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                      avatar === e
                        ? "bg-accent/30 ring-2 ring-accent scale-110"
                        : "bg-surface-2 hover:bg-surface-3"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLOR_PICKS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? "ring-2 ring-white scale-110" : "ring-1 ring-surface-4"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Film Buff, Code Tutor, Anime Expert..."
              className="w-full bg-surface-2 border border-surface-4 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50"
              maxLength={40}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short description shown on the card"
              className="w-full bg-surface-2 border border-surface-4 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50"
              maxLength={80}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this character do? Visible to users before they start chatting."
              className="w-full bg-surface-2 border border-surface-4 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50 resize-none h-20"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Personality Prompt *
              <span className="text-gray-600 ml-1">(system instruction for the AI)</span>
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder={"You are a [role]. When discussing YouTube videos, you [behavior]. Your tone is [tone]. You always [habit]."}
              className="w-full bg-surface-2 border border-surface-4 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent/50 resize-none h-32"
              required
            />
            <p className="text-[11px] text-gray-600 mt-1">
              This becomes the AI&apos;s system prompt. Describe how the character should behave, speak, and analyze videos.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-surface-3 hover:bg-surface-4 text-gray-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !personality.trim()}
              className="flex-1 py-2.5 px-4 bg-accent hover:bg-accent-dim disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {character ? "Save Changes" : "Create Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
