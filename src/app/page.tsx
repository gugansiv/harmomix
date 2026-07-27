"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayerProvider, usePlayer } from "@/lib/player-context";
import type { UnifiedTrack, SourceFilter } from "@/lib/types";
import TrackRow from "@/components/TrackRow";
import QueuePanel from "@/components/QueuePanel";
import AppShell from "@/components/AppShell";
import { useLiked } from "@/lib/playlists";

function HomeContent() {
  const player = usePlayer();
  const { isLiked, toggleLike } = useLiked();
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
          "Spotify state mismatch. This usually means the host you're browsing (e.g. the 192.168.x.x network URL) differs from the Redirect URI registered in Spotify. Browse http://localhost:3000 and retry.",
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

  // clear the OAuth result from the URL so a refresh doesn't re-trigger the banner
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setCommitted(q);
    setLoading(true);
    setNote(null);
    setTracks([]);

    try {
      const res = await fetch(`/api/search/unified?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      const results: UnifiedTrack[] = data.tracks ?? [];

      setTracks(results);

      const s = results.filter((t) => t.source === "spotify");
      const y = results.filter((t) => t.source === "youtube");

      if (s.length === 0 && y.length === 0) {
        setNote("No results.");
      } else if (s.length === 0 && filter !== "youtube") {
        setNote("YouTube results only — connect Spotify to search there too.");
      } else if (y.length === 0 && filter !== "spotify") {
        setNote("Spotify results only — YouTube API key not configured.");
      }
    } catch (e) {
      console.error("[unified search]", e);
      setNote("Search failed. Please try again.");
    }

    setLoading(false);
  }, [filter]);

  const filteredTracks = useMemo(() => {
    if (filter === "all") return tracks;
    return tracks.filter((t) => t.source === filter);
  }, [tracks, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-2xl mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                runSearch(e.target.value);
              }}
              placeholder="Search songs, artists, videos…"
              className="w-full pl-12 pr-4 py-3 rounded-full bg-hover text-foreground text-sm placeholder:text-subtext outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            />
            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-[130px]">
        <div className="max-w-7xl mx-auto">
          {committed === "" ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-transparent flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-12 h-12 text-accent/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Harmonix</h2>
              <p className="text-subtext max-w-md mx-auto">
                Search for any song, artist, or album to mix Spotify and YouTube Music results in one unified player.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center text-sm text-subtext">
                <span className="px-3 py-1.5 rounded-full bg-hover">Try "The Weeknd"</span>
                <span className="px-3 py-1.5 rounded-full bg-hover">Try "Arijit Singh"</span>
                <span className="px-3 py-1.5 rounded-full bg-hover">Try "Lo-fi beats"</span>
              </div>
            </div>
          ) : (
            <>
              {note && (
                <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 animate-slide-up">
                  {note}
                </div>
              )}
              {filteredTracks.length === 0 ? (
                <div className="text-center text-subtext py-12">
                  <p>No results for “{committed}”.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      {filteredTracks.length} result{filteredTracks.length !== 1 ? "s" : ""} for “{committed}”
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === "all" ? "bg-accent text-black" : "bg-hover text-subtext hover:text-foreground hover:bg-hover/80"}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter("spotify")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === "spotify" ? "bg-[#1db954]/20 text-[#1db954]" : "bg-hover text-subtext hover:text-foreground hover:bg-hover/80"}`}
                      >
                        Spotify
                      </button>
                      <button
                        onClick={() => setFilter("youtube")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === "youtube" ? "bg-red-500/20 text-red-400" : "bg-hover text-subtext hover:text-foreground hover:bg-hover/80"}`}
                      >
                        YouTube
                      </button>
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

      <QueuePanel onClose={() => {}} />
    </div>
  );
}

export default function Page() {
  return (
    <PlayerProvider>
      <AppShell>
        <HomeContent />
      </AppShell>
    </PlayerProvider>
  );
}