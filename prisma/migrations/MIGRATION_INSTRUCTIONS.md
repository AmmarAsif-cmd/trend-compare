# Database Migration Instructions

## Category Field Migration

The AI insights feature has been updated to detect and store keyword categories (Technology, Entertainment, etc.). The schema has been updated in `prisma/schema.prisma` with the category field and index.

### Before Running Migration

**IMPORTANT**: First regenerate the Prisma client to sync with the updated schema:

```bash
npx prisma generate
```

### Option 1: Using Prisma CLI (Recommended)

When you have database access, run:

```bash
npx prisma db push
# OR
npx prisma migrate dev --name add_category_field
```

### Option 2: Manual SQL Migration

Run this SQL directly on your PostgreSQL database:

```sql
-- Add category column to Comparison table
ALTER TABLE "Comparison"
ADD COLUMN "category" TEXT;

-- Add index on category for efficient filtering
CREATE INDEX "Comparison_category_idx" ON "Comparison"("category");

-- Add comment
COMMENT ON COLUMN "Comparison"."category" IS 'AI-detected category (e.g., "Technology", "Entertainment")';
```

### Verify Migration

After applying the migration, verify it worked:

```bash
npx prisma studio
# Check that the Comparison table has a "category" column
```

### Rollback (if needed)

To remove the category field:

```sql
ALTER TABLE "Comparison" DROP COLUMN "category";
```

---

**Note**: The category field is optional and the app will work without it. However, having it enables:
- Faster category display (no need to regenerate from AI)
- Category-based filtering/sorting (future feature)
- Reduced AI API costs (category cached in DB)
