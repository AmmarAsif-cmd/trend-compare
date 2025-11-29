#!/usr/bin/env node
/**
 * Run Prisma migration only if DATABASE_URL is available
 * This prevents build failures when database isn't accessible during build time
 */

const { execSync } = require('child_process');

if (process.env.DATABASE_URL) {
  console.log('📊 DATABASE_URL found - running migration...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    // Don't fail the build - migration can be run manually if needed
    console.log('⚠️  Continuing build anyway...');
  }
} else {
  console.log('⚠️  DATABASE_URL not set - skipping migration');
  console.log('💡 Migration will be attempted at runtime or can be run manually');
}
