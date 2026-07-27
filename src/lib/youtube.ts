import type { UnifiedTrack } from "./types";

/** Parse an ISO-8601 duration (e.g. PT4M13S) into milliseconds. */
export function parseISO8601(duration: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!m) return 0;
  const [, d, h, mm, s] = m;
  return (
    ((Number(d) || 0) * 86400 +
      (Number(h) || 0) * 3600 +
      (Number(mm) || 0) * 60 +
      (Number(s) || 0)) *
    1000
  );
}

export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}
export interface YouTubeSnippet {
  title?: string;
  channelTitle?: string;
  thumbnails?: { default?: YouTubeThumbnail; high?: YouTubeThumbnail };
}
export interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: YouTubeSnippet;
}

export function toUnifiedYouTube(item: YouTubeSearchItem, durationMs = 0): UnifiedTrack {
  const sn = item.snippet ?? {};
  const vid = item.id?.videoId;
  return {
    id: `youtube:${vid}`,
    source: "youtube",
    title: sn.title ?? "Unknown Title",
    artist: sn.channelTitle ?? "Unknown Artist",
    album: undefined,
    durationMs,
    artworkUrl: sn.thumbnails?.high?.url ?? sn.thumbnails?.default?.url,
    youtubeVideoId: vid,
    externalUrl: `https://www.youtube.com/watch?v=${vid}`,
  };
}
