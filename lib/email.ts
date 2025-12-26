/**
 * Email Service using Resend
 * Handles all transactional emails for the application
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'TrendArc <noreply@trendarc.net>';
const APP_URL = process.env.NEXTAUTH_URL || 'https://trendarc.net';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend
 */
async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not set - email not sent');
    console.log('[Email] Would have sent:', { to, subject });
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log('[Email] Sent successfully:', { to, subject, id: data.id });
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .code { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 18px; letter-spacing: 2px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Verify Your Email</h1>
    </div>
    <div class="content">
      <h2>Welcome to TrendArc! 🎉</h2>
      <p>Thank you for signing up. To complete your registration and start exploring trending topics, please verify your email address.</p>

      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <div class="code">${verificationUrl}</div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Security note:</strong> This link will expire in 24 hours. If you didn't create an account with TrendArc, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your TrendArc account',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Reset Your Password</h1>
    </div>
    <div class="content">
      <p>We received a request to reset your password for your TrendArc account.</p>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 14px;">${resetUrl}</div>

      <div class="warning">
        <strong>⚠️ Security Alert:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
      </div>

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        For your security, this link can only be used once and will expire in 1 hour.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your TrendArc password',
    html,
  });
}

/**
 * Send account lockout notification email
 */
export async function sendAccountLockoutEmail(email: string, unlockTime: Date) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Account Locked</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>Security Alert:</strong> Your TrendArc account has been temporarily locked due to multiple failed login attempts.
      </div>

      <h3>What happened?</h3>
      <p>We detected 5 or more failed login attempts on your account. To protect your account security, we've temporarily locked it.</p>

      <h3>When will my account be unlocked?</h3>
      <p>Your account will be automatically unlocked at:</p>
      <p style="text-align: center; font-size: 18px; font-weight: 600; color: #dc2626;">
        ${unlockTime.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC'
        })} UTC
      </p>

      <h3>What should I do?</h3>
      <ul>
        <li>Wait for the lockout period to expire (30 minutes)</li>
        <li>If you forgot your password, use the "Forgot Password" link on the login page</li>
        <li>If you didn't attempt to log in, someone may be trying to access your account</li>
      </ul>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Need help?</strong> If you believe this was triggered in error or you're concerned about unauthorized access to your account, please contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: '⚠️ TrendArc Account Locked - Security Alert',
    html,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, name: string | null) {
  const displayName = name || email.split('@')[0];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .feature { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Welcome to TrendArc! 🎉</h1>
    </div>
    <div class="content">
      <h2>Hi ${displayName}!</h2>
      <p>Your email has been verified and your account is now active. You now have unlimited access to all TrendArc features!</p>

      <h3>What you can do:</h3>
      <div class="feature">
        <strong>📊 Unlimited Comparisons</strong><br>
        Compare any trending topics with detailed charts and data
      </div>
      <div class="feature">
        <strong>🤖 AI-Powered Insights</strong><br>
        Get intelligent analysis of trend patterns and predictions
      </div>
      <div class="feature">
        <strong>📥 Export Data</strong><br>
        Download your comparisons as PNG images or CSV files
      </div>
      <div class="feature">
        <strong>📈 Historical Data</strong><br>
        Access trend data across multiple timeframes
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        Have questions? Check out our <a href="${APP_URL}/#faq" style="color: #667eea;">FAQ</a> or reply to this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TrendArc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to TrendArc - Your account is ready!',
    html,
  });
}
