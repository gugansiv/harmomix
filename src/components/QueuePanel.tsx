"use client";

import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";

export default function QueuePanel() {
  const { queue, currentIndex, removeFromQueue, clearQueue, playMany } = usePlayer();

  if (queue.length === 0) return null;

  return (
    <aside className="hidden w-80 shrink-0 border-l border-white/5 bg-neutral-900/40 p-4 xl:block">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-200">Queue</h2>
        <button
          onClick={clearQueue}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {queue.map((t, i) => (
          <div
            key={`${t.id}-${i}`}
            className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5 ${
              i === currentIndex ? "bg-white/10" : ""
            }`}
            onClick={() => playMany(queue, i)}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-neutral-200">
                {t.title}
              </div>
              <div className="truncate text-[11px] text-neutral-500">
                {t.source === "spotify" ? "Spotify" : "YouTube"} · {t.artist}
              </div>
            </div>
            <span className="text-[11px] tabular-nums text-neutral-600">
              {formatDuration(t.durationMs)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromQueue(i);
              }}
              aria-label="Remove"
              className="opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
