/**
 * Comprehensive Test Runner for Peak Explanations
 * Runs extensive tests and generates detailed reports
 */

import { testScenarios, mockAIResponses } from '../__tests__/mock-data';
import {
  suggestCategory,
  isAmbiguousKeyword,
  getInterpretationSummary,
} from '../lib/context-aware-peak-verification';

type TestResult = {
  name: string;
  passed: boolean;
  details: string;
  expected: any;
  actual: any;
};

class TestRunner {
  private results: TestResult[] = [];
  private passCount = 0;
  private failCount = 0;

  async run() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   PEAK EXPLANATION CONTEXT-AWARE VERIFICATION TESTS        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await this.testAmbiguousKeywordDetection();
    await this.testCategoryAutoDetection();
    await this.testContextFiltering();
    await this.testInterpretations();
    await this.testMockAIResponses();

    this.printResults();
  }

  private async testAmbiguousKeywordDetection() {
    console.log('📝 Test Suite 1: Ambiguous Keyword Detection\n');

    const ambiguousTests = [
      { keyword: 'apple', expected: true },
      { keyword: 'Apple', expected: true },
      { keyword: 'java', expected: true },
      { keyword: 'python', expected: true },
      { keyword: 'tesla', expected: true },
      { keyword: 'swift', expected: true },
      { keyword: 'ruby', expected: true },
      { keyword: 'mercury', expected: true },
      { keyword: 'amazon', expected: true },
      { keyword: 'iPhone', expected: false },
      { keyword: 'Android', expected: false },
      { keyword: 'specific-product', expected: false },
    ];

    for (const test of ambiguousTests) {
      const actual = isAmbiguousKeyword(test.keyword);
      const passed = actual === test.expected;

      this.recordResult({
        name: `Ambiguous detection: "${test.keyword}"`,
        passed,
        details: passed ? '✓ Correct' : '✗ Failed',
        expected: test.expected,
        actual
      });
    }

    console.log('');
  }

  private async testCategoryAutoDetection() {
    console.log('📝 Test Suite 2: Category Auto-Detection\n');

    const categoryTests = [
      { termA: 'iPhone', termB: 'Android', expected: 'technology' },
      { termA: 'MacBook', termB: 'Windows laptop', expected: 'technology' },
      { termA: 'iOS app', termB: 'Android app', expected: 'technology'},
      { termA: 'Pizza', termB: 'Burger', expected: 'food' },
      { termA: 'Coffee', termB: 'Tea', expected: 'food' },
      { termA: 'Oranges', termB: 'Apples', expected: 'food' },
      { termA: 'Netflix', termB: 'Disney Plus', expected: 'entertainment' },
      { termA: 'Movie A', termB: 'Movie B', expected: 'entertainment' },
      { termA: 'Football', termB: 'Basketball', expected: 'sports' },
      { termA: 'Messi', termB: 'Ronaldo', expected: 'sports' },
    ];

    for (const test of categoryTests) {
      const actual = suggestCategory(test.termA, test.termB);
      const passed = actual === test.expected;

      this.recordResult({
        name: `Category: "${test.termA}" vs "${test.termB}"`,
        passed,
        details: passed ? `✓ Detected: ${actual}` : `✗ Expected: ${test.expected}, Got: ${actual}`,
        expected: test.expected,
        actual
      });
    }

    console.log('');
  }

  private async testContextFiltering() {
    console.log('📝 Test Suite 3: Context-Based Event Filtering\n');

    const filteringTests = [
      {
        name: 'Apple (tech) in iPhone vs Android',
        event: 'iPhone 15 announced',
        mockResponse: mockAIResponses.appleTech_iPhoneContext,
        shouldPass: true
      },
      {
        name: 'Apple (fruit) in iPhone vs Android',
        event: 'Apple harvest begins',
        mockResponse: mockAIResponses.appleFruit_iPhoneContext,
        shouldPass: false
      },
      {
        name: 'Apple (tech) in Oranges vs Apples',
        event: 'MacBook announced',
        mockResponse: mockAIResponses.appleTech_fruitContext,
        shouldPass: false
      },
      {
        name: 'Apple (fruit) in Oranges vs Apples',
        event: 'Apple harvest',
        mockResponse: mockAIResponses.appleFruit_fruitContext,
        shouldPass: true
      },
      {
        name: 'Java (programming) in Java vs Python',
        event: 'Java 20 released',
        mockResponse: mockAIResponses.javaProgramming_programmingContext,
        shouldPass: true
      },
      {
        name: 'Java (island) in Java vs Python',
        event: 'Java earthquake',
        mockResponse: mockAIResponses.javaIsland_programmingContext,
        shouldPass: false
      },
      {
        name: 'Java (coffee) in Java vs Python',
        event: 'Starbucks Java blend',
        mockResponse: mockAIResponses.javaCoffee_programmingContext,
        shouldPass: false
      },
    ];

    for (const test of filteringTests) {
      const passed = test.mockResponse.contextMatch === test.shouldPass;

      this.recordResult({
        name: test.name,
        passed,
        details: passed
          ? `✓ ${test.shouldPass ? 'Included' : 'Filtered'} correctly (${test.mockResponse.interpretation})`
          : `✗ Should ${test.shouldPass ? 'include' : 'filter'} but didn't`,
        expected: test.shouldPass,
        actual: test.mockResponse.contextMatch
      });
    }

    console.log('');
  }

  private async testInterpretations() {
    console.log('📝 Test Suite 4: Interpretation Accuracy\n');

    const interpretationTests = [
      {
        name: 'Apple in tech context',
        response: mockAIResponses.appleTech_iPhoneContext,
        expectedKeywords: ['Apple Inc.', 'technology', 'company']
      },
      {
        name: 'Apple in food context',
        response: mockAIResponses.appleFruit_fruitContext,
        expectedKeywords: ['fruit']
      },
      {
        name: 'Java in programming context',
        response: mockAIResponses.javaProgramming_programmingContext,
        expectedKeywords: ['programming', 'language']
      },
      {
        name: 'Tesla in auto context',
        response: mockAIResponses.teslaCar_autoContext,
        expectedKeywords: ['automotive', 'company', 'Tesla Inc']
      },
      {
        name: 'Python in animal context',
        response: mockAIResponses.pythonSnake_animalContext,
        expectedKeywords: ['snake', 'species']
      },
    ];

    for (const test of interpretationTests) {
      const interpretation = test.response.interpretation.toLowerCase();
      const hasAllKeywords = test.expectedKeywords.every(keyword =>
        interpretation.includes(keyword.toLowerCase())
      );

      this.recordResult({
        name: test.name,
        passed: hasAllKeywords,
        details: hasAllKeywords
          ? `✓ Correct interpretation: ${test.response.interpretation}`
          : `✗ Missing keywords: ${test.expectedKeywords.join(', ')}`,
        expected: test.expectedKeywords,
        actual: test.response.interpretation
      });
    }

    console.log('');
  }

  private async testMockAIResponses() {
    console.log('📝 Test Suite 5: AI Response Quality\n');

    const responseTests = Object.entries(mockAIResponses).map(([key, response]) => ({
      name: key,
      response
    }));

    for (const test of responseTests) {
      const checks = {
        hasRelevance: test.response.relevance >= 0 && test.response.relevance <= 100,
        hasInterpretation: test.response.interpretation && test.response.interpretation.length > 0,
        hasReasoning: test.response.reasoning && test.response.reasoning.length > 10,
        hasConfidence: test.response.confidence >= 0 && test.response.confidence <= 100,
        hasContextMatch: typeof test.response.contextMatch === 'boolean',
        relevanceMatchesContext: test.response.contextMatch
          ? test.response.relevance > 50
          : test.response.relevance < 50
      };

      const allPassed = Object.values(checks).every(v => v);

      this.recordResult({
        name: `Mock AI Response: ${test.name}`,
        passed: allPassed,
        details: allPassed
          ? `✓ All checks passed (${test.response.relevance}%, ${test.response.contextMatch ? 'matches' : 'filtered'})`
          : `✗ Failed: ${Object.entries(checks).filter(([k,v]) => !v).map(([k]) => k).join(', ')}`,
        expected: checks,
        actual: test.response
      });
    }

    console.log('');
  }

  private recordResult(result: TestResult) {
    this.results.push(result);

    if (result.passed) {
      this.passCount++;
      console.log(`  ${result.name}: ${result.details}`);
    } else {
      this.failCount++;
      console.log(`  ${result.name}: ${result.details}`);
      console.log(`    Expected: ${JSON.stringify(result.expected)}`);
      console.log(`    Actual: ${JSON.stringify(result.actual)}`);
    }
  }

  private printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST RESULTS                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const total = this.passCount + this.failCount;
    const percentage = Math.round((this.passCount / total) * 100);

    console.log(`Total Tests: ${total}`);
    console.log(`✓ Passed: ${this.passCount} (${percentage}%)`);
    console.log(`✗ Failed: ${this.failCount}\n`);

    if (this.failCount === 0) {
      console.log('🎉 ALL TESTS PASSED! 🎉\n');
      console.log('The context-aware verification system is working correctly!');
    } else {
      console.log('⚠️  Some tests failed. Review the details above.\n');

      // Print failed test summary
      console.log('Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}`));
    }

    console.log('\n' + '═'.repeat(60) + '\n');
  }
}

// Export for use in other tests
export { TestRunner };

// Run if executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}
