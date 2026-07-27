"use client";

import type { UnifiedTrack } from "@/lib/types";
import { formatDuration } from "@/lib/format";

function SourceBadge({ source }: { source: UnifiedTrack["source"] }) {
  return source === "spotify" ? (
    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
      Spotify
    </span>
  ) : (
    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
      YouTube
    </span>
  );
}

export default function TrackRow({
  track,
  onPlay,
  onAdd,
}: {
  track: UnifiedTrack;
  onPlay: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
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
        <button
          onClick={onPlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
        >
          <span className="text-white text-lg">▶</span>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-100">
          {track.title}
        </div>
        <div className="truncate text-xs text-neutral-400">{track.artist}</div>
      </div>

      <div className="hidden sm:block">
        <SourceBadge source={track.source} />
      </div>

      <div className="w-12 text-right text-xs tabular-nums text-neutral-400">
        {formatDuration(track.durationMs)}
      </div>

      <button
        onClick={onAdd}
        aria-label="Add to queue"
        className="ml-1 rounded-md px-2 py-1 text-neutral-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
      >
        +
      </button>
    </div>
  );
}
