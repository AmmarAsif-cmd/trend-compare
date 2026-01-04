# Manual Migration Instructions

## Problem
PowerShell execution policy is blocking npm/npx commands. We'll run the migration manually.

## Solution: Run SQL Directly

### Option 1: Using Your Database Client (Recommended)

1. **Open your database client** (pgAdmin, DBeaver, TablePlus, etc.)
2. **Connect to your database** using the connection string from your `.env` file
3. **Open a SQL query window**
4. **Copy and paste** the contents of `prisma/migrations/add_peak_explanation_cache.sql`
5. **Execute the SQL**

### Option 2: Using psql (Command Line)

If you have `psql` installed:

```bash
psql "your-database-connection-string" -f prisma/migrations/add_peak_explanation_cache.sql
```

Replace `your-database-connection-string` with your actual DATABASE_URL from `.env`

### Option 3: Using Node.js Script

Create a temporary script to run the migration:

```javascript
// run-migration.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'prisma/migrations/add_peak_explanation_cache.sql'),
    'utf8'
  );
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✓ Executed:', statement.substring(0, 50) + '...');
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  }
  
  await prisma.$disconnect();
  console.log('Migration complete!');
}

runMigration();
```

Then run:
```bash
node run-migration.js
```

---

## After Running Migration

### Step 1: Generate Prisma Client

You'll need to generate the Prisma client. Try one of these:

**Option A: Temporarily allow scripts**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npx prisma generate
```

**Option B: Use node directly**
```bash
node node_modules/@prisma/client/scripts/postinstall.js
```

**Option C: Manual generation** (if above don't work)
The Prisma client should auto-generate on next build, but you can also:
1. Delete `node_modules/.prisma` folder
2. Run `npm install` (which runs postinstall script)

### Step 2: Verify Migration

Check that the table was created:

```sql
SELECT * FROM "PeakExplanationCache" LIMIT 1;
```

Or check table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'PeakExplanationCache';
```

---

## What This Migration Does

✅ Creates `PeakExplanationCache` table with:
- Cache key (unique identifier)
- Peak data (keyword, date, value)
- Explanation data (explanation, confidence, events, citations)
- Metadata (createdAt, lastAccessed, accessCount)
- All necessary indexes for performance

✅ This enables the peak explanation caching system to:
- Store explanations permanently
- Reduce API costs by 95%+ after warmup
- Provide fast retrieval of cached explanations

---

## Troubleshooting

### Error: "Table already exists"
The table might already exist. Check with:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'PeakExplanationCache';
```

If it exists but has wrong structure, you can drop and recreate:
```sql
DROP TABLE IF EXISTS "PeakExplanationCache" CASCADE;
```
Then run the migration again.

### Error: "Permission denied"
Make sure your database user has CREATE TABLE permissions.

### Error: "Connection refused"
Check your DATABASE_URL in `.env` file is correct.

---

## Next Steps

Once the migration is complete:
1. ✅ The `PeakExplanationCache` table will be ready
2. ✅ The caching system will automatically start working
3. ✅ Peak explanations will be cached and reused
4. ✅ API costs will drop significantly after warmup period

