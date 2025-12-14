/**
 * Detailed API test with better search terms and error diagnostics
 */

import { config } from "dotenv";
config();

import { spotifyAdapter } from "../lib/sources/adapters/spotify";
import { youtubeAdapter } from "../lib/sources/adapters/youtube";
import { tmdbAdapter } from "../lib/sources/adapters/tmdb";
import { bestBuyAdapter } from "../lib/sources/adapters/bestbuy";
import { steamAdapter } from "../lib/sources/adapters/steam";

async function testAPI(name: string, fn: () => Promise<any>, showFullError = false) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    
    if (result !== null && result !== undefined) {
      console.log(`✅ ${name} SUCCESS (${duration}ms)`);
      if (typeof result === 'object') {
        const keys = Object.keys(result).slice(0, 5);
        console.log(`   Keys: ${keys.join(', ')}`);
      }
      return { success: true, result, duration };
    } else {
      console.log(`⚠️  ${name} returned null/undefined`);
      return { success: false, result: null, duration, reason: 'No results found' };
    }
  } catch (error: any) {
    console.log(`❌ ${name} FAILED`);
    console.log(`   Error: ${error.message}`);
    if (showFullError && error.stack) {
      console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    return { success: false, error: error.message, duration: 0 };
  }
}

async function main() {
  console.log("🔍 Detailed API Testing...\n");
  
  // Check environment variables
  const envVars = {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    BESTBUY_API_KEY: process.env.BESTBUY_API_KEY,
  };

  console.log("Environment Variables Check:");
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? `✅ Set (${value.length} chars)` : '❌ Missing';
    console.log(`  ${key}: ${status}`);
  });

  const results: any = {};

  // Test 1: Spotify
  console.log("\n" + "=".repeat(60));
  console.log("1. SPOTIFY API");
  console.log("=".repeat(60));
  if (envVars.SPOTIFY_CLIENT_ID && envVars.SPOTIFY_CLIENT_SECRET) {
    results.spotify = await testAPI("Spotify - Taylor Swift", () => 
      spotifyAdapter.searchArtist("Taylor Swift"), true
    );
  } else {
    console.log("⚠️  Skipped - credentials not set");
    results.spotify = { success: false, reason: 'Credentials not set' };
  }

  // Test 2: YouTube
  console.log("\n" + "=".repeat(60));
  console.log("2. YOUTUBE API");
  console.log("=".repeat(60));
  if (envVars.YOUTUBE_API_KEY) {
    const yt1 = await testAPI("YouTube - iPhone", () => 
      youtubeAdapter.getVideoStats("iPhone"), true
    );
    const yt2 = await testAPI("YouTube - Taylor Swift", () => 
      youtubeAdapter.getVideoStats("Taylor Swift"), true
    );
    results.youtube = yt1.success || yt2.success ? { ...yt1, success: true } : yt1;
  } else {
    console.log("⚠️  Skipped - API key not set");
    results.youtube = { success: false, reason: 'API key not set' };
  }

  // Test 3: TMDB
  console.log("\n" + "=".repeat(60));
  console.log("3. TMDB API");
  console.log("=".repeat(60));
  if (envVars.TMDB_API_KEY) {
    const tmdb1 = await testAPI("TMDB - Inception", () => 
      tmdbAdapter.searchMovie("Inception"), true
    );
    const tmdb2 = await testAPI("TMDB - The Matrix", () => 
      tmdbAdapter.searchMovie("The Matrix"), true
    );
    const tmdb3 = await testAPI("TMDB - Avatar", () => 
      tmdbAdapter.searchMovie("Avatar"), true
    );
    results.tmdb = tmdb1.success || tmdb2.success || tmdb3.success 
      ? { ...tmdb1, success: true } 
      : tmdb1;
  } else {
    console.log("⚠️  Skipped - API key not set");
    results.tmdb = { success: false, reason: 'API key not set' };
  }

  // Test 4: Best Buy
  console.log("\n" + "=".repeat(60));
  console.log("4. BEST BUY API");
  console.log("=".repeat(60));
  if (envVars.BESTBUY_API_KEY) {
    const bb1 = await testAPI("Best Buy - iPhone", () => 
      bestBuyAdapter.searchProduct("iPhone"), true
    );
    const bb2 = await testAPI("Best Buy - Samsung Galaxy", () => 
      bestBuyAdapter.searchProduct("Samsung Galaxy"), true
    );
    const bb3 = await testAPI("Best Buy - MacBook", () => 
      bestBuyAdapter.searchProduct("MacBook"), true
    );
    results.bestbuy = bb1.success || bb2.success || bb3.success 
      ? { ...bb1, success: true } 
      : bb1;
  } else {
    console.log("⚠️  Skipped - API key not set");
    results.bestbuy = { success: false, reason: 'API key not set' };
  }

  // Test 5: Steam
  console.log("\n" + "=".repeat(60));
  console.log("5. STEAM API");
  console.log("=".repeat(60));
  results.steam = await testAPI("Steam - Counter-Strike", () => 
    steamAdapter.searchGame("Counter-Strike"), true
  );

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60));
  
  Object.entries(results).forEach(([api, result]: [string, any]) => {
    const status = result.success ? "✅ WORKING" : "❌ NOT WORKING";
    const reason = result.reason || result.error || (result.success ? "OK" : "No results found");
    console.log(`  ${api.toUpperCase().padEnd(12)} ${status.padEnd(12)} - ${reason}`);
  });

  const working = Object.values(results).filter((r: any) => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`\n${working}/${total} APIs are working`);
  
  if (working === total) {
    console.log("\n🎉 All APIs are working correctly!");
  } else if (working >= 3) {
    console.log("\n✅ Most APIs are working. Some may need better search terms.");
  } else {
    console.log("\n⚠️  Some APIs need attention. Check API keys and network connection.");
  }
}

main().catch(console.error);

