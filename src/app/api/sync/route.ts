import { NextRequest, NextResponse } from "next/server";

// Simple cross-device sync store. Keyed by deviceId (a stable per-browser id).
// Persisted to a JSON file so it survives restarts in dev. In production you'd
// swap this for a real DB — the client contract stays identical.

interface Stored {
  payload: unknown;
  updatedAt: number;
}

const store = new Map<string, Stored>();
const FS = process.env.NODE_ENV !== "production" ? require("fs") : null;
const OS = process.env.NODE_ENV !== "production" ? require("os") : null;
const PATH = FS ? `${OS.tmpdir()}/harmonix-sync.json` : null;

function load() {
  if (!FS || !PATH) return;
  try {
    const raw = FS.readFileSync(PATH, "utf8");
    const data = JSON.parse(raw) as Record<string, Stored>;
    for (const [k, v] of Object.entries(data)) store.set(k, v);
  } catch {
    /* no file yet */
  }
}
function save() {
  if (!FS || !PATH) return;
  try {
    const obj: Record<string, Stored> = {};
    for (const [k, v] of store.entries()) obj[k] = v;
    FS.writeFileSync(PATH, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}
load();

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  const v = store.get(deviceId);
  if (!v) return NextResponse.json({ payload: null, updatedAt: 0 });
  return NextResponse.json(v);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }
  const updatedAt = body.updatedAt ?? Date.now();
  const existing = store.get(body.deviceId);
  // Don't let an older write clobber a newer one.
  if (existing && existing.updatedAt > updatedAt) {
    return NextResponse.json({ ok: true, updatedAt: existing.updatedAt });
  }
  store.set(body.deviceId, { payload: body.payload, updatedAt });
  save();
  return NextResponse.json({ ok: true, updatedAt });
}
