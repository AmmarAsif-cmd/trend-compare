import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        lastSignInMethod: true,
        password: true, // Check if user has password (not OAuth-only)
      },
    });

    if (!user) {
      return NextResponse.json({
        lastSignInMethod: null,
        hasPassword: false,
      });
    }

    return NextResponse.json({
      lastSignInMethod: user.lastSignInMethod,
      hasPassword: !!user.password,
    });
  } catch (error: any) {
    console.error("[Last Sign In Method] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sign-in method" },
      { status: 500 }
    );
  }
}

