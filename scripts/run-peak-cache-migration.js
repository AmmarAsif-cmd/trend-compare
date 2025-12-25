/**
 * Run PeakExplanationCache Migration
 * 
 * This script runs the SQL migration to create the PeakExplanationCache table.
 * Use this if you can't run prisma migrate due to PowerShell execution policy issues.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const migrationSQL = `
-- Migration: Add PeakExplanationCache table
CREATE TABLE IF NOT EXISTS "PeakExplanationCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "peakDate" TIMESTAMP(3) NOT NULL,
    "peakValue" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "events" TEXT,
    "bestEvent" TEXT,
    "citations" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PeakExplanationCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeakExplanationCache_cacheKey_key" ON "PeakExplanationCache"("cacheKey");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_keyword_idx" ON "PeakExplanationCache"("keyword");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_peakDate_idx" ON "PeakExplanationCache"("peakDate");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_lastAccessed_idx" ON "PeakExplanationCache"("lastAccessed");
CREATE INDEX IF NOT EXISTS "PeakExplanationCache_status_idx" ON "PeakExplanationCache"("status");
`;

async function runMigration() {
  console.log('🚀 Running PeakExplanationCache migration...\n');

  try {
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      try {
        await prisma.$executeRawUnsafe(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✅ ${preview}...`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Already exists: ${statement.substring(0, 40)}...`);
        } else {
          console.error(`❌ Error: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node node_modules/@prisma/client/scripts/postinstall.js');
    console.log('   2. Or: Delete node_modules/.prisma and run npm install');
    console.log('   3. Verify: Check that PeakExplanationCache table exists in your database');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

