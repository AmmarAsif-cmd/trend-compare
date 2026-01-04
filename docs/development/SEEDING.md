# 🌱 TrendArc Seeding System

Complete guide to populating your database with comparison pages for maximum Google indexing.

## 📊 Current Status

- ✅ **300 pages indexed** in 1.5 months (organic traffic)
- 🎯 **Goal**: Scale to 10,000+ indexed pages
- 💡 **Strategy**: Pre-generate popular comparisons across all categories

---

## 🚀 Quick Start

### 1. Basic Seeding (Recommended First Step)

Generate 50 comparisons from all categories:

```bash
npm run seed -- --limit 50 --skip-existing
```

### 2. Category-Specific Seeding

Generate comparisons for a specific category:

```bash
# Music (50 comparisons)
npm run seed:music

# Tech (50 comparisons)
npm run seed:tech

# Movies (50 comparisons)
npm run seed:movies

# Games (50 comparisons)
npm run seed:games

# Products (50 comparisons)
npm run seed:products
```

### 3. Bulk Seeding (Maximum Pages)

Generate 1,000+ pages with multiple timeframes and regions:

```bash
# 100 keyword pairs × 2 timeframes × 3 regions = 600 pages
npm run seed:bulk -- --limit 100 --timeframes 12m,5y --geos ,US,GB
```

---

## 📚 Seeding Scripts

### `seed-comparisons.ts` - Single Batch Seeding

**Purpose:** Generate comparisons with fine control over parameters.

**Usage:**
```bash
npx tsx scripts/seed-comparisons.ts [options]
```

**Options:**
| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--category <name>` | Seed specific category | All | `--category music` |
| `--limit <number>` | Number of comparisons | 10 | `--limit 100` |
| `--delay <ms>` | Delay between requests | 2000 | `--delay 3000` |
| `--timeframe <tf>` | Timeframe to use | 12m | `--timeframe 5y` |
| `--geo <region>` | Region code | '' (worldwide) | `--geo US` |
| `--all` | Generate all comparisons | false | `--all` |
| `--shuffle` | Randomize order | false | `--shuffle` |
| `--skip-existing` | Skip existing comparisons | false | `--skip-existing` |

**Examples:**

```bash
# Generate 50 music comparisons
npx tsx scripts/seed-comparisons.ts --category music --limit 50

# Generate 100 tech comparisons for US market
npx tsx scripts/seed-comparisons.ts --category tech --limit 100 --geo US

# Generate all games comparisons with 5-second delay
npx tsx scripts/seed-comparisons.ts --category games --all --delay 5000

# Safe mode: shuffle and skip existing
npx tsx scripts/seed-comparisons.ts --limit 200 --shuffle --skip-existing
```

---

### `seed-bulk.ts` - Multi-Variant Seeding

**Purpose:** Generate maximum pages by creating multiple variants (timeframes × regions).

**How It Works:**
- Each keyword pair generates **multiple pages** with different parameters
- Example: "iPhone vs Samsung" generates:
  - `iphone-vs-samsung?tf=12m` (worldwide)
  - `iphone-vs-samsung?tf=12m&geo=US`
  - `iphone-vs-samsung?tf=5y` (worldwide)
  - `iphone-vs-samsung?tf=5y&geo=US`
  - etc.

**Usage:**
```bash
npx tsx scripts/seed-bulk.ts [options]
```

**Options:**
| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--category <name>` | Seed specific category | All | `--category tech` |
| `--limit <number>` | Number of keyword pairs | 10 | `--limit 50` |
| `--timeframes <list>` | Comma-separated timeframes | 12m,5y | `--timeframes 7d,30d,12m,5y,all` |
| `--geos <list>` | Comma-separated geo codes | ,US,GB | `--geos ,US,GB,CA,AU` |
| `--delay <ms>` | Delay between requests | 3000 | `--delay 5000` |
| `--all-timeframes` | Use all 5 timeframes | false | `--all-timeframes` |
| `--all-geos` | Use top 15 geo regions | false | `--all-geos` |
| `--skip-existing` | Skip existing | false | `--skip-existing` |

**Examples:**

```bash
# Conservative: 100 keyword pairs × 2 timeframes × 3 regions = 600 pages
npx tsx scripts/seed-bulk.ts --limit 100 --timeframes 12m,5y --geos ,US,GB

# Aggressive: 50 pairs × 5 timeframes × 15 regions = 3,750 pages
npx tsx scripts/seed-bulk.ts --limit 50 --all-timeframes --all-geos

# Category-focused: Music with all timeframes
npx tsx scripts/seed-bulk.ts --category music --limit 40 --all-timeframes --geos ,US,GB,CA
```

