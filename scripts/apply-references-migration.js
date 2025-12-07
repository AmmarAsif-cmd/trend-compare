/**
 * Apply References Field Migration
 *
 * This script manually applies the migration to add the references field
 * to the BlogPost table. Use this when Prisma migration tools are unavailable.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔧 Applying migration: Add references field to BlogPost table...\n');

    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'BlogPost' AND column_name = 'references'
    `;

    if (result.length > 0) {
      console.log('✅ Column "references" already exists. No migration needed.\n');
      return;
    }

    // Apply migration
    await prisma.$executeRaw`
      ALTER TABLE "BlogPost" ADD COLUMN "references" JSONB
    `;

    console.log('✅ Migration applied successfully!\n');
    console.log('📊 The "references" column has been added to the BlogPost table.');
    console.log('   Type: JSONB (PostgreSQL JSON column)');
    console.log('   Nullable: Yes');
    console.log('\n🎉 Database schema is now up to date!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease ensure:');
    console.error('  1. DATABASE_URL is set correctly');
    console.error('  2. PostgreSQL server is running');
    console.error('  3. You have ALTER TABLE permissions\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
