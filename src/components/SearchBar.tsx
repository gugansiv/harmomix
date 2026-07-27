"use client";

import type { SourceFilter } from "@/lib/types";

const FILTERS: { id: SourceFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🎵" },
  { id: "spotify", label: "Spotify", icon: "🟢" },
  { id: "youtube", label: "YouTube Music", icon: "🔴" },
];

export default function SearchBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  loading,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filter: SourceFilter;
  onFilterChange: (f: SourceFilter) => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search Input Box */}
      <div className="relative flex items-center w-full max-w-md">
        <span className="absolute left-3.5 text-neutral-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M10.5 2a8.5 8.5 0 1 0 5.262 15.176l4.531 4.532a1 1 0 0 0 1.414-1.414l-4.532-4.531A8.5 8.5 0 0 0 10.5 2zm-6.5 8.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="What do you want to play?"
          className="h-10 w-full rounded-full bg-[#242424] pl-10 pr-10 text-sm text-white placeholder-neutral-400 outline-none transition focus:bg-[#2a2a2a] focus:ring-2 focus:ring-white/20"
        />
        {query && !loading && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        )}
        {loading && (
          <span className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-[#1ed760]" />
        )}
      </div>

      {/* Source Filter Badges */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === f.id
                ? "bg-white text-black"
                : "bg-[#2a2a2a] text-white hover:bg-[#333333]"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
