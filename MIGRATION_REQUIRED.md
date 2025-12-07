# Database Migration Required

## Issue
The `references` column needs to be added to the `BlogPost` table in your database.

## Error You're Seeing
```
The column `BlogPost.references` does not exist in the current database.
```

## Quick Fix (Choose ONE method)

### Method 1: Using Prisma Migrate (Recommended)
```bash
npx prisma migrate deploy
```

This will apply all pending migrations, including the one that adds the `references` column.

### Method 2: Using Prisma DB Push
```bash
npx prisma db push
```

This syncs your database schema with your Prisma schema file without creating a migration.

### Method 3: Manual SQL (If Prisma commands fail)
Run this SQL directly in your PostgreSQL database:

```sql
ALTER TABLE "BlogPost" ADD COLUMN "references" JSONB;
```

**Using psql:**
```bash
psql $DATABASE_URL -c 'ALTER TABLE "BlogPost" ADD COLUMN "references" JSONB;'
```

**Or connect to your database and run:**
```bash
psql $DATABASE_URL
# Then in the psql prompt:
ALTER TABLE "BlogPost" ADD COLUMN "references" JSONB;
\q
```

### Method 4: Using the Migration Script
If you have the Prisma client generated, run:

```bash
node scripts/apply-references-migration.js
```

## After Running the Migration

1. **Restart your development server** if it's running:
   ```bash
   npm run dev
   ```

2. **Verify it worked** - you should no longer see the error

3. **Generate new blog posts** - they will now include references!

## What This Adds

The `references` field stores citations and sources for blog posts in JSON format:

```json
{
  "references": [
    {
      "title": "AI Trends 2024",
      "url": "https://www.gartner.com/ai-trends",
      "source": "Gartner",
      "accessDate": "2024-12-07",
      "type": "industry_report"
    }
  ]
}
```

## Why This Happened

The schema was updated to include references for blog post citations, but the database migration couldn't be applied automatically in the restricted build environment. This is normal and the migration needs to be run in your local or production environment where the database is accessible.

## Need Help?

If you're still having issues, check:
1. ✅ DATABASE_URL is set correctly in your `.env` file
2. ✅ PostgreSQL server is running
3. ✅ You have ALTER TABLE permissions on the database
4. ✅ Prisma client is generated (`npx prisma generate`)
