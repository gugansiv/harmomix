"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { usePlaylists } from "@/lib/playlists";

function LibraryPage() {
  const { playlists, createPlaylist, exportAll, importAll } = usePlaylists();
  const [name, setName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const pl = createPlaylist(name || "My Playlist");
    setName("");
    router.push(`/playlist/${pl.id}`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const res = importAll(text);
      setImportError(res.ok ? null : res.error ?? "Import failed");
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-hover"
          >
            Import
          </button>
          <button
            onClick={exportAll}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-hover"
          >
            Export
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {importError && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {importError}
        </p>
      )}

      <div className="flex gap-2 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New playlist name"
          className="flex-1 rounded-full bg-hover px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          onClick={handleCreate}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent-hover"
        >
          Create
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-subtext">No playlists yet. Create one above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => router.push(`/playlist/${pl.id}`)}
              className="group flex flex-col gap-2 rounded-xl bg-card p-4 text-left transition-colors hover:bg-hover"
            >
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-hover">
                {pl.tracks[0]?.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.tracks[0].artworkUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-subtext">♪</div>
                )}
              </div>
              <p className="truncate font-semibold">{pl.name}</p>
              <p className="truncate text-xs text-subtext">{pl.tracks.length} tracks</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <LibraryPage />
    </AppShell>
  );
}
