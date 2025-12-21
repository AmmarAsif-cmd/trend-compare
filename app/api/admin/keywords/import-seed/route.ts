import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreKeywordPair, getQualityLabel } from "@/lib/keyword-quality";
import fs from "fs";
import path from "path";

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  lowQuality: number;
  errors: number;
  byCategory: Record<string, number>;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const minQuality = body.minQuality || 50;
    const category = body.category || null;

    const stats: ImportStats = {
      total: 0,
      imported: 0,
      skipped: 0,
      lowQuality: 0,
      errors: 0,
      byCategory: {},
    };

    // Load seed keywords
    const seedPath = path.join(process.cwd(), "data", "seed-keywords.json");

    if (!fs.existsSync(seedPath)) {
      return NextResponse.json(
        { error: "Seed file not found: data/seed-keywords.json" },
        { status: 404 }
      );
    }

    const keywords: Record<string, Array<[string, string]>> = JSON.parse(
      fs.readFileSync(seedPath, "utf-8")
    );

    // Filter by category if specified
    const categoriesToImport = category ? [category] : Object.keys(keywords);

    if (category && !keywords[category]) {
      return NextResponse.json(
        {
          error: `Category not found: ${category}`,
          availableCategories: Object.keys(keywords),
        },
        { status: 400 }
      );
    }

    // Import keywords
    for (const cat of categoriesToImport) {
      const pairs = keywords[cat];

      for (const [termA, termB] of pairs) {
        stats.total++;

        // Calculate quality
        const qualityResult = scoreKeywordPair(termA, termB);

        // Check minimum quality
        if (qualityResult.overall < minQuality) {
          stats.lowQuality++;
          continue;
        }

        try {
          // Check if already exists
          const existing = await prisma.keywordPair.findUnique({
            where: {
              unique_pair: { termA, termB },
            },
          });

          if (existing) {
            stats.skipped++;
            continue;
          }

          // Import
          await prisma.keywordPair.create({
            data: {
              termA,
              termB,
              category: cat,
              qualityScore: qualityResult.overall,
              status: qualityResult.overall >= 70 ? "approved" : "pending",
              approvedBy: qualityResult.overall >= 70 ? "auto" : null,
              approvedAt: qualityResult.overall >= 70 ? new Date() : null,
              source: "manual",
              importedFrom: "seed-keywords.json",
            },
          });

          stats.imported++;
          stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        } catch (error) {
          stats.errors++;
          console.error(`Error importing ${termA} vs ${termB}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${stats.imported} keyword pairs`,
      stats,
    });
  } catch (error) {
    console.error("[Keywords Import] Error:", error);
    return NextResponse.json(
      { error: "Failed to import keywords" },
      { status: 500 }
    );
  }
}
