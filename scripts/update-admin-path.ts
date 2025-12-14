/**
 * Script to update admin path references
 * Run this after renaming the admin folder
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const OLD_ADMIN_PATH = '/admin';
const NEW_ADMIN_PATH = '/cp-9a4eef7'; // Update this to match your new folder name

const filesToUpdate = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'lib/**/*.ts',
  'app/robots.ts',
];

async function updateAdminPaths() {
  console.log('🔄 Updating admin path references...');
  console.log(`   Old path: ${OLD_ADMIN_PATH}`);
  console.log(`   New path: ${NEW_ADMIN_PATH}\n`);

  let updatedCount = 0;

  for (const pattern of filesToUpdate) {
    const files = await glob(pattern, { cwd: process.cwd() });
    
    for (const file of files) {
      const filePath = join(process.cwd(), file);
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // Update path references
      if (content.includes(OLD_ADMIN_PATH)) {
        content = content.replace(new RegExp(OLD_ADMIN_PATH.replace(/\//g, '\\/'), 'g'), NEW_ADMIN_PATH);
        modified = true;
      }

      // Update API path references
      const oldApiPath = `/api${OLD_ADMIN_PATH}`;
      const newApiPath = `/api${NEW_ADMIN_PATH}`;
      if (content.includes(oldApiPath)) {
        content = content.replace(new RegExp(oldApiPath.replace(/\//g, '\\/'), 'g'), newApiPath);
        modified = true;
      }

      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`   ✅ Updated: ${file}`);
        updatedCount++;
      }
    }
  }

  console.log(`\n✨ Updated ${updatedCount} files`);
  console.log('\n📝 Next steps:');
  console.log('   1. Rename app/admin folder to app/cp-9a4eef7');
  console.log('   2. Rename app/api/admin folder to app/api/cp-9a4eef7');
  console.log('   3. Update ADMIN_PATH in lib/admin-config.ts if needed');
  console.log('   4. Update .env.local with ADMIN_PATH variable');
}

updateAdminPaths().catch(console.error);

