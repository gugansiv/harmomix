"use client";

import { usePlayer } from "@/lib/player-context";
import { formatDuration } from "@/lib/format";

export default function QueuePanel({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { currentTrack, queue, currentIndex, removeFromQueue, clearQueue, playMany } =
    usePlayer();

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 rounded-xl bg-[#121212] p-4 text-white select-none border border-white/5 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
          <span>Queue</span>
          <span className="text-xs font-normal text-neutral-400">
            ({queue.length})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Currently Playing Card */}
      {currentTrack && (
        <div className="flex flex-col gap-2 rounded-lg bg-[#181818] p-3 border border-white/5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
            Now Playing
          </span>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#282828]">
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
              <div className="truncate text-xs font-bold text-white">
                {currentTrack.title}
              </div>
              <div className="truncate text-[11px] text-neutral-400">
                {currentTrack.artist}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Up Queue List */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        <span className="text-xs font-bold text-neutral-400 px-1 py-1">
          Next Up
        </span>
        {queue.length === 0 ? (
          <div className="mt-8 text-center text-xs text-neutral-500">
            Queue is empty. Add songs from search.
          </div>
        ) : (
          queue.map((t, i) => {
            const isCur = i === currentIndex;
            return (
              <div
                key={`${t.id}-${i}`}
                onClick={() => playMany(queue, i)}
                className={`group flex items-center gap-2 rounded-md p-2 cursor-pointer transition ${
                  isCur ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-[#242424]">
                  {t.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.artworkUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      ♪
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-xs font-semibold ${
                      isCur ? "text-[#1ed760]" : "text-white"
                    }`}
                  >
                    {t.title}
                  </div>
                  <div className="truncate text-[11px] text-neutral-400">
                    {t.artist}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {formatDuration(t.durationMs)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(i);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white transition"
                  title="Remove from queue"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
