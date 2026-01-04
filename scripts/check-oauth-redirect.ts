/**
 * Script to check OAuth redirect URI configuration
 * This helps diagnose redirect_uri_mismatch errors
 * 
 * Run: tsx scripts/check-oauth-redirect.ts
 */

const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
const redirectUri = `${baseUrl}/api/auth/callback/google`;

console.log('\n🔍 OAuth Redirect URI Configuration Check\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Current Configuration:');
console.log(`   Base URL: ${baseUrl}`);
console.log(`   Redirect URI: ${redirectUri}\n`);

console.log('✅ What to do:');
console.log('   1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('   2. Navigate to: APIs & Services → Credentials');
console.log('   3. Click on your OAuth 2.0 Client ID');
console.log('   4. Under "Authorized redirect URIs", add this EXACT URI:');
console.log(`      ${redirectUri}\n`);

console.log('⚠️  Important:');
console.log('   - The URI must match EXACTLY (including http/https, domain, path)');
console.log('   - No trailing slashes');
console.log('   - Wait 1-2 minutes after saving for changes to propagate');
console.log('   - Clear browser cache/cookies after updating\n');

console.log('🔧 Environment Variables:');
console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ Not set'}`);
console.log(`   AUTH_URL: ${process.env.AUTH_URL || '❌ Not set'}`);
console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}\n`);

if (!process.env.NEXTAUTH_URL && !process.env.AUTH_URL) {
  console.log('💡 Tip: Set NEXTAUTH_URL or AUTH_URL in your .env.local for production:');
  console.log('   NEXTAUTH_URL=https://yourdomain.com');
  console.log('   or');
  console.log('   AUTH_URL=https://yourdomain.com\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

