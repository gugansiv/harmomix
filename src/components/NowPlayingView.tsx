"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";
import LyricsPanel from "./LyricsPanel";

/**
 * Full-screen expanded Now Playing view.
 * Large artwork + full transport (shuffle / prev / play / next / repeat),
 * progress + volume, and tabs for Lyrics and Queue. Rendered as a z-50
 * overlay above the mini PlayerBar (which stays mounted underneath).
 */
export default function NowPlayingView({ onClose }: { onClose: () => void }) {
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
    volume,
    muted,
    setVolume,
    toggleMute,
    playMany,
    removeFromQueue,
    shuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [tab, setTab] = useState<"player" | "lyrics" | "queue">("player");
  const playing = status === "playing";
  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!currentTrack) return null;

  const repeatTitle =
    repeatMode === "off"
      ? "Repeat: off"
      : repeatMode === "all"
        ? "Repeat: all"
        : "Repeat: one";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1a1a] via-background to-black"
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full p-2 text-subtext transition-colors hover:bg-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Collapse now playing"
          title="Collapse (Esc)"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Tabs */}
        <div className="flex gap-1 rounded-full bg-hover p-1">
          {(["player", "lyrics", "queue"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-black" : "text-subtext hover:text-foreground"
              }`}
              aria-pressed={tab === t}
            >
              {t === "player" ? "Now Playing" : t}
            </button>
          ))}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            currentTrack.source === "spotify"
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {currentTrack.source === "spotify" ? "Spotify" : "YouTube"}
        </span>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
        {tab === "player" && (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <div className="aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl bg-hover shadow-2xl shadow-black/60 sm:max-w-[360px]">
              {currentTrack.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentTrack.artworkUrl}
                  alt={`${currentTrack.title} artwork`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-accent/10 text-5xl text-subtext">
                  ♪
                </div>
              )}
            </div>
            <div className="w-full text-center">
              <h2 className="truncate text-xl font-bold text-foreground sm:text-2xl">
                {currentTrack.title}
              </h2>
              <p className="mt-1 truncate text-sm text-subtext">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {tab === "lyrics" && (
          <div className="h-full w-full max-w-2xl overflow-hidden py-2">
            <LyricsPanel
              artist={currentTrack.artist}
              title={currentTrack.title}
              positionMs={positionMs}
            />
          </div>
        )}

        {tab === "queue" && (
          <div className="h-full w-full max-w-2xl overflow-y-auto py-2">
            {queue.length === 0 ? (
              <p className="p-6 text-center text-sm text-subtext">Your queue is empty.</p>
            ) : (
              <div className="space-y-1">
                {queue.map((t, idx) => (
                  <div
                    key={`${t.id}-${idx}`}
                    onClick={() => playMany(queue, idx)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                      idx === currentIndex ? "bg-hover" : "hover:bg-hover/60"
                    }`}
                  >
                    <span className="w-6 text-right text-xs tabular-nums text-subtext">
                      {idx === currentIndex ? (
                        <span className="text-accent">▶</span>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    {t.artworkUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.artworkUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 rounded-md bg-hover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${idx === currentIndex ? "text-accent" : "text-foreground"}`}>
                        {t.title}
                      </p>
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
                      className="text-subtext opacity-0 hover:text-foreground group-hover:opacity-100"
                      aria-label={`Remove ${t.title} from queue`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transport / progress / volume — always visible */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-2 sm:px-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-subtext">
            {formatDuration(positionMs)}
          </span>
          <div className="relative flex-1">
            <input
              type="range"
              className="h-1.5 w-full cursor-pointer appearance-none bg-transparent"
              min={0}
              max={Math.max(durationMs, 1)}
              value={Math.min(positionMs, durationMs)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Playback progress"
            />
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="w-10 shrink-0 text-[11px] tabular-nums text-subtext">
            {formatDuration(durationMs)}
          </span>
        </div>

        {/* Transport */}
        <div className="mt-3 flex items-center justify-center gap-5 sm:gap-6">
          <button
            onClick={toggleShuffle}
            className={`relative rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              shuffle ? "text-accent" : "text-subtext hover:text-foreground"
            }`}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            title={shuffle ? "Shuffle: on" : "Shuffle: off"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h3.5c1.2 0 2.3.55 3.02 1.5l2.96 3.99A3.75 3.75 0 0016.5 14H20m0 0l-2.5-2.5M20 14l-2.5 2.5M4 17h3.5c.83 0 1.62-.27 2.27-.75M20 7h-3.5c-.83 0-1.62.27-2.27.75M20 7l-2.5-2.5M20 7l-2.5 2.5" />
            </svg>
            {shuffle && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" aria-hidden="true" />}
          </button>

          <button
            onClick={prev}
            className="rounded-lg p-2 text-foreground transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Previous"
            title="Previous track"
          >
            <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black transition-all hover:scale-105 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent active:scale-95"
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="ml-1 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={next}
            className="rounded-lg p-2 text-foreground transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Next"
            title="Next track"
          >
            <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button
            onClick={cycleRepeat}
            className={`relative rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              repeatMode !== "off" ? "text-accent" : "text-subtext hover:text-foreground"
            }`}
            aria-label={repeatTitle}
            aria-pressed={repeatMode !== "off"}
            title={repeatTitle}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {repeatMode === "one" && (
              <span className="absolute -top-0.5 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-black">
                1
              </span>
            )}
            {repeatMode !== "off" && (
              <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={toggleMute}
            className="rounded-lg p-1.5 text-subtext transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            )}
          </button>
          <input
            type="range"
            className="h-1.5 w-40 cursor-pointer appearance-none bg-transparent"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
