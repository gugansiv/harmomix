"use client";

import { useEffect, useState } from "react";

interface Device {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent?: number;
}

export default function DeviceMenu({ onClose }: { onClose: () => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/spotify/devices")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status === 401 ? "Connect Spotify first" : "Failed")))
      .then((d) => {
        setDevices(d.devices ?? []);
        setError(d.devices?.length ? null : "No devices online. Open Spotify on a phone or desktop.");
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const transfer = (id: string) => {
    setBusy(id);
    fetch("/api/spotify/transfer", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: id }),
    })
      .then((r) => (r.ok ? (load(), onClose()) : Promise.reject("transfer failed")))
      .catch((e) => setError(String(e)))
      .finally(() => setBusy(null));
  };

  return (
    <div className="fixed right-4 bottom-[100px] z-50 w-72 rounded-2xl border border-border bg-sidebar shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Connect to a device</h3>
        <button onClick={onClose} className="text-subtext hover:text-foreground" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {loading && (
          <p className="px-3 py-4 text-sm text-subtext">Looking for devices…</p>
        )}
        {error && <p className="px-3 py-4 text-sm text-amber-300">{error}</p>}
        {!loading &&
          devices.map((d) => (
            <button
              key={d.id}
              disabled={busy === d.id}
              onClick={() => transfer(d.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                d.is_active ? "bg-hover text-accent" : "hover:bg-hover"
              }`}
            >
              <span className="text-lg">{iconFor(d.type)}</span>
              <span className="flex-1 truncate text-sm font-medium">{d.name}</span>
              {d.is_active && <span className="text-xs">Active</span>}
            </button>
          ))}
      </div>
    </div>
  );
}

function iconFor(type: string) {
  switch (type) {
    case "Smartphone":
      return "📱";
    case "Computer":
      return "💻";
    case "Speaker":
      return "🔊";
    case "TV":
      return "📺";
    default:
      return "🎵";
  }
}
