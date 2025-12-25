/**
 * Authentication Setup Diagnostic Script
 * 
 * Checks all requirements for authentication to work
 * 
 * Usage:
 *   npx tsx scripts/check-auth-setup.ts
 *   OR (if PowerShell blocks): Use Command Prompt instead
 *   OR: See MANUAL_AUTH_CHECK.md for manual steps
 */

import { prisma } from '../lib/db';

console.log('🔍 Checking Authentication Setup...\n');

let allGood = true;

// 1. Check AUTH_SECRET
console.log('1️⃣  Checking AUTH_SECRET...');
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  console.log('   ❌ AUTH_SECRET is not set!');
  console.log('   💡 Add to .env.local: AUTH_SECRET=your-secret');
  console.log('   💡 Generate secret: tsx scripts/generate-auth-secret.ts\n');
  allGood = false;
} else {
  console.log('   ✅ AUTH_SECRET is set\n');
}

// 2. Check AUTH_URL
console.log('2️⃣  Checking AUTH_URL...');
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
if (!authUrl) {
  console.log('   ⚠️  AUTH_URL is not set (optional for local dev)');
  console.log('   💡 Add to .env.local: AUTH_URL=http://localhost:3000\n');
} else {
  console.log(`   ✅ AUTH_URL is set: ${authUrl}\n`);
}

// 3. Check DATABASE_URL
console.log('3️⃣  Checking DATABASE_URL...');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('   ❌ DATABASE_URL is not set!');
  console.log('   💡 Add to .env.local: DATABASE_URL=postgresql://...\n');
  allGood = false;
} else {
  // Hide password in output
  const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`   ✅ DATABASE_URL is set: ${safeUrl}\n`);
}

// 4. Check Prisma Client
console.log('4️⃣  Checking Prisma Client...');
try {
  // Try to use prisma
  await prisma.$connect();
  console.log('   ✅ Prisma Client is initialized\n');
  
  // 5. Check User table exists
  console.log('5️⃣  Checking User table...');
  try {
    const userCount = await prisma.user.count();
    console.log(`   ✅ User table exists (${userCount} users)\n`);
    
    // 6. Check Subscription table exists
    console.log('6️⃣  Checking Subscription table...');
    try {
      const subCount = await prisma.subscription.count();
      console.log(`   ✅ Subscription table exists (${subCount} subscriptions)\n`);
    } catch (error: any) {
      console.log('   ❌ Subscription table does not exist!');
      console.log('   💡 Run migration: prisma/migrations/manual_add_user_subscription.sql\n');
      allGood = false;
    }
    
    // 7. Check SavedComparison table (if migration run)
    console.log('7️⃣  Checking SavedComparison table...');
    try {
      const savedCount = await (prisma as any).savedComparison?.count() || 0;
      console.log(`   ✅ SavedComparison table exists (${savedCount} saved)\n`);
    } catch (error: any) {
      console.log('   ⚠️  SavedComparison table does not exist (optional)');
      console.log('   💡 Run migration: prisma/migrations/add_saved_comparisons_and_history.sql\n');
    }
    
  } catch (error: any) {
    console.log('   ❌ User table does not exist!');
    console.log('   💡 Run migration: prisma/migrations/manual_add_user_subscription.sql\n');
    allGood = false;
  }
  
  await prisma.$disconnect();
} catch (error: any) {
  console.log('   ❌ Prisma Client error:', error.message);
  console.log('   💡 Run: npx prisma generate\n');
  allGood = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All checks passed! Authentication should work.');
  console.log('\n📋 Next steps:');
  console.log('   1. Create test user: tsx scripts/create-test-user.ts');
  console.log('   2. Visit: http://localhost:3000/login');
  console.log('   3. Use test credentials to login');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\n📋 Quick fixes:');
  console.log('   1. Add AUTH_SECRET to .env.local');
  console.log('   2. Run database migrations');
  console.log('   3. Run: npx prisma generate');
  console.log('   4. Restart development server');
}
console.log('='.repeat(50) + '\n');

