import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists and has a password (not OAuth-only)
    if (user && user.password) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // Send password reset email
      const resetUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
      
      // Try Resend first (if configured)
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'TrendArc <onboarding@resend.dev>';
          
          console.log("[Password Reset] Attempting to send email via Resend:", {
            from: fromEmail,
            to: user.email,
            hasApiKey: !!process.env.RESEND_API_KEY,
            apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
          });
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4F46E5;">Password Reset Request</h2>
              <p>Hello,</p>
              <p>You requested to reset your password for your TrendArc account. Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
              <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
          `;
          
          const emailText = `
Password Reset Request

You requested to reset your password for your TrendArc account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email.
          `.trim();
          
          const result = await resend.emails.send({
            from: fromEmail,
            to: [user.email],
            subject: 'Reset Your TrendArc Password',
            text: emailText,
            html: emailHtml,
          });
          
          console.log("[Password Reset] Email sent successfully via Resend:", {
            emailId: result.data?.id || 'unknown',
            to: user.email,
            result: result,
          });
        } catch (error: any) {
          console.error("[Password Reset] Resend error details:", {
            message: error?.message,
            name: error?.name,
            status: error?.status,
            statusCode: error?.statusCode,
            response: error?.response,
            stack: error?.stack,
          });
          
          // Log specific Resend error messages
          if (error?.message?.includes('domain')) {
            console.error("[Password Reset] Domain verification issue. Make sure your domain is verified in Resend or use 'onboarding@resend.dev' for testing.");
          }
          if (error?.message?.includes('API key') || error?.message?.includes('Unauthorized')) {
            console.error("[Password Reset] API key issue. Check that RESEND_API_KEY is correct.");
          }
          
          // Don't throw - we still want to return success to prevent email enumeration
          // But log the error so it can be debugged
        }
      } else {
        // Fallback: Log for development
        console.warn("[Password Reset] RESEND_API_KEY not configured. Email not sent.");
        console.log("[Password Reset] Reset link for", email, ":", resetUrl);
      }
    }

    // Always return success message
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, we've sent a password reset link.",
    });
  } catch (error: any) {
    console.error("[Forgot Password] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}


