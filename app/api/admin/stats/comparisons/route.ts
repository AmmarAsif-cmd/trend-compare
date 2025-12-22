import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total comparisons
    const total = await prisma.comparison.count();

    // Get today's comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await prisma.comparison.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        today: todayCount,
      },
    });
  } catch (error) {
    console.error("[Stats] Error fetching comparison stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        stats: { total: 0, today: 0 },
      },
      { status: 500 }
    );
  }
}
