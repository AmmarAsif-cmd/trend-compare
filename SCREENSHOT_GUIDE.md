# 📸 Product Hunt Screenshot Guide

## 🎯 Screenshot Requirements

Product Hunt requires **3-5 high-quality screenshots** for your gallery. Here's what you need:

### Required Screenshots

1. **Hero/Homepage** (Required)
2. **Comparison View** (Required)
3. **TrendArc Verdict** (Required)
4. **Trending Page** (Recommended)
5. **Mobile View** (Optional but recommended)

---

## 📐 Technical Specifications

### Image Requirements
- **Format**: PNG or JPG
- **Size**: Minimum 1200px width (recommended: 1920px width)
- **Aspect Ratio**: 16:9 or 4:3 (landscape)
- **File Size**: Under 5MB per image
- **Quality**: High resolution, crisp and clear

### Product Hunt Gallery
- **Main Image**: First screenshot (will be featured)
- **Gallery Images**: Additional 2-4 screenshots
- **Total**: 3-5 images recommended

---

## 📋 Screenshot Checklist

### 1. Hero/Homepage Screenshot ⭐ (Main Image)

**What to Capture:**
- Full homepage view
- Hero section with search form
- Brand name/logo visible
- Clean, professional look

**How to Capture:**
1. Open `http://localhost:3000` (or your dev URL)
2. Make sure page is fully loaded
3. Scroll to top
4. Use browser screenshot tool or:
   - **Chrome**: F12 → Cmd/Ctrl + Shift + P → "Capture full size screenshot"
   - **Firefox**: F12 → Settings → Screenshot → "Capture full page"
   - **Edge**: F12 → Cmd/Ctrl + Shift + P → "Capture full size screenshot"

**What to Show:**
- ✅ Hero section with search form
- ✅ Brand name "TrendArc"
- ✅ Tagline visible
- ✅ Clean, modern design
- ✅ No browser UI (address bar, bookmarks, etc.)

**File Name:** `1-hero-homepage.png`

---

### 2. Comparison View Screenshot ⭐

**What to Capture:**
- Side-by-side comparison page
- Google Trends chart visible
- Both terms clearly shown
- Data visualization prominent

**How to Capture:**
1. Navigate to a comparison (e.g., `/compare/iphone-vs-samsung`)
2. Wait for all data to load
3. Scroll to show the chart
4. Capture full page or key section

**What to Show:**
- ✅ Two terms being compared
- ✅ Google Trends chart
- ✅ Comparison data visible
- ✅ Clean layout
- ✅ Professional appearance

**File Name:** `2-comparison-view.png`

**Recommended Comparisons to Use:**
- "iPhone vs Samsung" (tech)
- "Taylor Swift vs Drake" (music)
- "Inception vs Interstellar" (movies)
- "MacBook vs Surface" (products)

---

### 3. TrendArc Verdict Screenshot ⭐

**What to Capture:**
- The verdict card with scores
- Winner highlighted
- Key evidence visible
- AI insights shown

**How to Capture:**
1. Navigate to a comparison page
2. Scroll to "TrendArc Verdict" section
3. Wait for verdict to load
4. Capture the verdict card

**What to Show:**
- ✅ TrendArc Verdict card
- ✅ Scores for both terms
- ✅ Winner clearly highlighted
- ✅ Key evidence points
- ✅ Professional design

**File Name:** `3-trendarc-verdict.png`

---

### 4. Trending Page Screenshot

**What to Capture:**
- Trending comparisons list
- Multiple comparisons visible
- Clean grid/list layout

**How to Capture:**
1. Navigate to `/trending`
2. Wait for trending comparisons to load
3. Capture the list view

**What to Show:**
- ✅ List of trending comparisons
- ✅ Multiple comparisons visible
- ✅ Clean layout
- ✅ Professional appearance

**File Name:** `4-trending-page.png`

---

### 5. Mobile View Screenshot (Optional)

**What to Capture:**
- Mobile-responsive design
- Comparison on mobile device
- Touch-friendly interface

**How to Capture:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Cmd/Ctrl + Shift + M)
3. Select mobile device (iPhone 12 Pro recommended)
4. Navigate to comparison page
5. Capture screenshot

**What to Show:**
- ✅ Mobile layout
- ✅ Responsive design
- ✅ Touch-friendly interface
- ✅ Clean mobile UI

**File Name:** `5-mobile-view.png`

---

## 🎨 Screenshot Editing Tips

### Before Capturing
1. **Clear Browser Cache**: Fresh load
2. **Close Extensions**: Hide browser extensions
3. **Full Screen**: Maximize browser window
4. **Clean State**: No console errors
5. **Good Data**: Use comparisons with rich data

### After Capturing

#### Basic Edits (Recommended)
1. **Crop**: Remove browser UI, focus on content
2. **Resize**: Ensure minimum 1200px width
3. **Optimize**: Compress if needed (keep quality)
4. **Add Borders**: Optional subtle border
5. **Add Labels**: Optional text labels (use sparingly)

#### Advanced Edits (Optional)
1. **Add Highlights**: Circle key features
2. **Add Annotations**: Brief text labels
3. **Add Branding**: Subtle watermark (optional)
4. **Color Correction**: Ensure colors are vibrant
5. **Sharpening**: Make text crisp

### Tools for Editing
- **Free**: GIMP, Paint.NET, Canva
- **Online**: Photopea, Figma
- **Paid**: Photoshop, Sketch

---

## 📝 Screenshot Capture Script

### Quick Capture Steps

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Chrome/Edge: `http://localhost:3000`
   - Make sure page loads fully

3. **Capture Screenshots**
   - Use browser DevTools screenshot
   - Or use screenshot tool (Snipping Tool, ShareX, etc.)

4. **Save Files**
   - Save in `/screenshots` folder
   - Use naming convention above

---

## 🎯 What Makes a Good Product Hunt Screenshot?

### ✅ DO:
- Show the product clearly
- Highlight key features
- Use real data (not dummy data)
- Keep it clean and professional
- Show the value proposition
- Use consistent styling
- Make it visually appealing

### ❌ DON'T:
- Include browser UI (address bar, tabs)
- Show placeholder/dummy data
- Make it cluttered
- Use low resolution
- Include personal information
- Show errors or loading states
- Make it too busy

---

## 📦 Final Checklist

Before submitting to Product Hunt:

- [ ] 3-5 screenshots captured
- [ ] All images are 1200px+ width
- [ ] Images are clear and professional
- [ ] No browser UI visible
- [ ] Real data shown (not placeholders)
- [ ] Files optimized (under 5MB each)
- [ ] Images saved in correct format (PNG/JPG)
- [ ] Main image selected (hero/homepage)
- [ ] Gallery images ready

---

## 🚀 Quick Start

1. **Create Screenshots Folder**
   ```bash
   mkdir screenshots
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Capture Screenshots**
   - Follow guide above for each screenshot

4. **Edit & Optimize**
   - Crop, resize, optimize
   - Save in `/screenshots` folder

5. **Ready for Product Hunt!**

---

**Need help?** Check the Product Hunt guidelines: https://www.producthunt.com/posts/new

