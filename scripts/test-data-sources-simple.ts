/**
 * Simple Data Source Testing (without server-only dependencies)
 * Tests all data source adapters
 */

import { config } from "dotenv";
config();

import { youtubeAdapter } from "../lib/sources/adapters/youtube";
import { spotifyAdapter } from "../lib/sources/adapters/spotify";
import { tmdbAdapter } from "../lib/sources/adapters/tmdb";
import { bestBuyAdapter } from "../lib/sources/adapters/bestbuy";
import { steamAdapter } from "../lib/sources/adapters/steam";
import { wikipediaAdapter } from "../lib/sources/adapters/wikipedia";

type TestResult = {
  name: string;
  healthCheck: boolean;
  functionalTest: boolean;
  configured: boolean;
  duration: number;
  error?: string;
  details?: any;
};

const results: TestResult[] = [];

async function testWithTimeout<T>(
  name: string,
  fn: () => Promise<T>,
  timeout: number = 10000
): Promise<{ success: boolean; result?: T; error?: string; duration: number }> {
  const start = Date.now();
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
    });

    const result = await Promise.race([fn(), timeoutPromise]);
    const duration = Date.now() - start;
    return { success: true, result, duration };
  } catch (error: any) {
    const duration = Date.now() - start;
    return {
      success: false,
      error: error.message || String(error),
      duration,
    };
  }
}

