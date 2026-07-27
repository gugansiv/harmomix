import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotify";

// Transfer Spotify playback to a chosen device (cross-device "Connect").
export async function PUT(req: NextRequest) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const deviceId = body?.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  const res = await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [deviceId], play: true }),
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "transfer_failed", detail: text, status: res.status },
      { status: res.status },
    );
  }
  return NextResponse.json({ ok: true });
}
