/**
 * Test script to verify Resend configuration
 * Run with: tsx scripts/test-resend.ts
 */

import 'dotenv/config';
import { Resend } from 'resend';

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'TrendArc <onboarding@resend.dev>';
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log('=== Resend Configuration Test ===\n');
  console.log('RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('RESEND_FROM_EMAIL:', fromEmail);
  console.log('Test Email:', testEmail);
  console.log('');

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.log('\nTo fix:');
    console.log('1. Get your API key from https://resend.com/api-keys');
    console.log('2. Add to .env: RESEND_API_KEY=re_xxxxxxxxxxxxx');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    
    console.log('Attempting to send test email...');
    const result = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: 'Test Email from TrendArc',
      html: '<p>This is a test email to verify Resend configuration.</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.data?.id || 'unknown');
    console.log('Response:', result);
    console.log('\nCheck your inbox at:', testEmail);
  } catch (error: any) {
    console.error('❌ Failed to send email');
    console.error('Error:', error.message);
    console.error('Status:', error.status || error.statusCode);
    
    if (error.message?.includes('domain') || error.message?.includes('Domain')) {
      console.error('\n⚠️  Domain verification issue:');
      console.error('   - Make sure your domain is verified in Resend dashboard');
      console.error('   - Or use "onboarding@resend.dev" for testing (limited to 100 emails/day)');
      console.error('   - Update RESEND_FROM_EMAIL in .env');
    }
    
    if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
      console.error('\n⚠️  API key issue:');
      console.error('   - Verify your API key is correct');
      console.error('   - Check that the key is active in Resend dashboard');
    }
    
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

testResend();

