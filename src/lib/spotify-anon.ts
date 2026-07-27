/**
 * Keyless Spotify search support.
 *
 * The public open.spotify.com embed pages ship an anonymous web-player
 * `accessToken` in their HTML that is valid against api.spotify.com/v1/search.
 * No client ID, no client secret, no OAuth — same token every browser gets.
 *
 * We fetch it server-side, cache it in module scope, and refresh ~1 min before
 * its expiry timestamp. This runs only on the server (route handlers).
 */

interface AnonToken {
  token: string;
  expiresAt: number; // epoch ms
}

let cached: AnonToken | null = null;
let inflight: Promise<AnonToken | null> | null = null;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Any public embed page works as a token source.
const EMBED_URLS = [
  "https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp",
  "https://open.spotify.com/embed/track/0VjIjW4GlUZAMYd2vXMi3b",
  "https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF",
];

async function fetchAnonToken(): Promise<AnonToken | null> {
  for (const url of EMBED_URLS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const tokenMatch = /"accessToken":"([^"]+)"/.exec(html);
      if (!tokenMatch) continue;
      const expMatch = /"accessTokenExpirationTimestampMs":\s*(\d+)/.exec(html);
      const expiresAt = expMatch
        ? Number(expMatch[1])
        : Date.now() + 30 * 60 * 1000; // fallback: 30 min
      return { token: tokenMatch[1], expiresAt };
    } catch {
      // try next source
    }
  }
  return null;
}

export async function getAnonSpotifyToken(): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  if (!inflight) {
    inflight = fetchAnonToken().finally(() => {
      inflight = null;
    });
  }
  const t = await inflight;
  if (t) cached = t;
  return t?.token ?? null;
}

/** Drop the cached token (e.g. after a 401) so the next call refetches. */
export function invalidateAnonSpotifyToken() {
  cached = null;
}

export interface SpotifyTrackItem {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album?: { name?: string; images?: { url?: string }[] };
  external_urls?: { spotify?: string };
}

export async function scrapeSpotifySearch(
  q: string,
  limit = 20
): Promise<import("./types").UnifiedTrack[]> {
  const token = await getAnonSpotifyToken();
  if (!token) {
    console.warn("[spotify-anon] no anon token available");
    return [];
  }

  const searchUrl = new URL("https://api.spotify.com/v1/search");
  searchUrl.searchParams.set("q", q);
  searchUrl.searchParams.set("type", "track");
  searchUrl.searchParams.set("limit", String(Math.min(limit, 50)));

  let res = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // Token may have been invalidated by expiry/401 — try one refresh
  if (res.status === 401) {
    invalidateAnonSpotifyToken();
    const newToken = await getAnonSpotifyToken();
    if (newToken) {
      res = await fetch(searchUrl.toString(), {
        headers: { Authorization: `Bearer ${newToken}` },
        cache: "no-store",
      });
    }
  }

  if (!res.ok) {
    console.warn("[spotify-anon] search failed:", res.status, await res.text().catch(() => ""));
    return [];
  }

  const data = await res.json();
  const items: SpotifyTrackItem[] = data.tracks?.items ?? [];

  return items.map((t) => ({
    id: `spotify:${t.id}`,
    source: "spotify" as const,
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(", ") ?? "Unknown Artist",
    album: t.album?.name,
    durationMs: t.duration_ms,
    artworkUrl: t.album?.images?.[0]?.url,
    spotifyUri: t.uri,
    externalUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  }));
}
