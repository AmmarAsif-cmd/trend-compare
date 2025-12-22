# 🔧 Database Migration Instructions

**Migration:** Add `viewCount` field to Comparison table

---

## ⚠️ PowerShell Execution Policy Issue

Your system has PowerShell execution policy restrictions that prevent running npm/npx directly.

---

## ✅ Solution Options

### **Option 1: Run Migration Manually (Recommended)**

1. **Open your database client** (pgAdmin, DBeaver, or Neon dashboard)

2. **Run this SQL:**
   ```sql
   -- Add viewCount column to Comparison table
   ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

   -- Create index for sorting by popularity
   CREATE INDEX IF NOT EXISTS "Comparison_viewCount_idx" ON "Comparison"("viewCount");
   ```

3. **Verify it worked:**
   ```sql
   SELECT "viewCount" FROM "Comparison" LIMIT 1;
   ```

---

### **Option 2: Use Command Prompt (Not PowerShell)**

1. **Open Command Prompt** (cmd.exe, not PowerShell)

2. **Navigate to project:**
   ```cmd
   cd C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare
   ```

3. **Run migration:**
   ```cmd
   npx prisma migrate dev --name add_view_count
   ```

---

### **Option 3: Change PowerShell Execution Policy (One-Time)**

1. **Open PowerShell as Administrator**

2. **Run:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Then run:**
   ```powershell
   npx prisma migrate dev --name add_view_count
   ```

---

### **Option 4: Use Prisma Studio**

1. **Generate Prisma Client:**
   ```cmd
   node node_modules\prisma\build\index.js generate
   ```

2. **The migration will run automatically on next build** (if using `migrate-if-db-available.js`)

---

## 📋 What the Migration Does

1. **Adds `viewCount` column** to `Comparison` table
   - Type: INTEGER
   - Default: 0
   - Not null

2. **Creates index** on `viewCount`
   - Enables fast sorting by popularity
   - Improves query performance

---

## ✅ Verification

After migration, verify:

1. **Check schema:**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'Comparison' AND column_name = 'viewCount';
   ```

2. **Check index:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'Comparison' AND indexname LIKE '%viewCount%';
   ```

---

## 🚀 After Migration

Once migration is complete:

1. ✅ View counter will start tracking
2. ✅ Existing comparisons will have viewCount = 0
3. ✅ New views will increment the count
4. ✅ You can sort by popularity using viewCount

---

## 💡 Quick SQL (Copy & Paste)

```sql
-- Add viewCount column
ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Create index
CREATE INDEX IF NOT EXISTS "Comparison_viewCount_idx" ON "Comparison"("viewCount");
```

**That's it!** Just run these two SQL commands in your database client.

