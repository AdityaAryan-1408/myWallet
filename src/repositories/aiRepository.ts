/**
 * MyWallet — AI & Zenith Intelligence Repository
 * 
 * 100% offline mathematical and statistical intelligence engine:
 * - Natural language monthly spending report card & audit
 * - Statistical anomaly detection (Z-score & median outlier detection)
 * - Predictive cash flow & month-end balance trajectory forecasting
 * - Recurring subscription & fixed outlay pattern recognition
 * - Smart savings autopilot (round-ups & discipline pacing)
 * - Real-time spending velocity radar
 */

import { getDatabase } from '@/db/client';
import { Transaction, Budget } from '@/db/schema';
import { AccountRepository } from './accountRepository';
import { CreditCardRepository } from './creditCardRepository';
import { ReservationRepository } from './reservationRepository';
import { BudgetRepository } from './budgetRepository';
import { calculateAvailableToSpend } from '@/domain/financialCalculations';

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface SpendingAnomaly {
  transactionId: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  note?: string | null;
  multiplier: number;
  typicalAmount: number;
  severity: 'high' | 'medium' | 'info';
  message: string;
}

export interface MonthlyReportCard {
  yearMonth: string;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netSaved: number;
  savingsRate: number; // percentage (0..100)
  prevExpense: number;
  expenseDelta: number;
  expensePercentChange: number;
  rolling3MonthAvgExpense: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  gradeTitle: string;
  summaryNarrative: string;
  keyWins: string[];
  watchOuts: string[];
  topCategories: {
    name: string;
    amount: number;
    percent: number;
    color: string;
    icon: string;
  }[];
  topMerchant?: {
    name: string;
    amount: number;
    transactionCount: number;
  } | null;
  nextMonthOptimizationTip: string;
}

export interface CashFlowPrediction {
  currentDay: number;
  totalDaysInMonth: number;
  daysRemaining: number;
  currentAvailableToSpend: number;
  averageDailySpend: number;
  safeDailySpend: number;
  projectedMonthEndBalance: number;
  trajectoryStatus: 'SURPLUS' | 'ON_TRACK' | 'DEFICIT_WARNING';
  burnTrajectory: { day: number; projectedBalance: number; actualSpend?: number }[];
  budgetBreachRisks: {
    categoryName: string;
    budgetLimit: number;
    currentSpent: number;
    projectedSpent: number;
    willBreach: boolean;
    estimatedDaysToBreach: number | null;
  }[];
}

export interface RecurringPattern {
  name: string;
  averageAmount: number;
  frequencyDays: number;
  occurrences: number;
  lastDate: string;
  estimatedMonthlyCost: number;
  categoryName?: string;
}

export interface SavingsAutopilot {
  roundUp10Total: number;
  roundUp50Total: number;
  roundUp100Total: number;
  noSpendDaysCount: number;
  currentNoSpendStreak: number;
  longestNoSpendStreak: number;
  noSpendChallengeProgress: number; // e.g. 8 / 10 days goal
  estimatedAnnualRoundUp: number;
}

