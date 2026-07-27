import { cookies } from "next/headers";
import type { UnifiedTrack } from "./types";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

export interface SpotifyTokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-currently-playing",
].join(" ");

export function spotifyCallbackPath(): string {
  return "/api/auth/spotify/callback";
}

/** Build the exact redirect URI.
 * Prefer an explicit SPOTIFY_REDIRECT_URI (authoritative — set it to exactly
 * what's registered in the Spotify dashboard). Fall back to the live request
 * host so localhost works with zero config. */
export function redirectUriFrom(req: Request): string {
  const configured = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (configured) return configured;
  try {
    const origin = new URL(req.url).origin;
    if (origin && origin !== "null") return origin + spotifyCallbackPath();
  } catch {}
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${spotifyCallbackPath()}`;
}

/** Where to send the user after OAuth completes (the app root). */
export function appBaseUrl(req: Request): string {
  try {
    const origin = new URL(req.url).origin;
    if (origin && origin !== "null") return origin;
  } catch {}
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function spotifyAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    show_dialog: "true",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function spotifyTokenExchange(
  code: string,
  redirectUri: string,
): Promise<SpotifyTokenData | null> {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as SpotifyTokenData;
}

export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenData | null> {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as SpotifyTokenData;
}

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
  expiresAt: number;
}

export async function readTokens(): Promise<StoredTokens> {
  const cs = await cookies();
  const expiresAt = cs.get("sp_expires_at")?.value;
  return {
    accessToken: cs.get("sp_access_token")?.value,
    refreshToken: cs.get("sp_refresh_token")?.value,
    expiresAt: expiresAt ? Number(expiresAt) : 0,
  };
}

/**
 * Returns a valid Spotify access token, refreshing it via the refresh token
 * if expired. Writes the new cookies. Must be called from a Route Handler.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const t = await readTokens();
  if (t.accessToken && t.expiresAt > Date.now() + 60_000) {
    return t.accessToken;
  }
  if (!t.refreshToken) return null;
  const data = await refreshAccessToken(t.refreshToken);
  if (!data) return null;
  await setTokens(data.access_token, data.refresh_token ?? t.refreshToken, data.expires_in);
  return data.access_token;
}

export async function setTokens(
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
) {
  const cs = await cookies();
  const expiresAt = Date.now() + expiresIn * 1000;
  cs.set("sp_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });
  if (refreshToken) {
    cs.set("sp_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  cs.set("sp_expires_at", String(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });
}

export interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}
export interface SpotifyArtist {
  name: string;
}
export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists?: SpotifyArtist[];
  album?: { name?: string; images?: SpotifyImage[] };
  external_urls?: { spotify?: string };
}

export function toUnifiedSpotify(t: SpotifyTrack): UnifiedTrack {
  const img = t.album?.images?.[0]?.url;
  return {
    id: `spotify:${t.id}`,
    source: "spotify",
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(", ") ?? "Unknown Artist",
    album: t.album?.name,
    durationMs: t.duration_ms,
    artworkUrl: img,
    spotifyUri: t.uri,
    externalUrl: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  };
}
