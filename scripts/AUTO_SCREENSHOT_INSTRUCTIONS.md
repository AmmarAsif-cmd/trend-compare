# 🤖 Automated Screenshot Capture

## Quick Start

### Step 1: Install Puppeteer

```bash
npm install
```

This will automatically install Puppeteer (headless Chrome browser).

### Step 2: Start Your Dev Server

In one terminal:
```bash
npm run dev
```

Wait for server to start (you'll see "Ready" message).

### Step 3: Run Screenshot Script

In another terminal:
```bash
npm run screenshots
```

That's it! The script will automatically:
- ✅ Capture all 5 required screenshots
- ✅ Save them to `/screenshots` folder
- ✅ Wait for pages to load
- ✅ Handle charts and dynamic content

---

## What It Captures

1. **1-hero-homepage.png** - Homepage hero section
2. **2-comparison-view.png** - Comparison page with chart
3. **3-trendarc-verdict.png** - Verdict card
4. **4-trending-page.png** - Trending comparisons
5. **5-mobile-view.png** - Mobile responsive view

---

## Customization

### Change Base URL

The default is `http://localhost:3001`. If your dev server runs on a different port:

```bash
BASE_URL=http://localhost:3000 npm run screenshots
```

### Change Comparison

Edit `scripts/capture-screenshots.ts` to use different comparisons:

```typescript
{
  name: '2-comparison-view',
  url: `${BASE_URL}/compare/taylor-swift-vs-drake`, // Change this
  // ...
}
```

---

## Troubleshooting

### "Cannot connect to server"
- Make sure `npm run dev` is running
- Check the URL is correct (default: http://localhost:3000)

### Screenshots are blank
- Wait longer for pages to load
- Increase `waitTime` in the script
- Check if selectors exist on the page

### Charts not showing
- The script waits 5 seconds for charts to load
- If still not showing, increase `waitTime` in the script

### File size too large
- Screenshots are saved as PNG (high quality)
- Use an image editor to compress if needed
- Or modify script to save as JPG

---

## Manual Editing (Optional)

After capturing, you may want to:

1. **Crop** - Remove any unwanted areas
2. **Resize** - Ensure 1920px width
3. **Optimize** - Compress if over 5MB
4. **Review** - Check all screenshots look good

---

## Alternative: Manual Capture

If the automated script doesn't work, see:
- `QUICK_SCREENSHOT_GUIDE.md` - Manual capture instructions
- `SCREENSHOT_GUIDE.md` - Detailed guide

---

## Requirements

- Node.js 20+
- Dev server running (`npm run dev`)
- Puppeteer will be installed automatically

---

**That's it! Run `npm run screenshots` and you're done! 🚀**

