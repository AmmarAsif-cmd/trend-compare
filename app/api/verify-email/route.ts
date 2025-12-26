import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Delete the token since it's already used
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json({
        success: true,
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete the verification token (one-time use)
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Send welcome email (don't block on this)
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log('[Verify] Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('[Verify] Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    console.log('[Verify] Email verified successfully for:', user.email);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("[Verify Email] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to verify email. Please try again or contact support.",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
