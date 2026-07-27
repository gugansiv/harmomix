"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";
import QueuePanel from "./QueuePanel";
import DeviceMenu from "./DeviceMenu";

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
    volume,
    muted,
    setVolume,
    toggleMute,
    clearQueue,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [volumeHover, setVolumeHover] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  const playing = status === "playing";

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
          toggleMute();
          break;
        case "q":
          setShowQueue((s) => !s);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, next, prev, setVolume, volume, toggleMute, showQueue]);

  if (!currentTrack) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 h-[90px] bg-black/90 backdrop-blur-xl border-t border-border flex items-center justify-center px-4 text-subtext">
        Nothing playing — search for a track and hit play.
      </footer>
    );
  }

  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <>
      {/* Queue + Lyrics Panel (overlay) */}
      {showQueue && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQueue(false)}
            aria-hidden="true"
          />
          <QueuePanel onClose={() => setShowQueue(false)} />
        </>
      )}

      {showDevices && <DeviceMenu onClose={() => setShowDevices(false)} />}

      {/* Main Player Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-30 h-[90px] bg-black/90 backdrop-blur-xl border-t border-border">
        <div className="mx-auto flex max-w-7xl h-full items-center gap-4 px-4">
          {/* Left: Track Info */}
          <div className="flex w-[25%] shrink-0 items-center gap-3 min-w-0">
            <button
              className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-hover transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Open Now Playing"
            >
              {currentTrack.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.artworkUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/30 to-accent/10 text-subtext">
                  ♪
                </div>
              )}
              {playing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2" />
                  </svg>
                </div>
              )}
            </button>
            <div className="min-w-0">
              <p className="truncate font-medium text-sm text-foreground">{currentTrack.title}</p>
              <p className="truncate text-xs text-subtext">
                {currentTrack.artist}
                <span className="mx-1.5">•</span>
                <span className={currentTrack.source === "spotify" ? "text-green-400" : "text-red-400"}>
                  {currentTrack.source === "spotify" ? "Spotify" : "YouTube"}
                </span>
              </p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {}}
                className="p-1.5 rounded-lg text-subtext hover:text-foreground hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Shuffle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4v6m-4 4h12m-6 4v6m4-4h-12" />
                </svg>
              </button>

              <button
                onClick={prev}
                className="p-1.5 rounded-lg text-foreground hover:text-accent hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="relative p-0 w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black active:scale-95"
                aria-label={playing ? "Pause" : "Play"}
                aria-pressed={playing}
              >
                {playing ? (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                {playing && (
                  <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" aria-hidden="true" />
                )}
              </button>

              <button
                onClick={next}
                className="p-1.5 rounded-lg text-foreground hover:text-accent hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                className="p-1.5 rounded-lg text-subtext hover:text-foreground hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Repeat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex w-full max-w-2xl items-center gap-2">
              <span className="w-10 text-right text-[11px] tabular-nums text-subtext shrink-0">
                {formatDuration(positionMs)}
              </span>
              <div className="flex-1 relative" ref={volumeRef}>
                <input
                  ref={progressRef}
                  type="range"
                  className="w-full h-1.5 appearance-none bg-transparent cursor-pointer"
                  min={0}
                  max={Math.max(durationMs, 1)}
                  value={Math.min(positionMs, durationMs)}
                  onChange={(e) => seek(Number(e.target.value))}
                  onMouseDown={() => progressRef.current?.classList.add("dragging")}
                  onMouseUp={() => progressRef.current?.classList.remove("dragging")}
                  aria-label="Playback progress"
                />
                <div
                  className="absolute left-0 top-1/2 h-1.5 bg-accent rounded-full transition-all duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Playback progress"
                />
                <div
                  className={`absolute top-1/2 w-3 h-3 rounded-full bg-accent transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out ${progressRef.current?.classList.contains("dragging") ? "scale-150" : "opacity-0 hover:opacity-100 focus-within:opacity-100"}`}
                  style={{ left: `${progress}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-10 text-[11px] tabular-nums text-subtext shrink-0">
                {formatDuration(durationMs)}
              </span>
            </div>
          </div>

          {/* Right: Volume + Queue + Devices + Lyrics */}
          <div className="flex w-[25%] shrink-0 items-center justify-end gap-2 min-w-0">
            <button
              onClick={() => setShowDevices((s) => !s)}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black ${showDevices ? "text-accent bg-hover" : "text-subtext hover:text-foreground hover:bg-hover"}`}
              aria-label="Connect device"
              aria-expanded={showDevices}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            <button
              onClick={() => setShowQueue((s) => !s)}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black ${showQueue ? "text-accent bg-hover" : "text-subtext hover:text-foreground hover:bg-hover"}`}
              aria-label="Queue and lyrics"
              aria-expanded={showQueue}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-subtext hover:text-foreground hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" /></svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
              </button>

              <div className="relative" onMouseEnter={() => setVolumeHover(true)} onMouseLeave={() => setVolumeHover(false)}>
                <input
                  type="range"
                  className={`w-0 opacity-0 pointer-events-none transition-all duration-200 ease-out ${volumeHover ? "w-24 opacity-100 pointer-events-auto" : ""} appearance-none bg-transparent cursor-pointer`}
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
        </div>
      </footer>
    </>
  );
}
