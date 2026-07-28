# Harmonix — STATUS

Updated: 2026-07-28

## Feature-complete milestone

All planned player features are now implemented and verified.

### Newly completed (this pass)

1. **Shuffle** (`src/lib/player-context.tsx`)
   - `toggleShuffle()` exposed on player context.
   - On enable: original queue order saved in `originalQueueRef`, queue randomized
     with Fisher-Yates while keeping the currently-playing track at index 0.
   - On disable: original order restored and `currentIndex` re-synced to the
     current track's position in the restored queue.
   - `playMany()` respects shuffle when starting a new queue; `addToQueue` /
     `addManyToQueue` also append to the saved original order so toggle-off
     never loses tracks.

2. **Repeat** (`src/lib/player-context.tsx`)
   - `repeatMode: "off" | "all" | "one"` + `cycleRepeat()` (off → all → one → off).
   - `nextInternal(auto)`: on natural track end (YouTube `ENDED` event),
     repeat-one replays the current track; repeat-all wraps from the last queue
     item back to index 0; manual Next always advances (repeat-one does not trap
     the skip button).

3. **PlayerBar wiring** (`src/components/PlayerBar.tsx`)
   - Shuffle/Repeat buttons now call `toggleShuffle` / `cycleRepeat` (were no-ops).
   - Active state: accent-green icon, dot indicator, `aria-pressed`, dynamic
     `title` ("Shuffle: on", "Repeat: all", "Repeat: one"), and a "1" badge for
     repeat-one.
   - Now-playing artwork button opens the expanded view (`aria-expanded` wired).

4. **Full Now-Playing view** (`src/components/NowPlayingView.tsx`, new)
   - Full-screen z-50 overlay (mini player bar stays mounted underneath).
   - Large artwork, title/artist, Spotify/YouTube source badge.
   - Tabs: Now Playing / Lyrics (live LyricsPanel) / Queue (click-to-play,
     remove, current-track highlight).
   - Full transport (shuffle / prev / play-pause / next / repeat with active
     states), seekable progress bar, volume slider + mute.
   - Collapse via chevron button or Escape key; `role="dialog"` + `aria-modal`.

### Previously working (unchanged, not broken)
- Keyless unified search (YouTube + Spotify-anon), TrackRow play/like/queue,
  PlayerBar transport + keyboard shortcuts, QueuePanel (drag reorder + lyrics),
  playlists CRUD, Library, Liked/Recent, export/import + Upstash-ready sync,
  Spotify OAuth (env-gated, secrets in .env.local only).

## Verification evidence

- `npm run build` — ✓ clean (Next.js 16.2.12/Turbopack): compiled, TypeScript
  passed, all 17 routes generated, exit 0.
- Dev server on :3000 — `curl` → HTTP 200 on `/`.
- Live browser test: played a YouTube track from search; Repeat button cycled
  off → all → one (aria-label/aria-pressed verified in DOM); Shuffle toggled on
  (aria-pressed=true, accent color rgb(29,185,84) confirmed via computed style).
- Expanded Now-Playing view opened from artwork click; screenshot verified:
  artwork, title/artist, YouTube badge, tabs, transport, progress, volume,
  collapse chevron all rendered; no horizontal overflow; zero JS console errors.
- ESLint: no new issues introduced (remaining 8 findings are pre-existing in
  PlayerBar.tsx and predate this change).

## Notes
- Accent green preserved (`--accent` ≈ rgb(29,185,84)).
- No secrets committed; Spotify credentials remain in gitignored `.env.local`.
- Known cosmetic quirk (pre-existing): infinite YouTube live streams report a
  huge duration, so the progress timestamp looks odd for 24/7 radio streams.
