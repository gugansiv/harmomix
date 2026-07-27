"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayerProvider, usePlayer } from "@/lib/player-context";
import type { UnifiedTrack, SourceFilter } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TrackList from "@/components/TrackList";
import PlayerBar from "@/components/PlayerBar";
import QueuePanel from "@/components/QueuePanel";

function AppContent() {
  const player = usePlayer();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [spotifyTracks, setSpotifyTracks] = useState<UnifiedTrack[]>([]);
  const [youtubeTracks, setYoutubeTracks] = useState<UnifiedTrack[]>([]);

  const [note, setNote] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const map: Record<string, string> = {
        spotify_missing_client_id:
          "Spotify Client ID is not configured. Please set SPOTIFY_CLIENT_ID in your Vercel Environment Variables.",
        spotify_state:
          "Spotify state mismatch. Browse via your main app domain (https://harmonix.vercel.app) and retry.",
        spotify_token:
          "Spotify token exchange failed — check your SPOTIFY_CLIENT_SECRET in Vercel.",
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

  const connectSpotify = useCallback(() => {
    window.location.href = "/api/auth/spotify/login";
  }, []);

  // Clear OAuth URL query param on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setCommitted("");
        setSpotifyTracks([]);
        setYoutubeTracks([]);
        return;
      }
      setCommitted(q);
      setLoading(true);
      setNote(null);

      const doSpotify = filter === "all" || filter === "spotify";
      const doYouTube = filter === "all" || filter === "youtube";

      const out = await Promise.allSettled([
        doSpotify
          ? fetch(`/api/search/spotify?q=${encodeURIComponent(q)}&limit=20`).then((r) =>
              r.json(),
            )
          : Promise.resolve({ tracks: [] }),
        doYouTube
          ? fetch(`/api/search/youtube?q=${encodeURIComponent(q)}&limit=20`).then((r) =>
              r.json(),
            )
          : Promise.resolve({ tracks: [] }),
      ]);

      const s = out[0].status === "fulfilled" ? out[0].value : { tracks: [] };
      const y = out[1].status === "fulfilled" ? out[1].value : { tracks: [] };

      setSpotifyTracks(s.tracks ?? []);
      setYoutubeTracks(y.tracks ?? []);

      const messages: string[] = [];
      if (doSpotify && s.error === "not_authenticated")
        messages.push("Connect Spotify to search Spotify tracks.");
      if (doYouTube && y.error === "youtube_key_missing")
        messages.push("YouTube API key not configured.");
      setNote(messages.length ? messages.join(" ") : null);
      setLoading(false);
    },
    [filter],
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        runSearch(query);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const allTracks = useMemo(
    () => [...spotifyTracks, ...youtubeTracks],
    [spotifyTracks, youtubeTracks],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden select-none">
      {/* Spotify Signature Sidebar */}
      <Sidebar
        filter={filter}
        onFilterChange={setFilter}
        onConnectSpotify={connectSpotify}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col my-2 mr-2 overflow-hidden rounded-xl bg-[#121212] border border-white/5 relative">
        <Header
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          loading={loading}
          onConnectSpotify={connectSpotify}
        />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Scrollable Center Body */}
          <main className="flex-1 overflow-y-auto px-6 py-4 pb-32">
            {note && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#1ed760]/30 bg-[#1ed760]/10 px-4 py-2.5 text-xs font-semibold text-[#1ed760]">
                <span>{note}</span>
                <button
                  onClick={() => setNote(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {committed === "" ? (
              <div className="flex flex-col gap-6">
                {/* Hero Greeting Section */}
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white mb-4">
                    {getGreeting()}
                  </h1>

                  {/* Quick Play Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { title: "Top Hits 2026", sub: "Spotify & YouTube", query: "top hits 2026" },
                      { title: "Trending India", sub: "YouTube Music", query: "trending india" },
                      { title: "Chill Lofi Beats", sub: "Atmospheric", query: "lofi beats" },
                      { title: "Global Pop", sub: "Spotify Chart", query: "pop hits" },
                      { title: "Anirudh Ravichander", sub: "Composer Focus", query: "anirudh" },
                      { title: "A.R. Rahman Hits", sub: "Legendary", query: "ar rahman" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(item.query);
                          runSearch(item.query);
                        }}
                        className="group flex items-center gap-4 rounded-md bg-[#181818] hover:bg-[#282828] cursor-pointer transition overflow-hidden shadow-sm border border-white/5"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gradient-to-tr from-[#1ed760] to-[#121212] text-xl font-bold text-black group-hover:scale-105 transition">
                          🎵
                        </div>
                        <div className="min-w-0 flex-1 py-2 pr-2">
                          <div className="truncate text-sm font-bold text-white">
                            {item.title}
                          </div>
                          <div className="truncate text-xs text-neutral-400">
                            {item.sub}
                          </div>
                        </div>
                        <button className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-lg group-hover:opacity-100 transition hover:scale-105">
                          ▶
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-neutral-500">
                  Search above to discover & stream tracks across Spotify & YouTube simultaneously.
                </div>
              </div>
            ) : (
              <>
                {filter !== "youtube" && (
                  <TrackList
                    title="Spotify Tracks"
                    tracks={spotifyTracks}
                    onPlay={(t, list) => player.playMany(list, list.indexOf(t))}
                    onAdd={(t) => player.addToQueue(t)}
                  />
                )}
                {filter !== "spotify" && (
                  <TrackList
                    title="YouTube Music"
                    tracks={youtubeTracks}
                    onPlay={(t, list) => player.playMany(list, list.indexOf(t))}
                    onAdd={(t) => player.addToQueue(t)}
                  />
                )}
                {!loading && allTracks.length === 0 && (
                  <div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-[#181818] p-8 text-center border border-white/5 max-w-md mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1ed760]/10 text-[#1ed760] text-xl mb-3">
                      🎵
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      No Spotify results for “{committed}”
                    </h3>
                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      Connect your Spotify account to search &amp; play Spotify tracks, or switch to All / YouTube Music for instant playback.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={connectSpotify}
                        className="rounded-full bg-[#1ed760] px-5 py-2 text-xs font-bold text-black hover:bg-[#1fdf64] transition"
                      >
                        Connect Spotify
                      </button>
                      <button
                        onClick={() => setFilter("all")}
                        className="rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                      >
                        Switch to All / YouTube Music
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Right Queue Drawer */}
          {showQueue && (
            <QueuePanel onClose={() => setShowQueue(false)} />
          )}
        </div>
      </div>

      {/* Spotify Signature Fixed Bottom Player */}
      <PlayerBar
        showQueue={showQueue}
        onToggleQueue={() => setShowQueue(!showQueue)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}
