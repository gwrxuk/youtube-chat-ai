"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { Character } from "@/lib/characters";

interface Props {
  characters: Character[];
  onSelect: (char: Character) => void;
  onCreate: () => void;
  onEdit: (char: Character) => void;
  onDelete: (id: string) => void;
}

export default function CharacterGrid({
  characters,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-6 py-12 flex-1">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            YouTube Chat AI
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Pick a character to chat with about any YouTube video.
            Each has a unique personality and perspective.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => onSelect(char)}
              className="group relative bg-surface-1 border border-surface-3 hover:border-surface-4 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
            >
              {!char.isDefault && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(char);
                    }}
                    className="p-1.5 bg-surface-3 hover:bg-surface-4 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(char.id);
                    }}
                    className="p-1.5 bg-surface-3 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${char.color}20` }}
                >
                  {char.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white mb-0.5 truncate">
                    {char.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {char.tagline}
                  </p>
                </div>
              </div>

              {char.description && (
                <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                  {char.description}
                </p>
              )}

              <div
                className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: char.color }}
              />
            </div>
          ))}

          {/* Create new character card */}
          <div
            onClick={onCreate}
            className="bg-surface-1 border-2 border-dashed border-surface-4 hover:border-accent/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col items-center justify-center min-h-[140px] gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Plus size={24} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Create Character</p>
              <p className="text-xs text-gray-500">Custom personality &amp; style</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-6 text-xs text-gray-600">
        Powered by GPT-4o &middot; Paste YouTube URLs to discuss videos
      </div>
    </div>
  );
}
