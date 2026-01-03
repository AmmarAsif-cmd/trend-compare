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

    // User Analytics
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: today } },
    });
    const newUsersLast7Days = await prisma.user.count({
      where: { createdAt: { gte: last7Days } },
    });
    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: last30Days } },
    });
    const activeUsers = await prisma.user.count({
      where: {
        comparisonHistory: { some: {} },
      },
    });

    // Comparison Analytics
    const totalComparisons = await prisma.comparison.count();
    const comparisonsToday = await prisma.comparison.count({
      where: { createdAt: { gte: today } },
    });
    const comparisonsLast7Days = await prisma.comparison.count({
      where: { createdAt: { gte: last7Days } },
    });
    const comparisonsLast30Days = await prisma.comparison.count({
      where: { createdAt: { gte: last30Days } },
    });
    
    // Most viewed comparisons
    const topComparisons = await prisma.comparison.findMany({
      take: 10,
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        slug: true,
        viewCount: true,
        visitCount: true,
        lastVisited: true,
        category: true,
        createdAt: true,
      },
    });

    // Comparison History Analytics
    const totalViews = await prisma.comparisonHistory.count();
    const viewsToday = await prisma.comparisonHistory.count({
      where: { viewedAt: { gte: today } },
    });
    const viewsLast7Days = await prisma.comparisonHistory.count({
      where: { viewedAt: { gte: last7Days } },
    });
    const viewsLast30Days = await prisma.comparisonHistory.count({
      where: { viewedAt: { gte: last30Days } },
    });

    // User Engagement
    const usersWithSavedComparisons = await prisma.user.count({
      where: { savedComparisons: { some: {} } },
    });
    const usersWithTrendAlerts = await prisma.user.count({
      where: { trendAlerts: { some: {} } },
    });
    const totalSavedComparisons = await prisma.savedComparison.count();
    const totalTrendAlerts = await prisma.trendAlert.count();

    // Blog Analytics
    const totalBlogPosts = await prisma.blogPost.count();
    const publishedPosts = await prisma.blogPost.count({
      where: { status: "published" },
    });
    const draftPosts = await prisma.blogPost.count({
      where: { status: "draft" },
    });
    const blogViews = await prisma.blogPost.aggregate({
      _sum: { viewCount: true },
    });

    // Keywords Analytics
    const totalKeywords = await prisma.keywordPair.count();
    const approvedKeywords = await prisma.keywordPair.count({
      where: { status: "approved" },
    });
    const pendingKeywords = await prisma.keywordPair.count({
      where: { status: "pending" },
    });

    // Forecast Analytics
    const totalForecasts = await prisma.forecastRun.count();
    const evaluatedForecasts = await prisma.forecastRun.count({
      where: { evaluatedAt: { not: null } },
    });
    const recentForecasts = await prisma.forecastRun.count({
      where: { computedAt: { gte: last7Days } },
    });

    // Daily user signups (last 30 days for chart)
    const dailySignups = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });
      
      dailySignups.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // Daily comparison views (last 30 days)
    const dailyViews = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await prisma.comparisonHistory.count({
        where: {
          viewedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });
      
      dailyViews.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // Category breakdown
    const categoryBreakdown = await prisma.comparison.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { category: { not: null } },
    });

    // Authentication method breakdown
    const googleAuthUsers = await prisma.user.count({
      where: { lastSignInMethod: "google" },
    });
    const emailAuthUsers = await prisma.user.count({
      where: { password: { not: null } },
    });

    return NextResponse.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100 * 100) / 100 : 0,
          newToday: newUsersToday,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days,
          dailySignups,
          authentication: {
            google: googleAuthUsers,
            email: emailAuthUsers,
          },
        },
        comparisons: {
          total: totalComparisons,
          today: comparisonsToday,
          last7Days: comparisonsLast7Days,
          last30Days: comparisonsLast30Days,
          topComparisons: topComparisons.map(c => ({
            slug: c.slug,
            views: c.viewCount,
            visits: c.visitCount,
            category: c.category,
            lastVisited: c.lastVisited,
          })),
          categoryBreakdown: categoryBreakdown.map(c => ({
            category: c.category || 'general',
            count: c._count.category,
          })),
        },
        views: {
          total: totalViews,
          today: viewsToday,
          last7Days: viewsLast7Days,
          last30Days: viewsLast30Days,
          dailyViews,
        },
        engagement: {
          usersWithSavedComparisons,
          usersWithTrendAlerts,
          totalSavedComparisons,
          totalTrendAlerts,
          engagementRate: totalUsers > 0
            ? Math.round(((usersWithSavedComparisons + usersWithTrendAlerts) / totalUsers) * 100 * 100) / 100
            : 0,
        },
        content: {
          blogPosts: {
            total: totalBlogPosts,
            published: publishedPosts,
            draft: draftPosts,
            totalViews: blogViews._sum.viewCount || 0,
          },
          keywords: {
            total: totalKeywords,
            approved: approvedKeywords,
            pending: pendingKeywords,
          },
        },
        forecasts: {
          total: totalForecasts,
          evaluated: evaluatedForecasts,
          recent: recentForecasts,
          evaluationRate: totalForecasts > 0
            ? Math.round((evaluatedForecasts / totalForecasts) * 100 * 100) / 100
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}


