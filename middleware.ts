// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory window. For multi-instance, move to Redis (Upstash).
const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQ_API = 40; // API routes: 40 requests per minute
const MAX_REQ_COMPARE = 100; // Comparison pages: 100 requests per minute (more generous for public pages)
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

// Get secure admin path (must match next.config.ts)
const getSecureAdminPath = (): string => {
  return process.env.ADMIN_PATH || 'cp-9a4eef7';
};

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Block direct access to /admin/* routes
  // Only allow access through the secure admin path (e.g., /cp-9a4eef7/*)
  // The secure path gets rewritten to /admin/* by next.config.ts, but middleware runs before rewrites
  if (path.startsWith('/admin/') || path === '/admin') {
    // This is a direct /admin/* access - block it
    // The secure path requests will be at /cp-9a4eef7/* and will be rewritten after middleware
    return new NextResponse('Not Found', { status: 404 });
  }

  // SEO-preserving redirects for e-commerce pivot
  // 301 permanent redirects to maintain SEO value

  // Note: The old homepage functionality has been moved to /tools/trend-comparison
  // but we DON'T redirect the homepage (/) because it now has new e-commerce content

  // However, if there are query params that indicate old compare functionality,
  // redirect to the tools page
  // This is handled by generateMetadata in the page components instead

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
  // Rate limit API routes and comparison pages (with different limits)
  if (path.startsWith("/api/")) {
    // API routes: stricter limit (40/min)
    const xff = req.headers.get("x-forwarded-for");
    const ip =
      (xff && xff.split(",")[0].trim()) ||
      // NextRequest has ip in some runtimes
      // @ts-expect-error: ip may be undefined depending on runtime
      req.ip ||
      "anon";

    const now = Date.now();
    const rec = hits.get(`api:${ip}`) ?? { count: 0, ts: now };

    if (now - rec.ts > WINDOW_MS) {
      rec.count = 0;
      rec.ts = now;
    }

    rec.count += 1;
    hits.set(`api:${ip}`, rec);

    if (rec.count > MAX_REQ_API) {
      return new NextResponse("Too Many Requests", { status: 429, headers: res.headers });
    }
  } else if (path.startsWith("/compare/")) {
    // Comparison pages: more generous limit (100/min) since we have daily limits
    // This allows for page loads with multiple requests (API calls, images, etc.)
    const xff = req.headers.get("x-forwarded-for");
    const ip =
      (xff && xff.split(",")[0].trim()) ||
      // NextRequest has ip in some runtimes
      // @ts-expect-error: ip may be undefined depending on runtime
      req.ip ||
      "anon";

    const now = Date.now();
    const rec = hits.get(`compare:${ip}`) ?? { count: 0, ts: now };

    if (now - rec.ts > WINDOW_MS) {
      rec.count = 0;
      rec.ts = now;
    }

    rec.count += 1;
    hits.set(`compare:${ip}`, rec);

    if (rec.count > MAX_REQ_COMPARE) {
      return new NextResponse("Too Many Requests", { status: 429, headers: res.headers });
    }
  }
  
  // Note: Homepage query params (like ?q=) are allowed for UX
  // but handled with noindex robots meta via generateMetadata in app/page.tsx
  
  return res;
}

// Apply to all paths so CORS covers API and any future endpoints.
// If you only want CORS on API routes, change to: ['/api/:path*']
export const config = {
  matcher: "/:path*",
};
