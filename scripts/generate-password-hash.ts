/**
 * Generate password hash for admin authentication
 * 
 * Usage: tsx scripts/generate-password-hash.ts your-password
 * 
 * This generates a SHA-256 hash that can be stored in ADMIN_PASSWORD_HASH
 */

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Please provide a password');
  console.log('\nUsage: tsx scripts/generate-password-hash.ts your-password');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n✅ Password hash generated!\n');
console.log('Add this to your .env.local file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('⚠️  Important:');
console.log('   - Never commit this hash to version control');
console.log('   - Store it securely in your environment variables');
console.log('   - The original password cannot be recovered from the hash\n');

