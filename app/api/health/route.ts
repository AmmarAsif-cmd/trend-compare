/**
 * Health check endpoint
 * Returns the status of critical systems
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const health: any = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    checks: {
      prisma: 'unknown',
      database: 'unknown',
      keywordCategoryTable: 'unknown',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    },
  };

  // Check Prisma client
  try {
    if (!prisma) {
      health.checks.prisma = 'not_initialized';
      health.checks.database = 'unavailable';
      health.checks.keywordCategoryTable = 'unavailable';
      health.status = 'unhealthy';
      return NextResponse.json(health, { status: 503 });
    }

    health.checks.prisma = 'initialized';

    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'connected';

    // Check if KeywordCategory table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "KeywordCategory" LIMIT 1`;
      health.checks.keywordCategoryTable = 'exists';
      health.status = 'healthy';
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        health.checks.keywordCategoryTable = 'missing';
        health.status = 'degraded';
        health.error = 'KeywordCategory table does not exist - migrations need to be run';
      } else {
        throw error; // Re-throw if it's not a "table doesn't exist" error
      }
    }
  } catch (error: any) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
    health.error = error.message;
    return NextResponse.json(health, { status: 503 });
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
