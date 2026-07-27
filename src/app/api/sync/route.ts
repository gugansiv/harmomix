import { NextRequest, NextResponse } from "next/server";

// Cross-device sync store. Keyed by deviceId (a stable per-browser id).
//
// Durable mode (recommended in production):
//   If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (link the
//   "Upstash Redis" integration in the Vercel dashboard → Storage → Upstash
//   Redis → Create), every PUT/GET hits Redis and survives serverless cold
//   starts across all function instances. No code change needed.
//
// Fallback mode (dev / no Redis):
//   In-memory Map (+ a local JSON file in dev). Works within a warm instance.
//   For guaranteed transfer between devices without Redis, use the Library
//   page's Export / Import buttons (data never leaves the browser).

interface Stored {
  payload: unknown;
  updatedAt: number;
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazily construct the Redis client only when configured.
let redisClient: import("@upstash/redis").Redis | null = null;
async function getRedis() {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  if (!redisClient) {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
  return redisClient;
}

const KEY = (deviceId: string) => `harmonix:sync:${deviceId}`;

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

  const r = await getRedis();
  if (r) {
    const v = (await r.get<Stored>(KEY(deviceId))) ?? null;
    if (!v) return NextResponse.json({ payload: null, updatedAt: 0 });
    return NextResponse.json(v);
  }

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
  const next: Stored = { payload: body.payload, updatedAt };

  const r = await getRedis();
  if (r) {
    // Conditional write: don't let an older snapshot clobber a newer one.
    const existing = await r.get<Stored>(KEY(body.deviceId));
    if (existing && existing.updatedAt > updatedAt) {
      return NextResponse.json({ ok: true, updatedAt: existing.updatedAt, mode: "redis" });
    }
    await r.set(KEY(body.deviceId), next);
    return NextResponse.json({ ok: true, updatedAt, mode: "redis" });
  }

  const existing = store.get(body.deviceId);
  if (existing && existing.updatedAt > updatedAt) {
    return NextResponse.json({ ok: true, updatedAt: existing.updatedAt, mode: "memory" });
  }
  store.set(body.deviceId, next);
  save();
  return NextResponse.json({ ok: true, updatedAt, mode: "memory" });
}
