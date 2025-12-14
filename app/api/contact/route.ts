import { NextRequest, NextResponse } from "next/server";

async function sendEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail: string;
}) {
  const emailContent = `
New Contact Form Submission from TrendArc

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
This message was sent from the TrendArc contact form.
Reply to: ${data.email}
  `.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Contact Form Submission</h2>
      <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Subject:</strong> ${data.subject}</p>
      </div>
      <div style="background: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1F2937;">Message:</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
      </div>
      <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
        This message was sent from the TrendArc contact form.<br>
        Reply to: <a href="mailto:${data.email}">${data.email}</a>
      </p>
    </div>
  `;

  // Try Resend first (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'TrendArc <onboarding@resend.dev>',
        to: [data.recipientEmail],
        subject: `Contact Form: ${data.subject}`,
        text: emailContent,
        html: htmlContent,
        replyTo: data.email,
      });
      
      console.log('Resend email sent successfully:', result);
      return;
    } catch (error: any) {
      console.error('Resend error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack,
      });
      // Re-throw with more context for better error messages
      throw new Error(`Resend error: ${error?.message || 'Unknown error'}. Check your API key and domain verification.`);
    }
  }

  // Try Gmail SMTP (if configured)
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
        to: data.recipientEmail,
        subject: `Contact Form: ${data.subject}`,
        text: emailContent,
        html: htmlContent,
        replyTo: data.email,
      });
      return;
    } catch (error) {
      console.error('SMTP error:', error);
      // Fall through to webhook or log
    }
  }

  // Fallback: Use webhook if configured
  if (process.env.CONTACT_WEBHOOK_URL) {
    try {
      await fetch(process.env.CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          recipientEmail: data.recipientEmail,
        }),
      });
      return;
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  // Last resort: Log to console (for development)
  console.log('Contact form submission (no email service configured):', {
    to: data.recipientEmail,
    from: data.email,
    subject: data.subject,
    message: data.message,
  });
  
  throw new Error('No email service configured. Please set up Resend, SMTP, or webhook.');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Get recipient email from environment variable (default to provided email)
    const recipientEmail = process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'manipulator550@gmail.com';

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: "Email service not configured. Please set RESEND_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    console.log('Sending email with config:', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
      recipientEmail,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'TrendArc <onboarding@resend.dev>',
    });

    // Send email
    await sendEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      recipientEmail,
    });

    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Contact form error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Return more specific error message
    const errorMessage = error?.message || "Failed to send message. Please try again later.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

