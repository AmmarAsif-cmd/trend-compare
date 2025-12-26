/**
 * Runtime migration checker
 * Ensures the database schema is up to date at runtime
 */

import { prisma } from './db';

let migrationsChecked = false;
let migrationsValid = false;

/**
 * Check if KeywordCategory table exists in the database
 * This is the table we added most recently that's causing issues
 */
export async function ensureMigrations(): Promise<boolean> {
  // Only check once per deployment
  if (migrationsChecked) {
    return migrationsValid;
  }

  try {
    console.log('[Migrations] Checking if database schema is current...');

    // Try to query the KeywordCategory table
    // If it doesn't exist, this will throw an error
    await prisma.$queryRaw`SELECT 1 FROM "KeywordCategory" LIMIT 1`;

    console.log('[Migrations] ✅ Database schema is current - KeywordCategory table exists');
    migrationsValid = true;
  } catch (error: any) {
    console.error('[Migrations] ❌ Database schema check failed:', error.message);

    // Check if it's a "table doesn't exist" error
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('[Migrations] ❌ CRITICAL: KeywordCategory table does not exist!');
      console.error('[Migrations] Run "npx prisma migrate deploy" to apply pending migrations');
      migrationsValid = false;
    } else if (error.message?.includes('Prisma client is not initialized')) {
      console.error('[Migrations] ❌ CRITICAL: Prisma client not initialized!');
      migrationsValid = false;
    } else {
      // Unknown error - assume migrations might be OK but something else is wrong
      console.error('[Migrations] ⚠️  Unknown error during migration check, proceeding anyway');
      migrationsValid = true;
    }
  }

  migrationsChecked = true;
  return migrationsValid;
}

/**
 * Get migration status without throwing
 */
export function areMigrationsValid(): boolean {
  return migrationsValid;
}
