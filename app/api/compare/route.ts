import { NextRequest, NextResponse } from "next/server";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { toCanonicalSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  try {
    // Fetch comparison data
    const { searchParams } = new URL(request.url);
    const a = searchParams.get("a");
    const b = searchParams.get("b");
    const tf = searchParams.get("tf") || "12m";
    const geo = searchParams.get("geo") || "";

    if (!a || !b) {
      return NextResponse.json(
        { error: "Missing required parameters: a and b" },
        { status: 400 }
      );
    }

    // Build slug and get comparison data
    const slug = toCanonicalSlug([a, b]);
    if (!slug) {
      return NextResponse.json(
        { error: "Invalid comparison terms" },
        { status: 400 }
      );
    }

    const comparison = await getOrBuildComparison({
      slug,
      terms: [a, b],
      timeframe: tf,
      geo,
    });

    if (!comparison) {
      return NextResponse.json(
        { error: "Failed to generate comparison" },
        { status: 500 }
      );
    }

    // Return simplified data for the chart
    return NextResponse.json({
      series: comparison.series,
      terms: comparison.terms,
      timeframe: comparison.timeframe,
      geo: comparison.geo,
    });
  } catch (error) {
    console.error("Error in /api/compare:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}
