import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { spotifyTokenExchange } from "@/lib/spotify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cs = await cookies();
  const expectedState = cs.get("sp_oauth_state")?.value;
  cs.delete("sp_oauth_state");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=spotify_denied`);
  }
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=spotify_state`);
  }

  const data = await spotifyTokenExchange(code);
  if (!data) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=spotify_token`);
  }

  const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?spotify=connected`);
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
