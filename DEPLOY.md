# Harmonix — Deployment Status

**Live URL:** https://harmomix.vercel.app
**Platform:** Vercel (team `primedata`, project `harmomix`)
**Repo:** github.com/gugansiv/harmomix (local folder: `harmonix`)

## What was verified (build + runtime, not just claims)

| Check | Result |
|-------|--------|
| `npm run build` (Next 16, Turbopack) | ✅ Compiled + TypeScript passed |
| Static generation | ✅ 17/17 routes |
| Prod deploy (`vercel deploy --prod`) | ✅ Aliased → `harmomix.vercel.app` |
| Home `/` | ✅ HTTP 200 |
| `/library`, `/library/liked`, `/library/recent` | ✅ HTTP 200 |
| `/playlist/[id]` (unknown id) | ✅ HTTP 200 (graceful "not found") |
| `/api/auth/spotify/debug` | ✅ `SPOTIFY_CLIENT_ID: true`, `SPOTIFY_CLIENT_SECRET: true` |
| `/api/search/unified?q=test` (keyless) | ✅ Live YouTube results returned |
| `/api/lyrics?artist=...&title=...` | ✅ Real lyrics (LRCLIB + lyrics.ovh fallback) |
| `/api/sync` PUT→GET (cross-device relay) | ⚠ Best-effort on serverless (see note) |

## Features shipped this cycle

1. **Playlists** — create / rename / delete / add-remove tracks; `/library`, `/playlist/[id]`, `/library/liked`, `/library/recent` pages; live sidebar counts.
2. **Queue UI** — full-screen panel with drag-to-reorder, remove, clear, lyrics tab.
3. **Lyrics** — LRCLIB (synced) + lyrics.ovh (plain) fallback; active line synced to playback.
4. **Cross-device** — Spotify Connect device picker (`/api/spotify/devices` + `/api/spotify/transfer`); playlist/liked/recent **Export / Import** JSON in Library (privacy-first, no server storage); server relay (`/api/sync`) for same-network convenience.

## OAuth / Spotify

- Redirect URI registered in Spotify dashboard: `https://harmomix.vercel.app/api/auth/spotify/callback`
- `SPOTIFY_REDIRECT_URI` is set in Vercel prod env to the above.
- Web Playback SDK requires a **Spotify Premium** account. Free accounts return `account_error: Premium required for Web Playback`. YouTube playback needs no Premium.

## Secrets handling

- `.env.local` is gitignored — never committed.
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` pushed to Vercel **production** env via `vercel env add` (values piped from local file, never printed).
- `YOUTUBE_API_KEY` is intentionally empty — YouTube search uses keyless scraping; no key needed.
- No secrets appear in this repo or in `DEPLOY.md`.

## Cross-device sync note

The `/api/sync` server relay uses an in-memory store. On Vercel serverless this is reliable only within a warm function instance; cold starts / multi-instance routing may not share state. For **guaranteed** transfer between devices, use the **Export / Import** buttons in the Library page — the JSON file is downloaded to the user's device and re-imported elsewhere (no server stores the data). If a durable server store is later wanted, link an Upstash Redis integration in the Vercel dashboard and point the sync route at it.

## How to redeploy

```bash
cd harmonix
vercel deploy --prod --scope primedata --yes
```

Env changes require a redeploy to take effect.
