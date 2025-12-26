import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (server-side)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check for password complexity (optional but recommended)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
        { status: 400 }
      );
    }

    // Check if Prisma is available
    if (!prisma) {
      console.error('[Signup] Prisma client not initialized');
      return NextResponse.json(
        { error: "Database connection unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with free unlimited access
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        subscriptionTier: "free", // All users get free unlimited access
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error: any) {
    console.error("[Signup] Error:", error);

    // Check if it's a Prisma initialization error
    if (error?.message?.includes('Prisma client is not initialized')) {
      console.error('[Signup] ❌ CRITICAL: Prisma client not initialized');
      return NextResponse.json(
        { error: "Database is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Provide more detailed error messages
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    if (error?.message?.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if it's a database connection error
    if (error?.message?.includes('PrismaClient') || error?.message?.includes('connect')) {
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create account. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
