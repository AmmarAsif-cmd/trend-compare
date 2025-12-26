import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    // Don't reveal whether the email exists or not
    if (!user) {
      console.log('[ForgotPassword] User not found:', email);
      // Still return success to prevent account enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Check if user has a password (OAuth users don't)
    if (!user.password) {
      console.log('[ForgotPassword] User signed up with OAuth:', email);
      // Still return success to prevent account enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `reset:${email}`,
      },
    });

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Store reset token (prefixed with "reset:" to differentiate from email verification tokens)
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: resetToken,
        expires: tokenExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log('[ForgotPassword] Reset email sent to:', email);
    } catch (emailError) {
      console.error('[ForgotPassword] Failed to send reset email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("[ForgotPassword] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process password reset request. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
