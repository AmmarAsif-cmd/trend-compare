/**
 * Admin API: Keyword Management
 *
 * CRUD operations for managing keyword pairs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { scoreKeywordPair } from "@/lib/keyword-quality";

// GET /api/admin/keywords - List all keyword pairs
export async function GET(request: NextRequest) {
  // Check auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    // Get total count
    const total = await prisma.keywordPair.count({ where });

    // Get paginated results
    const keywords = await prisma.keywordPair.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stats
    const stats = {
      total,
      approved: await prisma.keywordPair.count({ where: { status: "approved" } }),
      pending: await prisma.keywordPair.count({ where: { status: "pending" } }),
      rejected: await prisma.keywordPair.count({ where: { status: "rejected" } }),
      byCategory: await prisma.keywordPair.groupBy({
        by: ["category"],
        _count: true,
      }),
    };

    return NextResponse.json({
      keywords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("[Admin Keywords GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// POST /api/admin/keywords - Create new keyword pair
export async function POST(request: NextRequest) {
  // Check auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { termA, termB, category, notes, tags, source } = body;

    // Validation
    if (!termA || !termB || !category) {
      return NextResponse.json(
        { error: "termA, termB, and category are required" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const existing = await prisma.keywordPair.findUnique({
      where: {
        unique_pair: {
          termA: termA.trim(),
          termB: termB.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This keyword pair already exists" },
        { status: 409 }
      );
    }

    // Calculate quality score
    const qualityResult = scoreKeywordPair(termA.trim(), termB.trim());

    // Auto-approve if quality is high
    const autoApprove = qualityResult.isApproved;

    // Create keyword pair
    const keyword = await prisma.keywordPair.create({
      data: {
        termA: termA.trim(),
        termB: termB.trim(),
        category,
        qualityScore: qualityResult.overall,
        status: autoApprove ? "approved" : "pending",
        approvedBy: autoApprove ? "auto" : null,
        approvedAt: autoApprove ? new Date() : null,
        source: source || "manual",
        notes,
        tags: tags || [],
      },
    });

    return NextResponse.json({
      keyword,
      quality: qualityResult,
      message: autoApprove
        ? "Keyword pair created and auto-approved (high quality)"
        : "Keyword pair created, pending approval",
    });
  } catch (error) {
    console.error("[Admin Keywords POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create keyword pair" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/keywords - Update keyword pair
export async function PUT(request: NextRequest) {
  // Check auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, termA, termB, category, status, notes, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Recalculate quality if terms changed
    let qualityScore: number | undefined;
    if (termA && termB) {
      const qualityResult = scoreKeywordPair(termA.trim(), termB.trim());
      qualityScore = qualityResult.overall;
    }

    // Build update data
    const updateData: any = {};
    if (termA) updateData.termA = termA.trim();
    if (termB) updateData.termB = termB.trim();
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (qualityScore !== undefined) updateData.qualityScore = qualityScore;

    // If status changed to approved, track approval
    if (status === "approved") {
      updateData.approvedBy = "admin"; // Could get from session
      updateData.approvedAt = new Date();
    }

    const keyword = await prisma.keywordPair.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ keyword });
  } catch (error) {
    console.error("[Admin Keywords PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update keyword pair" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/keywords - Delete keyword pair
export async function DELETE(request: NextRequest) {
  // Check auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.keywordPair.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Keyword pair deleted" });
  } catch (error) {
    console.error("[Admin Keywords DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword pair" },
      { status: 500 }
    );
  }
}
