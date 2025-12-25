# Fix Type Mismatch Error

## Problem
The error "incorrect binary data format in bind parameter 7" occurs because:
- Database columns are `DOUBLE PRECISION` (Float)
- Prisma schema had them as `Int?` (Integer)
- This causes a type mismatch when inserting data

## Solution Applied

### 1. Updated Prisma Schema
Changed these fields from `Int?` to `Float?`:
- `threshold: Float?`
- `baselineScoreA: Float?`
- `baselineScoreB: Float?`
- `changePercent: Float?`

### 2. Updated Code
Updated `lib/trend-alerts.ts` to ensure numbers are passed correctly:
- `baselineScoreA: Number(baselineScoreA)` (instead of `Math.round()`)
- `baselineScoreB: Number(baselineScoreB)`
- `changePercent: data.changePercent ? Number(data.changePercent) : 10`
- `threshold: data.threshold ? Number(data.threshold) : null`

## Next Steps

**IMPORTANT:** You must regenerate the Prisma client after this schema change:

```bash
npx prisma generate
```

Or if that doesn't work:

```bash
node node_modules\.bin\prisma generate
```

Or use the safe script:

```bash
node scripts/prisma-generate-safe.js
```

After regenerating, the error should be resolved and you'll be able to create alerts successfully.

