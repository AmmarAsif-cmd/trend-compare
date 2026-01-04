import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/send-email";

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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours

    // Create user with free tier subscription (email not verified yet)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        subscriptionTier: "free",
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
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

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Thank you for signing up for TrendArc! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    `;

    const emailText = `
Verify Your Email Address

Hello${name ? ` ${name}` : ''},

Thank you for signing up for TrendArc! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, please ignore this email.
    `.trim();

    try {
      await sendEmail({
        to: email,
        subject: "Verify Your TrendArc Email Address",
        html: emailHtml,
        text: emailText,
      });
      console.log("[Signup] Verification email sent to:", email);
    } catch (emailError: any) {
      console.error("[Signup] Failed to send verification email:", emailError);
      // Don't fail signup if email fails - user can request resend later
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please check your email to verify your account.",
      requiresVerification: true,
      user: {
        ...user,
        emailVerified: false,
      },
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
