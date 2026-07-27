/**
 * Keyless YouTube search: fetch https://www.youtube.com/results?search_query=q
 * with a desktop UA and parse the inline `ytInitialData` JSON.
 * No API key, no quota. Server-side only.
 */
import type { UnifiedTrack } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** Extract the balanced ytInitialData JSON object from the page HTML.
 * Do NOT terminate on </script> (YouTube appends JS after the object).
 * Balance braces with a proper in-string/escape state machine. */
export function extractYtInitialData(html: string): unknown | null {
  const anchor = html.search(/ytInitialData\s*=\s*/);
  if (anchor === -1) return null;
  const open = html.indexOf("{", anchor);
  if (open === -1) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = open; i < html.length; i++) {
    const c = html.charCodeAt(i);
    if (esc) {
      esc = false;
      continue;
    }
    if (c === 0x5c) {
      // backslash
      esc = true;
    } else if (c === 0x22) {
      // double quote
      inStr = !inStr;
    } else if (!inStr && c === 0x7b) {
      depth++;
    } else if (!inStr && c === 0x7d) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(open, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

interface VideoRenderer {
  videoId?: string;
  title?: { runs?: { text?: string }[] };
  ownerText?: { runs?: { text?: string }[] };
  longBylineText?: { runs?: { text?: string }[] };
  lengthText?: { simpleText?: string };
  thumbnail?: { thumbnails?: { url?: string }[] };
}

/** Recursively collect every videoRenderer in the parsed tree. */
export function collectVideoRenderers(node: unknown, out: VideoRenderer[] = []): VideoRenderer[] {
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, out);
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.videoRenderer && typeof obj.videoRenderer === "object") {
      out.push(obj.videoRenderer as VideoRenderer);
    }
    for (const key of Object.keys(obj)) collectVideoRenderers(obj[key], out);
  }
  return out;
}

/** "1:23:45" | "12:34" | "0:59" -> ms */
export function lengthTextToMs(text?: string): number {
  if (!text) return 0;
  const parts = text.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0) * 1000;
}

export function rendererToTrack(v: VideoRenderer): UnifiedTrack | null {
  const vid = v.videoId;
  if (!vid) return null;
  const thumbs = v.thumbnail?.thumbnails ?? [];
  return {
    id: `youtube:${vid}`,
    source: "youtube",
    title: v.title?.runs?.[0]?.text ?? "Unknown Title",
    artist:
      v.ownerText?.runs?.[0]?.text ??
      v.longBylineText?.runs?.[0]?.text ??
      "Unknown Artist",
    durationMs: lengthTextToMs(v.lengthText?.simpleText),
    artworkUrl: thumbs.length ? thumbs[thumbs.length - 1]?.url : undefined,
    youtubeVideoId: vid,
    externalUrl: `https://www.youtube.com/watch?v=${vid}`,
  };
}

export async function scrapeYouTubeSearch(q: string, limit = 20): Promise<UnifiedTrack[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`youtube_http_${res.status}`);
  const html = await res.text();
  const root = extractYtInitialData(html);
  if (!root) throw new Error("youtube_parse_failed");
  const renderers = collectVideoRenderers(root);
  const seen = new Set<string>();
  const tracks: UnifiedTrack[] = [];
  for (const r of renderers) {
    const t = rendererToTrack(r);
    if (!t || !t.youtubeVideoId || seen.has(t.youtubeVideoId)) continue;
    seen.add(t.youtubeVideoId);
    tracks.push(t);
    if (tracks.length >= limit) break;
  }
  return tracks;
}
