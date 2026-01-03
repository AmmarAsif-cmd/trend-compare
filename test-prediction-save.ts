/**
 * Test script to verify prediction saving works
 * Run with: npx tsx test-prediction-save.ts
 */

import { prisma } from './lib/db';
import { savePrediction } from './lib/prediction-tracking';

async function test() {
  console.log('🧪 Testing prediction saving...\n');

  // Test 1: Check if Prisma client recognizes Prediction model
  try {
    const count = await prisma.prediction.count();
    console.log('✅ Prisma client can access Prediction table');
    console.log(`   Current prediction count: ${count}\n`);
  } catch (error: any) {
    console.error('❌ Prisma client cannot access Prediction table:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Make sure you ran: npx prisma generate\n');
    return;
  }

  // Test 2: Try to save a test prediction
  try {
    console.log('💾 Attempting to save a test prediction...');
    await savePrediction({
      slug: 'test-slug',
      term: 'test-term',
      forecastDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      predictedValue: 50.5,
      confidence: 75.0,
      method: 'test-method',
    });
    console.log('✅ Test prediction saved successfully!\n');
  } catch (error: any) {
    console.error('❌ Failed to save test prediction:', error.message);
    console.error('   Error details:', error);
    return;
  }

  // Test 3: Verify the prediction was saved
  try {
    const saved = await prisma.prediction.findFirst({
      where: { slug: 'test-slug', term: 'test-term' },
    });
    
    if (saved) {
      console.log('✅ Test prediction found in database:');
      console.log('   ID:', saved.id);
      console.log('   Slug:', saved.slug);
      console.log('   Term:', saved.term);
      console.log('   Predicted Value:', saved.predictedValue);
      console.log('   Confidence:', saved.confidence);
      console.log('   Method:', saved.method);
      console.log('\n✅ All tests passed! Prediction tracking is working.\n');
      
      // Clean up test data
      await prisma.prediction.deleteMany({
        where: { slug: 'test-slug' },
      });
      console.log('🧹 Cleaned up test data');
    } else {
      console.error('❌ Test prediction not found in database');
    }
  } catch (error: any) {
    console.error('❌ Failed to verify test prediction:', error.message);
  }
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });


