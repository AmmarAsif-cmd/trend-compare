/**
 * Test APIs with raw fetch to see actual responses
 */

import { config } from "dotenv";
config();

async function testRawAPI(name: string, url: string, options?: RequestInit) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   URL: ${url.substring(0, 100)}...`);
    
    const start = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - start;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} API Response OK (${duration}ms)`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      
      // Check for results
      if (data.results && Array.isArray(data.results)) {
        console.log(`   Results count: ${data.results.length}`);
        if (data.results.length > 0) {
          console.log(`   First result: ${JSON.stringify(data.results[0], null, 2).slice(0, 200)}`);
        }
      } else if (data.products && Array.isArray(data.products)) {
        console.log(`   Products count: ${data.products.length}`);
        if (data.products.length > 0) {
          console.log(`   First product: ${JSON.stringify(data.products[0], null, 2).slice(0, 200)}`);
        }
      } else {
        console.log(`   Full response: ${JSON.stringify(data, null, 2).slice(0, 300)}`);
      }
      
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ ${name} API Error: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2).slice(0, 300)}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error: any) {
    console.log(`❌ ${name} FAILED`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🔍 Testing APIs with Raw Fetch...\n");

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const BESTBUY_API_KEY = process.env.BESTBUY_API_KEY;

  // Test TMDB
  if (TMDB_API_KEY) {
    console.log("\n" + "=".repeat(60));
    console.log("TMDB API - Raw Test");
    console.log("=".repeat(60));
    
    await testRawAPI(
      "TMDB - Inception",
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=Inception&include_adult=false`
    );
    
    await testRawAPI(
      "TMDB - Configuration (health check)",
      `https://api.themoviedb.org/3/configuration?api_key=${TMDB_API_KEY}`
    );
  } else {
    console.log("\n⚠️  TMDB API key not set");
  }

  // Test Best Buy
  if (BESTBUY_API_KEY) {
    console.log("\n" + "=".repeat(60));
    console.log("Best Buy API - Raw Test");
    console.log("=".repeat(60));
    
    await testRawAPI(
      "Best Buy - iPhone",
      `https://api.bestbuy.com/v1/products((search=iPhone))?apiKey=${BESTBUY_API_KEY}&format=json&show=sku,name&pageSize=1`
    );
    
    await testRawAPI(
      "Best Buy - Laptops (category)",
      `https://api.bestbuy.com/v1/products(categoryPath.id=abcat0502000)?apiKey=${BESTBUY_API_KEY}&format=json&show=sku,name&pageSize=1`
    );
  } else {
    console.log("\n⚠️  Best Buy API key not set");
  }
}

main().catch(console.error);

