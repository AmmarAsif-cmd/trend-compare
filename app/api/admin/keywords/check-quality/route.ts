/**
 * Admin API: Check Keyword Quality
 *
 * Analyze quality of a keyword pair before adding
 */

import { NextRequest, NextResponse } from "next/server";
import { scoreKeywordPair, suggestImprovements } from "@/lib/keyword-quality";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Check auth
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { termA, termB } = body;

    if (!termA || !termB) {
      return NextResponse.json(
        { error: "termA and termB are required" },
        { status: 400 }
      );
    }

    // Calculate quality score
    const quality = scoreKeywordPair(termA.trim(), termB.trim());

    // Get improvement suggestions
    const suggestions = suggestImprovements(termA.trim(), termB.trim());

    return NextResponse.json({
      quality,
      suggestions,
    });
  } catch (error) {
    console.error("[Check Quality] Error:", error);
    return NextResponse.json(
      { error: "Failed to check quality" },
      { status: 500 }
    );
  }
}
