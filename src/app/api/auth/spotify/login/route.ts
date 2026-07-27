import { NextResponse } from "next/server";
import { spotifyAuthUrl } from "@/lib/spotify";

export async function GET() {
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(spotifyAuthUrl(state));
  res.cookies.set("sp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
