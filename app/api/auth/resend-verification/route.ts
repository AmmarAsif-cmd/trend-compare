import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/send-email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, we've sent a verification link.",
      });
    }

    // If email is already verified, return success
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified.",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
        <p>Hello${user.name ? ` ${user.name}` : ''},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `;

    const emailText = `
Verify Your Email Address

Hello${user.name ? ` ${user.name}` : ''},

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.
    `.trim();

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your TrendArc Email Address",
        html: emailHtml,
        text: emailText,
      });
      console.log("[Resend Verification] Email sent to:", user.email);
    } catch (emailError: any) {
      console.error("[Resend Verification] Failed to send email:", emailError);
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, we've sent a verification link.",
    });
  } catch (error: any) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}

