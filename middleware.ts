// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory window. For multi-instance, move to Redis (Upstash).
const WINDOW_MS = 60_000;
const MAX_REQ = 40;
const hits = new Map<string, { count: number; ts: number }>();

// CORS config
const ALLOWLIST = new Set<string>([
  "https://trendarc.net",
  "https://www.trendarc.net",
  "https://dev.trendarc.net",
  "http://localhost:3000",
]);
const ALLOW_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOW_HEADERS = "Origin, X-Requested-With, Content-Type, Accept, Authorization";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Prepare response so we can set headers
  const res = NextResponse.next();

  // CORS
  const origin = req.headers.get("origin");
  if (origin && ALLOWLIST.has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", ALLOW_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
  res.headers.set("Access-Control-Allow-Credentials", "true");

  // Preflight short circuit
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  // Url Fix
  //  if (url.searchParams.has("q")) {
  //   url.search = "";
  //   return NextResponse.redirect(url);
  // }
  // Rate limit only compare pages and public APIs
  if (path.startsWith("/compare/") || path.startsWith("/api/")) {
    const xff = req.headers.get("x-forwarded-for");
    const ip =
      (xff && xff.split(",")[0].trim()) ||
      // NextRequest has ip in some runtimes
      // @ts-expect-error: ip may be undefined depending on runtime
      req.ip ||
      "anon";

    const now = Date.now();
    const rec = hits.get(ip) ?? { count: 0, ts: now };

    if (now - rec.ts > WINDOW_MS) {
      rec.count = 0;
      rec.ts = now;
    }

    rec.count += 1;
    hits.set(ip, rec);

    if (rec.count > MAX_REQ) {
      return new NextResponse("Too Many Requests", { status: 429, headers: res.headers });
    }
  }
// Url Fix
    if (url.pathname === "/" && url.search) {
    // Strip all query parameters on the homepage
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

// Apply to all paths so CORS covers API and any future endpoints.
// If you only want CORS on API routes, change to: ['/api/:path*']
export const config = {
  matcher: "/:path*",
};
