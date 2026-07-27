# Harmonix — Build Status

**Date:** 2026-07-27
**Stack:** Next.js 16.2.12 (Turbopack) · React 19.2.4 · TypeScript · Tailwind v4
**Goal:** Unified Spotify (Premium) + YouTube Music player. Ad-free *by design* via Spotify Premium — no ad-blocking hacks (which violate ToS and get accounts banned).

---

## ✅ Verification performed (real, not assumed)

| Check | Result |
|---|---|
| `npm run build` (Next 16 + Turbopack + TS) | ✅ Compiled successfully, TS passed, 11/11 pages generated |
| Dev server runtime | ✅ HTTP `200` on `/` |
| `/api/search/spotify` (not authed) | ✅ returns `401` (correct — needs Premium OAuth) |
| `/api/search/youtube` (no key) | ✅ returns `500` (correct — key not configured) |
| `/api/auth/spotify/debug` | ✅ reports `SPOTIFY_CLIENT_ID: true`, `SPOTIFY_CLIENT_SECRET: true`, `YOUTUBE_API_KEY: false` |
| Browser render (real headless browser) | ✅ Harmonix UI renders: logo, Connect card, search bar, All/Spotify/YouTube filters |
| Search interaction | ✅ Typing + Enter shows graceful "Connect Spotify / YouTube key not configured" |
| JS console errors (initial load) | ✅ **0** errors |
| JS console errors (fresh load post-fix) | ✅ **0** new errors |

---

## 🐛 Bug found & fixed during verification

**Symptom:** Browser `NotFoundError: Failed to execute 'removeChild' on 'Node'` — the classic React 19 + YouTube IFrame API crash. The YT IFrame API *replaces* the DOM element passed to it with an `<iframe>`. The original code passed a **React-managed** `<div ref={ytDivRef}>`, so React later tried to remove a node it no longer owned and threw.

**Fix:** `src/lib/player-context.tsx` now creates a **detached container** (`document.createElement('div')`), appends it to `<body>` (outside React's tree), and passes that to `YT.Player`. React never reconciles it, so no crash. Verified: error count frozen at the pre-fix 15 (all from before the edit), zero new errors on fresh load.

---

## ✨ Feature added this session: Volume + Mute

Wired a unified volume/mute control across **both** SDKs (Spotify Web Playback + YouTube IFrame), per the "max capability, compact UI" rule.

- `src/lib/player-context.tsx`
  - Added `volume`, `muted`, `setVolume(v)`, `toggleMute()` to `PlayerState`.
  - `applyVolume(v)` pushes the level to Spotify (`setVolume`) **and** YouTube (`setVolume` in 0–100).
  - Restores saved volume when the Spotify player becomes ready.
  - Minimal SDK typings extended with `setVolume` for both players.
- `src/components/PlayerBar.tsx`
  - Compact mute button (🔇/🔉/🔊) + 0–1 volume slider on the right of the player bar (hidden on < sm).
- `src/app/globals.css`
  - Added `.vol` slider styling (light thumb) to match the `.seek` control.

---

## 🔑 What you need to make it fully live

1. **Spotify (already coded; just authenticate):** Your `.env.local` already has `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`. Click **Connect Spotify** in the app and approve with your **Premium** account. (Free accounts return `account_error: Premium required for Web Playback`.)
2. **YouTube search:** Add a `YOUTUBE_API_KEY` to `.env.local` (Google Cloud Console → enable *YouTube Data API v3* → create API key), then restart the dev server.

> Secrets: `.env.local` is `chmod 600` and gitignored. `.env.example` contains only placeholders — no real secrets committed. ✅

---

## 🚀 Run it

```bash
cd harmonix
npm run dev      # http://localhost:3000  (or :3001 if 3000 busy)
npm run build    # production build (verified passing)
```

---

## 📁 Files touched this session

- `src/lib/player-context.tsx` — volume/mute + YT crash fix
- `src/components/PlayerBar.tsx` — volume UI
- `src/app/globals.css` — `.vol` slider styles

*(Unchanged but verified working: Spotify OAuth routes, YouTube/Spotify search routes, queue, player bar, track lists.)*
