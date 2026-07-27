import { NextRequest, NextResponse } from "next/server";

// Lyrics proxy. Two keyless sources, in order:
//   1. LRCLIB  — synced (timestamped) + plain lyrics
//   2. lyrics.ovh — plain lyrics fallback (no key)
// Cached for a day since lyrics don't change.

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");
  const album = searchParams.get("album") ?? "";
  const duration = searchParams.get("duration"); // seconds

  if (!artist || !title) {
    return NextResponse.json({ error: "artist and title required" }, { status: 400 });
  }

  // 1) Try LRCLIB (synced)
  const lrc = await tryLrclib(artist, title, album, duration);
  if (lrc) return NextResponse.json(lrc);

  // 2) Fallback to lyrics.ovh (plain only)
  const ovh = await tryLyricsOvh(artist, title);
  if (ovh) return NextResponse.json({ synced: false, plain: ovh, lines: null, source: "lyrics.ovh" });

  return NextResponse.json({ synced: false, plain: null, error: "no_lyrics_found" });
}

async function tryLrclib(
  artist: string,
  title: string,
  album: string,
  duration?: string | null,
): Promise<null | object> {
  const q = new URLSearchParams({ artist, track: title });
  if (album) q.set("album", album);
  if (duration) q.set("duration", duration);
  const url = `https://lrclib.net/api/get?${q.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Harmonix/1.0 (music player)" },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const data = await res.json();
      const lines = data.syncedLyrics ? parseSynced(data.syncedLyrics) : null;
      if (data.plainLyrics || lines) {
        return { synced: Boolean(lines?.length), plain: data.plainLyrics ?? null, lines, source: "lrclib" };
      }
    }
    if (res.status === 404) {
      const sres = await fetch(
        `https://lrclib.net/api/search?${new URLSearchParams({ artist, track: title }).toString()}`,
        { headers: { "User-Agent": "Harmonix/1.0 (music player)" }, next: { revalidate: 86400 } },
      );
      if (sres.ok) {
        const arr = (await sres.json()) as any[];
        const best = arr[0];
        if (best) {
          const lines = best.syncedLyrics ? parseSynced(best.syncedLyrics) : null;
          if (best.plainLyrics || lines)
            return { synced: Boolean(lines?.length), plain: best.plainLyrics ?? null, lines, source: "lrclib" };
        }
      }
    }
  } catch {
    /* upstream unreachable */
  }
  return null;
}

async function tryLyricsOvh(artist: string, title: string): Promise<string | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = (await res.json()) as { lyrics?: string };
      if (data.lyrics && data.lyrics.trim()) return data.lyrics;
    }
  } catch {
    /* upstream unreachable */
  }
  return null;
}

function parseSynced(text: string): { time: number; text: string }[] {
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const out: { time: number; text: string }[] = [];
  for (const raw of text.split("\n")) {
    re.lastIndex = 0;
    const m = re.exec(raw);
    if (!m) continue;
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    const frac = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) / 1000 : 0;
    const time = min * 60 + sec + frac;
    const txt = raw.replace(re, "").trim();
    if (txt) out.push({ time, text: txt });
  }
  return out;
}

