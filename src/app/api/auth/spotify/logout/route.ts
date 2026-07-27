import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cs = await cookies();
  cs.delete("sp_access_token");
  cs.delete("sp_refresh_token");
  cs.delete("sp_expires_at");
  return NextResponse.json({ ok: true });
}
