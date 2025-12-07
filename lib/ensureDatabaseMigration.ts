/**
 * Runtime database migration helper
 *
 * Ensures the AIInsightUsage table exists by attempting to create it
 * if it doesn't exist. This is a fallback in case build-time migration fails.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let migrationAttempted = false;
let migrationSucceeded = false;

/**
 * Ensure database migration has run
 * This will attempt to create the table if it doesn't exist
 */
export async function ensureDatabaseMigration(): Promise<boolean> {
  // Only attempt once per server instance
  if (migrationAttempted) {
    return migrationSucceeded;
  }

  migrationAttempted = true;

  try {
    console.log('[DB Migration] Checking if AIInsightUsage table exists...');

    // Try to count records - this will fail if table doesn't exist
    await prisma.aIInsightUsage.count();

    console.log('[DB Migration] ✅ Table exists');
    migrationSucceeded = true;
    return true;
  } catch (error) {
    console.error('[DB Migration] ❌ Table check failed:', error instanceof Error ? error.message : String(error));

    // If table doesn't exist, try to create it directly
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log('[DB Migration] 📝 Attempting to create table...');

      try {
        // Create table using raw SQL
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "AIInsightUsage" (
            "id" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "dailyCount" INTEGER NOT NULL DEFAULT 0,
            "monthlyCount" INTEGER NOT NULL DEFAULT 0,
            "month" TEXT NOT NULL,
            "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "AIInsightUsage_pkey" PRIMARY KEY ("id")
          );
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "AIInsightUsage_date_key" ON "AIInsightUsage"("date");
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "AIInsightUsage_month_key" ON "AIInsightUsage"("month");
        `);

        console.log('[DB Migration] ✅ Table created successfully');
        migrationSucceeded = true;
        return true;
      } catch (createError) {
        console.error('[DB Migration] ❌ Failed to create table:', createError instanceof Error ? createError.message : String(createError));
        migrationSucceeded = false;
        return false;
      }
    }

    migrationSucceeded = false;
    return false;
  }
}
