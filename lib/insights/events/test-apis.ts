/**
 * API Testing Script
 * Tests Wikipedia, GDELT, and NewsAPI with real queries
 * Run this to verify APIs are working
 */

import { getWikipediaEventsNearDate } from './wikipedia-events';
import { getGDELTEventsNearDate } from './gdelt-events';
import { fetchNewsForDate } from './news-detector';
import { expandKeywords } from './keyword-expander';

async function testAPIs() {
  console.log('\n=== TESTING EVENT DETECTION APIs ===\n');

  // Test case 1: Honey Singh (recent event)
  const honeySinghDate = new Date('2024-12-22');
  const honeySinghKeywords = ['honey-singh'];
  const expandedHoneySingh = expandKeywords(honeySinghKeywords);

  console.log('TEST 1: Honey Singh Documentary (Dec 22, 2024)');
  console.log('Original keywords:', honeySinghKeywords);
  console.log('Expanded keywords:', expandedHoneySingh.slice(0, 10));
  console.log('');

  try {
    console.log('Testing Wikipedia...');
    const wikiResults = await getWikipediaEventsNearDate(honeySinghDate, expandedHoneySingh, 3);
    console.log(`✓ Wikipedia: ${wikiResults.length} events found`);
    if (wikiResults.length > 0) {
      console.log('  Sample:', wikiResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Wikipedia failed:', error);
  }

  try {
    console.log('Testing GDELT...');
    const gdeltResults = await getGDELTEventsNearDate(honeySinghDate, expandedHoneySingh, 3, 10);
    console.log(`✓ GDELT: ${gdeltResults.length} events found`);
    if (gdeltResults.length > 0) {
      console.log('  Sample:', gdeltResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ GDELT failed:', error);
  }

  try {
    console.log('Testing NewsAPI...');
    const newsResults = await fetchNewsForDate(honeySinghDate, expandedHoneySingh, 3);
    console.log(`✓ NewsAPI: ${newsResults.length} articles found`);
    if (newsResults.length > 0) {
      console.log('  Sample:', newsResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ NewsAPI failed:', error);
  }

  console.log('');

  // Test case 2: iPhone 16 (known event)
  const iphoneDate = new Date('2024-09-09');
  const iphoneKeywords = ['iphone'];
  const expandedIphone = expandKeywords(iphoneKeywords);

  console.log('\nTEST 2: iPhone 16 Launch (Sep 9, 2024)');
  console.log('Original keywords:', iphoneKeywords);
  console.log('Expanded keywords:', expandedIphone.slice(0, 10));
  console.log('');

  try {
    console.log('Testing Wikipedia...');
    const wikiResults = await getWikipediaEventsNearDate(iphoneDate, expandedIphone, 3);
    console.log(`✓ Wikipedia: ${wikiResults.length} events found`);
    if (wikiResults.length > 0) {
      console.log('  Sample:', wikiResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ Wikipedia failed:', error);
  }

  try {
    console.log('Testing GDELT...');
    const gdeltResults = await getGDELTEventsNearDate(iphoneDate, expandedIphone, 3, 10);
    console.log(`✓ GDELT: ${gdeltResults.length} events found`);
    if (gdeltResults.length > 0) {
      console.log('  Sample:', gdeltResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ GDELT failed:', error);
  }

  try {
    console.log('Testing NewsAPI...');
    const newsResults = await fetchNewsForDate(iphoneDate, expandedIphone, 3);
    console.log(`✓ NewsAPI: ${newsResults.length} articles found`);
    if (newsResults.length > 0) {
      console.log('  Sample:', newsResults[0].title.substring(0, 100));
    }
  } catch (error) {
    console.error('✗ NewsAPI failed:', error);
  }

  console.log('\n=== API TESTING COMPLETE ===\n');
}

// Export for use in other files
export { testAPIs };

// Run if executed directly
if (require.main === module) {
  testAPIs().catch(console.error);
}
