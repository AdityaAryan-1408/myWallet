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

export type CreditCardLifecycleStatus =
  | 'UNBILLED'
  | 'GRACE_PERIOD'
  | 'DUE_SOON'
  | 'DUE_TODAY'
  | 'OVERDUE';

export interface CreditCardLifecycleResult {
  cycleStartDate: Date;
  cycleEndDate: Date;
  daysUntilReset: number;
  paymentDueDate: Date | null;
  daysUntilDue: number | null;
  lifecycleStatus: CreditCardLifecycleStatus;
  statusBadgeText: string;
  statusColor: string;
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
 * Calculates credit card statement lifecycle, grace periods, payment due date countdowns,
 * and overdue alerts.
 */
export function calculateCreditCardLifecycle(
  outstanding: number,
  limit: number,
  cycleResetDay: number,
  paymentDueDay?: number | null,
  isStatementPaid: boolean = false,
  currentDate: Date = new Date()
): CreditCardLifecycleResult {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const currentDay = currentDate.getDate();

  // 1. Utilization calculation
  const utilizationPercentage = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
  let utilizationStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (utilizationPercentage > 50) {
    utilizationStatus = 'critical';
  } else if (utilizationPercentage > 30) {
    utilizationStatus = 'warning';
  }

  // 2. Billing cycle calculation (last statement closed vs upcoming reset date)
  let lastStatementDate: Date;
  let nextStatementDate: Date;

  if (currentDay >= cycleResetDay) {
    lastStatementDate = new Date(currentYear, currentMonth, cycleResetDay);
    nextStatementDate = new Date(currentYear, currentMonth + 1, cycleResetDay);
  } else {
    lastStatementDate = new Date(currentYear, currentMonth - 1, cycleResetDay);
    nextStatementDate = new Date(currentYear, currentMonth, cycleResetDay);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilReset = Math.max(0, Math.ceil((nextStatementDate.getTime() - currentDate.getTime()) / msPerDay));

  // Fallback if card doesn't have an explicit payment due day configured
  if (!paymentDueDay) {
    return {
      cycleStartDate: lastStatementDate,
      cycleEndDate: nextStatementDate,
      daysUntilReset,
      paymentDueDate: null,
      daysUntilDue: null,
      lifecycleStatus: 'UNBILLED',
      statusBadgeText: `Resets ${cycleResetDay}th (${daysUntilReset}d left)`,
      statusColor: '#8F937A',
      utilizationPercentage,
      utilizationStatus,
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 3. Payment due date for the last statement that closed
  const lastDueMonthOffset = paymentDueDay > cycleResetDay ? 0 : 1;
  const lastStatementDueDate = new Date(
    lastStatementDate.getFullYear(),
    lastStatementDate.getMonth() + lastDueMonthOffset,
    paymentDueDay,
    23,
    59,
    59
  );

  const dueDateTime = lastStatementDueDate.getTime();
  const currentDateTime = currentDate.getTime();
  const diffFromLastDueDays = Math.ceil((dueDateTime - currentDateTime) / msPerDay);

  let lifecycleStatus: CreditCardLifecycleStatus = 'UNBILLED';
  let paymentDueDate: Date = lastStatementDueDate;
  let daysUntilDue: number = diffFromLastDueDays;
  let statusBadgeText = '';
  let statusColor = '#8F937A';

  const formattedDueDate = `${monthNames[lastStatementDueDate.getMonth()]} ${lastStatementDueDate.getDate()}`;

  if (outstanding <= 0) {
    // Completely cleared / zero balance
    lifecycleStatus = 'UNBILLED';
    statusBadgeText = `All Clear • Resets ${monthNames[nextStatementDate.getMonth()]} ${nextStatementDate.getDate()}`;
    statusColor = '#22C55E';
  } else if (diffFromLastDueDays < 0) {
    // Past the due date of last statement with outstanding > 0
    if (isStatementPaid) {
      // User settled the statement bill; current balance represents unbilled cycle spends
      const nextDueMonthOffset = paymentDueDay > cycleResetDay ? 0 : 1;
      const nextDueDate = new Date(
        nextStatementDate.getFullYear(),
        nextStatementDate.getMonth() + nextDueMonthOffset,
        paymentDueDay,
        23,
        59,
        59
      );
      paymentDueDate = nextDueDate;
      daysUntilDue = Math.max(0, Math.ceil((nextDueDate.getTime() - currentDateTime) / msPerDay));
      lifecycleStatus = 'UNBILLED';
      statusBadgeText = `Next Due ${monthNames[nextDueDate.getMonth()]} ${nextDueDate.getDate()} (${daysUntilDue}d)`;
      statusColor = '#8F937A';
    } else {
      // Overdue bill from previous statement
      lifecycleStatus = 'OVERDUE';
      const overdueDays = Math.abs(diffFromLastDueDays);
      statusBadgeText = `OVERDUE by ${overdueDays}d (${formattedDueDate})`;
      statusColor = '#EF4444';
    }
  } else if (diffFromLastDueDays === 0) {
    lifecycleStatus = 'DUE_TODAY';
    statusBadgeText = `DUE TODAY (${formattedDueDate})`;
    statusColor = '#F59E0B';
  } else if (diffFromLastDueDays <= 3) {
    lifecycleStatus = 'DUE_SOON';
    statusBadgeText = `DUE IN ${diffFromLastDueDays}d (${formattedDueDate})`;
    statusColor = '#F59E0B';
  } else {
    // In grace period
    lifecycleStatus = 'GRACE_PERIOD';
    statusBadgeText = `Due in ${diffFromLastDueDays}d (${formattedDueDate})`;
    statusColor = '#38BDF8';
  }

  return {
    cycleStartDate: lastStatementDate,
    cycleEndDate: nextStatementDate,
    daysUntilReset,
    paymentDueDate,
    daysUntilDue,
    lifecycleStatus,
    statusBadgeText,
    statusColor,
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
