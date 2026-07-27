import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotify";

// Lists the user's available Spotify Connect devices (cross-device playback).
export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "spotify_error", status: res.status },
      { status: res.status },
    );
  }
  const data = await res.json();
  return NextResponse.json({ devices: data.devices ?? [] });
}
