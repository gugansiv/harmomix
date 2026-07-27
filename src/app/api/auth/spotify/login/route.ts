import { NextResponse } from "next/server";
import { spotifyAuthUrl, redirectUriFrom } from "@/lib/spotify";

export async function GET(req: Request) {
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
