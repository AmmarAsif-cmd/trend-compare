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

    // Get free users
    const freeUsers = await prisma.user.count({
      where: { subscriptionTier: "free" },
    });

    // Get premium users
    const premiumUsers = await prisma.user.count({
      where: { subscriptionTier: "premium" },
    });

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: {
          in: ["active", "trialing"],
        },
      },
    });

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

    // Get new subscriptions this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newSubscriptionsThisMonth = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
        status: {
          in: ["active", "trialing"],
        },
      },
    });

    // Calculate Monthly Recurring Revenue (MRR)
    const mrr = premiumUsers * 4.99;

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        free: freeUsers,
        premium: premiumUsers,
        activeSubscriptions,
        newToday: newUsersToday,
        newSubscriptionsThisMonth,
        mrr: Math.round(mrr * 100) / 100, // Round to 2 decimal places
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
          free: 0,
          premium: 0,
          activeSubscriptions: 0,
          newToday: 0,
          newSubscriptionsThisMonth: 0,
          mrr: 0,
        },
      },
      { status: 500 }
    );
  }
}
