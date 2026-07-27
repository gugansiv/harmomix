"use client";

import { useCallback, useEffect, useState } from "react";
import type { UnifiedTrack } from "./types";
import { pushSync, pullSync } from "./sync";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: UnifiedTrack[];
  createdAt: number;
  updatedAt: number;
  coverUrl?: string;
}

const PLAYLISTS_KEY = "harmonix.playlists";
const LIKED_KEY = "harmonix.liked";
const RECENT_KEY = "harmonix.recent";
const RECENT_MAX = 50;

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export interface SyncSnapshot {
  playlists: Playlist[];
  liked: UnifiedTrack[];
  recent: UnifiedTrack[];
  updatedAt: number;
}

const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if ([PLAYLISTS_KEY, LIKED_KEY, RECENT_KEY].includes(e.key ?? ""))
      listeners.forEach((l) => l());
  });
}

function uid() {
  return (
    crypto.randomUUID?.() ??
    `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  );
}

export function usePlaylists(): {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, track: UnifiedTrack) => void;
  removeFromPlaylist: (id: string, index: number) => void;
  getPlaylist: (id: string) => Playlist | undefined;
  exportAll: () => void;
  importAll: (json: string) => { ok: boolean; error?: string };
  syncNow: () => Promise<void>;
} {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const sync = () => setPlaylists(read<Playlist>(PLAYLISTS_KEY));
    sync();
    // pull from server on mount (cross-device)
    pullSync().then((r) => {
      if (r.ok && r.payload) {
        const snap = r.payload as SyncSnapshot;
        if (snap.playlists?.length) {
          const merged = mergeById(read<Playlist>(PLAYLISTS_KEY), snap.playlists);
          write(PLAYLISTS_KEY, merged);
          setPlaylists(merged);
        }
      }
    });
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const persist = useCallback((next: Playlist[]) => {
    setPlaylists(next);
    write(PLAYLISTS_KEY, next);
    // debounced push to server for cross-device sync
    window.clearTimeout((persist as any)._t);
    (persist as any)._t = window.setTimeout(() => {
      const snap: SyncSnapshot = {
        playlists: next,
        liked: read<UnifiedTrack>(LIKED_KEY),
        recent: read<UnifiedTrack>(RECENT_KEY),
        updatedAt: Date.now(),
      };
      pushSync(snap).catch(() => {});
    }, 800);
  }, []);

  const createPlaylist = useCallback(
    (name: string, description?: string) => {
      const now = Date.now();
      const pl: Playlist = {
        id: uid(),
        name: name.trim() || "My Playlist",
        description,
        tracks: [],
        createdAt: now,
        updatedAt: now,
      };
      persist([pl, ...read<Playlist>(PLAYLISTS_KEY)]);
      return pl;
    },
    [persist],
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) => {
      const next = read<Playlist>(PLAYLISTS_KEY).map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p,
      );
      persist(next);
    },
    [persist],
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      persist(read<Playlist>(PLAYLISTS_KEY).filter((p) => p.id !== id));
    },
    [persist],
  );

  const addToPlaylist = useCallback(
    (id: string, track: UnifiedTrack) => {
      const next = read<Playlist>(PLAYLISTS_KEY).map((p) => {
        if (p.id !== id) return p;
        if (p.tracks.some((t) => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track], updatedAt: Date.now() };
      });
      persist(next);
    },
    [persist],
  );

  const removeFromPlaylist = useCallback(
    (id: string, index: number) => {
      const next = read<Playlist>(PLAYLISTS_KEY).map((p) => {
        if (p.id !== id) return p;
        const tracks = [...p.tracks];
        tracks.splice(index, 1);
        return { ...p, tracks, updatedAt: Date.now() };
      });
      persist(next);
    },
    [persist],
  );

  const getPlaylist = useCallback(
    (id: string) => read<Playlist>(PLAYLISTS_KEY).find((p) => p.id === id),
    [],
  );

  const exportAll = useCallback(() => {
    const snap: SyncSnapshot = {
      playlists: read<Playlist>(PLAYLISTS_KEY),
      liked: read<UnifiedTrack>(LIKED_KEY),
      recent: read<UnifiedTrack>(RECENT_KEY),
      updatedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harmonix-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importAll = useCallback(
    (json: string): { ok: boolean; error?: string } => {
      try {
        const snap = JSON.parse(json) as SyncSnapshot;
        if (snap.playlists) write(PLAYLISTS_KEY, snap.playlists);
        if (snap.liked) write(LIKED_KEY, snap.liked);
        if (snap.recent) write(RECENT_KEY, snap.recent);
        persist(read<Playlist>(PLAYLISTS_KEY));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
    [persist],
  );

  const syncNow = useCallback(async () => {
    const snap: SyncSnapshot = {
      playlists: read<Playlist>(PLAYLISTS_KEY),
      liked: read<UnifiedTrack>(LIKED_KEY),
      recent: read<UnifiedTrack>(RECENT_KEY),
      updatedAt: Date.now(),
    };
    await pushSync(snap);
    const r = await pullSync();
    if (r.ok && r.payload) {
      const snap2 = r.payload as SyncSnapshot;
      if (snap2.playlists?.length) {
        const merged = mergeById(read<Playlist>(PLAYLISTS_KEY), snap2.playlists);
        write(PLAYLISTS_KEY, merged);
        setPlaylists(merged);
      }
    }
  }, []);

  return {
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylist,
    exportAll,
    importAll,
    syncNow,
  };
}

/** Merge server + local by id, keeping the most recently updated version. */
function mergeById(local: Playlist[], remote: Playlist[]): Playlist[] {
  const map = new Map<string, Playlist>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    const existing = map.get(p.id);
    if (!existing || p.updatedAt > existing.updatedAt) map.set(p.id, p);
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---- Liked + Recent (single-device, included in sync snapshot) ----

export function useLiked(): {
  liked: UnifiedTrack[];
  isLiked: (id: string) => boolean;
  toggleLike: (track: UnifiedTrack) => void;
} {
  const [liked, setLiked] = useState<UnifiedTrack[]>([]);
  useEffect(() => {
    const sync = () => setLiked(read<UnifiedTrack>(LIKED_KEY));
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  const isLiked = useCallback((id: string) => liked.some((t) => t.id === id), [liked]);
  const toggleLike = useCallback((track: UnifiedTrack) => {
    setLiked((prev) => {
      const next = prev.some((t) => t.id === track.id)
        ? prev.filter((t) => t.id !== track.id)
        : [track, ...prev];
      write(LIKED_KEY, next);
      return next;
    });
  }, []);
  return { liked, isLiked, toggleLike };
}

export function useRecent(): { recent: UnifiedTrack[] } {
  const [recent, setRecent] = useState<UnifiedTrack[]>([]);
  useEffect(() => {
    const sync = () => setRecent(read<UnifiedTrack>(RECENT_KEY));
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return { recent };
}

export function pushRecent(track: UnifiedTrack) {
  const prev = read<UnifiedTrack>(RECENT_KEY).filter((t) => t.id !== track.id);
  const next = [track, ...prev].slice(0, RECENT_MAX);
  write(RECENT_KEY, next);
  listeners.forEach((l) => l());
}
