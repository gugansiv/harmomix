"use client";

// Browser-side sync helpers for cross-device playlist sync.
// Playlists are stored locally (per-device) AND mirrored to the server keyed by
// a stable device/user id, so the same browser profile on another device can pull them.
// No third-party auth required — the server just stores opaque blobs by deviceId.

const DEVICE_KEY = "harmonix.deviceId";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      (crypto.randomUUID?.() ??
        `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`);
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface SyncPushResult {
  ok: boolean;
  updatedAt: number;
  error?: string;
}

/** Push a collection (playlists) to the server for this device. */
export async function pushSync(
  payload: unknown,
): Promise<SyncPushResult> {
  const deviceId = getDeviceId();
  try {
    const res = await fetch("/api/sync", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId, payload, updatedAt: Date.now() }),
    });
    if (!res.ok) return { ok: false, updatedAt: 0, error: `HTTP ${res.status}` };
    const data = (await res.json()) as SyncPushResult;
    return data;
  } catch (e) {
    return { ok: false, updatedAt: 0, error: String(e) };
  }
}

export async function pullSync(): Promise<{
  ok: boolean;
  payload?: unknown;
  updatedAt?: number;
  error?: string;
}> {
  const deviceId = getDeviceId();
  try {
    const res = await fetch(`/api/sync?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, payload: data.payload, updatedAt: data.updatedAt };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
