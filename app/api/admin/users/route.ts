import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as const } },
        { name: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with subscriptions
    let users;
    try {
      users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder as "asc" | "desc",
        },
      });
    } catch (dbError: any) {
      // Handle case where new fields don't exist yet (migration not run)
      if (dbError?.message?.includes('emailVerificationToken') || dbError?.code === 'P2021') {
        console.warn('[Admin Users] Database migration may not be complete. Attempting fallback query.');
        // Try with select to avoid new fields
        users = await prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder as "asc" | "desc",
          },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            lastSignInMethod: true,
            image: true,
            subscriptionTier: true,
          },
        });
      } else {
        throw dbError;
      }
    }

    // Get counts for each user in parallel
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        // Get counts in parallel
        const [comparisonsCount, savedCount, alertsCount] = await Promise.all([
          prisma.comparisonHistory.count({ where: { userId: user.id } }),
          prisma.savedComparison.count({ where: { userId: user.id } }),
          prisma.trendAlert.count({ where: { userId: user.id } }),
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: (user as any).emailVerified || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastSignInMethod: (user as any).lastSignInMethod || null,
          image: (user as any).image || null,
          stats: {
            comparisonsViewed: comparisonsCount,
            savedComparisons: savedCount,
            trendAlerts: alertsCount,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin Users] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

