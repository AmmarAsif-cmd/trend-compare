// Run manual migration for User and Subscription tables
// Usage: node scripts/run-manual-migration.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running manual migration for User and Subscription tables...');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

try {
  // Read the migration SQL file
  const sqlPath = path.join(__dirname, '../prisma/migrations/manual_add_user_subscription.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📊 Executing migration SQL...');

  // Use Prisma's db execute command
  execSync(`npx prisma db execute --file "${sqlPath}" --schema prisma/schema.prisma`, {
    stdio: 'inherit',
    env: process.env,
  });

  console.log('✅ Migration completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run "npx prisma generate" to update Prisma Client');
  console.log('2. Deploy your app to Vercel');
  console.log('3. Add Stripe environment variables to Vercel');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('');
  console.error('Alternative: Run the SQL manually in your database console:');
  console.error('1. Open your database admin panel (e.g., Neon, Supabase, etc.)');
  console.error('2. Copy the SQL from: prisma/migrations/manual_add_user_subscription.sql');
  console.error('3. Execute it in the SQL editor');
  process.exit(1);
}
