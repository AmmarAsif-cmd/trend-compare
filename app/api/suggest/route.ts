// app/api/suggest/route.ts
import { NextResponse } from "next/server";

export const revalidate = 60; // cache at the edge for 60s

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ suggestions: [] });

    // Google Suggest (Firefox client returns JSON)
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
      q
    )}`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const json = (await res.json()) as [string, string[]];
    const suggestions = Array.isArray(json?.[1]) ? json[1].slice(0, 8) : [];

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
