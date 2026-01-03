/**
 * Verification Script: Free Tier Features
 * Checks that all free tier features are properly implemented
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FeatureCheck {
  name: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
}

async function checkDatabaseTables(): Promise<FeatureCheck[]> {
  const checks: FeatureCheck[] = [];

  try {
    // Check SavedComparison table
    await prisma.savedComparison.findFirst({ take: 1 });
    checks.push({
      name: 'SavedComparison table',
      status: '✅',
      message: 'Table exists and is accessible',
    });
  } catch (error: any) {
    checks.push({
      name: 'SavedComparison table',
      status: '❌',
      message: `Error: ${error.message}`,
    });
  }

  try {
    // Check ComparisonHistory table
    await prisma.comparisonHistory.findFirst({ take: 1 });
    checks.push({
      name: 'ComparisonHistory table',
      status: '✅',
      message: 'Table exists and is accessible',
    });
  } catch (error: any) {
    checks.push({
      name: 'ComparisonHistory table',
      status: '❌',
      message: `Error: ${error.message}`,
    });
  }

  try {
    // Check User table
    await prisma.user.findFirst({ take: 1 });
    checks.push({
      name: 'User table',
      status: '✅',
      message: 'Table exists and is accessible',
    });
  } catch (error: any) {
    checks.push({
      name: 'User table',
      status: '❌',
      message: `Error: ${error.message}`,
    });
  }

  return checks;
}

async function checkFileExistence(): Promise<FeatureCheck[]> {
  const fs = require('fs');
  const path = require('path');
  const checks: FeatureCheck[] = [];

  const requiredFiles = [
    'components/SocialShareButtons.tsx',
    'components/SaveComparisonButton.tsx',
    'components/SimplePrediction.tsx',
    'components/ComparisonHistoryTracker.tsx',
    'components/DailyLimitStatus.tsx',
    'lib/saved-comparisons.ts',
    'lib/comparison-history.ts',
    'lib/daily-limit.ts',
    'lib/simple-prediction.ts',
    'app/api/comparisons/save/route.ts',
    'app/api/comparisons/saved/route.ts',
    'app/api/comparisons/history/route.ts',
    'app/api/comparisons/limit/route.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    checks.push({
      name: file,
      status: exists ? '✅' : '❌',
      message: exists ? 'File exists' : 'File missing',
    });
  }

  return checks;
}

async function checkPremiumGating(): Promise<FeatureCheck[]> {
  const checks: FeatureCheck[] = [];
  const fs = require('fs');
  const path = require('path');

  // Check if canAccessPremium is used in compare page
  const comparePagePath = path.join(process.cwd(), 'app/compare/[slug]/page.tsx');
  if (fs.existsSync(comparePagePath)) {
    const content = fs.readFileSync(comparePagePath, 'utf-8');
    const hasPremiumCheck = content.includes('canAccessPremium') || content.includes('hasPremiumAccess');
    checks.push({
      name: 'Premium gating in compare page',
      status: hasPremiumCheck ? '✅' : '❌',
      message: hasPremiumCheck ? 'Premium checks found' : 'No premium checks found',
    });

    // Check for SimplePrediction (free) vs TrendPrediction (premium)
    const hasSimplePrediction = content.includes('SimplePrediction');
    const hasTrendPrediction = content.includes('TrendPrediction');
    checks.push({
      name: 'Free vs Premium predictions',
      status: hasSimplePrediction && hasTrendPrediction ? '✅' : '⚠️',
      message: hasSimplePrediction && hasTrendPrediction 
        ? 'Both free and premium predictions implemented'
        : 'Missing prediction components',
    });
  }

  return checks;
}

async function main() {
  console.log('🔍 Verifying Free Tier Features...\n');

  const [dbChecks, fileChecks, gatingChecks] = await Promise.all([
    checkDatabaseTables(),
    checkFileExistence(),
    checkPremiumGating(),
  ]);

  const allChecks = [...dbChecks, ...fileChecks, ...gatingChecks];

  console.log('📊 Results:\n');
  allChecks.forEach((check) => {
    console.log(`${check.status} ${check.name}`);
    console.log(`   ${check.message}\n`);
  });

  const passed = allChecks.filter((c) => c.status === '✅').length;
  const failed = allChecks.filter((c) => c.status === '❌').length;
  const warnings = allChecks.filter((c) => c.status === '⚠️').length;

  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total: ${allChecks.length}`);

  if (failed > 0) {
    console.log('\n❌ Some checks failed. Please review the errors above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Some warnings found. Review the output above.');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed! Free tier features are properly implemented.');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

