/**
 * MyWallet — Financial Calculation Engine
 * 
 * Single authoritative source for all core financial formulas:
 *   Available to Spend = Total Bank/Cash Balance − Credit Obligations − Reserved Money
 */

export interface AvailableToSpendInput {
  totalBankCashBalance: number;
  totalCreditObligations: number;
  totalReservedMoney: number;
}

export interface AvailableToSpendResult {
  availableToSpend: number;
  totalBankCashBalance: number;
  totalCreditObligations: number;
  totalReservedMoney: number;
  isNegative: boolean;
}

export interface DailyPacingResult {
  dailyLimit: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  formattedLimit: string;
}

export interface CreditCardCycleResult {
  cycleStartDate: Date;
  cycleEndDate: Date;
  daysRemaining: number;
  utilizationPercentage: number;
  utilizationStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Calculates the core derived metric: Safe-to-Spend / Available Capital.
 * Formula: Total Bank/Cash Balance - Credit Obligations - Reserved Money
 */
export function calculateAvailableToSpend(input: AvailableToSpendInput): AvailableToSpendResult {
  const { totalBankCashBalance, totalCreditObligations, totalReservedMoney } = input;
  const available = totalBankCashBalance - totalCreditObligations - totalReservedMoney;

  return {
    availableToSpend: Math.round(available * 100) / 100,
    totalBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
    isNegative: available < 0,
  };
}

/**
 * Calculates the recommended daily spending limit through the end of the current month.
 */
export function calculateDailyPacing(
  availableToSpend: number,
  currentDate: Date = new Date()
): DailyPacingResult {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const currentDay = currentDate.getDate();

  // Total days in the current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  const dailyLimit = availableToSpend > 0 ? Math.floor(availableToSpend / daysRemaining) : 0;

  return {
    dailyLimit,
    daysRemaining,
    totalDaysInMonth,
    formattedLimit: `₹${dailyLimit.toLocaleString('en-IN')}/day`,
  };
}

/**
 * Calculates credit card utilization and billing cycle countdown.
 */
export function calculateCardCycle(
  outstanding: number,
  limit: number,
  resetDay: number,
  currentDate: Date = new Date()
): CreditCardCycleResult {
  const utilizationPercentage = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;

  let utilizationStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (utilizationPercentage > 50) {
    utilizationStatus = 'critical';
  } else if (utilizationPercentage > 30) {
    utilizationStatus = 'warning';
  }

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  let nextResetDate: Date;
  let cycleStartDate: Date;

  if (currentDay < resetDay) {
    // Current cycle started last month on resetDay
    cycleStartDate = new Date(currentYear, currentMonth - 1, resetDay);
    nextResetDate = new Date(currentYear, currentMonth, resetDay);
  } else {
    // Current cycle started this month on resetDay
    cycleStartDate = new Date(currentYear, currentMonth, resetDay);
    nextResetDate = new Date(currentYear, currentMonth + 1, resetDay);
  }

  const diffMs = nextResetDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    cycleStartDate,
    cycleEndDate: nextResetDate,
    daysRemaining,
    utilizationPercentage,
    utilizationStatus,
  };
}

/**
 * Formats standard Indian Rupee currency with commas and optional decimals.
 */
export function formatINR(amount: number, includeDecimals: boolean = false): string {
  const rounded = Math.round(amount * 100) / 100;
  if (includeDecimals) {
    return `₹${rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${Math.round(rounded).toLocaleString('en-IN')}`;
}
