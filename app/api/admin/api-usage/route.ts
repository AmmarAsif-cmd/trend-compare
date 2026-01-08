/**
 * API Usage Statistics Endpoint
 * Admin endpoint to view API usage and costs
 */

import { NextRequest, NextResponse } from "next/server";
import { getAPIUsageStats, getEstimatedCost } from "@/lib/utils/api-monitoring";

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // For now, this is accessible but should be protected in production

    const searchParams = request.nextUrl.searchParams;
    const timeframe = (searchParams.get('timeframe') as '1h' | '24h' | '7d') || '24h';

    const stats = getAPIUsageStats(timeframe);
    const costs = getEstimatedCost(timeframe);

    return NextResponse.json({
      timeframe,
      stats,
      costs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[APIUsage] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get API usage statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

