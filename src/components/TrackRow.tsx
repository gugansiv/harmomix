"use client";

import { useState } from "react";
import Image from "next/image";
import { UnifiedTrack, Source } from "@/lib/types";
import { usePlayer } from "@/lib/player-context";

interface TrackRowProps {
  track: UnifiedTrack;
  index?: number;
  onPlay: (track: UnifiedTrack) => void;
  onAdd: (track: UnifiedTrack) => void;
  onLike?: (track: UnifiedTrack) => void;
  isLiked?: boolean;
  isPlaying?: boolean;
  showSource?: boolean;
}

const SOURCE_COLORS: Record<Source, string> = {
  spotify: "#1db954",
  youtube: "#ff0000",
};

const SOURCE_LABELS: Record<Source, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
};

export default function TrackRow({
  track,
  index,
  onPlay,
  onAdd,
  onLike,
  isLiked = false,
  isPlaying = false,
  showSource = true,
}: TrackRowProps) {
  const [hovered, setHovered] = useState(false);
  const { queue, currentIndex, status, playTrack, addToQueue } = usePlayer();

  const isInQueue = queue.some((t) => t.id === track.id);
  const isCurrent = isPlaying && isInQueue && queue[currentIndex]?.id === track.id;

  const handleClick = (e: React.MouseEvent) => {
    if (!e.currentTarget.closest("button") && !e.currentTarget.closest('[role="button"]')) {
      onPlay(track);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      // Toggle play/pause handled by PlayerBar
    } else {
      onPlay(track);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(track);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(track);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "--:--";
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`
        group flex items-center gap-3 px-4 py-2.5 rounded-xl
        transition-all duration-150 ease-out
        cursor-pointer select-none
        ${isCurrent ? "bg-hover" : "hover:bg-hover"}
        ${hovered ? "bg-hover" : ""}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      role="row"
      aria-selected={isCurrent}
    >
      {/* Track Number / Play Button */}
      <div className="flex items-center justify-center w-10 flex-shrink-0">
        {index !== undefined && !hovered && !isCurrent && (
          <span className="text-subtext text-sm font-medium w-6 text-right">{index + 1}</span>
        )}
        {(hovered || isCurrent) && (
          <button
            onClick={handlePlayClick}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-150
              ${isCurrent ? "bg-accent text-black" : "bg-accent/20 text-accent hover:bg-accent/40"}
            `}
            aria-label={isCurrent ? (status === "playing" ? "Pause" : "Play") : "Play"}
            aria-pressed={isCurrent}
          >
            {isCurrent ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Artwork */}
      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-hover">
        {track.artworkUrl ? (
          <Image
            src={track.artworkUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/30 to-accent/10">
            <svg className="w-6 h-6 text-subtext" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
        {isCurrent && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2" />
            </svg>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate text-foreground">{track.title}</span>
          {showSource && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
              style={{
                backgroundColor: `${SOURCE_COLORS[track.source]}20`,
                color: SOURCE_COLORS[track.source],
              }}
            >
              {SOURCE_LABELS[track.source]}
            </span>
          )}
          {isCurrent && (
            <span className="text-accent text-[10px] font-semibold flex-shrink-0">NOW PLAYING</span>
          )}
        </div>
        <span className="text-subtext text-sm truncate">{track.artist}</span>
      </div>

      {/* Album (optional, hidden on mobile) */}
      <div className="hidden md:block w-40 text-subtext text-sm truncate px-2">
        {track.album ?? "—"}
      </div>

      {/* Duration / Actions */}
      <div className="flex items-center gap-1.5 w-36 flex-shrink-0 justify-end">
        {!hovered && !isCurrent && (
          <span className="text-subtext text-sm font-medium tabular-nums w-20 text-right">
            {formatDuration(track.durationMs)}
          </span>
        )}
        {hovered && (
          <div className="flex items-center gap-1">
            {onLike && (
              <button
                onClick={handleLikeClick}
                className={`
                  p-1.5 rounded-full transition-all duration-150
                  ${isLiked ? "text-red-400 bg-red-400/10" : "text-subtext hover:text-foreground hover:bg-hover"}
                `}
                aria-label={isLiked ? "Remove from Liked" : "Add to Liked"}
                aria-pressed={isLiked}
                title={isLiked ? "Remove from Liked" : "Save to Liked"}
              >
                <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleAddClick}
              className="p-1.5 rounded-full text-subtext hover:text-foreground hover:bg-hover transition-colors"
              aria-label="Add to queue"
              title="Add to queue"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="p-1.5 rounded-full text-subtext hover:text-foreground hover:bg-hover transition-colors"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}