import { NextResponse } from "next/server";
import { redirectUriFrom } from "@/lib/spotify";

// Diagnostic helper (dev only). Reports the exact redirect_uri this app sends
// to Spotify so you can register the matching value in the Spotify dashboard.
export async function GET(req: Request) {
  const redirectUri = redirectUriFrom(req);
  return NextResponse.json({
    redirect_uri_sent_to_spotify: redirectUri,
    note: "Register this EXACT value (scheme + host + path, no trailing slash) as a Redirect URI in the Spotify developer dashboard.",
    registered_must_match: true,
  });
}