**Expected Page Counts:**

| Keywords | Timeframes | Regions | Total Pages | Est. Time (3s delay) |
|----------|------------|---------|-------------|----------------------|
| 10 | 2 | 3 | 60 | 3 min |
| 50 | 2 | 3 | 300 | 15 min |
| 100 | 5 | 3 | 1,500 | 1.25 hours |
| 100 | 5 | 15 | 7,500 | 6.25 hours |
| 200 | 5 | 15 | 15,000 | 12.5 hours |

---

### `seed-scheduler.ts` - Automated Continuous Seeding

**Purpose:** Run seeding automatically on a schedule (background process).

**Usage:**
```bash
npx tsx scripts/seed-scheduler.ts [options]
```

**Options:**
| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--interval <minutes>` | Run every N minutes | 60 | `--interval 30` |
| `--batch-size <number>` | Comparisons per batch | 20 | `--batch-size 50` |
| `--mode <mode>` | Seeding mode | random | `--mode sequential` |
| `--category <name>` | Focus on category | Auto-rotate | `--category tech` |

**Modes:**
- **random**: Pick random comparisons from all categories
- **sequential**: Rotate through categories one by one
- **category**: Focus on specific category

**Examples:**

```bash
# Run every 30 minutes, seed 20 random comparisons
npx tsx scripts/seed-scheduler.ts --interval 30 --batch-size 20

# Focus on tech, run every hour
npx tsx scripts/seed-scheduler.ts --mode category --category tech --interval 60

# Production: Run as background service with PM2
pm2 start "npx tsx scripts/seed-scheduler.ts --interval 60" --name trendarc-seeder
```

**Environment Variables:**
```bash
SEEDER_ENABLED=true        # Enable/disable scheduler
SEEDER_INTERVAL=60         # Override interval in minutes
SEEDER_BATCH_SIZE=20       # Override batch size
```

---

## 🎯 Keyword Database

Location: `/data/seed-keywords.json`

**Categories:**
- 🎵 **music** - 40 artist/band comparisons
- 🎬 **movies** - 40 movie/franchise comparisons
- 🎮 **games** - 40 game/console comparisons
- 💻 **tech** - 40 technology comparisons
- 📦 **products** - 40 product comparisons
- 👤 **people** - 30 celebrity/influencer comparisons
- 🏢 **brands** - 40 brand comparisons
- 🌍 **places** - 30 location comparisons
- 🌐 **general** - 40 general comparisons

**Total:** 340+ keyword pairs = **1,700+ potential pages** (with 5 timeframes)

### Adding Custom Keywords

Edit `/data/seed-keywords.json`:

```json
{
  "tech": [
    ["ChatGPT", "Gemini"],
    ["React", "Vue"],
    ["Your Keyword 1", "Your Keyword 2"]
  ]
}
```

---

## 📈 SEO Strategy

### Phase 1: Foundation (Week 1)
**Goal:** 500 indexed pages

```bash
# Day 1-2: Seed all categories with default settings
npm run seed:music
npm run seed:movies
npm run seed:games
npm run seed:tech
npm run seed:products

# Day 3-4: Bulk seed with multiple timeframes
npm run seed:bulk -- --limit 50 --timeframes 12m,5y --geos ,US,GB

# Day 5-7: Submit sitemap and monitor indexing
```

### Phase 2: Expansion (Week 2-4)
**Goal:** 2,000+ indexed pages

```bash
# Run bulk seeding with all timeframes
npm run seed:bulk -- --limit 100 --all-timeframes --geos ,US,GB,CA,AU

# Start automated scheduler for continuous seeding
pm2 start "npx tsx scripts/seed-scheduler.ts --interval 120" --name seeder
```

### Phase 3: Dominance (Month 2-3)
**Goal:** 10,000+ indexed pages

```bash
# Maximum bulk seeding
npm run seed:bulk -- --limit 200 --all-timeframes --all-geos --skip-existing

