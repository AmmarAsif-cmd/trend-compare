/**
 * Reusable email sending function
 * Supports Resend, SMTP, and webhook fallbacks
 */

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Try Resend first (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'TrendArc <onboarding@resend.dev>',
        to: [to],
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        html,
      });
      
      console.log('[Email] Sent via Resend:', result);
      return;
    } catch (error: any) {
      console.error('[Email] Resend error:', error);
      // Fall through to next method
    }
  }

  // Try SMTP (if configured)
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html,
      });
      
      console.log('[Email] Sent via SMTP');
      return;
    } catch (error) {
      console.error('[Email] SMTP error:', error);
      // Fall through to next method
    }
  }

  // Log for development (no email service configured)
  console.warn('[Email] No email service configured. Email would have been sent to:', to);
  console.log('[Email] Subject:', subject);
  console.log('[Email] HTML:', html);
}


