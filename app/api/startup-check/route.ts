/**
 * Startup diagnostic endpoint
 * Call this on first request to log system status
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let startupCheckComplete = false;

export async function GET() {
  if (startupCheckComplete) {
    return NextResponse.json({ message: 'Startup check already completed' });
  }

  console.log('='.repeat(80));
  console.log('🚀 Application Startup Diagnostics');
  console.log('='.repeat(80));

  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  AUTH_SECRET: ${process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Auth Secret Available: ${(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) ? '✅ Yes' : '❌ No'}`);

  // Check Prisma
  console.log('\n🗄️  Database Status:');
  try {
    if (!prisma) {
      console.log('  Prisma Client: ❌ NOT INITIALIZED');
      console.log('  Database Connection: ❌ Unavailable');
      console.log('  KeywordCategory Table: ❌ Unknown (Prisma not initialized)');
    } else {
      console.log('  Prisma Client: ✅ Initialized');

      // Test connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('  Database Connection: ✅ Connected');

        // Check KeywordCategory table
        try {
          const result: any = await prisma.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'KeywordCategory'
            ) as exists
          `;

          if (result[0]?.exists) {
            console.log('  KeywordCategory Table: ✅ Exists');

            // Count rows
            const count: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "KeywordCategory"`;
            console.log(`  KeywordCategory Rows: ${count[0]?.count || 0}`);
          } else {
            console.log('  KeywordCategory Table: ❌ MISSING');
            console.log('  ⚠️  CRITICAL: Run "npx prisma migrate deploy" to create the table');
          }
        } catch (error: any) {
          console.log(`  KeywordCategory Table: ❌ Error checking - ${error.message}`);
        }

        // List all tables
        const tables: any = await prisma.$queryRaw`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `;
        console.log(`  Total Tables: ${tables.length}`);
        console.log(`  Tables: ${tables.map((t: any) => t.table_name).join(', ')}`);
      } catch (error: any) {
        console.log(`  Database Connection: ❌ Failed - ${error.message}`);
      }
    }
  } catch (error: any) {
    console.log(`  Database Check: ❌ Error - ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Startup Diagnostics Complete');
  console.log('='.repeat(80));

  startupCheckComplete = true;

  return NextResponse.json({
    success: true,
    message: 'Startup diagnostics logged to console',
  });
}