# Add custom keywords to seed-keywords.json (100+ new pairs)
# Run refresh to update old comparisons with fresh data
npm run refresh:all
```

---

## ⚠️ Best Practices

### API Quota Management

**YouTube API Quota:**
- Free tier: 10,000 units/day ≈ 100 searches
- Each comparison uses 2 searches (one per term)
- **Safe rate:** 50 comparisons/day (100 searches)
- **Solution:** Use `--delay 5000` (5 seconds) to avoid hitting limits

**Google Trends:**
- No strict quota, but rate-limited
- **Safe rate:** 1 request every 2-3 seconds
- **Solution:** Use `--delay 2000` or higher

**Other APIs:**
- Spotify, TMDB, Steam: Higher limits or unlimited
- Cached via 3-tier caching system (DB → Keyword → API)

### Recommended Delays

| Daily Target | Delay | Hourly Rate | Daily Total |
|--------------|-------|-------------|-------------|
| Conservative | 5000ms | 12/hour | 288/day |
| Moderate | 3000ms | 20/hour | 480/day |
| Aggressive | 2000ms | 30/hour | 720/day |

### Safe Seeding Schedule

```bash
# Morning: 50 comparisons (2.5 min)
npm run seed -- --limit 50 --delay 3000 --skip-existing

# Afternoon: 50 comparisons (2.5 min)
npm run seed -- --limit 50 --delay 3000 --skip-existing --shuffle

# Evening: Bulk seed 20 keyword pairs × 2 variants = 40 pages
npm run seed:bulk -- --limit 20 --timeframes 12m,5y --geos ,US

# Total: 140 pages/day without hitting quotas
```

---

## 🔄 Maintenance

### Refresh Old Comparisons

Keep data fresh by refreshing older comparisons:

```bash
# Refresh comparisons older than 7 days (limit 100)
npm run refresh:all

# Refresh trending comparisons
npm run refresh:trending
```

### Monitor Progress

```bash
# View database
npx prisma studio

# Check comparison count
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM Comparison;"

# Check pages by category
npx prisma db execute --stdin <<< "SELECT category, COUNT(*) FROM Comparison GROUP BY category;"
```

### Check Indexed Pages

1. **Google Search Console:**
   - Go to Coverage report
   - View indexed pages count
   - Check indexing errors

2. **Manual Check:**
   ```
   site:your-domain.com/compare
   ```

3. **Sitemap:**
   - Visit: `https://your-domain.com/sitemap.xml`
   - Verify all comparisons listed

---

## 🚨 Troubleshooting

### "Quota exceeded" errors

**Solution:**
1. Increase delay: `--delay 5000`
2. Reduce batch size: `--limit 20`
3. Wait 24 hours for quota reset
4. Consider upgrading API tier

### Pages not indexing

**Checklist:**
1. ✅ Sitemap submitted to Google Search Console
2. ✅ Robots.txt allows indexing
3. ✅ Pages return 200 status code
4. ✅ Unique content (not duplicate)
5. ✅ Wait 3-7 days for indexing

**Force indexing:**
```bash
# Generate fresh comparisons (not cached)
npm run seed -- --limit 10 --shuffle
```

### Slow seeding

**Solutions:**
1. Reduce timeframe variants: `--timeframes 12m`
2. Reduce geo variants: `--geos ,US`
3. Run multiple processes in parallel (advanced)
4. Use `--skip-existing` to avoid regenerating

---

## 📊 Expected Results

### Conservative Strategy
- **Week 1:** 300 → 500 pages (+200)
- **Month 1:** 500 → 2,000 pages (+1,500)
- **Month 3:** 2,000 → 5,000 pages (+3,000)

### Aggressive Strategy
- **Week 1:** 300 → 1,000 pages (+700)
- **Month 1:** 1,000 → 5,000 pages (+4,000)
- **Month 3:** 5,000 → 15,000 pages (+10,000)

### SEO Impact
- **Traffic increase:** 2-5x within 3 months
- **Keyword rankings:** 500+ "[X] vs [Y]" rankings
- **Domain authority:** Improved with more indexed pages

---

## 💡 Pro Tips

1. **Start with high-value categories:**
   - Tech and products have highest commercial intent
   - Music and movies have highest search volume

2. **Use timeframe variants strategically:**
   - `12m` and `5y` are most popular
   - `7d` and `30d` for trending topics
   - `all` for historical comparisons

3. **Geographic targeting:**
   - Focus on English-speaking markets first: US, GB, CA, AU
   - Add other markets after establishing base

4. **Monitor and optimize:**
   - Check Google Search Console weekly
   - Identify high-performing comparisons
   - Generate similar comparisons

5. **Content quality over quantity:**
   - 1,000 quality comparisons > 10,000 low-quality
   - Use meaningful keywords from seed database
   - Avoid spammy or irrelevant comparisons

---

## 📞 Support

Having issues? Check:
1. Database connection: `npx prisma db pull`
2. API keys configured: Check `.env.local`
3. Logs: Check console output for errors
4. GitHub Issues: Open an issue with error details

**Happy seeding! 🚀**
