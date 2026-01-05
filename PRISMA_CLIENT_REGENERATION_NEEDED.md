# Prisma Client Regeneration Required

## Issue
The Prisma client hasn't been regenerated after adding the `featured` and `linkedComparisonSlugs` fields to the BlogPost model.

## Error
```
Unknown argument `featured`. Available options are marked with ?.
```

## Solution

### Option 1: Restart Dev Server (Recommended)
The Prisma client will auto-regenerate when you restart:

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### Option 2: Manual Regeneration
If restarting doesn't work:

```bash
# Stop the dev server first
# Then run:
npx prisma generate
# Then restart:
npm run dev
```

## Temporary Fix Applied
I've added error handling in `lib/blog/related-blogs.ts` to gracefully fall back when the fields don't exist yet:

- `getFeaturedBlogs()`: Falls back to engagement-based selection if `featured` field isn't available
- `getRelatedBlogsForComparison()`: Falls back to `comparisonSlug` only if `linkedComparisonSlugs` isn't available

The code will work without errors, but full functionality requires Prisma client regeneration.

## After Regeneration
Once the Prisma client is regenerated:
- ✅ `featured` field will be available for homepage curation
- ✅ `linkedComparisonSlugs` array will be available for explicit linking
- ✅ All blog features will work at full capacity

## Verification
After restarting, check:
1. Homepage loads without errors
2. Blog sections appear correctly
3. No Prisma validation errors in console

