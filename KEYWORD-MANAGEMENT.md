## 🎯 Keyword Quality Management System

Complete system for managing, validating, and curating keyword pairs with quality scoring.

---

## 📊 Quality Scoring System

Every keyword pair gets a **0-100 quality score** based on:

### Score Breakdown (25 points each)

1. **Validity (0-25)** - Security & format checks
   - Passes validation filters (no spam, SQL injection, XSS)
   - No test/demo patterns
   - Proper length and format

2. **Searchability (0-25)** - Likely to be searched?
   - Contains branded terms (iPhone, Tesla, Netflix)
   - Proper length (3-30 characters)
   - Has capitalization (indicates real names)
   - Word count (1-4 words ideal)

3. **Competitiveness (0-25)** - Are terms comparable?
   - Terms are different (not identical)
   - Similar length ratio
   - Same type/category

4. **Clarity (0-25)** - Clear and specific?
   - No vague words ("best", "thing", "stuff")
   - Has numbers/versions (iPhone 15 vs Samsung S24)
   - Specific names, not generic terms

### Quality Labels

| Score Range | Label | Auto-Approve? | Recommendation |
|-------------|-------|---------------|----------------|
| 80-100 | Excellent | ✅ Yes | Perfect for seeding |
| 70-79 | Good | ✅ Yes | Safe to use |
| 60-69 | Fair | ⚠️ Review | Manual approval needed |
| 40-59 | Poor | ❌ No | Consider improving |
| 0-39 | Very Poor | ❌ No | Not recommended |

---

## 🛠️ Admin Interface

### Access

Visit: `https://your-domain.com/admin/keywords`

**Features:**
- ✅ Add new keyword pairs with live quality checking
- ✅ Edit existing keywords
- ✅ Delete keywords
- ✅ Approve/reject pending keywords
- ✅ Filter by category and status
- ✅ View quality scores and breakdown
- ✅ See usage statistics

### Adding a New Keyword Pair

1. Click "Add Keyword Pair"
2. Enter Term A and Term B
3. Select category
4. Click "Check Quality" to see score
5. Review quality breakdown and issues
6. Add notes or tags (optional)
7. Click "Add Keyword"

**Auto-Approval:**
- Keywords with score ≥ 70 are automatically approved
- Keywords with score < 70 need manual approval

### Quality Check Example

```
Term A: iPhone 15
Term B: Samsung S24
Category: products

Quality Score: 87/100 (Excellent)

Breakdown:
  Validity: 25/25 ✅
  Searchability: 23/25 ✅
  Competitiveness: 20/25 ✅
  Clarity: 19/25 ✅

Issues: None

Recommendations:
  ✨ Excellent quality - highly recommended!
```

---

## 📥 Importing Keywords

### Option 1: Import from Existing Comparisons

Extract high-quality keywords from your database:

```bash
# Import 100 keywords with quality score ≥ 60
npm run keywords:import

# Import only excellent keywords (score ≥ 80)
npx tsx scripts/import-keywords.ts --min-quality 80 --limit 200

# Preview without saving
npx tsx scripts/import-keywords.ts --dry-run

# Import tech keywords only
npx tsx scripts/import-keywords.ts --category tech --limit 50
```

**What it does:**
1. Analyzes existing comparisons in your database
2. Calculates quality score for each pair
3. Filters by minimum quality threshold
4. Removes duplicates
5. Imports to KeywordPair table

### Option 2: Import from seed-keywords.json

Import the curated keyword database:

```bash
# Import all keywords from seed file
npm run keywords:import-seed

# Import only music keywords
npx tsx scripts/import-seed-keywords.ts --category music

# Import only high-quality keywords (score ≥ 70)
npx tsx scripts/import-seed-keywords.ts --min-quality 70

# Preview what would be imported
npx tsx scripts/import-seed-keywords.ts --dry-run
```

**What's included:**
- 340+ curated keyword pairs
- 9 categories (music, movies, games, tech, products, people, brands, places, general)
- Pre-validated for quality

---

## 🎯 Keyword Database Schema

```prisma
model KeywordPair {
  id              String   @id @default(cuid())
  termA           String   // First term (e.g., "iPhone 15")
  termB           String   // Second term (e.g., "Samsung S24")
  category        String   // Category (music, movies, games, etc.)

  // Quality metrics
  qualityScore    Int      // 0-100 overall quality score
  searchVolume    String?  // high, medium, low, unknown

  // Status and approval
  status          String   // pending, approved, rejected, archived
  approvedBy      String?  // Who approved it
  approvedAt      DateTime?

  // Source tracking
  source          String   // manual, imported, suggested, ai_generated
  importedFrom    String?  // Where it came from

  // Usage tracking
  timesUsed       Int      // How many times seeded
  lastUsedAt      DateTime?

  // Notes and tags
  notes           String?  // Admin notes
  tags            String[] // Custom tags

  createdAt       DateTime
  updatedAt       DateTime

  @@unique([termA, termB]) // Prevent duplicates
}
```

---

## 🔍 Quality Checking Before Adding

### Via Admin UI

1. Visit `/admin/keywords`
2. Click "Add Keyword Pair"
3. Enter terms
4. Click "Check Quality" button
5. Review:
   - Overall score (0-100)
   - Breakdown by category
   - Issues detected
   - Improvement suggestions

