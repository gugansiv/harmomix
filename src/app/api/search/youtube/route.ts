import { NextResponse } from "next/server";
import { toUnifiedYouTube, parseISO8601, type YouTubeSearchItem } from "@/lib/youtube";
import type { UnifiedTrack } from "@/lib/types";

export async function GET(req: Request) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json({ tracks: [], error: "youtube_key_missing" }, { status: 500 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

  if (!q) return NextResponse.json({ tracks: [] });

  // Step 1: search for videos
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", q);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("maxResults", String(limit));
  searchUrl.searchParams.set("key", key);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    return NextResponse.json(
      { tracks: [], error: `youtube_error_${searchRes.status}` },
      { status: searchRes.status },
    );
  }
  const searchData = await searchRes.json();
  const items = searchData.items ?? [];
  if (items.length === 0) return NextResponse.json({ tracks: [] });

  // Step 2: fetch contentDetails for durations
  const ids = items.map((i: YouTubeSearchItem) => i.id?.videoId).filter(Boolean);
  const durations: Record<string, number> = {};
  try {
    const detUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detUrl.searchParams.set("part", "contentDetails");
    detUrl.searchParams.set("id", ids.join(","));
    detUrl.searchParams.set("key", key);
    const detRes = await fetch(detUrl.toString());
    if (detRes.ok) {
      const detData = await detRes.json();
      for (const v of detData.items ?? []) {
        durations[v.id] = parseISO8601(v.contentDetails?.duration ?? "");
      }
    }
  } catch {
    // durations optional; ignore
  }

  const tracks: UnifiedTrack[] = items.map((i: YouTubeSearchItem) =>
    toUnifiedYouTube(i, durations[i.id?.videoId ?? ""] ?? 0),
  );
  return NextResponse.json({ tracks });
}
