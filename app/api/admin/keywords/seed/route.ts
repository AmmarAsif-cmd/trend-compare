import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrBuildComparison } from "@/lib/getOrBuild";
import { toCanonicalSlug } from "@/lib/slug";
import { generateAIInsights } from "@/lib/aiInsightsGenerator";

interface SeedStats {
  processed: number;
  created: number;
  exists: number;
  errors: number;
  aiGenerated: number;
  errorDetails: Array<{ pair: string; error: string }>;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const limit = body.limit || 10; // Process 10 keywords at a time by default
    const category = body.category || null;
    const status = body.status || "approved"; // Only seed approved keywords by default
    const generateAI = body.generateAI || false; // Generate rich AI insights

    const stats: SeedStats = {
      processed: 0,
      created: 0,
      exists: 0,
      errors: 0,
      aiGenerated: 0,
      errorDetails: [],
    };

    // Get keyword pairs to seed
    const where: any = { status };
    if (category) {
      where.category = category;
    }

    const keywordPairs = await prisma.keywordPair.findMany({
      where,
      take: limit,
      orderBy: {
        qualityScore: 'desc', // Process highest quality first
      },
    });

    if (keywordPairs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No keyword pairs found to seed",
        stats,
      });
    }

    // Process each keyword pair
    for (const pair of keywordPairs) {
      stats.processed++;

      try {
        // Generate slug
        const slug = `${pair.termA.toLowerCase()}-vs-${pair.termB.toLowerCase()}`
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // Check if comparison already exists
        // Comparison table uses compound unique constraint: slug + timeframe + geo
        const existing = await prisma.comparison.findUnique({
          where: {
            slug_timeframe_geo: {
              slug: slug,
              timeframe: '7d',
              geo: '',
            },
          },
        });

        if (existing) {
          stats.exists++;
          continue;
        }

        // Create comparison directly (more efficient than HTTP call)
        const comparison = await getOrBuildComparison({
          slug: slug,
          terms: [pair.termA, pair.termB],
          timeframe: '7d',
          geo: '',
        });

        if (!comparison) {
          stats.errors++;
          stats.errorDetails.push({
            pair: `${pair.termA} vs ${pair.termB}`,
            error: 'Failed to generate comparison data',
          });
          continue;
        }

        stats.created++;

        // Generate rich AI insights if requested
        if (generateAI) {
          try {
            await generateAIInsights(
              slug,
              '7d',
              '',
              true // force regeneration even if cached
            );
            stats.aiGenerated++;
          } catch (aiError) {
            console.error(`[Seed] Failed to generate AI for ${pair.termA} vs ${pair.termB}:`, aiError);
            // Don't fail the whole seeding, just log it
          }
        }

        // Update keyword pair usage stats
        await prisma.keywordPair.update({
          where: { id: pair.id },
          data: {
            timesUsed: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        stats.errors++;
        stats.errorDetails.push({
          pair: `${pair.termA} vs ${pair.termB}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeding complete! Created ${stats.created} new comparisons`,
      stats,
      keywordPairs: keywordPairs.map((kp: { termA: string; termB: string; category: string }) => ({
        termA: kp.termA,
        termB: kp.termB,
        category: kp.category,
      })),
    });
  } catch (error) {
    console.error("[Keywords Seed] Error:", error);
    return NextResponse.json(
      { error: "Failed to seed keywords" },
      { status: 500 }
    );
  }
}
