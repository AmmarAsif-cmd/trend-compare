import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users count
    const activeUsersCount = await prisma.user.count({
      where: {
        comparisonHistory: { some: {} },
      },
    });

    // New users over time
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: today } },
    });

    const newUsersYesterday = await prisma.user.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const newUsersLast7Days = await prisma.user.count({
      where: { createdAt: { gte: last7Days } },
    });

    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: last30Days } },
    });

    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    });


    // Users with activity (at least one comparison viewed)
    const activeUsers = await prisma.user.count({
      where: {
        comparisonHistory: {
          some: {},
        },
      },
    });

    // Users with Google OAuth
    const googleUsers = await prisma.user.count({
      where: {
        lastSignInMethod: "google",
      },
    });

    // Users with email/password
    const emailUsers = await prisma.user.count({
      where: {
        password: { not: null },
      },
    });

    // Most active users (by comparison history)
    // Get users who have viewed comparisons, ordered by count
    const topUsersRaw = await prisma.comparisonHistory.groupBy({
      by: ['userId'],
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
      where: {
        userId: { not: null },
      },
    });

    // Get user details for top users
    const topUserIds = topUsersRaw.map((u: any) => u.userId).filter((id: any): id is string => id !== null);
    const topUsers = await prisma.user.findMany({
      where: {
        id: { in: topUserIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Get detailed counts for top users
    const formattedTopUsers = await Promise.all(
      topUsers.map(async (user: any) => {
        const comparisonCount = topUsersRaw.find((u: any) => u.userId === user.id)?._count.userId || 0;
        const [savedCount, alertCount] = await Promise.all([
          prisma.savedComparison.count({ where: { userId: user.id } }),
          prisma.trendAlert.count({ where: { userId: user.id } }),
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          comparisonsViewed: comparisonCount,
          savedComparisons: savedCount,
          trendAlerts: alertCount,
        };
      })
    );

    // Sort by comparisons viewed (maintain order)
    formattedTopUsers.sort((a, b) => b.comparisonsViewed - a.comparisonsViewed);

    // Growth rate calculations
    const growthRate7Days = newUsersLast7Days > 0
      ? ((newUsersToday - newUsersYesterday) / newUsersLast7Days) * 100
      : 0;

    const growthRate30Days = newUsersLast30Days > 0
      ? ((newUsersThisMonth - newUsersLast30Days) / newUsersLast30Days) * 100
      : 0;

    // User engagement metrics
    const usersWithSavedComparisons = await prisma.user.count({
      where: {
        savedComparisons: {
          some: {},
        },
      },
    });

    const usersWithTrendAlerts = await prisma.user.count({
      where: {
        trendAlerts: {
          some: {},
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsersCount,
        activeUsers,
        newUsers: {
          today: newUsersToday,
          yesterday: newUsersYesterday,
          last7Days: newUsersLast7Days,
          last30Days: newUsersLast30Days,
          thisMonth: newUsersThisMonth,
        },
        growth: {
          rate7Days: Math.round(growthRate7Days * 100) / 100,
          rate30Days: Math.round(growthRate30Days * 100) / 100,
        },
        authentication: {
          google: googleUsers,
          email: emailUsers,
        },
        engagement: {
          usersWithSavedComparisons,
          usersWithTrendAlerts,
          activeUsersPercentage: totalUsers > 0
            ? Math.round((activeUsers / totalUsers) * 100 * 100) / 100
            : 0,
        },
        topUsers: formattedTopUsers,
      },
    });
  } catch (error) {
    console.error("[Admin Users Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}

