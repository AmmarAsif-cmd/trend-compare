import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/send-email";

/**
 * Test email endpoint
 * POST /api/test/email
 * Body: { to: string, type?: 'verification' | 'password-reset' | 'contact' | 'custom' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type = 'verification' } = body;

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: "Email address (to) is required" },
        { status: 400 }
      );
    }

    // Check environment configuration
    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSMTP = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'TrendArc <onboarding@resend.dev>';

    let subject: string;
    let html: string;
    let text: string;

    switch (type) {
      case 'verification':
        const verificationToken = 'test-token-12345';
        const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
        
        subject = 'Test: Verify Your TrendArc Email Address';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test: Verify Your Email Address</h2>
            <p>Hello,</p>
            <p>This is a test email verification message. Click the button below to verify:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            </div>
            <p>Or copy and paste this link:</p>
            <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This is a test email. The link will not actually verify your email.</p>
          </div>
        `;
        text = `Test: Verify Your Email Address\n\nClick this link to verify: ${verificationUrl}\n\nThis is a test email.`;
        break;

      case 'password-reset':
        const resetToken = 'test-reset-token-12345';
        const resetUrl = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        subject = 'Test: Reset Your TrendArc Password';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test: Password Reset Request</h2>
            <p>Hello,</p>
            <p>This is a test password reset email. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link:</p>
            <p style="color: #6B7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This is a test email. The link will not actually reset your password.</p>
          </div>
        `;
        text = `Test: Reset Your Password\n\nClick this link to reset: ${resetUrl}\n\nThis is a test email.`;
        break;

      case 'contact':
        subject = 'Test: Contact Form Submission';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test: Contact Form Message</h2>
            <p><strong>From:</strong> Test User (test@example.com)</p>
            <p><strong>Subject:</strong> Test Contact Form</p>
            <p><strong>Message:</strong></p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
              This is a test contact form message. If you received this, your email configuration is working!
            </p>
          </div>
        `;
        text = `Test: Contact Form Message\n\nFrom: Test User (test@example.com)\nSubject: Test Contact Form\n\nThis is a test contact form message.`;
        break;

      default:
        subject = 'Test Email from TrendArc';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test Email</h2>
            <p>This is a test email from TrendArc. If you received this, your email configuration is working correctly!</p>
            <p style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 6px; color: #166534;">
              ✅ Email service is configured and working!
            </p>
          </div>
        `;
        text = `Test Email from TrendArc\n\nThis is a test email. If you received this, your email configuration is working correctly!`;
    }

    // Attempt to send email
    try {
      await sendEmail({
        to,
        subject,
        html,
        text,
      });

      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        config: {
          hasResend: hasResend,
          hasSMTP: hasSMTP,
          fromEmail: fromEmail,
          method: hasResend ? 'Resend' : hasSMTP ? 'SMTP' : 'None (logged only)',
        },
        sentTo: to,
        type: type,
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: error?.message || 'Unknown error',
        config: {
          hasResend: hasResend,
          hasSMTP: hasSMTP,
          fromEmail: fromEmail,
        },
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Test Email] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process test email request',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check email configuration
 */
export async function GET() {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSMTP = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'TrendArc <onboarding@resend.dev>';

  return NextResponse.json({
    configured: hasResend || hasSMTP,
    config: {
      resend: {
        enabled: hasResend,
        apiKey: hasResend ? `${process.env.RESEND_API_KEY?.substring(0, 10)}...` : 'Not set',
        fromEmail: process.env.RESEND_FROM_EMAIL || 'Not set',
      },
      smtp: {
        enabled: hasSMTP,
        host: process.env.SMTP_HOST || 'Not set',
        user: hasSMTP ? process.env.SMTP_USER : 'Not set',
        from: process.env.SMTP_FROM || 'Not set',
      },
      activeMethod: hasResend ? 'Resend' : hasSMTP ? 'SMTP' : 'None',
      fromEmail: fromEmail,
    },
    instructions: {
      resend: hasResend ? '✅ Resend is configured' : 'To use Resend: Add RESEND_API_KEY to .env',
      smtp: hasSMTP ? '✅ SMTP is configured' : 'To use SMTP: Add SMTP_USER and SMTP_PASSWORD to .env',
    },
  });
}

