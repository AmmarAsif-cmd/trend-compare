/**
 * Script to check and fix premium user
 * This will verify if the user exists and create/update it with correct password
 * 
 * Usage: npx tsx scripts/check-and-fix-premium-user.ts
 */

import { hash, compare } from 'bcryptjs';
import { prisma } from '../lib/db';

async function main() {
  const email = 'premium@test.com';
  const password = 'premium123';
  const name = 'Premium Test User';

  console.log('🔍 Checking premium user...\n');

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: {
            status: 'active',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (existing) {
      console.log('✅ User found in database');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.name || 'Not set'}`);
      console.log(`   Subscription Tier: ${existing.subscriptionTier}`);
      console.log(`   Has Password: ${existing.password ? 'Yes' : 'No'}`);
      console.log(`   Active Subscriptions: ${existing.subscriptions.length}`);

      // Test password
      if (existing.password) {
        const passwordValid = await compare(password, existing.password);
        console.log(`   Password Valid: ${passwordValid ? '✅ Yes' : '❌ No'}`);
        
        if (!passwordValid) {
          console.log('\n⚠️  Password is incorrect. Updating password...');
          const hashedPassword = await hash(password, 12);
          await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
          });
          console.log('✅ Password updated!');
        }
      } else {
        console.log('\n⚠️  No password set. Setting password...');
        const hashedPassword = await hash(password, 12);
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword },
        });
        console.log('✅ Password set!');
      }

      // Ensure premium tier
      if (existing.subscriptionTier !== 'premium') {
        console.log('\n⚠️  User is not premium. Updating to premium...');
        await prisma.user.update({
          where: { email },
          data: { subscriptionTier: 'premium' },
        });
        console.log('✅ Updated to premium tier!');
      }

      // Ensure active premium subscription
      if (existing.subscriptions.length === 0 || existing.subscriptions[0].tier !== 'premium') {
        console.log('\n⚠️  No active premium subscription. Creating...');
        await prisma.subscription.create({
          data: {
            userId: existing.id,
            tier: 'premium',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
        console.log('✅ Premium subscription created!');
      }

      console.log('\n✅ Premium user is ready!');
    } else {
      console.log('❌ User not found. Creating new premium user...');
      
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
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          },
        },
      });

      console.log('✅ Premium user created!');
    }

    // Final verification
    console.log('\n🔍 Final Verification:');
    const finalUser = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: 'active' },
        },
      },
    });

    if (finalUser && finalUser.password) {
      const passwordValid = await compare(password, finalUser.password);
      console.log(`   User exists: ✅`);
      console.log(`   Password correct: ${passwordValid ? '✅' : '❌'}`);
      console.log(`   Premium tier: ${finalUser.subscriptionTier === 'premium' ? '✅' : '❌'}`);
      console.log(`   Active premium subscription: ${finalUser.subscriptions.some((s: any) => s.tier === 'premium') ? '✅' : '❌'}`);
      
      if (passwordValid && finalUser.subscriptionTier === 'premium') {
        console.log('\n✨ Login credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ You should now be able to log in!');
      } else {
        console.log('\n❌ Something is still wrong. Check the output above.');
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

