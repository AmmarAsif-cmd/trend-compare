# Testing Guide - Context-Aware Peak Explanations

Complete guide to testing the context-aware peak explanation functionality.

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install -D vitest tsx @anthropic-ai/sdk
```

### Run All Tests
```bash
# Option 1: Vitest (recommended)
npm run test

# Option 2: Test script
npx tsx scripts/test-peak-explanations.ts

# Option 3: Specific test file
npm run test __tests__/context-aware-verification.test.ts
```

---

## 📁 Test Files

### 1. Mock Data (`__tests__/mock-data.ts`)
Contains all test fixtures:
- Wikipedia event responses
- GDELT news article responses
- AI verification responses
- 5 comprehensive test scenarios

### 2. Unit Tests (`__tests__/context-aware-verification.test.ts`)
Vitest test suite with:
- 51 unit tests
- Mock API responses
- Integration tests for full scenarios
- Assertion-based validation

### 3. Test Runner (`scripts/test-peak-explanations.ts`)
Comprehensive test runner that:
- Runs all test suites
- Generates detailed reports
- Shows pass/fail statistics
- Can be run standalone

### 4. Expected Results (`TEST_RESULTS_EXPECTED.md`)
Documentation showing:
- Expected test output
- Test coverage details
- Success criteria
- Failure scenarios to watch for

---

## 🧪 What Gets Tested

### Test Suite 1: Ambiguous Keyword Detection (12 tests)
Tests `isAmbiguousKeyword()` function:

```typescript
isAmbiguousKeyword('apple')     // → true ✓
isAmbiguousKeyword('java')      // → true ✓
isAmbiguousKeyword('python')    // → true ✓
isAmbiguousKeyword('iPhone')    // → false ✓
```

**Validates**: System correctly identifies 20+ ambiguous keywords

---

### Test Suite 2: Category Auto-Detection (10 tests)
Tests `suggestCategory()` function:

```typescript
suggestCategory('iPhone', 'Android')        // → 'technology' ✓
suggestCategory('Pizza', 'Burger')          // → 'food' ✓
suggestCategory('Netflix', 'Disney Plus')   // → 'entertainment' ✓
suggestCategory('Messi', 'Ronaldo')         // → 'sports' ✓
```

**Validates**: System auto-detects comparison category correctly

---

### Test Suite 3: Context-Based Event Filtering (7 tests)
Tests `verifyEventWithContext()` and filtering:

```typescript
// Scenario: iPhone vs Android (tech context)
Event: "Apple unveils iPhone 15"
→ Relevance: 98%, Context Match: YES ✓ INCLUDED

Event: "Apple fruit harvest"
→ Relevance: 5%, Context Match: NO ✓ FILTERED

// Scenario: Oranges vs Apples (food context)
Event: "Apple unveils iPhone 15"
→ Relevance: 8%, Context Match: NO ✓ FILTERED

Event: "Apple fruit harvest"
→ Relevance: 92%, Context Match: YES ✓ INCLUDED
```

**Validates**: Events filtered correctly based on comparison context

---

### Test Suite 4: Interpretation Accuracy (5 tests)
Tests interpretation strings:

```typescript
// iPhone vs Android context
Interpretation: "Apple Inc. (technology company)" ✓

// Oranges vs Apples context
Interpretation: "Apple (fruit)" ✓

// Java vs Python context
Interpretation: "Java (programming language)" ✓
```

**Validates**: AI provides clear, accurate interpretations

---

### Test Suite 5: AI Response Quality (11 tests)
Tests all mock AI responses:

```typescript
Response validation:
✓ Relevance score: 0-100
✓ Interpretation: non-empty string
✓ Reasoning: > 10 characters
✓ Confidence: 0-100
✓ Context match: boolean
✓ Logic: high relevance = context match
```

**Validates**: All AI responses have correct structure

---

## 🎯 Test Scenarios

### Scenario 1: Apple (Tech vs Food)

**Test**: Same keyword, different contexts

```typescript
// Context 1: iPhone vs Android (TECH)
Peak: "Apple" on 2023-09-12
Expected: Show iPhone 15 event ✓
Filter:   Apple harvest ✗

// Context 2: Oranges vs Apples (FOOD)
Peak: "Apple" on 2023-09-12
Expected: Show apple harvest ✓
Filter:   iPhone 15 event ✗
```

**Result**: ✓ Different events for same peak based on context

---

### Scenario 2: Java (Programming vs Geography vs Coffee)

**Test**: Keyword with 3+ meanings

```typescript
// Context: Java vs Python (PROGRAMMING)
Peak: "Java" on 2023-03-21

Events found:
1. "Oracle releases Java 20" → 96%, INCLUDED ✓
2. "Java island earthquake" → 3%, FILTERED ✗
3. "Starbucks Java coffee" → 12%, FILTERED ✗
```

**Result**: ✓ Only programming events shown

---

### Scenario 3: Tesla (Car vs Scientist)

**Test**: Company vs person disambiguation

```typescript
// Context: Model 3 vs Bolt (AUTOMOTIVE)
Peak: "Tesla" on 2023-07-19

