"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  time: number;
  text: string;
}

export default function LyricsPanel({
  artist,
  title,
  positionMs,
}: {
  artist: string;
  title: string;
  positionMs: number;
}) {
  const [lines, setLines] = useState<Line[] | null>(null);
  const [plain, setPlain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLines(null);
    setPlain(null);
    setActive(-1);
    const q = `/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    fetch(q)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.lines?.length) setLines(d.lines);
        if (d.plain) setPlain(d.plain);
        if (!d.lines?.length && !d.plain) setError("No lyrics found");
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [artist, title]);

  // Sync active line to playback position
  useEffect(() => {
    if (!lines) return;
    const sec = positionMs / 1000;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= sec) idx = i;
      else break;
    }
    if (idx !== active) {
      setActive(idx);
      const el = scrollRef.current?.querySelector(`[data-i="${idx}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [positionMs, lines, active]);

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-sm text-subtext">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );

  if (error && !plain)
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-subtext">
        {error}
      </div>
    );

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-6 py-8">
      {lines ? (
        <div className="space-y-3">
          {lines.map((l, i) => (
            <p
              key={i}
              data-i={i}
              className={`text-lg leading-snug transition-all duration-300 ${
                i === active
                  ? "font-bold text-foreground scale-[1.02]"
                  : i < active
                    ? "text-subtext/50"
                    : "text-subtext"
              }`}
            >
              {l.text}
            </p>
          ))}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-subtext leading-relaxed">
          {plain}
        </pre>
      )}
    </div>
  );
}
