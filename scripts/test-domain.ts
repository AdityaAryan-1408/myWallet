import {
  calculateAvailableToSpend,
  calculateDailyPacing,
  calculateCardCycle,
  formatINR,
} from '../src/domain/financialCalculations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Domain Financial Calculations Tests ---');

// Test 1: Standard Available to Spend
{
  const result = calculateAvailableToSpend({
    totalBankCashBalance: 25000,
    totalCreditObligations: 8000,
    totalReservedMoney: 5000,
  });
  assert(result.availableToSpend === 12000, `Expected 12000, got ${result.availableToSpend}`);
  assert(!result.isNegative, 'Expected isNegative to be false');
  console.log('✓ Test 1 Passed: Standard Available to Spend (25000 - 8000 - 5000 = 12000)');
}

// Test 2: Deficit / Negative Available to Spend
{
  const result = calculateAvailableToSpend({
    totalBankCashBalance: 10000,
    totalCreditObligations: 15000,
    totalReservedMoney: 2000,
  });
  assert(result.availableToSpend === -7000, `Expected -7000, got ${result.availableToSpend}`);
  assert(result.isNegative, 'Expected isNegative to be true');
  console.log('✓ Test 2 Passed: Deficit Available to Spend (10000 - 15000 - 2000 = -7000)');
}

// Test 3: Daily Pacing Calculation
{
  const fixedDate = new Date(2026, 8, 15); // Sep 15, 2026 (September has 30 days)
  const pacing = calculateDailyPacing(3000, fixedDate);
  // Days remaining: 30 - 15 + 1 = 16 days
  // Daily limit: Math.floor(3000 / 16) = 187
  assert(pacing.daysRemaining === 16, `Expected 16 days remaining, got ${pacing.daysRemaining}`);
  assert(pacing.dailyLimit === 187, `Expected daily limit 187, got ${pacing.dailyLimit}`);
  console.log(`✓ Test 3 Passed: Daily pacing (${pacing.daysRemaining} days remaining -> ₹${pacing.dailyLimit}/day)`);
}

// Test 4: Credit Card Cycle and Utilization
{
  const testDate = new Date(2026, 8, 10); // Sep 10, 2026
  const cycle = calculateCardCycle(15000, 50000, 20, testDate);
  assert(cycle.utilizationPercentage === 30, `Expected 30%, got ${cycle.utilizationPercentage}%`);
  assert(cycle.utilizationStatus === 'healthy', `Expected healthy, got ${cycle.utilizationStatus}`);
  assert(cycle.daysRemaining === 10, `Expected 10 days remaining, got ${cycle.daysRemaining}`);
  console.log(`✓ Test 4 Passed: Card cycle (util: ${cycle.utilizationPercentage}%, days: ${cycle.daysRemaining})`);
}

// Test 5: Currency Formatting
{
  assert(formatINR(1934) === '₹1,934', `Expected ₹1,934, got ${formatINR(1934)}`);
  assert(formatINR(12500.5, true) === '₹12,500.50', `Expected ₹12,500.50, got ${formatINR(12500.5, true)}`);
  console.log('✓ Test 5 Passed: INR formatting');
}

console.log('All financial calculation tests passed successfully!');
