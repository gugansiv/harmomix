import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  spotifyTokenExchange,
  redirectUriFrom,
  appBaseUrl,
} from "@/lib/spotify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const spotifyError = url.searchParams.get("spotify_error");

  const cs = await cookies();
  const expectedState = cs.get("sp_oauth_state")?.value;
  cs.delete("sp_oauth_state");

  const base = appBaseUrl(req);

  // Spotify returns `spotify_error=state_mismatch` when the registered
  // redirect_uri doesn't match — surface it clearly.
  if (error || spotifyError) {
    const reason = spotifyError ?? error;
    return NextResponse.redirect(
      `${base}/?error=${encodeURIComponent("spotify_" + reason)}`,
    );
  }
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${base}/?error=spotify_state`);
  }

  const data = await spotifyTokenExchange(code, redirectUriFrom(req));
  if (!data) {
    return NextResponse.redirect(`${base}/?error=spotify_token`);
  }

  const res = NextResponse.redirect(`${base}/?spotify=connected`);
  cs.set("sp_access_token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });
  if (data.refresh_token) {
    cs.set("sp_refresh_token", data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  cs.set("sp_expires_at", String(Date.now() + data.expires_in * 1000), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });
  return res;
}
