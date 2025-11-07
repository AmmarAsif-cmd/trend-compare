import { NextResponse } from "next/server";

// Simple in-memory window. For multi-instance, move to Redis (Upstash).
const WINDOW_MS = 60_000;
const MAX_REQ = 40;
const hits = new Map<string, { count: number; ts: number }>();

export function middleware(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  // throttle compare pages and public APIs
  if (!(path.startsWith("/compare/") || path.startsWith("/api/"))) {
    return NextResponse.next();
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const rec = hits.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) { rec.count = 0; rec.ts = now; }
  rec.count += 1; hits.set(ip, rec);

  if (rec.count > MAX_REQ) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }
  return NextResponse.next();
}
