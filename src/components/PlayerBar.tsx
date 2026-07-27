"use client";

import { useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";

export default function PlayerBar({
  showQueue,
  onToggleQueue,
}: {
  showQueue?: boolean;
  onToggleQueue?: () => void;
}) {
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

  const [liked, setLiked] = useState(false);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);

  if (!currentTrack) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 flex h-20 items-center justify-between border-t border-[#282828] bg-[#000000] px-6 text-xs text-neutral-400 select-none">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-md bg-[#181818] flex items-center justify-center text-neutral-600">
            ♪
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-300">Nothing Playing</div>
            <div className="text-xs text-neutral-500">Search songs, videos or artists</div>
          </div>
        </div>
        <div className="text-xs text-neutral-500">Harmonix Spotify Player</div>
      </footer>
    );
  }

  const playing = status === "playing";

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 h-24 border-t border-[#282828] bg-[#000000] px-4 select-none">
      <div className="mx-auto flex h-full items-center justify-between gap-4">
        {/* Left Column: Cover Art, Title, Artist, Source & Like */}
        <div className="flex w-72 shrink-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#181818] shadow-md group">
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

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white hover:underline cursor-pointer">
              {currentTrack.title}
            </div>
            <div className="truncate text-xs font-medium text-neutral-400 hover:text-white hover:underline cursor-pointer">
              {currentTrack.artist}
            </div>
          </div>

          {/* Heart / Like button */}
          <button
            onClick={() => setLiked(!liked)}
            className={`text-sm transition ${
              liked ? "text-[#1ed760]" : "text-neutral-400 hover:text-white"
            }`}
            title={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
          >
            {liked ? "💚" : "🤍"}
          </button>
        </div>

        {/* Center Column: Playback Controls & Progress Bar */}
        <div className="flex flex-1 max-w-2xl flex-col items-center gap-1.5">
          {/* Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={prev}
              aria-label="Previous track"
              className="text-neutral-400 hover:text-white transition"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16">
                <path d="M13 2.5L5 8l8 5.5V2.5zM3 2.5h2v11H3v-11z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-md transition hover:scale-105 hover:bg-[#1fdf64]"
            >
              {playing ? (
                <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16">
                  <path d="M3 2h3v12H3zm7 0h3v12h-3z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 16 16">
                  <path d="M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z" />
                </svg>
              )}
            </button>

            <button
              onClick={next}
              aria-label="Next track"
              className="text-neutral-400 hover:text-white transition"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16">
                <path d="M3 2.5L11 8l-8 5.5V2.5zM11 2.5h2v11h-2v-11z" />
              </svg>
            </button>
          </div>

          {/* Progress Slider */}
          <div className="flex w-full items-center gap-2">
            <span className="w-10 text-right text-[11px] font-mono tabular-nums text-neutral-400">
              {formatDuration(positionMs)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                className="seek w-full"
                min={0}
                max={Math.max(durationMs, 1)}
                value={Math.min(positionMs, durationMs)}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </div>
            <span className="w-10 text-[11px] font-mono tabular-nums text-neutral-400">
              {formatDuration(durationMs)}
            </span>
          </div>
        </div>

        {/* Right Column: Queue Toggle, Source Indicator & Volume */}
        <div className="flex w-72 shrink-0 items-center justify-end gap-3 text-xs text-neutral-400">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              currentTrack.source === "spotify"
                ? "bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {currentTrack.source === "spotify" ? "Spotify" : "YouTube Music"}
          </span>

          {/* Queue toggle button */}
          {onToggleQueue && (
            <button
              onClick={onToggleQueue}
              className={`p-1 transition ${
                showQueue ? "text-[#1ed760]" : "text-neutral-400 hover:text-white"
              }`}
              title="Queue"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16">
                <path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm0-4.5H1V4.5h14V6z" />
              </svg>
            </button>
          )}

          {/* Volume slider */}
          <div className="flex items-center gap-2 w-28">
            <button
              onClick={() => setMuted(!muted)}
              className="text-neutral-400 hover:text-white"
            >
              {muted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              className="volume flex-1"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
