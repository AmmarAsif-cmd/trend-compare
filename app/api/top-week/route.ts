// app/api/top-week/route.ts
import { NextResponse } from "next/server";
import { getTopThisWeek } from "@/lib/topThisWeek";

export const runtime = "nodejs";

export async function GET() {
  const list = await getTopThisWeek(8);
  return NextResponse.json({ items: list }, { headers: { "Cache-Control": "s-maxage=600" } });
}
