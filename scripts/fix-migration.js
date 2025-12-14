require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('Checking migration status...');
    
    // Check if the failed migration exists
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20251213002426_add_keyword_category_and_comparison_category'
      ORDER BY started_at DESC
      LIMIT 1
    `;
    
    if (migrations && migrations.length > 0) {
      const migration = migrations[0];
      console.log('Found migration:', migration);
      console.log('Status:', migration.finished_at ? 'Finished' : 'Failed');
      
      if (!migration.finished_at) {
        console.log('Marking migration as rolled back...');
        // Mark as rolled back
        await prisma.$executeRaw`
          UPDATE _prisma_migrations 
          SET finished_at = NOW(),
              applied_steps_count = 0,
              logs = 'Manually resolved - marked as rolled back'
          WHERE migration_name = '20251213002426_add_keyword_category_and_comparison_category'
            AND finished_at IS NULL
        `;
        console.log('✅ Migration marked as rolled back');
      } else {
        console.log('✅ Migration already resolved');
      }
    } else {
      console.log('Migration not found in database');
    }
    
    // Check current migration status
    console.log('\nChecking all migrations...');
    const allMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT 10
    `;
    
    console.log('\nRecent migrations:');
    allMigrations.forEach(m => {
      console.log(`- ${m.migration_name}: ${m.finished_at ? '✅ Applied' : '❌ Failed'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();

