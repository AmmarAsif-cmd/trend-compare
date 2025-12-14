import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

interface ScreenshotConfig {
  name: string;
  url: string;
  waitForSelector?: string;
  waitTime?: number;
  fullPage?: boolean;
  viewport?: { width: number; height: number };
  clip?: { x: number; y: number; width: number; height: number };
}

const screenshots: ScreenshotConfig[] = [
  {
    name: '1-hero-homepage',
    url: `${BASE_URL}`,
    waitForSelector: 'h1',
    fullPage: true,
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: '2-comparison-view',
    url: `${BASE_URL}/compare/iphone-vs-samsung`,
    waitForSelector: '[data-testid="comparison-chart"], canvas, .chart-container, svg',
    waitTime: 5000, // Wait 5 seconds for charts to load
    fullPage: true,
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: '3-trendarc-verdict',
    url: `${BASE_URL}/compare/iphone-vs-samsung`,
    waitForSelector: '[data-testid="verdict"], .verdict, h2',
    waitTime: 3000,
    fullPage: false,
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: '4-trending-page',
    url: `${BASE_URL}/trending`,
    waitForSelector: 'main, [data-testid="trending"], .trending-list',
    waitTime: 3000,
    fullPage: true,
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: '5-mobile-view',
    url: `${BASE_URL}/compare/iphone-vs-samsung`,
    waitForSelector: '[data-testid="comparison-chart"], canvas, .chart-container',
    waitTime: 5000,
    fullPage: true,
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro dimensions
  },
];

async function captureScreenshot(
  browser: puppeteer.Browser,
  config: ScreenshotConfig
): Promise<void> {
  console.log(`📸 Capturing: ${config.name}...`);
  
  const page = await browser.newPage();
  
  try {
    // Set viewport
    if (config.viewport) {
      await page.setViewport(config.viewport);
    } else {
      await page.setViewport({ width: 1920, height: 1080 });
    }

    // Navigate to page
    console.log(`   Navigating to: ${config.url}`);
    await page.goto(config.url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for specific selector if provided
    if (config.waitForSelector) {
      try {
        await page.waitForSelector(config.waitForSelector, { timeout: 10000 });
      } catch (error) {
        console.warn(`   ⚠️  Selector "${config.waitForSelector}" not found, continuing...`);
      }
    }

    // Additional wait time if specified
    if (config.waitTime) {
      await new Promise(resolve => setTimeout(resolve, config.waitTime));
    }

    // Hide scrollbars for cleaner screenshots
    await page.evaluate(() => {
      document.body.style.overflow = 'hidden';
    });

    // Take screenshot
    const filePath = path.join(SCREENSHOTS_DIR, `${config.name}.png`);
    
    const screenshotOptions: puppeteer.ScreenshotOptions = {
      path: filePath,
      type: 'png',
      fullPage: config.fullPage !== false,
    };

    if (config.clip) {
      screenshotOptions.clip = config.clip;
    }

    await page.screenshot(screenshotOptions);
    
    console.log(`   ✅ Saved: ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Error capturing ${config.name}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Starting automated screenshot capture...\n');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  // Check if server is running
  try {
    const http = await import('http');
    await new Promise<void>((resolve, reject) => {
      const req = http.get(BASE_URL, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
    });
    console.log(`✅ Server is running at ${BASE_URL}\n`);
  } catch (error) {
    console.error(`❌ Cannot connect to ${BASE_URL}`);
    console.error(`   Please make sure your dev server is running:`);
    console.error(`   npm run dev\n`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    console.log(`📸 Capturing ${screenshots.length} screenshots...\n`);

    for (const config of screenshots) {
      await captureScreenshot(browser, config);
      console.log(''); // Empty line for readability
    }

    console.log('✅ All screenshots captured successfully!\n');
    console.log(`📁 Files saved in: ${SCREENSHOTS_DIR}\n`);
    console.log('📋 Next steps:');
    console.log('   1. Review the screenshots');
    console.log('   2. Edit if needed (crop, resize)');
    console.log('   3. Upload to Product Hunt\n');
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

