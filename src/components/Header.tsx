"use client";

import { usePlayer } from "@/lib/player-context";
import SearchBar from "./SearchBar";
import type { SourceFilter } from "@/lib/types";

export default function Header({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  loading,
  onConnectSpotify,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filter: SourceFilter;
  onFilterChange: (f: SourceFilter) => void;
  loading: boolean;
  onConnectSpotify: () => void;
}) {
  const { spotifyReady } = usePlayer();

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-3 bg-[#121212]/90 px-6 py-3 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between gap-4">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-neutral-400 hover:text-white transition"
          >
            ‹
          </button>
          <button
            onClick={() => window.history.forward()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-neutral-400 hover:text-white transition"
          >
            ›
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <SearchBar
            query={query}
            onQueryChange={onQueryChange}
            filter={filter}
            onFilterChange={onFilterChange}
            loading={loading}
          />
        </div>

        {/* Spotify Account Status / Action Button */}
        <div className="flex items-center gap-3">
          {spotifyReady ? (
            <div className="flex items-center gap-2 rounded-full bg-[#1ed760]/10 px-3 py-1 text-xs font-bold text-[#1ed760] border border-[#1ed760]/20">
              <span className="h-2 w-2 rounded-full bg-[#1ed760] animate-pulse" />
              Spotify Connected
            </div>
          ) : (
            <button
              onClick={onConnectSpotify}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:scale-105 hover:bg-neutral-200"
            >
              Connect Spotify
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
