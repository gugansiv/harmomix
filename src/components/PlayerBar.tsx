"use client";

import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";

export default function PlayerBar() {
  const {
    currentTrack,
    status,
    positionMs,
    durationMs,
    togglePlay,
    next,
    prev,
    seek,
    queue,
    currentIndex,
  } = usePlayer();

  if (!currentTrack) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 flex h-20 items-center justify-center border-t border-white/5 bg-neutral-900/95 px-4 text-sm text-neutral-500 backdrop-blur">
        Nothing playing — search and hit play.
      </footer>
    );
  }

  const playing = status === "playing";

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-neutral-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div className="flex w-64 shrink-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
            {currentTrack.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentTrack.artworkUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-500">
                ♪
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-neutral-100">
              {currentTrack.title}
            </div>
            <div className="truncate text-xs text-neutral-400">
              {currentTrack.artist}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous"
              className="text-neutral-300 hover:text-white"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black transition hover:bg-emerald-400"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="text-neutral-300 hover:text-white"
            >
              ⏭
            </button>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <span className="w-10 text-right text-[11px] tabular-nums text-neutral-500">
              {formatDuration(positionMs)}
            </span>
            <input
              type="range"
              className="seek flex-1"
              min={0}
              max={Math.max(durationMs, 1)}
              value={Math.min(positionMs, durationMs)}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <span className="w-10 text-[11px] tabular-nums text-neutral-500">
              {formatDuration(durationMs)}
            </span>
          </div>
        </div>

        <div className="hidden w-64 shrink-0 items-center justify-end gap-2 text-xs text-neutral-500 sm:flex">
          <span className="rounded bg-white/5 px-2 py-1">
            {currentTrack.source === "spotify" ? "Spotify" : "YouTube"}
          </span>
          <span className="tabular-nums">
            {currentIndex + 1}/{queue.length}
          </span>
        </div>
      </div>
    </footer>
  );
}
