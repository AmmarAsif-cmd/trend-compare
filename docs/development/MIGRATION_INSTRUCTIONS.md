# Migration Instructions for Saved Comparisons & History

## Step 1: Run Database Migration

You need to run the SQL migration to create the new tables in your database.

### Option A: Using Prisma Migrate (Recommended)

```bash
npx prisma migrate dev --name add_saved_comparisons_and_history
```

### Option B: Manual SQL (If Prisma Migrate doesn't work)

Run the SQL file directly in your database:

```sql
-- File: prisma/migrations/add_saved_comparisons_and_history.sql
-- Copy and paste the entire contents into your database client (pgAdmin, DBeaver, psql, etc.)
```

**OR** use psql from command line:

```bash
psql -h your-host -U your-user -d your-database -f prisma/migrations/add_saved_comparisons_and_history.sql
```

## Step 2: Generate Prisma Client

After migration, generate the Prisma client:

```bash
npx prisma generate
```

## Step 3: Verify Schema

Check that the new models are in your schema:

```bash
npx prisma validate
```

## Step 4: Test the Features

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test Saved Comparisons:**
   - Log in to your account
   - Visit any comparison page (e.g., `/compare/iphone-vs-samsung`)
   - Click the "Save" button
   - Visit `/dashboard` to see your saved comparisons

3. **Test History Tracking:**
   - View different comparison pages
   - Visit `/dashboard` to see your viewing history

4. **Test Dashboard:**
   - Visit `/dashboard`
   - You should see:
     - Stats overview (saved count, recent views, most viewed)
     - List of saved comparisons
     - Recent viewing history

## Troubleshooting

### Error: "Table does not exist"
- Make sure you ran the migration SQL
- Check that the table names match exactly: `SavedComparison` and `ComparisonHistory` (case-sensitive)

### Error: "Foreign key constraint fails"
- Make sure the `User` table exists
- Verify the user ID exists in the User table

### Error: "Prisma Client not generated"
- Run `npx prisma generate`
- Restart your development server

### Build Errors
- Run `npx prisma generate` again
- Clear `.next` folder: `rm -rf .next` (or `rmdir /s /q .next` on Windows)
- Restart dev server

## Database Schema Changes

The migration adds two new tables:

1. **SavedComparison** - Stores user's saved comparisons
   - One entry per user per comparison (unique constraint)
   - Supports notes and tags for organization

2. **ComparisonHistory** - Tracks all comparison views
   - Multiple entries allowed (to track frequency)
   - Used for "Most Viewed" feature

Both tables have foreign key relationships to the `User` table with CASCADE delete (when a user is deleted, their saved comparisons and history are also deleted).
