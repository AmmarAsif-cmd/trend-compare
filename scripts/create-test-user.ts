/**
 * Create Test User Script
 * 
 * This script creates a test user account for development/testing purposes.
 * 
 * Usage:
 *   tsx scripts/create-test-user.ts
 * 
 * Or with custom credentials:
 *   tsx scripts/create-test-user.ts test@example.com testpassword123 "Test User"
 */

import { hash } from 'bcryptjs';
import { prisma } from '../lib/db';

const DEFAULT_EMAIL = 'test@trendarc.net';
const DEFAULT_PASSWORD = 'test123456';
const DEFAULT_NAME = 'Test User';

async function createTestUser() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;
  const name = process.argv[4] || DEFAULT_NAME;

  try {
    console.log('🔄 Creating test user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Password: ${password}`);
    console.log('');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists with this email!');
      console.log('');
      console.log('✅ You can login with these credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log('💡 To create a different user, run:');
      console.log(`   tsx scripts/create-test-user.ts your-email@example.com yourpassword "Your Name"`);
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscriptionTier: 'free',
        subscriptions: {
          create: {
            tier: 'free',
            status: 'active',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Tier: ${user.subscriptionTier}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 Next Steps:');
    console.log('   1. Visit http://localhost:3000/login');
    console.log('   2. Use the credentials above to sign in');
    console.log('   3. Visit http://localhost:3000/dashboard to see your dashboard');
    console.log('   4. Visit any comparison page and click "Save" to test saved comparisons');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error creating test user:', error.message);
    if (error.code === 'P2002') {
      console.error('   User with this email already exists!');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();


