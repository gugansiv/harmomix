import { NextResponse } from "next/server";
import { scrapeSpotifySearch } from "@/lib/spotify-anon";
import { scrapeYouTubeSearch } from "@/lib/youtube-scrape";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

  if (!q) return NextResponse.json({ tracks: [] });

  const [spotifyRes, youtubeRes] = await Promise.allSettled([
    scrapeSpotifySearch(q, limit).catch((e: Error) => {
      console.error("[unified search] spotify:", e);
      return [] as import("@/lib/types").UnifiedTrack[];
    }),
    scrapeYouTubeSearch(q, limit).catch((e: Error) => {
      console.error("[unified search] youtube:", e);
      return [] as import("@/lib/types").UnifiedTrack[];
    }),
  ]);

  const spotify = spotifyRes.status === "fulfilled" ? spotifyRes.value : [];
  const youtube = youtubeRes.status === "fulfilled" ? youtubeRes.value : [];

  return NextResponse.json({ tracks: [...spotify, ...youtube] });
}