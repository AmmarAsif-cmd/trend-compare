/**
 * Verify PeakExplanationCache Table Exists
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'PeakExplanationCache'
    `;
    
    if (result && result.length > 0) {
      console.log('✅ PeakExplanationCache table exists!');
      
      // Try to count rows
      try {
        const count = await prisma.peakExplanationCache.count();
        console.log(`   Current cache entries: ${count}`);
      } catch (e) {
        console.log('   ⚠️  Table exists but Prisma client may need regeneration');
        console.log('   Run: node node_modules/@prisma/client/scripts/postinstall.js');
      }
    } else {
      console.log('❌ PeakExplanationCache table does NOT exist');
      console.log('   Run: node scripts/run-peak-cache-migration.js');
    }
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    console.error('   Make sure your DATABASE_URL is set correctly in .env');
  } finally {
    await prisma.$disconnect();
  }
}

verify();

