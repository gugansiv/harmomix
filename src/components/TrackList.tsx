"use client";

import type { UnifiedTrack } from "@/lib/types";
import { usePlayer } from "@/lib/player-context";
import TrackRow from "./TrackRow";

export default function TrackList({
  title,
  tracks,
  onPlay,
  onAdd,
}: {
  title: string;
  tracks: UnifiedTrack[];
  onPlay: (track: UnifiedTrack, all: UnifiedTrack[]) => void;
  onAdd: (track: UnifiedTrack) => void;
}) {
  const { currentTrack } = usePlayer();

  if (tracks.length === 0) return null;

  return (
    <section className="mb-8 select-none">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h2>
        <span className="text-xs text-neutral-400 font-medium">
          {tracks.length} tracks
        </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[16px_1fr_120px_60px_40px] gap-4 px-3 pb-2 text-xs font-semibold text-neutral-400 border-b border-white/5 uppercase tracking-wider">
        <span>#</span>
        <span>Title</span>
        <span className="hidden sm:inline">Source</span>
        <span className="text-right">⏱</span>
        <span />
      </div>

      {/* Table Rows */}
      <div className="mt-2 flex flex-col gap-0.5">
        {tracks.map((t, idx) => (
          <TrackRow
            key={t.id}
            index={idx}
            track={t}
            isPlaying={currentTrack?.id === t.id}
            onPlay={() => onPlay(t, tracks)}
            onAdd={() => onAdd(t)}
          />
        ))}
      </div>
    </section>
  );
}
