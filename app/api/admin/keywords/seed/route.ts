import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface SeedStats {
  processed: number;
  created: number;
  exists: number;
  errors: number;
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

    const stats: SeedStats = {
      processed: 0,
      created: 0,
      exists: 0,
      errors: 0,
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
        const existing = await prisma.comparison.findUnique({
          where: { slug },
        });

        if (existing) {
          stats.exists++;
          continue;
        }

        // Create comparison by calling the compare API
        const compareResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/compare`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              a: pair.termA,
              b: pair.termB,
              tf: '7d',
              geo: '',
            }),
          }
        );

        if (!compareResponse.ok) {
          const errorText = await compareResponse.text();
          stats.errors++;
          stats.errorDetails.push({
            pair: `${pair.termA} vs ${pair.termB}`,
            error: `API error: ${compareResponse.status} - ${errorText.substring(0, 100)}`,
          });
          continue;
        }

        // Update keyword pair usage stats
        await prisma.keywordPair.update({
          where: { id: pair.id },
          data: {
            timesUsed: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });

        stats.created++;

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
      keywordPairs: keywordPairs.map(kp => ({
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
