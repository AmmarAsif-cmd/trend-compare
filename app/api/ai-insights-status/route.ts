import { NextResponse } from 'next/server';
import { getBudgetStatus, canGenerateInsight } from '@/lib/aiInsightsGenerator';

/**
 * Diagnostic endpoint to check AI insights system status
 * Visit: /api/ai-insights-status
 */
export async function GET() {
  try {
    // Check API key
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const apiKeyPreview = hasApiKey
      ? `${process.env.ANTHROPIC_API_KEY?.slice(0, 10)}...`
      : 'NOT SET';

    // Check budget status
    let budgetStatus;
    let budgetError;
    try {
      budgetStatus = await getBudgetStatus();
    } catch (error) {
      budgetError = error instanceof Error ? error.message : String(error);
    }

    // Check if can generate
    let canGenerate;
    let canGenerateError;
    try {
      canGenerate = await canGenerateInsight();
    } catch (error) {
      canGenerateError = error instanceof Error ? error.message : String(error);
    }

    // Check database connection
    let databaseStatus = 'unknown';
    let databaseError;
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.aIInsightUsage.count();
      databaseStatus = 'connected - table exists';
      await prisma.$disconnect();
    } catch (error) {
      databaseStatus = 'error';
      databaseError = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: {
        apiKey: {
          configured: hasApiKey,
          preview: apiKeyPreview,
        },
        database: {
          status: databaseStatus,
          error: databaseError,
        },
        budget: {
          status: budgetStatus,
          error: budgetError,
        },
        canGenerate: {
          allowed: canGenerate,
          error: canGenerateError,
        },
      },
      recommendations: generateRecommendations({
        hasApiKey,
        databaseStatus,
        databaseError,
        canGenerate,
        budgetStatus,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check AI insights status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.hasApiKey) {
    recommendations.push('❌ Add ANTHROPIC_API_KEY to Vercel environment variables');
  } else {
    recommendations.push('✅ API key is configured');
  }

  if (checks.databaseStatus === 'error') {
    if (checks.databaseError?.includes('does not exist')) {
      recommendations.push('❌ Run database migration: `npx prisma migrate deploy`');
      recommendations.push('💡 Or redeploy to Vercel (postinstall will run migration automatically)');
    } else {
      recommendations.push(`❌ Database error: ${checks.databaseError}`);
    }
  } else {
    recommendations.push('✅ Database table exists');
  }

  if (checks.canGenerate === false) {
    if (checks.budgetStatus) {
      recommendations.push(
        `⚠️ Budget limit reached: ${checks.budgetStatus.dailyUsed}/${checks.budgetStatus.dailyLimit} daily, ${checks.budgetStatus.monthlyUsed}/${checks.budgetStatus.monthlyLimit} monthly`
      );
    } else {
      recommendations.push('⚠️ Cannot generate insights - check budget limits');
    }
  } else if (checks.canGenerate === true) {
    recommendations.push('✅ Can generate insights (within budget)');
  }

  return recommendations;
}
