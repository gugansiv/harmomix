"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayerProvider, usePlayer } from "@/lib/player-context";
import type { UnifiedTrack, SourceFilter } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import TrackList from "@/components/TrackList";
import PlayerBar from "@/components/PlayerBar";
import QueuePanel from "@/components/QueuePanel";

function ConnectCard() {
  const { spotifyReady } = usePlayer();
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      // Fetch first so the browser reliably stores the sp_oauth_state cookie on
      // this host, THEN navigate. Relying on Set-Cookie surviving a top-level
      // 307 redirect is flaky in some browsers and causes state mismatch.
      const res = await fetch("/api/auth/spotify/login", { method: "GET" });
      const spotifyUrl = res.headers.get("location") ?? res.url;
      window.location.href = spotifyUrl;
    } catch {
      setConnecting(false);
      window.location.href = "/api/auth/spotify/login";
    }
  }, [connecting]);

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-neutral-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-100">
            Connect your services
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Spotify Web Playback needs a connected account (Premium). YouTube
            works out of the box once the API key is set.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {connecting ? "Connecting…" : "Connect Spotify"}
          </button>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              spotifyReady
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/5 text-neutral-500"
            }`}
          >
            {spotifyReady ? "Spotify ready" : "Spotify not connected"}
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const player = usePlayer();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [loading, setLoading] = useState(false);
  const [spotifyTracks, setSpotifyTracks] = useState<UnifiedTrack[]>([]);
  const [youtubeTracks, setYoutubeTracks] = useState<UnifiedTrack[]>([]);
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
    setSpotifyTracks([]);
    setYoutubeTracks([]);

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
      messages.push("Connect Spotify to search there.");
    if (doYouTube && y.error === "youtube_key_missing")
      messages.push("YouTube API key not configured.");
    setNote(messages.length ? messages.join(" ") : null);
    setLoading(false);
  }, [filter]);

  const allTracks = useMemo(
    () => [...spotifyTracks, ...youtubeTracks],
    [spotifyTracks, youtubeTracks],
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black font-black">
            H
          </div>
          <h1 className="text-lg font-bold tracking-tight text-neutral-100">
            Harmonix
          </h1>
        </div>
        <ConnectCard />
        {note && (
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {note}
          </div>
        )}
        <SearchBar
          query={query}
          onQueryChange={(q) => {
            setQuery(q);
            runSearch(q);
          }}
          filter={filter}
          onFilterChange={setFilter}
          loading={loading}
        />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 pb-28 pt-4">
        <main className="min-w-0 flex-1">
          {committed === "" ? (
            <div className="mt-16 text-center text-neutral-500">
              <p className="text-2xl">🎧</p>
              <p className="mt-2">Search to mix Spotify &amp; YouTube tracks.</p>
            </div>
          ) : (
            <>
              {filter !== "youtube" && (
                <TrackList
                  title="Spotify"
                  tracks={spotifyTracks}
                  onPlay={(t) => player.playTrack(t)}
                  onAdd={(t) => player.addToQueue(t)}
                />
              )}
              {filter !== "spotify" && (
                <TrackList
                  title="YouTube"
                  tracks={youtubeTracks}
                  onPlay={(t) => player.playTrack(t)}
                  onAdd={(t) => player.addToQueue(t)}
                />
              )}
              {!loading && allTracks.length === 0 && (
                <div className="mt-10 text-center text-sm text-neutral-500">
                  No results for “{committed}”.
                </div>
              )}
            </>
          )}
        </main>
        <QueuePanel />
      </div>

      <PlayerBar />
    </div>
  );
}

export default function Page() {
  return (
    <PlayerProvider>
      <App />
    </PlayerProvider>
  );
}
