import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total users
    const totalUsers = await prisma.user.count();

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Get active users (users who have viewed comparisons)
    const activeUsers = await prisma.user.count({
      where: {
        comparisonHistory: {
          some: {},
        },
      },
    });

    // Get users with Google OAuth
    const googleUsers = await prisma.user.count({
      where: {
        lastSignInMethod: "google",
      },
    });

    // Get users with email/password
    const emailUsers = await prisma.user.count({
      where: {
        password: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        authentication: {
          google: googleUsers,
          email: emailUsers,
        },
      },
    });
  } catch (error) {
    console.error("[Stats] Error fetching subscriber stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        stats: {
          total: 0,
          active: 0,
          newToday: 0,
          authentication: {
            google: 0,
            email: 0,
          },
        },
      },
      { status: 500 }
    );
  }
}
