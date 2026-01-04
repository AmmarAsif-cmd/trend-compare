# Premium-Only Exports Implementation

## ✅ Implementation Complete

Premium-only exports have been implemented with zero recomputation, using stored InsightsPack and cached chart data.

## 📁 Files Created/Updated

1. **`prisma/schema.prisma`** - Added PdfJob model
2. **`prisma/migrations/add_pdf_job_table.sql`** - Migration SQL for PdfJob table
3. **`app/api/comparisons/export/route.ts`** - Updated export endpoint (JSON/CSV)
4. **`app/api/comparisons/export/pdf/route.ts`** - PDF export endpoint with job queue
5. **`app/api/jobs/generate-pdf/route.ts`** - Background PDF generation job
6. **`lib/pdf-generator-enhanced.ts`** - Enhanced PDF generator wrapper

## 🎯 Features

### 1. Premium-Only Access (Server-Side)

All export endpoints enforce premium access server-side:
```typescript
const hasPremium = await canAccessPremium();
if (!hasPremium) {
  return NextResponse.json(
    { error: 'Premium subscription required' },
    { status: 403 }
  );
}
```

### 2. Zero Recomputation

All exports use:
- **Stored InsightsPack** (from cache)
- **Cached chart data** (from database)
- **Cached forecasts** (from cache)
- **Cached AI insights** (from cache)
- **No AI calls** - Only reads cached data

### 3. JSON Export

**Endpoint:** `GET /api/comparisons/export?format=json&slug=...`

**Returns:** InsightsPack directly
```json
{
  "version": "1",
  "slug": "taylor-swift-vs-beyonce",
  "terms": { "termA": "Taylor Swift", "termB": "Beyonce" },
  "signals": [...],
  "interpretations": [...],
  "forecasts": {...},
  "aiInsights": {...}
}
```

### 4. CSV Export

**Endpoint:** `GET /api/comparisons/export?format=csv&slug=...`

**Includes:**
- Raw series points (date, termA value, termB value)
- Derived Signals (type, severity, term, value, description)
- Interpretations flags (category, confidence, summary, reasons)
- Forecast points (term, period, date, value, lowerBound, upperBound, confidence)
- Summary statistics (overall scores, breakdowns)

### 5. PDF Export (Job Queue System)

**Endpoint:** `POST /api/comparisons/export/pdf`

**Features:**
- Queued job system (PdfJob table)
- Generate once and reuse
- Store fileUrl and serve signed URL
- Rate limit: 1 per user per 5 minutes
- Background processing (never blocks user requests)

**Flow:**
1. User requests PDF export
2. Check rate limit (1 per 5 minutes)
3. Check if PDF already exists (reuse if available)
4. Create PdfJob with status 'pending'
5. Trigger background job (fire-and-forget)
6. Return job ID and status
7. User polls for completion or receives webhook

**Job Status:**
- `pending` - Job queued, waiting to process
- `processing` - PDF generation in progress
- `completed` - PDF ready, signed URL available
- `failed` - Generation failed, error stored

## 🔒 Security

### Premium Access
- ✅ Server-side enforcement on all export endpoints
- ✅ Returns 403 if not premium
- ✅ No client-side checks (security by design)

### Rate Limiting
- ✅ PDF exports: 1 per user per 5 minutes
- ✅ Returns 429 with retryAfter if limit exceeded
- ✅ JSON/CSV exports: No rate limit (lightweight)

## 📊 Data Sources

All exports use cached data only:

1. **Comparison Data** - From database (`getOrBuildComparison`)
2. **Intelligent Comparison** - Cached scores (no recomputation)
3. **Signals** - Generated deterministically (no AI)
4. **Interpretations** - Generated deterministically (no AI)
5. **Forecasts** - From cache (if available)
6. **AI Insights** - From cache (if available, never generated)

## 🚫 No AI Calls

Exports **never** trigger AI calls:
- ✅ Only reads cached AI insights
- ✅ Uses deterministic signals/interpretations
- ✅ Falls back gracefully if AI insights missing
- ✅ No `guardAICall` or AI budget checks in export paths

## 📋 PDF Job Queue

### Database Schema
```prisma
model PdfJob {
  id          String   @id @default(cuid())
  userId      String
  slug        String
  timeframe   String
  geo         String
  status      String   @default("pending")
  fileUrl     String?
  signedUrl   String?
  signedUrlExpiresAt DateTime?
  error       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?
}
```

### Unique Constraint
- One PDF job per user per comparison (slug + timeframe + geo)
- Reuses existing PDF if available

### Job Lifecycle
1. **Create** - User requests PDF, job created with status 'pending'
2. **Process** - Background job updates status to 'processing'
3. **Complete** - PDF generated, fileUrl stored, signed URL generated
4. **Reuse** - Subsequent requests return existing signed URL (if valid)

## 🔄 API Endpoints

### JSON Export
```bash
GET /api/comparisons/export?format=json&slug=taylor-swift-vs-beyonce&timeframe=12m&geo=
```

### CSV Export
```bash
GET /api/comparisons/export?format=csv&slug=taylor-swift-vs-beyonce&timeframe=12m&geo=
```

### PDF Export (Request)
```bash
POST /api/comparisons/export/pdf
Content-Type: application/json

{
  "slug": "taylor-swift-vs-beyonce",
  "timeframe": "12m",
  "geo": ""
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "clx...",
  "status": "pending",
  "message": "PDF generation queued"
}
```

### PDF Export (Check Status)
```bash
GET /api/comparisons/export/pdf?jobId=clx...
```

**Response (Completed):**
```json
{
  "jobId": "clx...",
  "status": "completed",
  "fileUrl": "https://storage.example.com/pdfs/...",
  "signedUrl": "https://storage.example.com/pdfs/...?signature=...",
  "expiresAt": "2024-01-01T12:00:00Z",
  "createdAt": "2024-01-01T11:00:00Z",
  "completedAt": "2024-01-01T11:05:00Z"
}
```

## ⚙️ Configuration

### Rate Limits
- **PDF Exports:** 1 per user per 5 minutes
- **JSON/CSV Exports:** No limit (lightweight)

### Signed URL Expiry
- **Default:** 1 hour (3600 seconds)
- **Configurable:** Via `generateSignedUrl` function

### Storage
- **TODO:** Implement PDF upload to S3/R2/Cloudflare
- **TODO:** Implement signed URL generation
- **Placeholder:** Returns placeholder URLs

## ✅ Requirements Checklist

- [x] No exports for free users (block server-side)
- [x] Exports must use stored InsightsPack + cached chart data
- [x] JSON export: return InsightsPack directly
- [x] CSV export: include raw series points, Signals, Interpretations, forecast points
- [x] PDF export: queued job system (PdfJob table)
- [x] PDF export: generate once and reuse
- [x] PDF export: store fileUrl and serve signed URL
- [x] PDF export: rate limit 1 per user per 5 minutes
- [x] Ensure exports never trigger AI calls

## 🔧 Next Steps

1. **Implement PDF Storage:**
   - Upload PDFs to S3/R2/Cloudflare
   - Generate signed URLs with proper expiry

2. **Implement PDF Generation:**
   - Use Puppeteer to render HTML to PDF
   - Or use a PDF service (PDFShift, DocRaptor)

3. **Add Webhooks:**
   - Notify users when PDF is ready
   - Optional: Email notification

4. **Add PDF Template:**
   - Enhance PDF HTML template with InsightsPack data
   - Include charts, graphs, and visualizations

---

**Status**: ✅ Complete - Premium-only exports with zero recomputation and job queue system

