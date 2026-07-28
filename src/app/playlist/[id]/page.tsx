"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TrackRow from "@/components/TrackRow";
import { usePlayer } from "@/lib/player-context";
import { usePlaylists, useLiked } from "@/lib/playlists";

function PlaylistDetail() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { playlists, renamePlaylist, deletePlaylist, removeFromPlaylist, addToPlaylist, syncNow } = usePlaylists();
  const { isLiked, toggleLike } = useLiked();
  const player = usePlayer();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground">← Back</button>
        <p className="text-subtext">Playlist not found. It may be on another device — try Sync.</p>
        <button onClick={() => syncNow()} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black">
          Sync from other devices
        </button>
      </div>
    );
  }

  const saveRename = () => {
    renamePlaylist(playlist.id, title);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-subtext hover:text-foreground">← Back</button>

      <div className="flex items-end gap-6">
        <div className="aspect-square w-40 shrink-0 overflow-hidden rounded-xl bg-hover">
          {playlist.tracks[0]?.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.tracks[0].artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-subtext">♪</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-subtext">Playlist</p>
          {editing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveRename()}
                className="mt-1 w-full max-w-md rounded-lg bg-hover px-3 py-2 text-2xl font-bold outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button onClick={saveRename} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black">Save</button>
            </div>
          ) : (
            <h1
              className="mt-1 cursor-pointer truncate text-4xl font-bold tracking-tight hover:underline"
              onClick={() => {
                setTitle(playlist.name);
                setEditing(true);
              }}
            >
              {playlist.name}
            </h1>
          )}
          <p className="mt-1 text-sm text-subtext">
            {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
            {playlist.description ? ` · ${playlist.description}` : ""}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => playlist.tracks.length && player.playMany(playlist.tracks, 0)}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black hover:bg-accent-hover"
            >
              ▶ Play
            </button>
            <button
              onClick={() => syncNow()}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-hover"
            >
              Sync
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${playlist.name}"?`)) {
                  deletePlaylist(playlist.id);
                  router.push("/library");
                }
              }}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-hover"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-base font-semibold">This playlist is empty</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-subtext">
            Search for a song above, then tap the <span className="font-medium text-foreground">＋</span>{" "}
            button on any track and choose <span className="font-medium text-foreground">{playlist.name}</span> — or use <span className="font-medium text-foreground">Save to Liked</span> ♥ to build your library.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {playlist.tracks.map((track, index) => (
            <TrackRow
              key={`${track.id}-${index}`}
              track={track}
              index={index}
              onPlay={(t) => player.playMany(playlist.tracks, playlist.tracks.findIndex((x) => x.id === t.id))}
              onAdd={(t) => addToPlaylist(playlist.id, t)}
              onLike={toggleLike}
              isLiked={isLiked(track.id)}
              isPlaying={player.status !== "idle"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <PlaylistDetail />
    </AppShell>
  );
}
