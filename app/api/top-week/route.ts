// app/api/top-week/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTopThisWeek } from "@/lib/topThisWeek";
import { checkETag, createCacheHeaders } from '@/lib/utils/etag';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const list = await getTopThisWeek(8);
  const responseData = { items: list };
  
  // Generate ETag and check for 304 Not Modified
  const cacheHeaders = createCacheHeaders(responseData, 600, 1800); // 10 min cache, 30 min stale
  const etag = (cacheHeaders as Record<string, string>)['ETag'];
  
  if (etag && checkETag(request, etag)) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }
  
  return NextResponse.json(responseData, { headers: cacheHeaders });
}
