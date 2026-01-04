# 🚀 Quick Screenshot Guide - Product Hunt Launch

## Step-by-Step Instructions

### Step 1: Start Your Dev Server

```bash
cd C:\Users\User\Desktop\trend-compare
npm run dev
```

Wait for server to start, then open: `http://localhost:3000`

---

### Step 2: Capture Screenshots

#### Method: Browser DevTools (Easiest)

**Chrome/Edge:**
1. Open your site in browser
2. Press `F12` (opens DevTools)
3. Press `Ctrl + Shift + P` (Command Palette)
4. Type: `Capture full size screenshot`
5. Press Enter
6. Screenshot saved to Downloads folder

**Firefox:**
1. Open your site in browser
2. Press `F12` (opens DevTools)
3. Click Settings icon (gear)
4. Find "Screenshot" section
5. Click "Capture full page"

---

### Step 3: Capture Each Screenshot

#### 📸 Screenshot 1: Homepage Hero (MAIN IMAGE)

1. Navigate to: `http://localhost:3000`
2. Wait for page to fully load
3. Scroll to top
4. Capture full page screenshot
5. Save as: `1-hero-homepage.png`

**What should be visible:**
- Hero section with search form
- "TrendArc" brand name
- Tagline
- Clean, professional look

---

#### 📸 Screenshot 2: Comparison View

1. Navigate to: `http://localhost:3000/compare/iphone-vs-samsung`
   - Or try: `/compare/taylor-swift-vs-drake`
   - Or try: `/compare/inception-vs-interstellar`
2. Wait for all data to load (chart, verdict, etc.)
3. Capture full page screenshot
4. Save as: `2-comparison-view.png`

**What should be visible:**
- Two terms being compared
- Google Trends chart
- Comparison data
- Clean layout

---

#### 📸 Screenshot 3: TrendArc Verdict

1. Navigate to: `http://localhost:3000/compare/iphone-vs-samsung`
2. Scroll down to "TrendArc Verdict" section
3. Wait for verdict to load
4. Capture screenshot of verdict card (or full page)
5. Save as: `3-trendarc-verdict.png`

**What should be visible:**
- Verdict card with scores
- Winner highlighted
- Key evidence points
- Professional design

---

#### 📸 Screenshot 4: Trending Page

1. Navigate to: `http://localhost:3000/trending`
2. Wait for trending comparisons to load
3. Capture full page screenshot
4. Save as: `4-trending-page.png`

**What should be visible:**
- List of trending comparisons
- Multiple comparisons
- Clean layout

---

#### 📸 Screenshot 5: Mobile View (Optional)

1. Open DevTools (F12)
2. Press `Ctrl + Shift + M` (Toggle device toolbar)
3. Select "iPhone 12 Pro" from device dropdown
4. Navigate to: `http://localhost:3000/compare/iphone-vs-samsung`
5. Wait for page to load
6. Capture screenshot
7. Save as: `5-mobile-view.png`

**What should be visible:**
- Mobile layout
- Responsive design
- Touch-friendly interface

---

### Step 4: Edit Screenshots

#### Basic Editing (Required)

For each screenshot:

1. **Crop Browser UI**
   - Remove address bar
   - Remove browser tabs
   - Remove DevTools (if visible)
   - Keep only the webpage content

2. **Resize**
   - Ensure width is at least 1200px
   - Recommended: 1920px width
   - Maintain aspect ratio

3. **Optimize**
   - Compress if file is over 5MB
   - Keep quality high
   - Save as PNG (preferred) or JPG

#### Tools for Editing

**Free Options:**
- **GIMP** (Windows/Mac/Linux) - Full-featured
- **Paint.NET** (Windows) - Simple and fast
- **Photopea** (Online) - Browser-based Photoshop alternative
- **Canva** (Online) - Easy to use

**Quick Edit Steps:**
1. Open image in editor
2. Crop to remove browser UI
3. Resize to 1920px width
4. Save as PNG
5. Check file size (should be under 5MB)

---

### Step 5: Save to Screenshots Folder

Move all edited screenshots to:
```
C:\Users\User\Desktop\trend-compare\screenshots\
```

Files should be named:
- `1-hero-homepage.png` ⭐ (Main image)
- `2-comparison-view.png`
- `3-trendarc-verdict.png`
- `4-trending-page.png`
- `5-mobile-view.png` (optional)

---

## ✅ Quality Checklist

Before uploading to Product Hunt, verify:

- [ ] All screenshots are 1200px+ width
- [ ] All images are clear and professional
- [ ] No browser UI visible
- [ ] Real data shown (not placeholders)
- [ ] Files are under 5MB each
- [ ] Files saved as PNG or JPG
- [ ] Main image selected (hero/homepage)

---

## 🎯 Product Hunt Upload

1. Go to Product Hunt submission page
2. Upload `1-hero-homepage.png` as **Main Image**
3. Upload remaining 2-4 screenshots as **Gallery Images**
4. Order: Comparison → Verdict → Trending → Mobile

---

## 💡 Pro Tips

1. **Use Real Data**: Make sure comparisons show actual data, not placeholders
2. **Wait for Load**: Ensure all charts and data are fully loaded before capturing
3. **Clean State**: Close browser extensions, clear console errors
4. **Consistent Style**: Keep all screenshots consistent in style
5. **Highlight Value**: Make sure key features are visible

---

## 🆘 Troubleshooting

**Screenshot is too large:**
- Use image compression tool
- Reduce quality slightly (keep it readable)
- Try saving as JPG instead of PNG

**Browser UI visible:**
- Use browser DevTools full page capture
- Or crop manually in image editor

**Data not loading:**
- Check API keys are set
- Wait longer for data to load
- Try a different comparison URL

**Image quality poor:**
- Use full page capture (not area selection)
- Ensure browser zoom is at 100%
- Use high-resolution display

---

## 🎉 You're Done!

Once all screenshots are captured, edited, and saved, you're ready to upload to Product Hunt!

**Next Steps:**
1. Review screenshots one more time
2. Upload to Product Hunt
3. Launch! 🚀

---

**Need more help?** See `SCREENSHOT_GUIDE.md` for detailed instructions.

