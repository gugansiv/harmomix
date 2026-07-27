"use client";

import { useState } from "react";
import type { SourceFilter } from "@/lib/types";

const FILTERS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "spotify", label: "Spotify" },
  { id: "youtube", label: "YouTube" },
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
  const [local, setLocal] = useState(query);

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-white/5 bg-neutral-950/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 rounded-full bg-white/5 px-4">
        <span className="text-neutral-500">🔍</span>
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onQueryChange(local);
          }}
          placeholder="Search songs, artists, videos…"
          className="h-11 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-emerald-500" />
        )}
        <button
          onClick={() => onQueryChange(local)}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-black transition hover:bg-emerald-400"
        >
          Search
        </button>
      </div>
      <div className="mt-2 flex gap-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === f.id
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
