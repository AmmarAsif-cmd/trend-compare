/**
 * Test script to verify all APIs are working
 * Run with: npx tsx scripts/test-apis.ts
 */

import { config } from "dotenv";
config();

import { spotifyAdapter } from "../lib/sources/adapters/spotify";
import { youtubeAdapter } from "../lib/sources/adapters/youtube";
import { tmdbAdapter } from "../lib/sources/adapters/tmdb";
import { bestBuyAdapter } from "../lib/sources/adapters/bestbuy";
import { steamAdapter } from "../lib/sources/adapters/steam";

async function testAPI(name: string, fn: () => Promise<any>) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    
    if (result) {
      console.log(`✅ ${name} SUCCESS (${duration}ms)`);
      console.log(`   Result:`, JSON.stringify(result, null, 2).slice(0, 200));
      return true;
    } else {
      console.log(`⚠️  ${name} returned null (no results found)`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ ${name} FAILED`);
    console.log(`   Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 Testing API Connections...\n");
  console.log("Environment Check:");
  console.log(`  SPOTIFY_CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SPOTIFY_CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  YOUTUBE_API_KEY: ${process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  TMDB_API_KEY: ${process.env.TMDB_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  BESTBUY_API_KEY: ${process.env.BESTBUY_API_KEY ? '✅ Set' : '❌ Missing'}`);

  const results = {
    spotify: false,
    youtube: false,
    tmdb: false,
    bestbuy: false,
    steam: false,
  };

  // Test Spotify
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    results.spotify = await testAPI("Spotify", () => spotifyAdapter.searchArtist("Taylor Swift"));
  } else {
    console.log("\n⚠️  Spotify: Skipped (credentials not set)");
  }

  // Test YouTube - try multiple terms
  if (process.env.YOUTUBE_API_KEY) {
    console.log("\n🧪 Testing YouTube with multiple terms...");
    const youtubeTest1 = await testAPI("YouTube (iPhone)", () => youtubeAdapter.getVideoStats("iPhone"));
    const youtubeTest2 = await testAPI("YouTube (Taylor Swift)", () => youtubeAdapter.getVideoStats("Taylor Swift"));
    results.youtube = youtubeTest1 || youtubeTest2; // Success if either works
  } else {
    console.log("\n⚠️  YouTube: Skipped (API key not set)");
  }

  // Test TMDB - try multiple movie names
  if (process.env.TMDB_API_KEY) {
    console.log("\n🧪 Testing TMDB with multiple terms...");
    const tmdbTest1 = await testAPI("TMDB (Inception)", () => tmdbAdapter.searchMovie("Inception"));
    const tmdbTest2 = await testAPI("TMDB (The Matrix)", () => tmdbAdapter.searchMovie("The Matrix"));
    const tmdbTest3 = await testAPI("TMDB (Avatar)", () => tmdbAdapter.searchMovie("Avatar"));
    results.tmdb = tmdbTest1 || tmdbTest2 || tmdbTest3; // Success if any works
  } else {
    console.log("\n⚠️  TMDB: Skipped (API key not set)");
  }

  // Test Best Buy - try multiple product names
  if (process.env.BESTBUY_API_KEY) {
    console.log("\n🧪 Testing Best Buy with multiple terms...");
    const bestbuyTest1 = await testAPI("Best Buy (iPhone)", () => bestBuyAdapter.searchProduct("iPhone"));
    const bestbuyTest2 = await testAPI("Best Buy (Samsung Galaxy)", () => bestBuyAdapter.searchProduct("Samsung Galaxy"));
    const bestbuyTest3 = await testAPI("Best Buy (MacBook)", () => bestBuyAdapter.searchProduct("MacBook"));
    results.bestbuy = bestbuyTest1 || bestbuyTest2 || bestbuyTest3; // Success if any works
  } else {
    console.log("\n⚠️  Best Buy: Skipped (API key not set)");
  }

  // Test Steam (no API key needed)
  results.steam = await testAPI("Steam", () => steamAdapter.searchGame("Counter-Strike"));

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary:");
  console.log("=".repeat(50));
  Object.entries(results).forEach(([api, success]) => {
    const status = success ? "✅" : "❌";
    console.log(`  ${status} ${api.toUpperCase()}`);
  });

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  console.log(`\n${successCount}/${totalCount} APIs working`);

  if (successCount === totalCount) {
    console.log("\n🎉 All APIs are working correctly!");
  } else {
    console.log("\n⚠️  Some APIs failed. Check the errors above.");
  }
}

main().catch(console.error);

