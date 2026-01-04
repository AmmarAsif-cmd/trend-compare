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

    // Create user with free tier subscription
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        subscriptionTier: "free",
        subscriptions: {
          create: {
            tier: "free",
            status: "active",
          },
        },
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
        { error: "Database connection error. Please ensure the database is running and migrations are complete." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error?.message || "Failed to create account. Please check server logs for details.",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
