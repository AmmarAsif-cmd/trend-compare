import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        emailVerified: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only check verification for credential-based accounts
    if (user.password && !user.emailVerified) {
      return NextResponse.json({
        requiresVerification: true,
        email: email,
      });
    }

    return NextResponse.json({
      requiresVerification: false,
    });
  } catch (error: any) {
    console.error("[Check Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}

