import { NextResponse } from "next/server";
import { redirectUriFrom } from "@/lib/spotify";

// Diagnostic helper (dev only). Reports config status WITHOUT exposing secret
// values, and the exact redirect_uri the app sends to Spotify.
export async function GET(req: Request) {
  const redirectUri = redirectUriFrom(req);
  return NextResponse.json({
    redirect_uri_sent_to_spotify: redirectUri,
    configured: {
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    },
    note: "All three `configured` flags must be true. If SPOTIFY_CLIENT_ID is false, the OAuth request is missing client_id and Spotify returns spotify_error=missing_params. Set real values in .env.local and restart the dev server.",
  });
}