### Via API

```bash
POST /api/admin/keywords/check-quality
Content-Type: application/json

{
  "termA": "ChatGPT",
  "termB": "Gemini"
}

Response:
{
  "quality": {
    "overall": 85,
    "breakdown": {
      "validity": 25,
      "searchability": 22,
      "competitiveness": 20,
      "clarity": 18
    },
    "issues": [],
    "recommendations": ["Excellent quality - highly recommended!"],
    "isApproved": true
  },
  "suggestions": []
}
```

---

## 📊 Monitoring Keyword Quality

### View Statistics

In the admin interface, you'll see:

**Overall Stats:**
- Total keywords
- Approved keywords
- Pending review
- Rejected keywords

**By Category:**
- Count per category
- Average quality score

**Recently Added:**
- Latest keyword pairs
- Quality scores
- Approval status

### Export Keywords

```bash
# Using Prisma Studio
npx prisma studio

# Navigate to KeywordPair table
# Use filters and export options
```

---

## 🚀 Using Keywords for Seeding

Once you have quality keywords in the database, you can use them for seeding:

### Manual Seeding

```bash
# Seed from approved keywords only
npm run seed -- --from-db --status approved --limit 50

# Seed from specific category
npm run seed -- --from-db --category tech --limit 100
```

### Automated Seeding

```bash
# Use scheduler with database keywords
npm run seed:scheduler -- --from-db --status approved
```

---

## 💡 Best Practices

### When Adding Keywords

1. ✅ **Use specific terms** - "iPhone 15" not "phone"
2. ✅ **Match categories** - Both tech, both music, etc.
3. ✅ **Check quality first** - Use the quality checker
4. ✅ **Add context** - Use notes field for special cases
5. ✅ **Tag appropriately** - Use tags for organization

### Quality Guidelines

**Good Examples:**
- "Taylor Swift" vs "Beyoncé" (music)
- "ChatGPT" vs "Gemini" (tech)
- "iPhone 15" vs "Samsung S24" (products)
- "Marvel" vs "DC" (movies)

**Bad Examples:**
- "best thing" vs "worst thing" (too vague)
- "a" vs "b" (too short)
- "test123" vs "demo456" (test data)
- "iPhone" vs "pizza" (different categories)

### Approval Workflow

1. **Auto-Approved (≥70):**
   - Ready to use immediately
   - High confidence in quality

2. **Pending Review (60-69):**
   - Review manually
   - Check if terms make sense
   - Approve or reject

3. **Rejected (<60):**
   - Don't use for seeding
   - Consider deleting
   - Or improve and re-check

---

## 🔧 Troubleshooting

### "Keyword pair already exists"

**Solution:**
- Check if terms are exactly the same (case-sensitive)
- Try reversing order: "A vs B" vs "B vs A"
- Search in admin interface to find existing

### Low quality score

**Common issues:**
1. **Too generic** - Use specific brands/names
2. **Too short** - Add context (version numbers, years)
3. **Vague words** - Avoid "best", "new", "thing"
4. **Different categories** - Ensure both terms match

**Fixes:**
- Add version numbers: "iPhone" → "iPhone 15"
- Add context: "phone" → "iPhone 15 Pro"
- Be specific: "game" → "Call of Duty: Modern Warfare"

### Import failed

**Check:**
1. Database connection: `npx prisma db pull`
2. File exists: `ls data/seed-keywords.json`
3. Valid JSON format
4. Admin authentication

---

## 📈 Growth Strategy

### Phase 1: Foundation (Week 1)
```bash
# Import seed keywords
npm run keywords:import-seed

# Review and approve in admin
# Goal: 300+ approved keywords
```

### Phase 2: Expansion (Week 2-4)
```bash
# Import from existing comparisons
npm run keywords:import -- --min-quality 70 --limit 500

# Add custom keywords via admin UI
# Goal: 1,000+ approved keywords
```

### Phase 3: Scale (Month 2+)
```bash
# Import all high-quality comparisons
npm run keywords:import -- --min-quality 60 --limit 2000

# Use for automated seeding
# Goal: 5,000+ keywords for massive scale
```

---

## 📞 Support

**Admin Interface Issues:**
- Ensure you're logged in: `/admin/login`
- Check browser console for errors
- Verify database migration: `npx prisma migrate deploy`

**Import Issues:**
- Check file paths are correct
- Verify JSON format is valid
- Test with --dry-run first

**Quality Scoring:**
- Review `/lib/keyword-quality.ts` for scoring logic
- Adjust thresholds if needed
- Report bugs or suggestions

---

## ✨ Summary

You now have a complete system for:
- ✅ **Quality checking** keywords before adding
- ✅ **Managing** keywords via admin interface
- ✅ **Importing** from multiple sources
- ✅ **Tracking** usage and quality metrics
- ✅ **Approving** high-quality keywords automatically

**Start here:**
```bash
# 1. Import curated keywords
npm run keywords:import-seed

# 2. Visit admin interface
open https://your-domain.com/admin/keywords

# 3. Review and approve keywords

# 4. Start seeding with quality keywords!
```

🎉 **Happy keyword curating!**
