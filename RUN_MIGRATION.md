# 🚀 Run Migration - Quick Guide

**Migration:** Add `viewCount` field to Comparison table

---

## ✅ **EASIEST: Run SQL Directly**

### **Step 1: Open Your Database Client**
- Neon Dashboard: https://console.neon.tech
- Or pgAdmin, DBeaver, or any PostgreSQL client

### **Step 2: Run This SQL:**

```sql
-- Add viewCount column to Comparison table
ALTER TABLE "Comparison" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Create index for sorting by popularity
CREATE INDEX IF NOT EXISTS "Comparison_viewCount_idx" ON "Comparison"("viewCount");
```

### **Step 3: Verify (Optional):**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Comparison' AND column_name = 'viewCount';
```

**That's it!** ✅

---

## 🔄 **Alternative: Use Command Prompt**

1. **Open Command Prompt** (cmd.exe, NOT PowerShell)
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to project:**
   ```cmd
   cd C:\Users\User\Desktop\Project\trned-compare-cursor\trend-compare
   ```

3. **Run migration:**
   ```cmd
   npx prisma migrate dev --name add_view_count
   ```

---

## 📋 **What This Migration Does:**

1. ✅ Adds `viewCount` column (INTEGER, default 0)
2. ✅ Creates index for fast sorting by popularity
3. ✅ All existing comparisons get viewCount = 0
4. ✅ New views will start tracking automatically

---

## ✅ **After Migration:**

- View counter will work immediately
- Existing comparisons: viewCount = 0
- New page views: will increment automatically
- Can sort by popularity using viewCount

---

**Recommended:** Just run the SQL directly in your database client - it's the fastest way! 🚀

