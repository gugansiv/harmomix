"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/lib/player-context";
import type { UnifiedTrack, SourceFilter } from "@/lib/types";
import TrackRow from "@/components/TrackRow";
import AppShell from "@/components/AppShell";
import { useLiked, useRecent } from "@/lib/playlists";

const QUICK_PICKS = [
  { q: "The Weeknd", label: "The Weeknd", emoji: "🌃" },
  { q: "Arijit Singh", label: "Arijit Singh", emoji: "🎤" },
  { q: "Lo-fi beats", label: "Lo-Fi Beats", emoji: "🎧" },
  { q: "Taylor Swift", label: "Taylor Swift", emoji: "✨" },
  { q: "Carnatic instrumental", label: "Carnatic", emoji: "🪕" },
  { q: "Rock classics", label: "Rock Classics", emoji: "🎸" },
  { q: "Peaceful piano", label: "Peaceful Piano", emoji: "🎹" },
  { q: "Top hits 2024", label: "Top Hits", emoji: "🔥" },
];

const GENRES = ["Pop", "Hip-Hop", "Lo-Fi", "Classical", "Devotional", "EDM", "Jazz", "Bollywood"];

function HomeContent() {
  const player = usePlayer();
  const { isLiked, toggleLike } = useLiked();
  const { recent } = useRecent();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [note, setNote] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const map: Record<string, string> = {
        spotify_state:
          "Spotify state mismatch. Browse http://localhost:3000 and retry.",
        spotify_token: "Spotify token exchange failed — check your client secret.",
        spotify_denied: "Spotify authorization was denied.",
      };
      if (map[err]) return map[err];
      if (err.startsWith("spotify_"))
        return `Spotify error: ${err.replace("spotify_", "")}`;
      return "Spotify connection failed. Please try again.";
    }
    if (params.get("spotify") === "connected") return "Spotify connected ✔";
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setCommitted(q);
      setLoading(true);
      setNote(null);
      setTracks([]);
      try {
        const res = await fetch(
          `/api/search/unified?q=${encodeURIComponent(q)}&limit=30`,
        );
        const data = await res.json();
        const results: UnifiedTrack[] = data.tracks ?? [];
        setTracks(results);
        const s = results.filter((t) => t.source === "spotify");
        const y = results.filter((t) => t.source === "youtube");
        if (s.length === 0 && y.length === 0) setNote("No results.");
        else if (s.length === 0 && filter !== "youtube")
          setNote("YouTube results only — connect Spotify to search there too.");
        else if (y.length === 0 && filter !== "spotify")
          setNote("Spotify results only — YouTube API key not configured.");
      } catch (e) {
        console.error("[unified search]", e);
        setNote("Search failed. Please try again.");
      }
      setLoading(false);
    },
    [filter],
  );

  const filteredTracks = useMemo(() => {
    if (filter === "all") return tracks;
    return tracks.filter((t) => t.source === filter);
  }, [tracks, filter]);

  return (
    <div className="flex h-full flex-col">
      {/* Search header */}
      <header className="sticky top-0 z-20 border-b border-border bg-black/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <div className="relative mx-auto max-w-2xl">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-subtext"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                runSearch(e.target.value);
              }}
              placeholder="Search songs, artists, videos…"
              className="w-full rounded-full bg-hover py-3 pl-12 pr-4 text-sm text-foreground outline-none placeholder:text-subtext focus:ring-2 focus:ring-accent/30"
            />
            {loading && (
              <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-border border-t-accent" />
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6 pb-[120px]">
        <div className="mx-auto max-w-7xl">
          {committed === "" ? (
            <HomeView onPick={(q) => { setQuery(q); runSearch(q); }} recent={recent} />
          ) : (
            <>
              {note && (
                <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  {note}
                </div>
              )}
              {filteredTracks.length === 0 ? (
                <div className="py-12 text-center text-subtext">
                  <p>No results for &ldquo;{committed}&rdquo;.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {filteredTracks.length} result
                      {filteredTracks.length !== 1 ? "s" : ""} for &ldquo;{committed}&rdquo;
                    </h2>
                    <div className="flex gap-2">
                      {(["all", "spotify", "youtube"] as SourceFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                            filter === f
                              ? "bg-accent text-black"
                              : "bg-hover text-subtext hover:text-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {filteredTracks.map((track, index) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        onPlay={player.playTrack}
                        onAdd={player.addToQueue}
                        onLike={toggleLike}
                        isLiked={isLiked(track.id)}
                        isPlaying={player.status !== "idle"}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeView({
  onPick,
  recent,
}: {
  onPick: (q: string) => void;
  recent: UnifiedTrack[];
}) {
  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Good to see you</h1>
        <p className="mt-1 max-w-2xl text-subtext">
          Search any song, artist, or mood. Harmonix blends{" "}
          <span className="font-medium text-green-400">Spotify</span> and{" "}
          <span className="font-medium text-red-400">YouTube</span> results into one
          player — tap any result to play instantly (YouTube needs no Premium).
        </p>
      </div>

      {/* How it works */}
      <div className="flex flex-wrap gap-3 text-sm">
        {[
          { n: "1", t: "Search", d: "Type a song, artist, or mood above." },
          { n: "2", t: "Play", d: "Tap a result — it plays right away." },
          { n: "3", t: "Save", d: "Like tracks or build playlists to keep." },
        ].map((s) => (
          <div
            key={s.n}
            className="flex flex-1 min-w-[200px] items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {s.n}
            </span>
            <div>
              <p className="font-semibold">{s.t}</p>
              <p className="text-xs text-subtext">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick picks */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Quick picks</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {QUICK_PICKS.map((p) => (
            <button
              key={p.q}
              onClick={() => onPick(p.q)}
              className="group flex items-center gap-3 overflow-hidden rounded-xl bg-card p-3 text-left transition-colors hover:bg-hover"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 text-2xl">
                {p.emoji}
              </span>
              <span className="truncate font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recently played */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Recently played</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recent.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t.title)}
                className="group flex items-center gap-3 overflow-hidden rounded-xl bg-card p-3 text-left transition-colors hover:bg-hover"
              >
                <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-hover">
                  {t.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.artworkUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-subtext">♪</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{t.title}</span>
                  <span className="block truncate text-xs text-subtext">{t.artist}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Genre chips */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Browse by mood</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => onPick(g)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40 hover:bg-hover"
            >
              {g}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}
