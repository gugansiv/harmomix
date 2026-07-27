import { NextResponse } from "next/server";
import { spotifyAuthUrl, redirectUriFrom, appBaseUrl } from "@/lib/spotify";

export async function GET(req: Request) {
  if (!process.env.SPOTIFY_CLIENT_ID) {
    const base = appBaseUrl(req);
    return NextResponse.redirect(
      `${base}/?error=spotify_missing_client_id`,
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = redirectUriFrom(req);
  const res = NextResponse.redirect(spotifyAuthUrl(state, redirectUri));
  res.cookies.set("sp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
