import { NextResponse } from "next/server";
import { checkComparisonLimit } from "@/lib/daily-limit";

export async function GET() {
  try {
    const limitStatus = await checkComparisonLimit();

    return NextResponse.json(limitStatus);
  } catch (error) {
    console.error("[API /user/daily-limit] Error:", error);

    // Return fail-open response
    return NextResponse.json({
      allowed: true,
      remaining: 20,
      limit: 20,
      count: 0,
    });
  }
}
