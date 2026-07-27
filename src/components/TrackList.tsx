"use client";

import type { UnifiedTrack } from "@/lib/types";
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
  if (tracks.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      <div className="flex flex-col gap-0.5">
        {tracks.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            onPlay={() => onPlay(t, tracks)}
            onAdd={() => onAdd(t)}
          />
        ))}
      </div>
    </section>
  );
}
