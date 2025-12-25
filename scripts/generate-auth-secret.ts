/**
 * Generate AUTH_SECRET for NextAuth
 * 
 * This script generates a secure random secret for NextAuth.js v5 beta
 * 
 * Usage:
 *   tsx scripts/generate-auth-secret.ts
 */

import crypto from 'crypto';

console.log('🔐 Generating AUTH_SECRET for NextAuth...');
console.log('');

// Generate a 32-byte (256-bit) random base64 string
const secret = crypto.randomBytes(32).toString('base64');

console.log('✅ Generated AUTH_SECRET:');
console.log('');
console.log(secret);
console.log('');
console.log('📋 Add this to your .env.local file:');
console.log('');
console.log(`AUTH_SECRET=${secret}`);
console.log('');
console.log('💡 Also add for local development:');
console.log('');
console.log('AUTH_URL=http://localhost:3000');
console.log('');
console.log('🔄 Restart your development server after adding the secret.');


