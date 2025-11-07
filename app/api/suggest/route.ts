import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = (searchParams.get("q") ?? "").slice(0, 64);
    const q = qRaw.trim();
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "s-maxage=60" } });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } }).catch(() => null);
    clearTimeout(timeout);

    if (!res || !res.ok) {
      return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "s-maxage=60" } });
    }

    const json = (await res.json()) as [string, string[]];
    const suggestions = Array.isArray(json?.[1]) ? json[1].slice(0, 8) : [];
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "s-maxage=60" } });
  }
}
