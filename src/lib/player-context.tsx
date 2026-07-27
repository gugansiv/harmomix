"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { UnifiedTrack } from "./types";

// ---- Minimal typings for the third-party SDKs (no official TS types ship) ----
interface SpotifyPlayerState {
  position?: number;
  duration?: number;
  paused?: boolean;
  track_window?: { current_track?: { uri?: string } };
}
interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  play: (opts: { uris: string[]; position?: number }) => Promise<void>;
  seek: (ms: number) => Promise<void>;
  on: (event: string, cb: (state?: SpotifyPlayerState) => void) => void;
}
interface SpotifyPlayerConstructor {
  new (opts: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }): SpotifyPlayerInstance;
}
interface YTPlayerInstance {
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
}
interface YTPlayerEvent {
  data?: number;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      height: string;
      width: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    Spotify?: { Player: SpotifyPlayerConstructor };
    onSpotifyWebPlaybackSDKReady?: () => void;
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Status = "idle" | "loading" | "playing" | "paused";

interface PlayerState {
  queue: UnifiedTrack[];
  currentIndex: number;
  currentTrack: UnifiedTrack | null;
  status: Status;
  positionMs: number;
  durationMs: number;
  spotifyReady: boolean;
  error: string | null;
  playTrack: (track: UnifiedTrack) => void;
  playMany: (tracks: UnifiedTrack[], startIndex?: number) => void;
  addToQueue: (track: UnifiedTrack) => void;
  addManyToQueue: (tracks: UnifiedTrack[]) => void;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  seek: (ms: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const Ctx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<UnifiedTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<UnifiedTrack | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [spotifyReady, setSpotifyReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spotifyRef = useRef<SpotifyPlayerInstance | null>(null);
  const ytRef = useRef<YTPlayerInstance | null>(null);
  const ytDivRef = useRef<HTMLDivElement | null>(null);
  const queueRef = useRef<UnifiedTrack[]>([]);
  const indexRef = useRef(-1);
  const trackRef = useRef<UnifiedTrack | null>(null);

  // keep refs in sync for use inside async SDK callbacks / intervals
  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
    trackRef.current = currentTrack;
  }, [queue, currentIndex, currentTrack]);

  const pauseSpotify = useCallback(() => {
    spotifyRef.current?.pause().catch(() => {});
  }, []);

  const pauseYouTube = useCallback(() => {
    try {
      ytRef.current?.pauseVideo();
    } catch {}
  }, []);

  const pauseOther = useCallback(
    (source: "spotify" | "youtube") => {
      if (source !== "spotify") pauseSpotify();
      if (source !== "youtube") pauseYouTube();
    },
    [pauseSpotify, pauseYouTube],
  );

  const startTrack = useCallback(
    async (track: UnifiedTrack) => {
      setCurrentTrack(track);
      setStatus("loading");
      setPositionMs(0);
      setDurationMs(track.durationMs ?? 0);
      setError(null);

      if (track.source === "spotify") {
        pauseOther("spotify");
        if (!spotifyRef.current) {
          setError("Spotify player not ready.");
          setStatus("idle");
          return;
        }
        try {
          await spotifyRef.current.play({ uris: [track.spotifyUri ?? ""] });
          setStatus("playing");
        } catch {
          setError("Failed to play on Spotify (Premium required).");
          setStatus("idle");
        }
      } else if (track.source === "youtube") {
        pauseOther("youtube");
        const waitYT = () => {
          if (ytRef.current && ytRef.current.loadVideoById) {
            ytRef.current.loadVideoById(track.youtubeVideoId ?? "", 0);
            setStatus("playing");
          } else {
            setTimeout(waitYT, 100);
          }
        };
        waitYT();
      }
    },
    [pauseOther],
  );

  const playTrack = useCallback(
    (track: UnifiedTrack) => {
      setQueue([track]);
      setCurrentIndex(0);
      startTrack(track);
    },
    [startTrack],
  );

  const playMany = useCallback(
    (tracks: UnifiedTrack[], startIndex = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks);
      setCurrentIndex(startIndex);
      startTrack(tracks[startIndex]);
    },
    [startTrack],
  );

  const addToQueue = useCallback((track: UnifiedTrack) => {
    setQueue((q) => [...q, track]);
  }, []);

  const addManyToQueue = useCallback((tracks: UnifiedTrack[]) => {
    setQueue((q) => [...q, ...tracks]);
  }, []);

