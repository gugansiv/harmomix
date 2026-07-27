"use client";

import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TrackRow from "@/components/TrackRow";
import { usePlayer } from "@/lib/player-context";
import { useLiked, useRecent } from "@/lib/playlists";

function Collection() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const player = usePlayer();
  const { liked, isLiked, toggleLike } = useLiked();
  const { recent } = useRecent();

  const isLikedCollection = id === "liked";
  const tracks = isLikedCollection ? liked : recent;
  const title = isLikedCollection ? "Liked Songs" : "Recently Played";

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-subtext hover:text-foreground">← Back</button>

      <div className="flex items-end gap-6">
        <div className="flex aspect-square w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/40 to-accent/10 text-5xl">
          {isLikedCollection ? "❤" : "🕑"}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-subtext">Collection</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-subtext">{tracks.length} track{tracks.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => tracks.length && player.playMany(tracks, 0)}
            className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black hover:bg-accent-hover"
          >
            ▶ Play
          </button>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="text-subtext">Nothing here yet.</p>
      ) : (
        <div className="space-y-0.5">
          {tracks.map((track, index) => (
            <TrackRow
              key={`${track.id}-${index}`}
              track={track}
              index={index}
              onPlay={player.playTrack}
              onAdd={player.addToQueue}
              onLike={toggleLike}
              isLiked={isLikedCollection ? true : isLiked(track.id)}
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
      <Collection />
    </AppShell>
  );
}
