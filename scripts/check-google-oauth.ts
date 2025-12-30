/**
 * Quick script to verify Google OAuth credentials are configured
 * Run: tsx scripts/check-google-oauth.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log('\n🔍 Google OAuth Configuration Check\n');
console.log('=' .repeat(50));

if (!clientId) {
  console.log('❌ GOOGLE_CLIENT_ID: NOT SET');
  console.log('   → Add GOOGLE_CLIENT_ID to your .env.local file');
} else {
  console.log('✅ GOOGLE_CLIENT_ID: Set');
  console.log(`   → Value: ${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 10)}`);
  if (!clientId.includes('.apps.googleusercontent.com')) {
    console.log('   ⚠️  Warning: Client ID should end with .apps.googleusercontent.com');
  }
}

console.log('');

if (!clientSecret) {
  console.log('❌ GOOGLE_CLIENT_SECRET: NOT SET');
  console.log('   → Add GOOGLE_CLIENT_SECRET to your .env.local file');
} else {
  console.log('✅ GOOGLE_CLIENT_SECRET: Set');
  console.log(`   → Value: ${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 5)}`);
  if (clientSecret.length < 20) {
    console.log('   ⚠️  Warning: Client Secret seems too short');
  }
}

console.log('');
console.log('=' .repeat(50));

if (clientId && clientSecret) {
  console.log('\n✅ Both credentials are set!');
  console.log('\nNext steps:');
  console.log('1. Make sure the redirect URI in Google Console is:');
  console.log('   http://localhost:3000/api/auth/callback/google');
  console.log('2. Restart your development server');
  console.log('3. Try signing in with Google again\n');
} else {
  console.log('\n❌ Missing credentials!');
  console.log('\nTo fix this:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create OAuth 2.0 credentials');
  console.log('3. Add them to .env.local:');
  console.log('   GOOGLE_CLIENT_ID=your-client-id');
  console.log('   GOOGLE_CLIENT_SECRET=your-client-secret');
  console.log('4. Restart your server\n');
}


