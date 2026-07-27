import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotify";

// Used by the Spotify Web Playback SDK (client-side) to fetch a fresh token.
// The token lives in an httpOnly cookie the browser can't read directly, so the
// SDK calls this same-origin endpoint on demand.
export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  return NextResponse.json({ access_token: token });
}