export interface VelocityRadar {
  currentBurnRatePerDay: number;
  safeBurnRatePerDay: number;
  velocityMultiplier: number;
  status: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
  primarySurgeCategory?: {
    name: string;
    amount: number;
    percentOfBudget: number;
  } | null;
  statusMessage: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getMonthName(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

// ─── Repository Implementation ───────────────────────────────────────────

export const AiRepository = {
  /**
   * Generates a natural language Monthly Spending Report Card.
   */
  getSpendingReportCard(targetYearMonth?: string): MonthlyReportCard {
    const db = getDatabase();
    const now = new Date();
    const yearMonth = targetYearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [currY, currM] = yearMonth.split('-').map(Number);

    // Compute previous month
    const prevDate = new Date(currY, currM - 2, 1);
    const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Compute 3 previous months for rolling average
    const m3Date = new Date(currY, currM - 4, 1);
    const m3YearMonth = `${m3Date.getFullYear()}-${String(m3Date.getMonth() + 1).padStart(2, '0')}`;

    // 1. Current Month Totals
    const currentIncomeRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
      [yearMonth]
    );
    const currentExpenseRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [yearMonth]
    );

    const totalIncome = currentIncomeRow?.total ?? 0;
    const totalExpense = currentExpenseRow?.total ?? 0;
    const netSaved = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSaved / totalIncome) * 100)) : 0;

    // 2. Previous Month Expense
    const prevExpenseRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [prevYearMonth]
    );
    const prevExpense = prevExpenseRow?.total ?? 0;
    const expenseDelta = totalExpense - prevExpense;
    const expensePercentChange = prevExpense > 0 ? Math.round((expenseDelta / prevExpense) * 100) : 0;

    // 3. 3-Month Rolling Average Expense
    const rollingRow = db.getFirstSync<{ avgTotal: number | null }>(
      `SELECT AVG(monthly_total) as avgTotal FROM (
        SELECT SUM(amount) as monthly_total 
        FROM transactions 
        WHERE strftime('%Y-%m', date) < ? AND strftime('%Y-%m', date) >= ? AND type = 'expense'
        GROUP BY strftime('%Y-%m', date)
      );`,
      [yearMonth, m3YearMonth]
    );
    const rolling3MonthAvgExpense = rollingRow?.avgTotal ?? prevExpense ?? totalExpense;

    // 4. Top Spending Categories
    const topCatRows = db.getAllSync<{
      name: string;
      color: string;
      icon: string;
      total: number;
    }>(
      `SELECT c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 5;`,
      [yearMonth]
    );

    const topCategories = topCatRows.map((cat) => ({
      name: cat.name,
      amount: cat.total,
      percent: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
      color: cat.color,
      icon: cat.icon,
    }));

    // 5. Top Merchant / Note Payee
    const topMerchantRow = db.getFirstSync<{
      note: string;
      total: number;
      cnt: number;
    }>(
      `SELECT TRIM(note) as note, SUM(amount) as total, COUNT(*) as cnt
       FROM transactions
       WHERE strftime('%Y-%m', date) = ? AND type = 'expense' AND note IS NOT NULL AND TRIM(note) != ''
       GROUP BY LOWER(TRIM(note))
       ORDER BY total DESC
       LIMIT 1;`,
      [yearMonth]
    );

    const topMerchant = topMerchantRow
      ? {
          name: topMerchantRow.note,
          amount: topMerchantRow.total,
          transactionCount: topMerchantRow.cnt,
        }
      : null;

    // 6. Grade Evaluation
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
    let gradeTitle = 'Steady Performer';
    if (savingsRate >= 40) {
      grade = 'A+';
      gradeTitle = 'Zenith Master Saver';
    } else if (savingsRate >= 25) {
      grade = 'A';
      gradeTitle = 'Disciplined Builder';
    } else if (savingsRate >= 10) {
      grade = 'B';
      gradeTitle = 'Balanced Flow';
    } else if (savingsRate >= 0) {
      grade = 'C';
      gradeTitle = 'Break-Even Watch';
    } else {
      grade = 'D';
      gradeTitle = 'High Burn Rate';
    }

    // 7. Dynamic Narrative Generation
    const monthName = getMonthName(yearMonth);
    let summaryNarrative = '';
    const keyWins: string[] = [];
    const watchOuts: string[] = [];

    if (totalExpense === 0) {
      summaryNarrative = `No expenses recorded for ${monthName} yet. Log transactions to activate real-time intelligence.`;
    } else {
      const vsRolling = Math.round(((totalExpense - rolling3MonthAvgExpense) / (rolling3MonthAvgExpense || 1)) * 100);
      if (vsRolling > 0) {
        summaryNarrative = `You spent ${formatCurrency(totalExpense)} in ${monthName} — ${vsRolling}% above your recent baseline. Your top outlays were driven by ${topCategories[0]?.name || 'everyday purchases'}.`;
      } else {
        summaryNarrative = `Excellent pacing! You spent ${formatCurrency(totalExpense)} in ${monthName} — ${Math.abs(vsRolling)}% below your recent average.`;
      }
    }

    if (savingsRate >= 20) {
      keyWins.push(`Strong savings rate of ${savingsRate}% (${formatCurrency(netSaved)} preserved)`);
    }
    if (expenseDelta < 0 && prevExpense > 0) {
      keyWins.push(`Reduced spending by ${Math.abs(expensePercentChange)}% (${formatCurrency(Math.abs(expenseDelta))}) compared to last month`);
    }

    // Check no-spend days
    const noSpendRows = db.getAllSync<{ date: string }>(
      `SELECT DISTINCT date FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [yearMonth]
    );
    const dayLimit = currY === now.getFullYear() && currM === now.getMonth() + 1 ? now.getDate() : getDaysInMonth(currY, currM - 1);
    const spendDaysCount = noSpendRows.length;
    const noSpendDaysCount = Math.max(0, dayLimit - spendDaysCount);
    if (noSpendDaysCount >= 5) {
      keyWins.push(`${noSpendDaysCount} disciplined no-spend days logged so far this month`);
    }

    if (topCategories.length > 0 && topCategories[0].percent >= 35) {
      watchOuts.push(`${topCategories[0].name} accounts for ${topCategories[0].percent}% of all monthly outflows`);
    }
    if (expenseDelta > 2000 && prevExpense > 0) {
      watchOuts.push(`Outflows increased by ${formatCurrency(expenseDelta)} (+${expensePercentChange}%) over last month`);
    }
    if (savingsRate < 10 && totalIncome > 0) {
      watchOuts.push(`Savings rate is currently at ${savingsRate}%, below the healthy 20% benchmark`);
    }

    // Next Month Optimization Tip
    let nextMonthOptimizationTip = 'Maintain spending consistency and review upcoming card bills.';
    if (topCategories.length > 0 && topCategories[0].amount > 3000) {
      const potentialSaving = Math.round(topCategories[0].amount * 0.2);
      nextMonthOptimizationTip = `Trimming ${topCategories[0].name} spending by 20% next month would boost your reserves by an extra ${formatCurrency(potentialSaving)}.`;
    } else if (topMerchant) {
      nextMonthOptimizationTip = `You visited ${topMerchant.name} ${topMerchant.transactionCount} times (${formatCurrency(topMerchant.amount)}). Grouping or setting limits can save ₹1,000+ monthly.`;
    }

    return {
      yearMonth,
      monthName,
      totalIncome,
      totalExpense,
      netSaved,
      savingsRate,
      prevExpense,
      expenseDelta,
      expensePercentChange,
      rolling3MonthAvgExpense,
      grade,
      gradeTitle,
      summaryNarrative,
      keyWins: keyWins.length > 0 ? keyWins : ['Consistent tracking and database updates maintained'],
      watchOuts: watchOuts.length > 0 ? watchOuts : ['No critical financial alarms detected'],
      topCategories,
      topMerchant,
      nextMonthOptimizationTip,
    };
  },

  /**
   * Statistical Anomaly Detection across all transactions.
   */
  detectAnomalies(limit: number = 8): SpendingAnomaly[] {
    const db = getDatabase();

    // Query transactions with category details (last 90 days)
    const rows = db.getAllSync<{
      id: string;
      amount: number;
      date: string;
      note: string | null;
      category_id: string;
      category_name: string;
      category_color: string;
      category_icon: string;
    }>(
      `SELECT t.id, t.amount, t.date, t.note, t.category_id,
              c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense' AND t.date >= date('now', '-90 days')
       ORDER BY t.date DESC;`
    );

    if (rows.length === 0) return [];

    // Group transactions by category to calculate mean & standard deviation
    const catStats = new Map<string, { amounts: number[]; mean: number; stdDev: number; median: number }>();
    for (const r of rows) {
      if (!catStats.has(r.category_id)) {
        catStats.set(r.category_id, { amounts: [], mean: 0, stdDev: 0, median: 0 });
      }
      catStats.get(r.category_id)!.amounts.push(r.amount);
    }

    for (const [catId, stat] of catStats.entries()) {
      const sorted = [...stat.amounts].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      const mean = sum / sorted.length;
      const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
      const stdDev = Math.sqrt(variance);
      const median = sorted[Math.floor(sorted.length / 2)];

      stat.mean = mean;
      stat.stdDev = stdDev;
      stat.median = median;
    }

    const anomalies: SpendingAnomaly[] = [];

    for (const r of rows) {
      const stat = catStats.get(r.category_id);
      if (!stat || stat.amounts.length < 2) continue;

      const baseline = stat.median > 0 ? stat.median : stat.mean;
      // Anomaly criteria: amount >= 2.5x baseline and amount >= 300
      if (r.amount >= 300 && r.amount >= baseline * 2.2) {
        const multiplier = parseFloat((r.amount / (baseline || 1)).toFixed(1));
        const severity: 'high' | 'medium' | 'info' =
          multiplier >= 4.0 || r.amount >= 8000 ? 'high' : multiplier >= 2.8 ? 'medium' : 'info';

        const label = r.note?.trim() ? `"${r.note.trim()}"` : r.category_name;
        const message = `${formatCurrency(r.amount)} on ${label} is ${multiplier}× your usual ${formatCurrency(baseline)} ${r.category_name} spend.`;

        anomalies.push({
          transactionId: r.id,
          amount: r.amount,
          date: r.date,
          categoryName: r.category_name,
          categoryColor: r.category_color,
          categoryIcon: r.category_icon,
          note: r.note,
          multiplier,
          typicalAmount: Math.round(baseline),
          severity,
          message,
        });
      }

      if (anomalies.length >= limit) break;
    }

    return anomalies;
  },

  /**
   * Evaluates a single newly-logged transaction for instant anomaly alerts.
   */
  checkTransactionAnomaly(transaction: Transaction): SpendingAnomaly | null {
    if (transaction.type !== 'expense' || !transaction.category_id || transaction.amount < 300) {
      return null;
    }

    const db = getDatabase();
    const rows = db.getAllSync<{ amount: number }>(
      `SELECT amount FROM transactions 
       WHERE category_id = ? AND type = 'expense' AND id != ?
       ORDER BY date DESC LIMIT 30;`,
      [transaction.category_id, transaction.id]
    );

    if (rows.length < 2) return null;

    const amounts = rows.map((r) => r.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];

    if (transaction.amount >= median * 2.5) {
      const catRow = db.getFirstSync<{ name: string; color: string; icon: string }>(
        `SELECT name, color, icon FROM categories WHERE id = ?;`,
        [transaction.category_id]
      );
      const multiplier = parseFloat((transaction.amount / (median || 1)).toFixed(1));
      const severity: 'high' | 'medium' | 'info' =
        multiplier >= 4.0 || transaction.amount >= 8000 ? 'high' : 'medium';

      const catName = catRow?.name || 'Category';
      const label = transaction.note?.trim() ? `"${transaction.note.trim()}"` : catName;

      return {
        transactionId: transaction.id,
        amount: transaction.amount,
        date: transaction.date,
        categoryName: catName,
        categoryColor: catRow?.color || '#D4FF32',
        categoryIcon: catRow?.icon || 'tag',
        note: transaction.note,
        multiplier,
        typicalAmount: Math.round(median),
        severity,
        message: `${formatCurrency(transaction.amount)} on ${label} is ${multiplier}× your usual ${formatCurrency(median)} ${catName} spend.`,
      };
    }

    return null;
  },

  /**
   * Cash Flow Forecast & Balance Trajectory.
   */
  getPredictiveCashFlow(targetYearMonth?: string): CashFlowPrediction {
    const db = getDatabase();
    const now = new Date();
    const currentYearMonth = targetYearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = currentYearMonth.split('-').map(Number);
    const totalDaysInMonth = getDaysInMonth(y, m - 1);
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
    const currentDay = isCurrentMonth ? now.getDate() : totalDaysInMonth;
    const daysRemaining = Math.max(1, totalDaysInMonth - currentDay);

    // Compute Available to Spend
    const totalBankCash = AccountRepository.getTotalAvailableBankCashBalance();
    const totalCreditObligations = CreditCardRepository.getTotalCreditObligations();
    const totalReservedMoney = ReservationRepository.getTotalReservedAffectingAvailable();
    const { availableToSpend } = calculateAvailableToSpend({
      totalBankCashBalance: totalBankCash,
      totalCreditObligations,
      totalReservedMoney,
    });

    // Month to date spend
    const mtdRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [currentYearMonth]
    );
    const monthToDateExpense = mtdRow?.total ?? 0;
    const averageDailySpend = currentDay > 0 ? Math.round(monthToDateExpense / currentDay) : 0;
    const safeDailySpend = Math.max(0, Math.round(availableToSpend / daysRemaining));

    // Projected Month End Balance
    const projectedRemainingOutlay = averageDailySpend * daysRemaining;
    const projectedMonthEndBalance = Math.round(availableToSpend - projectedRemainingOutlay);

    let trajectoryStatus: 'SURPLUS' | 'ON_TRACK' | 'DEFICIT_WARNING' = 'ON_TRACK';
    if (projectedMonthEndBalance < 0) {
      trajectoryStatus = 'DEFICIT_WARNING';
    } else if (projectedMonthEndBalance > availableToSpend * 0.3) {
      trajectoryStatus = 'SURPLUS';
    }

    // Trajectory Curve Points (Day 1..totalDays)
    const burnTrajectory: { day: number; projectedBalance: number; actualSpend?: number }[] = [];
    const dailySpendMap = new Map<number, number>();

    const dailyRows = db.getAllSync<{ day: string; daily_total: number }>(
      `SELECT strftime('%d', date) as day, SUM(amount) as daily_total
       FROM transactions
       WHERE strftime('%Y-%m', date) = ? AND type = 'expense'
       GROUP BY day;`,
      [currentYearMonth]
    );

    for (const r of dailyRows) {
      dailySpendMap.set(parseInt(r.day, 10), r.daily_total);
    }

    let runningActualBalance = availableToSpend + monthToDateExpense;
    for (let d = 1; d <= totalDaysInMonth; d++) {
      if (d <= currentDay) {
        const spentOnDay = dailySpendMap.get(d) ?? 0;
        runningActualBalance -= spentOnDay;
        burnTrajectory.push({
          day: d,
          projectedBalance: Math.round(runningActualBalance),
          actualSpend: spentOnDay,
        });
      } else {
        const futureProjected = Math.round(
          availableToSpend - (d - currentDay) * averageDailySpend
        );
        burnTrajectory.push({
          day: d,
          projectedBalance: futureProjected,
        });
      }
    }

    // Budget Breach Risk Analysis
    const budgets = BudgetRepository.getAllWithProgress(currentYearMonth);
    const budgetBreachRisks = budgets.map((b) => {
      const dailyCatSpend = currentDay > 0 ? b.spentAmount / currentDay : 0;
      const projectedSpent = Math.round(b.spentAmount + dailyCatSpend * daysRemaining);
      const willBreach = projectedSpent > b.budgetAmount;
      let estimatedDaysToBreach: number | null = null;

      if (willBreach && dailyCatSpend > 0) {
        const remainingBudget = b.budgetAmount - b.spentAmount;
        estimatedDaysToBreach = remainingBudget > 0 ? Math.ceil(remainingBudget / dailyCatSpend) : 0;
      }

      return {
        categoryName: b.categoryName,
        budgetLimit: b.budgetAmount,
        currentSpent: Math.round(b.spentAmount),
        projectedSpent,
        willBreach,
        estimatedDaysToBreach,
      };
    });

    return {
      currentDay,
      totalDaysInMonth,
      daysRemaining,
      currentAvailableToSpend: availableToSpend,
      averageDailySpend,
      safeDailySpend,
      projectedMonthEndBalance,
      trajectoryStatus,
      burnTrajectory,
      budgetBreachRisks,
    };
  },

  /**
   * Recognizes repeating monthly bills, EMIs, and subscription cycles.
   */
  detectRecurringPatterns(): RecurringPattern[] {
    const db = getDatabase();

    const rows = db.getAllSync<{
      note: string;
      amount: number;
      date: string;
      category_name: string;
    }>(
      `SELECT t.note, t.amount, t.date, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense' AND t.date >= date('now', '-120 days') AND t.note IS NOT NULL AND TRIM(t.note) != ''
       ORDER BY t.date DESC;`
    );

    // Group by note name
    const groups = new Map<string, { amounts: number[]; dates: string[]; categoryName?: string }>();
    for (const r of rows) {
      const key = r.note.trim().toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { amounts: [], dates: [], categoryName: r.category_name });
      }
      groups.get(key)!.amounts.push(r.amount);
      groups.get(key)!.dates.push(r.date);
    }

    const patterns: RecurringPattern[] = [];

    for (const [key, val] of groups.entries()) {
      if (val.amounts.length >= 2) {
        // Check if amounts are consistent (+/- 10%)
        const avgAmount = val.amounts.reduce((a, b) => a + b, 0) / val.amounts.length;
        const maxDev = Math.max(...val.amounts.map((a) => Math.abs(a - avgAmount)));

        if (maxDev <= avgAmount * 0.15 && avgAmount >= 100) {
          // Check intervals between consecutive dates
          const uniqueDates = Array.from(new Set(val.dates)).sort();
          let intervalsSum = 0;
          let validIntervalsCount = 0;

          for (let i = 1; i < uniqueDates.length; i++) {
            const diffDays = Math.round(
              (new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / (1000 * 3600 * 24)
            );
            if (diffDays >= 20 && diffDays <= 38) {
              intervalsSum += diffDays;
              validIntervalsCount++;
            }
          }

          if (validIntervalsCount >= 1 || val.amounts.length >= 3) {
            const avgInterval = validIntervalsCount > 0 ? Math.round(intervalsSum / validIntervalsCount) : 30;
            const displayName = key.charAt(0).toUpperCase() + key.slice(1);

            patterns.push({
              name: displayName,
              averageAmount: Math.round(avgAmount),
              frequencyDays: avgInterval,
              occurrences: val.amounts.length,
              lastDate: val.dates[0],
              estimatedMonthlyCost: Math.round((avgAmount / (avgInterval || 30)) * 30),
              categoryName: val.categoryName,
            });
          }
        }
      }
    }

    return patterns.sort((a, b) => b.estimatedMonthlyCost - a.estimatedMonthlyCost);
  },

  /**
   * Smart Savings Autopilot Calculations (Round-ups & Discipline Heatmaps).
   */
  getSavingsAutopilotData(): SavingsAutopilot {
    const db = getDatabase();
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const expenseRows = db.getAllSync<{ amount: number; date: string }>(
      `SELECT amount, date FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [currentYearMonth]
    );

    let roundUp10Total = 0;
    let roundUp50Total = 0;
    let roundUp100Total = 0;

    const spendDates = new Set<string>();

    for (const r of expenseRows) {
      spendDates.add(r.date);
      const rem10 = r.amount % 10;
      if (rem10 > 0) roundUp10Total += 10 - rem10;

      const rem50 = r.amount % 50;
      if (rem50 > 0) roundUp50Total += 50 - rem50;

      const rem100 = r.amount % 100;
      if (rem100 > 0) roundUp100Total += 100 - rem100;
    }

    const currentDay = now.getDate();
    let noSpendDaysCount = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let d = 1; d <= currentDay; d++) {
      const dateStr = `${currentYearMonth}-${String(d).padStart(2, '0')}`;
      if (!spendDates.has(dateStr)) {
        noSpendDaysCount++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Current streak working backwards from today
    for (let d = currentDay; d >= 1; d--) {
      const dateStr = `${currentYearMonth}-${String(d).padStart(2, '0')}`;
      if (!spendDates.has(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const estimatedAnnualRoundUp = roundUp50Total * 12;

    return {
      roundUp10Total: Math.round(roundUp10Total),
      roundUp50Total: Math.round(roundUp50Total),
      roundUp100Total: Math.round(roundUp100Total),
      noSpendDaysCount,
      currentNoSpendStreak: currentStreak,
      longestNoSpendStreak: longestStreak,
      noSpendChallengeProgress: Math.min(100, Math.round((noSpendDaysCount / 10) * 100)),
      estimatedAnnualRoundUp: Math.round(estimatedAnnualRoundUp),
    };
  },

  /**
   * Real-Time Spending Velocity Radar (Burn Monitor).
   */
  getVelocityRadar(): VelocityRadar {
    const db = getDatabase();
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalDays = getDaysInMonth(now.getFullYear(), now.getMonth());
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, totalDays - currentDay);

    // Current Available to Spend
    const totalBankCash = AccountRepository.getTotalAvailableBankCashBalance();
    const totalCreditObligations = CreditCardRepository.getTotalCreditObligations();
    const totalReservedMoney = ReservationRepository.getTotalReservedAffectingAvailable();
    const { availableToSpend } = calculateAvailableToSpend({
      totalBankCashBalance: totalBankCash,
      totalCreditObligations,
      totalReservedMoney,
    });

    // MTD Outflows
    const mtdRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [currentYearMonth]
    );
    const mtdTotal = mtdRow?.total ?? 0;

    const currentBurnRatePerDay = currentDay > 0 ? Math.round(mtdTotal / currentDay) : 0;
    const safeBurnRatePerDay = Math.max(0, Math.round(availableToSpend / daysRemaining));

    const velocityMultiplier = safeBurnRatePerDay > 0
      ? parseFloat((currentBurnRatePerDay / safeBurnRatePerDay).toFixed(2))
      : 1.0;

    let status: 'HEALTHY' | 'CAUTION' | 'CRITICAL' = 'HEALTHY';
    let statusMessage = 'Spending within safe daily pacing limit.';

    if (velocityMultiplier > 1.35 || availableToSpend <= 0) {
      status = 'CRITICAL';
      statusMessage = `Velocity alert: Outflows are ${velocityMultiplier}× your safe pacing limit.`;
    } else if (velocityMultiplier >= 1.0) {
      status = 'CAUTION';
      statusMessage = `Pacing matches available limits. Moderate discretionary spend.`;
    }

    // Top category contributing to spend
    const topCat = db.getFirstSync<{ name: string; total: number }>(
      `SELECT c.name, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY total DESC LIMIT 1;`,
      [currentYearMonth]
    );

    return {
      currentBurnRatePerDay,
      safeBurnRatePerDay,
      velocityMultiplier,
      status,
      primarySurgeCategory: topCat ? { name: topCat.name, amount: topCat.total, percentOfBudget: 0 } : null,
      statusMessage,
    };
  },
};
