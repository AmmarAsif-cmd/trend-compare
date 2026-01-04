/**
 * Verify Premium User Password
 * This script checks if the password hash in the database is correct
 */

import { compare, hash } from 'bcryptjs';
import { prisma } from '../lib/db';

async function main() {
  const email = 'premium@test.com';
  const password = 'premium123';

  console.log('🔍 Verifying premium user password...\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('\n💡 Run the SQL fix script to create the user.');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Subscription Tier: ${user.subscriptionTier}`);
    console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);

    if (!user.password) {
      console.log('\n❌ User has no password!');
      console.log('\n💡 Fixing password...');
      const hashedPassword = await hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log('✅ Password set!');
      console.log(`   New hash: ${hashedPassword.substring(0, 20)}...`);
      process.exit(0);
    }

    console.log(`\n📋 Password Hash Info:`);
    console.log(`   Length: ${user.password.length}`);
    console.log(`   Format: ${user.password.substring(0, 7)}`);
    console.log(`   First 30 chars: ${user.password.substring(0, 30)}...`);

    // Test password
    console.log(`\n🔐 Testing password: "${password}"`);
    const isValid = await compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n✨ The user should be able to log in.');
      console.log('   If login still fails, check:');
      console.log('   1. Server logs for authentication errors');
      console.log('   2. AUTH_SECRET is set in .env');
      console.log('   3. Database connection is working');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n💡 Fixing password...');
      
      // Generate new hash
      const newHash = await hash(password, 12);
      console.log(`   New hash: ${newHash.substring(0, 30)}...`);
      
      // Update password
      await prisma.user.update({
        where: { email },
        data: { password: newHash },
      });
      
      console.log('✅ Password updated!');
      
      // Verify again
      const verifyAgain = await compare(password, newHash);
      if (verifyAgain) {
        console.log('✅ Verification: Password is now correct!');
      } else {
        console.log('❌ Verification failed - something is wrong');
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error);
    console.error('Details:', {
      message: error?.message,
      code: error?.code,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

