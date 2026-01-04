/**
 * Script to run the SavedComparison and ComparisonHistory migration
 * Run with: node scripts/run-saved-comparisons-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('📦 Reading migration SQL file...');
    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'add_saved_comparisons_and_history.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('🚀 Executing migration...');
    
    // Split SQL into statements, handling DO blocks
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    for (const line of sql.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('--') || trimmed === '') continue;
      
      currentStatement += line + '\n';
      
      if (trimmed.startsWith('DO $$')) {
        inDoBlock = true;
      }
      
      if (inDoBlock && trimmed.endsWith('$$;')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inDoBlock = false;
      } else if (!inDoBlock && trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        await prisma.$executeRawUnsafe(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✅ [${i + 1}/${statements.length}] Executed: ${preview}...`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07' ||
            error.meta?.code === '42P07') {
          const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`⚠️  [${i + 1}/${statements.length}] Skipped (exists): ${preview}...`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 200));
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

