import { NextResponse } from "next/server";
import { getValidAccessToken, getClientCredentialsToken, toUnifiedSpotify } from "@/lib/spotify";
import type { UnifiedTrack } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Number(url.searchParams.get("limit") ?? "20");

  if (!q) return NextResponse.json({ tracks: [] });

  let token = await getValidAccessToken();
  if (!token) {
    token = await getClientCredentialsToken();
  }

  if (!token) {
    return NextResponse.json({ tracks: [], error: "not_authenticated" }, { status: 401 });
  }

  const spotifyUrl = new URL("https://api.spotify.com/v1/search");
  spotifyUrl.searchParams.set("q", q);
  spotifyUrl.searchParams.set("type", "track");
  spotifyUrl.searchParams.set("limit", String(Math.min(limit, 50)));

  const res = await fetch(spotifyUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json(
      { tracks: [], error: `spotify_error_${res.status}` },
      { status: res.status },
    );
  }
  const data = await res.json();
  const tracks: UnifiedTrack[] = (data.tracks?.items ?? []).map(toUnifiedSpotify);
  return NextResponse.json({ tracks });
}
