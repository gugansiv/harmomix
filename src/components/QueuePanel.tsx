"use client";

import { useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";
import LyricsPanel from "./LyricsPanel";

export default function QueuePanel({ onClose }: { onClose: () => void }) {
  const {
    queue,
    currentIndex,
    removeFromQueue,
    clearQueue,
    playMany,
    currentTrack,
    positionMs,
  } = usePlayer();
  const [tab, setTab] = useState<"queue" | "lyrics">("queue");
  const [drag, setDrag] = useState<number | null>(null);

  const onDrop = (target: number) => {
    if (drag === null || drag === target) return;
    const copy = [...queue];
    const [moved] = copy.splice(drag, 1);
    copy.splice(target, 0, moved);
    // Re-sync current index: keep current track under playback
    const curId = queue[currentIndex]?.id;
    const newIdx = copy.findIndex((t) => t.id === curId);
    playMany(copy, newIdx < 0 ? 0 : newIdx);
    setDrag(null);
  };

  return (
    <aside
      className="fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-full flex-col border-l border-border bg-sidebar"
      aria-label="Play queue"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex gap-1 rounded-full bg-hover p-1">
          {(["queue", "lyrics"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-black" : "text-subtext hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-subtext hover:text-foreground" aria-label="Close">
          ✕
        </button>
      </div>

      {tab === "lyrics" ? (
        currentTrack ? (
          <LyricsPanel
            artist={currentTrack.artist}
            title={currentTrack.title}
            positionMs={positionMs}
          />
        ) : (
          <p className="p-6 text-sm text-subtext">Play a track to see lyrics.</p>
        )
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {queue.length === 0 ? (
            <p className="p-6 text-sm text-subtext">Your queue is empty.</p>
          ) : (
            <>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {queue.map((t, idx) => (
                  <div
                    key={`${t.id}-${idx}`}
                    draggable
                    onDragStart={() => setDrag(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(idx)}
                    onClick={() => playMany(queue, idx)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                      idx === currentIndex ? "bg-hover" : "hover:bg-hover/60"
                    } ${drag === idx ? "opacity-50" : ""}`}
                  >
                    <span className="cursor-grab text-subtext/40 group-hover:text-subtext">⠿</span>
                    <div className="w-10 flex-shrink-0">
                      {t.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.artworkUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-hover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                      <p className="truncate text-xs text-subtext">{t.artist}</p>
                    </div>
                    <span className="text-xs tabular-nums text-subtext">
                      {formatDuration(t.durationMs)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {queue.length > 1 && (
                <div className="border-t border-border p-3 text-center">
                  <button
                    onClick={clearQueue}
                    className="text-xs text-subtext hover:text-foreground"
                  >
                    Clear queue
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
