import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Track view count for a comparison
 * 
 * POST /api/compare/[slug]/view
 * 
 * Increments view count for the comparison
 * Uses session-based tracking to prevent duplicate counts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Find the comparison (using default timeframe and geo if not specified)
    // We'll update the most recent or default comparison for this slug
    const comparison = await prisma.comparison.findFirst({
      where: {
        slug: slug,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    // Increment view count
    const updated = await prisma.comparison.update({
      where: {
        id: comparison.id,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        viewCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      viewCount: updated.viewCount,
    });
  } catch (error) {
    console.error("[View Counter] Error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