  const nextInternal = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (i < q.length - 1) {
      const ni = i + 1;
      setCurrentIndex(ni);
      startTrack(q[ni]);
    } else {
      setStatus("paused");
    }
  }, [startTrack]);

  const next = useCallback(() => nextInternal(), [nextInternal]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (positionMs > 3000) {
      if (trackRef.current?.source === "youtube" && ytRef.current?.seekTo)
        ytRef.current.seekTo(0, true);
      else if (trackRef.current?.source === "spotify" && spotifyRef.current)
        spotifyRef.current.seek(0).catch(() => {});
      setPositionMs(0);
      return;
    }
    if (i > 0) {
      const pi = i - 1;
      setCurrentIndex(pi);
      startTrack(q[pi]);
    }
  }, [startTrack, positionMs]);

  const togglePlay = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    if (t.source === "spotify") {
      if (!spotifyRef.current) return;
      if (status === "playing") spotifyRef.current.pause().catch(() => {});
      else spotifyRef.current.resume().catch(() => {});
    } else {
      if (!ytRef.current) return;
      if (status === "playing") ytRef.current.pauseVideo();
      else ytRef.current.playVideo();
    }
  }, [status]);

  const seek = useCallback((ms: number) => {
    const t = trackRef.current;
    if (!t) return;
    if (t.source === "spotify" && spotifyRef.current) {
      spotifyRef.current.seek(ms).catch(() => {});
      setPositionMs(ms);
    } else if (t.source === "youtube" && ytRef.current?.seekTo) {
      ytRef.current.seekTo(ms / 1000, true);
      setPositionMs(ms);
    }
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((q) => {
        const copy = [...q];
        const removed = copy[index];
        copy.splice(index, 1);
        const cur = indexRef.current;
        if (index === cur) {
          if (copy.length > 0) {
            const ni = Math.min(cur, copy.length - 1);
            setCurrentIndex(ni);
            if (removed) startTrack(copy[ni]);
          } else {
            setCurrentIndex(-1);
            setCurrentTrack(null);
            setStatus("idle");
          }
        } else if (index < cur) {
          setCurrentIndex(cur - 1);
        }
        return copy;
      });
    },
    [startTrack],
  );

  const clearQueue = useCallback(() => {
    pauseSpotify();
    pauseYouTube();
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setStatus("idle");
    setPositionMs(0);
    setDurationMs(0);
  }, [pauseSpotify, pauseYouTube]);

  // ---- initialise the two SDK players ----
  const initSpotify = useCallback(() => {
    if (!window.Spotify) return;
    try {
      const player = new window.Spotify.Player({
        name: "Harmonix",
        getOAuthToken: (cb: (token: string) => void) => {
          fetch("/api/auth/spotify/token")
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d: { access_token: string }) => cb(d.access_token))
            .catch(() => setError("Spotify token unavailable — reconnect."));
        },
        volume: 0.8,
      });
      player.on("ready", () => setSpotifyReady(true));
      player.on("not_ready", () => setSpotifyReady(false));
      player.on("initialization_error", () => setError("Spotify init error"));
      player.on("authentication_error", () =>
        setError("Spotify auth error — please reconnect."),
      );
      player.on("account_error", () =>
        setError("Spotify Premium required for Web Playback."),
      );
      player.on("player_state_changed", (st?: SpotifyPlayerState) => {
        if (!st) return;
        setPositionMs(st.position ?? 0);
        setDurationMs(st.duration ?? 0);
        setStatus(st.paused ? "paused" : "playing");
      });
      player.connect();
      spotifyRef.current = player;
    } catch {
      setError("Could not initialise Spotify player.");
    }
  }, []);

  const initYouTube = useCallback(() => {
    if (!window.YT || !window.YT.Player || !ytDivRef.current) return;
    const YT = window.YT;
    ytRef.current = new YT.Player(ytDivRef.current, {
      height: "0",
      width: "0",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        origin: window.location.origin,
        host: "https://www.youtube.com",
      },
      events: {
        onReady: () => {},
        onStateChange: (e: YTPlayerEvent) => {
          if (e.data === YT.PlayerState.PLAYING) setStatus("playing");
          else if (
            e.data === YT.PlayerState.PAUSED ||
            e.data === YT.PlayerState.BUFFERING
          )
            setStatus("paused");
          else if (e.data === YT.PlayerState.ENDED) nextInternal();
        },
      },
    });
  }, [nextInternal]);

  // ---- progress polling (YouTube exposes no events for position) ----
  useEffect(() => {
    const id = setInterval(() => {
      const t = trackRef.current;
      if (!t || t.source !== "youtube" || !ytRef.current || !window.YT) return;
      if (ytRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) return;
      const pos = ytRef.current.getCurrentTime() * 1000;
      const dur = ytRef.current.getDuration() * 1000;
      setPositionMs(pos);
      setDurationMs(dur);
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ---- load both SDK scripts on mount ----
  useEffect(() => {
    let cancelled = false;

    const loadSpotify = () =>
      new Promise<void>((resolve) => {
        if (window.Spotify) return resolve();
        window.onSpotifyWebPlaybackSDKReady = () => resolve();
        const s = document.createElement("script");
        s.src = "https://sdk.scdn.co/spotify-player.js";
        s.async = true;
        s.onerror = () => resolve();
        document.body.appendChild(s);
      });

    const loadYouTube = () =>
      new Promise<void>((resolve) => {
        if (window.YT?.Player) return resolve();
        window.onYouTubeIframeAPIReady = () => resolve();
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.async = true;
        s.onerror = () => resolve();
        document.body.appendChild(s);
      });

    Promise.all([loadSpotify(), loadYouTube()]).then(() => {
      if (cancelled) return;
      initSpotify();
      initYouTube();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: PlayerState = {
    queue,
    currentIndex,
    currentTrack,
    status,
    positionMs,
    durationMs,
    spotifyReady,
    error,
    playTrack,
    playMany,
    addToQueue,
    addManyToQueue,
    next,
    prev,
    togglePlay,
    seek,
    removeFromQueue,
    clearQueue,
  };

  return (
    <Ctx.Provider value={value}>
      <div
        ref={ytDivRef}
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      />
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer(): PlayerState {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
}
