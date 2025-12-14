/**
 * Test YouTube API connectivity and diagnose issues
 */

import { config } from 'dotenv';
config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API...\n');

  // Check API key
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY is not set in environment variables');
    console.log('\n💡 To fix:');
    console.log('  1. Add YOUTUBE_API_KEY to your .env.local file');
    console.log('  2. Get an API key from: https://console.cloud.google.com/apis/credentials');
    return;
  }

  console.log(`✅ API Key found: ${YOUTUBE_API_KEY.substring(0, 10)}...${YOUTUBE_API_KEY.substring(YOUTUBE_API_KEY.length - 4)}\n`);

  // Test 1: Simple search
  console.log('📹 Test 1: Simple search for "test"');
  try {
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', 'test');
    searchUrl.searchParams.set('maxResults', '1');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Search failed:', response.status, response.statusText);
      if (data.error) {
        console.error('   Error details:', JSON.stringify(data.error, null, 2));
        
        if (data.error.errors) {
          data.error.errors.forEach((err: any) => {
            console.error(`   - ${err.domain}: ${err.reason} - ${err.message}`);
            
            if (err.reason === 'quotaExceeded') {
              console.error('\n💡 Quota exceeded! You need to:');
              console.error('  1. Wait for quota reset (daily)');
              console.error('  2. Enable billing in Google Cloud Console');
              console.error('  3. Request quota increase');
            } else if (err.reason === 'keyInvalid') {
              console.error('\n💡 Invalid API key! You need to:');
              console.error('  1. Check if the key is correct');
              console.error('  2. Ensure YouTube Data API v3 is enabled');
              console.error('  3. Regenerate the key if needed');
            } else if (err.reason === 'forbidden') {
              console.error('\n💡 Access forbidden! You need to:');
              console.error('  1. Enable YouTube Data API v3 in Google Cloud Console');
              console.error('  2. Check API key restrictions');
            }
          });
        }
      }
      return;
    }

    if (data.items && data.items.length > 0) {
      console.log(`✅ Search successful! Found ${data.items.length} result(s)`);
      console.log(`   First video: "${data.items[0].snippet.title}"`);
    } else {
      console.warn('⚠️ Search returned no results');
    }
  } catch (error: any) {
    console.error('❌ Search error:', error.message);
    return;
  }

  // Test 2: Get video statistics
  console.log('\n📊 Test 2: Get video statistics');
  try {
    // First get a video ID
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', 'test');
    searchUrl.searchParams.set('maxResults', '1');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (!searchResponse.ok || !searchData.items || searchData.items.length === 0) {
      console.error('❌ Could not get video ID for stats test');
      return;
    }

    const videoId = searchData.items[0].id.videoId;

    const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    statsUrl.searchParams.set('part', 'snippet,statistics');
    statsUrl.searchParams.set('id', videoId);
    statsUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const statsResponse = await fetch(statsUrl.toString());
    const statsData = await statsResponse.json();

    if (!statsResponse.ok) {
      console.error('❌ Stats request failed:', statsResponse.status);
      if (statsData.error) {
        console.error('   Error:', JSON.stringify(statsData.error, null, 2));
      }
      return;
    }

    if (statsData.items && statsData.items.length > 0) {
      const video = statsData.items[0];
      console.log('✅ Stats request successful!');
      console.log(`   Video: "${video.snippet.title}"`);
      console.log(`   Views: ${parseInt(video.statistics.viewCount || '0', 10).toLocaleString()}`);
      console.log(`   Likes: ${parseInt(video.statistics.likeCount || '0', 10).toLocaleString()}`);
    } else {
      console.warn('⚠️ Stats returned no data');
    }
  } catch (error: any) {
    console.error('❌ Stats error:', error.message);
  }

  // Test 3: Test with actual search terms
  console.log('\n🎯 Test 3: Test with comparison terms');
  const testTerms = ['iPhone', 'Samsung'];
  
  for (const term of testTerms) {
    try {
      const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', term);
      searchUrl.searchParams.set('maxResults', '5');
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

      const response = await fetch(searchUrl.toString());
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ "${term}": Failed - ${response.status}`);
        continue;
      }

      if (data.items && data.items.length > 0) {
        console.log(`✅ "${term}": Found ${data.items.length} video(s)`);
      } else {
        console.warn(`⚠️ "${term}": No videos found`);
      }
    } catch (error: any) {
      console.error(`❌ "${term}": Error - ${error.message}`);
    }
  }

  console.log('\n✅ YouTube API test complete!');
  console.log('\n💡 If all tests passed but you still see "no data" warnings:');
  console.log('   - Check the search terms being used (they might be too specific)');
  console.log('   - Check console logs for detailed error messages');
  console.log('   - Verify API quota hasn\'t been exceeded');
}

testYouTubeAPI().catch(console.error);

