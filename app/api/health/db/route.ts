import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const start = Date.now();

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get table counts
    const comparisons = await prisma.comparison.count();
    const blogPosts = await prisma.blogPost.count();
    const aiUsage = await prisma.aIInsightUsage.count();

    const responseTime = Date.now() - start;

    return NextResponse.json({
      ok: true,
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      prismaGenerated: true,
      tables: {
        comparisons,
        blogPosts,
        aiInsightUsage: aiUsage,
      },
      database: {
        type: 'PostgreSQL',
        connected: true,
      },
    });
  } catch (e: any) {
    const errorMessage = String(e?.message || e);
    const isPrismaError = errorMessage.includes('@prisma/client') || errorMessage.includes('did not initialize');

    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        prismaGenerated: !isPrismaError,
        database: {
          type: 'PostgreSQL',
          connected: false,
        },
        error: {
          type: isPrismaError ? 'Prisma client not generated' : 'Database connection failed',
          details: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
