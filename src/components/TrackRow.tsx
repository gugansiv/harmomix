"use client";

import type { UnifiedTrack } from "@/lib/types";
import { formatDuration } from "@/lib/format";

function SourceBadge({ source }: { source: UnifiedTrack["source"] }) {
  return source === "spotify" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#1ed760]/10 px-2 py-0.5 text-[11px] font-bold text-[#1ed760] border border-[#1ed760]/20">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
      Spotify
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-500 border border-red-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      YouTube
    </span>
  );
}

export default function TrackRow({
  index,
  track,
  isPlaying,
  onPlay,
  onAdd,
}: {
  index: number;
  track: UnifiedTrack;
  isPlaying?: boolean;
  onPlay: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="group grid grid-cols-[16px_1fr_120px_60px_40px] items-center gap-4 rounded-md px-3 py-2 text-sm text-neutral-400 hover:bg-[#2a2a2a]/60 hover:text-white transition">
      {/* Index / Hover Play Button */}
      <div className="flex items-center justify-center font-semibold text-xs text-neutral-400">
        <span className="group-hover:hidden">
          {isPlaying ? (
            <span className="text-[#1ed760] font-bold">▶</span>
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={onPlay}
          className="hidden group-hover:block text-white hover:scale-110 transition"
          aria-label="Play track"
        >
          ▶
        </button>
      </div>

      {/* Artwork, Title & Artist */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#282828] shadow">
          {track.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.artworkUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              ♪
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm font-semibold ${
              isPlaying ? "text-[#1ed760]" : "text-white"
            }`}
          >
            {track.title}
          </div>
          <div className="truncate text-xs text-neutral-400 group-hover:text-neutral-300">
            {track.artist}
          </div>
        </div>
      </div>

      {/* Source Badge */}
      <div className="hidden sm:block">
        <SourceBadge source={track.source} />
      </div>

      {/* Duration */}
      <div className="text-right text-xs font-mono text-neutral-400 group-hover:text-neutral-300">
        {formatDuration(track.durationMs)}
      </div>

      {/* Quick Add to Queue button */}
      <div className="flex items-center justify-end">
        <button
          onClick={onAdd}
          title="Add to queue"
          className="h-8 w-8 items-center justify-center rounded-full text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white transition"
        >
          +
        </button>
      </div>
    </div>
  );
}
