#!/usr/bin/env node
/**
 * Safe Prisma Client Generation
 * Attempts to generate Prisma client but doesn't fail if engines can't be downloaded
 * This allows builds to continue in environments with network restrictions
 */

const { execSync } = require('child_process');

console.log('🔧 Attempting Prisma client generation...');

try {
  // Try with checksum ignore in case of network issues
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
    }
  });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.warn('⚠️  Prisma client generation failed:', error.message);
  console.warn('⚠️  This may cause runtime errors if database features are used');
  console.warn('💡 The build will continue, but you may need to run "npx prisma generate" manually');
  // Don't exit with error code - allow build to continue
  process.exit(0);
}
