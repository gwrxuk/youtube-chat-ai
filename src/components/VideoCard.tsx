"use client";

import { X, FileText, Video, Clock } from "lucide-react";

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  contextType: "transcript" | "video" | "none";
}

interface Props {
  video: VideoInfo;
  onRemove: () => void;
}

export default function VideoCard({ video, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 bg-surface-2 border border-surface-4 rounded-xl p-3 max-w-md">
      <div className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-[10px] text-white px-1 rounded flex items-center gap-0.5">
          <Clock size={8} />
          {video.duration}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{video.title}</p>
        <div className="flex items-center gap-1 mt-1">
          {video.contextType === "transcript" ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              <FileText size={10} />
              Transcript loaded
            </span>
          ) : video.contextType === "video" ? (
            <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
              <Video size={10} />
              Video loaded (vision)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
              Metadata only
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-500 hover:text-white hover:bg-surface-4 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