async function testSource(
  name: string,
  healthCheckFn: () => Promise<boolean>,
  testFn: () => Promise<any>,
  configured: boolean = true
): Promise<TestResult> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log("=".repeat(60));

  const result: TestResult = {
    name,
    healthCheck: false,
    functionalTest: false,
    configured,
    duration: 0,
  };

  // Test 1: Health Check
  console.log(`\n1. Health Check...`);
  const healthResult = await testWithTimeout(`${name} Health Check`, healthCheckFn, 5000);
  result.healthCheck = healthResult.success && healthResult.result === true;
  
  if (result.healthCheck) {
    console.log(`   ✅ Health check passed (${healthResult.duration}ms)`);
  } else {
    console.log(`   ❌ Health check failed: ${healthResult.error || 'Unknown error'}`);
    if (!configured) {
      console.log(`   ⚠️  Not configured (missing API keys)`);
    }
  }

  // Test 2: Functional Test
  if (configured) {
    console.log(`\n2. Functional Test...`);
    const testResult = await testWithTimeout(`${name} Functional Test`, testFn, 15000);
    result.duration = testResult.duration;
    
    if (testResult.success && testResult.result !== null && testResult.result !== undefined) {
      result.functionalTest = true;
      result.details = testResult.result;
      console.log(`   ✅ Functional test passed (${testResult.duration}ms)`);
      
      // Show result summary
      if (typeof testResult.result === 'object') {
        const keys = Object.keys(testResult.result).slice(0, 5);
        console.log(`   📊 Result keys: ${keys.join(', ')}`);
      }
    } else {
      result.error = testResult.error || 'No results returned';
      console.log(`   ❌ Functional test failed: ${result.error}`);
    }
  } else {
    console.log(`\n2. Functional Test...`);
    console.log(`   ⚠️  Skipped - not configured`);
    result.error = 'Not configured (missing API keys)';
  }

  return result;
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 DATA SOURCE TESTING SUITE");
  console.log("=".repeat(60));

  // Check environment variables
  console.log("\n📋 Environment Variables Check:");
  const envVars = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    BESTBUY_API_KEY: process.env.BESTBUY_API_KEY,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? `✅ Set (${value.substring(0, 8)}...)` : '❌ Missing';
    console.log(`  ${key.padEnd(25)} ${status}`);
  });

  // Test YouTube
  const youtubeConfigured = !!process.env.YOUTUBE_API_KEY;
  const youtubeResult = await testSource(
    'YouTube',
    () => youtubeAdapter.healthCheck(),
    () => youtubeAdapter.searchVideos('iPhone', 5),
    youtubeConfigured
  );
  results.push(youtubeResult);

  // Test Spotify
  const spotifyConfigured = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
  const spotifyResult = await testSource(
    'Spotify',
    () => spotifyAdapter.healthCheck(),
    () => spotifyAdapter.searchArtist('Taylor Swift'),
    spotifyConfigured
  );
  results.push(spotifyResult);

  // Test TMDB
  const tmdbConfigured = !!process.env.TMDB_API_KEY;
  const tmdbResult = await testSource(
    'TMDB',
    () => tmdbAdapter.healthCheck(),
    () => tmdbAdapter.searchMovie('Inception'),
    tmdbConfigured
  );
  results.push(tmdbResult);

  // Test Best Buy
  const bestbuyConfigured = !!process.env.BESTBUY_API_KEY;
  const bestbuyResult = await testSource(
    'Best Buy',
    () => bestBuyAdapter.healthCheck(),
    () => bestBuyAdapter.searchProduct('iPhone'),
    bestbuyConfigured
  );
  results.push(bestbuyResult);

  // Test Steam
  const steamResult = await testSource(
    'Steam',
    () => steamAdapter.healthCheck(),
    () => steamAdapter.searchGame('Counter-Strike'),
    true // Steam works without API key
  );
  results.push(steamResult);

  // Test Wikipedia
  const wikipediaResult = await testSource(
    'Wikipedia',
    () => wikipediaAdapter.healthCheck(),
    async () => {
      const stats = await wikipediaAdapter.getArticleStats('iPhone');
      return { exists: stats.articleExists, title: stats.articleTitle, avgPageviews: stats.avgPageviews };
    },
    true // Wikipedia is free
  );
  results.push(wikipediaResult);

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL TEST SUMMARY");
  console.log("=".repeat(60));

  const summary = {
    total: results.length,
    healthCheckPassed: results.filter(r => r.healthCheck).length,
    functionalTestPassed: results.filter(r => r.functionalTest).length,
    configured: results.filter(r => r.configured).length,
    errors: results.filter(r => !r.functionalTest && r.configured).length,
    notConfigured: results.filter(r => !r.configured).length,
  };

  console.log(`\nTotal Sources: ${summary.total}`);
  console.log(`💚 Health Check Passed: ${summary.healthCheckPassed}/${summary.total}`);
  console.log(`✅ Functional Test Passed: ${summary.functionalTestPassed}/${summary.configured}`);
  console.log(`⚙️  Configured: ${summary.configured}/${summary.total}`);
  console.log(`❌ Errors: ${summary.errors}`);
  console.log(`⚠️  Not Configured: ${summary.notConfigured}`);

  console.log("\n" + "-".repeat(60));
  console.log("Detailed Results:");
  console.log("-".repeat(60));

  results.forEach((result, index) => {
    const health = result.healthCheck ? "💚" : "❌";
    const functional = result.functionalTest ? "✅" : result.configured ? "❌" : "⚠️";
    const status = result.functionalTest ? "WORKING" : result.configured ? "FAILED" : "NOT CONFIGURED";
    
    console.log(`\n${index + 1}. ${result.name}`);
    console.log(`   Status: ${functional} ${status}`);
    console.log(`   Health: ${health} ${result.healthCheck ? 'Passed' : 'Failed'}`);
    console.log(`   Duration: ${result.duration}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.details) {
      const detailsStr = JSON.stringify(result.details).substring(0, 150);
      console.log(`   Details: ${detailsStr}...`);
    }
  });

  // Recommendations
  console.log("\n" + "=".repeat(60));
  console.log("💡 RECOMMENDATIONS");
  console.log("=".repeat(60));

  if (summary.functionalTestPassed === summary.configured && summary.configured === summary.total) {
    console.log("\n🎉 All data sources are working correctly!");
  } else if (summary.functionalTestPassed >= summary.configured * 0.7) {
    console.log("\n✅ Most data sources are working. Some may need attention.");
    
    const failed = results.filter(r => !r.functionalTest && r.configured);
    if (failed.length > 0) {
      console.log("\n⚠️  Sources that need attention:");
      failed.forEach(r => {
        console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
      });
    }
  } else {
    console.log("\n⚠️  Multiple data sources need attention.");
    
    const notConfigured = results.filter(r => !r.configured);
    if (notConfigured.length > 0) {
      console.log("\n📝 Sources not configured (missing API keys):");
      notConfigured.forEach(r => {
        console.log(`   - ${r.name}`);
      });
    }

    const failed = results.filter(r => !r.functionalTest && r.configured);
    if (failed.length > 0) {
      console.log("\n❌ Sources with errors:");
      failed.forEach(r => {
        console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
      });
    }
  }

  // Exit with appropriate code
  const exitCode = summary.functionalTestPassed === summary.configured && summary.configured === summary.total ? 0 : summary.errors > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("\n❌ Test suite failed with error:", error);
  process.exit(1);
});