Events found:
1. "Tesla Q2 deliveries" → 94%, INCLUDED ✓
2. "Nikola Tesla museum" → 15%, FILTERED ✗
```

**Result**: ✓ Only car company events shown

---

### Scenario 4: Python (Programming vs Animal)

**Test**: Tech vs nature context

```typescript
// Context: Snakes vs Lizards (ANIMALS)
Peak: "Python" on 2023-06-05

Events found:
1. "Python 3.12 beta" → 8%, FILTERED ✗
2. "17-foot python captured" → 88%, INCLUDED ✓
```

**Result**: ✓ Only animal events shown

---

## 📊 Success Criteria

### All Tests Must Pass (51/51)
```
✓ Ambiguous detection: 12/12
✓ Category detection: 10/10
✓ Event filtering: 7/7
✓ Interpretation: 5/5
✓ AI responses: 11/11
────────────────────────
Total: 51/51 (100%) ✓
```

### Zero Failures
```
✗ Failed: 0
```

### Specific Validations
```
✓ No false positives (wrong events included)
✓ No false negatives (correct events filtered)
✓ All interpretations accurate
✓ All categories correct
```

---

## 🔧 Running Individual Test Suites

### Test Ambiguous Keywords Only
```typescript
import { isAmbiguousKeyword } from './lib/context-aware-peak-verification';

console.log(isAmbiguousKeyword('apple'));    // true
console.log(isAmbiguousKeyword('java'));     // true
console.log(isAmbiguousKeyword('iPhone'));   // false
```

### Test Category Detection Only
```typescript
import { suggestCategory } from './lib/context-aware-peak-verification';

console.log(suggestCategory('iPhone', 'Android'));  // 'technology'
console.log(suggestCategory('Pizza', 'Burger'));    // 'food'
```

### Test Full Verification (with mocks)
```typescript
import { verifyEventWithContext } from './lib/context-aware-peak-verification';

const result = await verifyEventWithContext(
  {
    title: "Apple unveils iPhone 15",
    description: "...",
    date: new Date('2023-09-12'),
    source: "Wikipedia"
  },
  'Apple',
  { termA: 'iPhone', termB: 'Android' },
  new Date('2023-09-12')
);

console.log(result.interpretation);  // "Apple Inc. (technology company)"
console.log(result.contextMatch);    // true
console.log(result.relevanceScore);  // 98
```

---

## 🐛 Debugging Failed Tests

### If a test fails:

**1. Check which test failed**
```bash
npm run test -- --reporter=verbose
```

**2. Check expected vs actual**
```
Test: Apple in tech context
Expected: Apple Inc. (technology company)
Actual: Apple (fruit)
→ Problem: Wrong interpretation
```

**3. Verify mock data**
Check `__tests__/mock-data.ts`:
- Are mock responses correct?
- Do they match test expectations?

**4. Check AI prompt logic**
Check `lib/context-aware-peak-verification.ts`:
- Is prompt including comparison context?
- Is parsing response correctly?

**5. Run single test**
```bash
npm run test -- -t "Apple in tech context"
```

---

## 📈 Performance Benchmarks

### Expected Performance

```
Test execution time: < 2 seconds
Memory usage: < 100MB
API calls (mocked): 0
Coverage: 100% of context functions
```

### If tests are slow:

1. **Check API mocking**: Real API calls will slow tests
2. **Check data fixtures**: Too much mock data?
3. **Check async operations**: Awaiting too many promises?

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All 51 tests passing
- [ ] Zero failures
- [ ] Mock data covers all scenarios
- [ ] Real API key set for integration tests
- [ ] Test on staging environment
- [ ] Verify with real Wikipedia/GDELT APIs
- [ ] Check AI verification costs
- [ ] Monitor first 100 real comparisons

---

## 🎊 Success Output

When all tests pass, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║                      TEST RESULTS                          ║
╚════════════════════════════════════════════════════════════╝

Total Tests: 51
✓ Passed: 51 (100%)
✗ Failed: 0

🎉 ALL TESTS PASSED! 🎉

The context-aware verification system is working correctly!
```

---

## 🚀 Next Steps After Tests Pass

1. **Integration Testing**: Test with real Wikipedia/GDELT APIs
2. **User Testing**: A/B test with real users
3. **Monitoring**: Track accuracy in production
4. **Iteration**: Improve based on real-world results

---

## 📞 Troubleshooting

### Tests won't run
```bash
# Install missing dependencies
npm install -D vitest tsx @anthropic-ai/sdk

# Clear cache
rm -rf node_modules/.vite
npm run test -- --no-cache
```

### Mock API not working
```bash
# Verify mock is imported
import { vi } from 'vitest';

# Check vi.mock() is at top of test file
vi.mock('@anthropic-ai/sdk', ...)
```

### TypeScript errors
```bash
# Check tsconfig.json includes test files
{
  "include": ["**/*.ts", "**/*.tsx"]
}
```

---

**Ready to test? Run: `npm run test`** 🧪
