/**
 * Test script to verify if event detection APIs are working
 * Run with: npx tsx scripts/test-event-apis.ts
 */

import { getWikipediaEventsNearDate } from '../lib/insights/events/wikipedia-events';
import { getGDELTEventsNearDate } from '../lib/insights/events/gdelt-events';
import { fetchNewsForDate } from '../lib/insights/events/news-detector';
import { getBestEventExplanation } from '../lib/insights/events/multi-source-detector';

async function testAPIs() {
  console.log('🧪 Testing Event Detection APIs\n');

  // Test with a known event - Honey Singh documentary on Netflix
  const testDate = '2024-12-22';
  const testKeywords = ['honey-singh', 'yo-yo-honey-singh', 'netflix', 'documentary'];

  console.log(`📅 Test Date: ${testDate}`);
  console.log(`🔍 Keywords: ${testKeywords.join(', ')}\n`);

  // Test 1: Wikipedia API
  console.log('1️⃣  Testing Wikipedia Events API...');
  try {
    const wikiEvents = await getWikipediaEventsNearDate(testDate, testKeywords, 7);
    console.log(`   ✅ Wikipedia returned ${wikiEvents.length} events`);
    if (wikiEvents.length > 0) {
      console.log(`   📰 Sample: ${wikiEvents[0].title.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.log(`   ❌ Wikipedia failed: ${error.message}`);
  }

  console.log();

  // Test 2: GDELT API
  console.log('2️⃣  Testing GDELT API...');
  try {
    const gdeltEvents = await getGDELTEventsNearDate(testDate, testKeywords, 7, 20);
    console.log(`   ✅ GDELT returned ${gdeltEvents.length} events`);
    if (gdeltEvents.length > 0) {
      console.log(`   📰 Sample: ${gdeltEvents[0].title.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.log(`   ❌ GDELT failed: ${error.message}`);
  }

  console.log();

  // Test 3: NewsAPI
  console.log('3️⃣  Testing NewsAPI...');
  try {
    const newsArticles = await fetchNewsForDate(testDate, testKeywords, 7);
    console.log(`   ✅ NewsAPI returned ${newsArticles.length} articles`);
    if (newsArticles.length > 0) {
      console.log(`   📰 Sample: ${newsArticles[0].title.substring(0, 100)}...`);
    }
    if (newsArticles.length === 0 && !process.env.NEWS_API_KEY) {
      console.log(`   ⚠️  Warning: NEWS_API_KEY not found in environment`);
    }
  } catch (error: any) {
    console.log(`   ❌ NewsAPI failed: ${error.message}`);
  }

  console.log();

  // Test 4: Multi-Source (Combined)
  console.log('4️⃣  Testing Multi-Source Combined...');
  try {
    const bestEvent = await getBestEventExplanation(testDate, testKeywords, 7);
    if (bestEvent) {
      console.log(`   ✅ Best event found:`);
      console.log(`      Title: ${bestEvent.title}`);
      console.log(`      Sources: ${bestEvent.sources.join(', ')}`);
      console.log(`      Verified: ${bestEvent.verified ? 'Yes' : 'No'}`);
      console.log(`      Confidence: ${bestEvent.confidence}`);
    } else {
      console.log(`   ❌ No event found by multi-source detector`);
    }
  } catch (error: any) {
    console.log(`   ❌ Multi-source failed: ${error.message}`);
  }

  console.log('\n✨ Test complete!\n');

  // Test with another common search term
  console.log('🧪 Testing with another term: ChatGPT\n');
  const testDate2 = '2024-11-01'; // ChatGPT-4 Turbo or other recent event
  const testKeywords2 = ['chatgpt', 'openai', 'gpt-4'];

  console.log(`📅 Test Date: ${testDate2}`);
  console.log(`🔍 Keywords: ${testKeywords2.join(', ')}\n`);

  try {
    const bestEvent = await getBestEventExplanation(testDate2, testKeywords2, 7);
    if (bestEvent) {
      console.log(`   ✅ Event found:`);
      console.log(`      Title: ${bestEvent.title}`);
      console.log(`      Sources: ${bestEvent.sources.join(', ')}`);
    } else {
      console.log(`   ❌ No event found`);
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
}

testAPIs().catch(console.error);
