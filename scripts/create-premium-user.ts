/**
 * Script to create a premium test user
 * 
 * Usage: npx tsx scripts/create-premium-user.ts
 * Or: node --loader ts-node/esm scripts/create-premium-user.ts
 */

import { hash } from 'bcryptjs';
import { prisma } from '../lib/db';

async function main() {
  const email = 'premium@test.com';
  const password = 'premium123';
  const name = 'Premium Test User';

  console.log('🔐 Creating premium test user...\n');

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  User already exists. Updating to premium...');
      
      // Update to premium
      const hashedPassword = await hash(password, 12);
      
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name,
          subscriptionTier: 'premium',
        },
      });

      // Ensure active premium subscription exists
      const existingSub = await prisma.subscription.findFirst({
        where: {
          userId: existing.id,
          tier: 'premium',
          status: 'active',
        },
      });

      if (!existingSub) {
        await prisma.subscription.create({
          data: {
            userId: existing.id,
            tier: 'premium',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });
        console.log('✅ Created active premium subscription');
      } else {
        console.log('✅ Premium subscription already exists');
      }

      console.log('\n✅ User updated to premium!');
    } else {
      // Create new premium user
      const hashedPassword = await hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          subscriptionTier: 'premium',
          subscriptions: {
            create: {
              tier: 'premium',
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          },
        },
      });

      console.log('✅ Premium user created!');
    }

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ You can now log in and test premium features!');
    console.log('   Premium features include:');
    console.log('   • PDF downloads');
    console.log('   • CSV/JSON data export');
    console.log('   • Rich AI insights');
    console.log('   • All timeframes (5y, all-time)');
    console.log('   • Email alerts');
    console.log('   • Ad-free experience');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error creating premium user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

