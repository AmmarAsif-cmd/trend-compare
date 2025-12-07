#!/usr/bin/env tsx
/**
 * Database Migration Status Checker
 *
 * This script checks if the AIInsightUsage table exists and is properly configured.
 * Run this after deployment to verify the migration was successful.
 *
 * Usage:
 *   npx tsx scripts/check-db-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log('🔍 Checking database migration status...\n');

  try {
    // Check if AIInsightUsage table exists by trying to query it
    const count = await prisma.aIInsightUsage.count();
    console.log('✅ AIInsightUsage table exists!');
    console.log(`   Current records: ${count}\n`);

    // Try to create a test record (if none exist)
    if (count === 0) {
      console.log('📝 Creating initial record for today...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const record = await prisma.aIInsightUsage.create({
        data: {
          date: today,
          month,
          dailyCount: 0,
          monthlyCount: 0,
        },
      });

      console.log('✅ Initial record created!');
      console.log(`   Record ID: ${record.id}`);
      console.log(`   Date: ${record.date.toISOString().split('T')[0]}`);
      console.log(`   Month: ${record.month}\n`);
    }

    // Fetch and display current usage
    const allRecords = await prisma.aIInsightUsage.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    });

    if (allRecords.length > 0) {
      console.log('📊 Recent usage records:');
      allRecords.forEach((record: any) => {
        console.log(`   ${record.date.toISOString().split('T')[0]}: ${record.dailyCount} insights (${record.month})`);
      });
      console.log();
    }

    console.log('✅ Database migration successful!');
    console.log('✅ AI insights are ready to use!');
    console.log('\n💡 Budget limits:');
    console.log('   Daily: 200 insights/day');
    console.log('   Monthly: 6000 insights/month');
    console.log('   Estimated cost: <$10/month\n');
  } catch (error) {
    console.error('❌ Migration check failed!');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    console.log('\n🔧 To fix this, run:');
    console.log('   npx prisma migrate deploy\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
