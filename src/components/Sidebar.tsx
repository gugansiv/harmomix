"use client";

import { usePlayer } from "@/lib/player-context";
import type { SourceFilter } from "@/lib/types";

export default function Sidebar({
  filter,
  onFilterChange,
  onConnectSpotify,
}: {
  filter: SourceFilter;
  onFilterChange: (f: SourceFilter) => void;
  onConnectSpotify: () => void;
}) {
  const { spotifyReady } = usePlayer();

  return (
    <aside className="flex w-64 flex-col gap-2 p-2 select-none shrink-0">
      {/* Brand & Main Navigation */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#121212] p-4 text-neutral-300">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#1ed760] to-[#1db954] text-black shadow-lg shadow-emerald-500/20">
            <svg
              className="h-5 w-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.467-.077-.334.132-.67.467-.746 3.816-.872 7.086-.496 9.722 1.115.294.18.386.563.207.854zm1.224-2.72c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.126-.85-.106-.975-.519-.125-.413.106-.85.519-.975 3.632-1.102 8.147-.568 11.236 1.332.366.226.482.706.257 1.071zm.135-2.835C14.692 8.95 8.375 8.74 4.71 9.852c-.505.153-1.037-.132-1.19-.637-.153-.505.132-1.037.637-1.19 4.214-1.279 11.203-1.04 15.658 1.604.454.27.601.86.33 1.314-.27.454-.86.601-1.314.33z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Harmonix
          </span>
        </div>

        <nav className="mt-2 flex flex-col gap-1">
          <button
            onClick={() => onFilterChange("all")}
            className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-[#282828] text-white"
                : "text-neutral-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h5v-6h6v6h5V7.577l-7.5-4.33z" />
            </svg>
            Home
          </button>
          <button
            onClick={() => onFilterChange("spotify")}
            className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              filter === "spotify"
                ? "bg-[#282828] text-[#1ed760]"
                : "text-neutral-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1ed760]/20 text-[#1ed760] font-bold text-xs">
              S
            </span>
            Spotify Music
          </button>
          <button
            onClick={() => onFilterChange("youtube")}
            className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              filter === "youtube"
                ? "bg-[#282828] text-red-500"
                : "text-neutral-400 hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-500 font-bold text-xs">
              Y
            </span>
            YouTube Videos
          </button>
        </nav>
      </div>

      {/* Library & Service Connections Panel */}
      <div className="flex flex-1 flex-col justify-between rounded-xl bg-[#121212] p-4 text-neutral-300">
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3 text-neutral-400 hover:text-white cursor-pointer transition">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM6 3v18h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6zm3 4h8v2H9V7zm0 4h8v2H9v-2z" />
              </svg>
              <span className="text-sm font-bold">Your Library</span>
            </div>
            <span className="rounded-full bg-white/5 p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition cursor-pointer">
              +
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {/* Spotify Connection Box */}
            <div className="rounded-lg bg-[#181818] p-3.5 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Spotify SDK</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    spotifyReady ? "bg-[#1ed760] shadow-sm shadow-[#1ed760]" : "bg-neutral-600"
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {spotifyReady
                  ? "Connected & ready for playback"
                  : "Connect your Premium account to stream tracks."}
              </p>
              {!spotifyReady && (
                <button
                  type="button"
                  onClick={onConnectSpotify}
                  className="mt-3 w-full rounded-full bg-[#1ed760] py-1.5 text-xs font-bold text-black transition hover:scale-[1.02] hover:bg-[#1fdf64]"
                >
                  Connect Spotify
                </button>
              )}
            </div>

            {/* YouTube Connection Box */}
            <div className="rounded-lg bg-[#181818] p-3.5 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">YouTube API</span>
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500" />
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Ready for videos & audio streaming.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-2 pt-4 text-[11px] text-neutral-500">
          Harmonix Unified Player &bull; Spotify Web UI
        </div>
      </div>
    </aside>
  );
}
