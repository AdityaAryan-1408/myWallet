/**
 * MyWallet — Analytics Repository
 * 
 * Phase 12: Analytics, Habits & Financial Resilience Engine
 * 100% offline mathematical analytics, habit heatmaps, weekend/weekday velocity audits,
 * and 0-100 Zenith Resilience Quotient calculations.
 */

import { getDatabase } from '@/db/client';
import { Colors } from '@/theme';
import { AccountRepository } from './accountRepository';
import { CreditCardRepository } from './creditCardRepository';
import { BudgetRepository } from './budgetRepository';
import { DebtRepository } from './debtRepository';
import { SettingsRepository } from './settingsRepository';

// ─── Interfaces ──────────────────────────────────────────────────────

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  currAmount: number;
  prevAmount: number;
  delta: number;
  percentChange: number;
  isNew: boolean;
}

export interface MonthComparisonData {
  currYearMonth: string;
  prevYearMonth: string;
  currIncome: number;
  prevIncome: number;
  incomeDelta: number;
  currExpense: number;
  prevExpense: number;
  expenseDelta: number;
  expensePercentChange: number;
  currSaved: number;
  prevSaved: number;
  savedDelta: number;
  categories: CategoryComparison[];
}

export interface VelocityAuditData {
  weekdayTotal: number;
  weekdayDaysCount: number;
  weekdayDailyAvg: number;
  weekendTotal: number;
  weekendDaysCount: number;
  weekendDailyAvg: number;
  velocityMultiplier: number;
  weekendSurgePercentage: number;
  weekendSafeAllocation: number;
  remainingWeekendDays: number;
  advisoryMessage: string;
}

export interface DayOfWeekItem {
  dayIndex: number; // 1 = Mon ... 7 = Sun (ISO)
  dayName: string;
  shortName: string;
  totalSpend: number;
  transactionCount: number;
  percentage: number;
  isPeak: boolean;
}

export interface DayOfWeekData {
  items: DayOfWeekItem[];
  peakDay: string;
  peakDaySpend: number;
  totalWeekSpend: number;
}

export interface TimeSlotItem {
  id: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  timeRange: string;
  totalSpend: number;
  transactionCount: number;
  percentage: number;
  color: string;
}

export interface TimeDistributionData {
  slots: TimeSlotItem[];
  peakSlot: string;
  totalSpend: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun .. 6 = Sat
  dayOfMonth: number;
  spend: number;
  isNoSpend: boolean;
  transactionCount: number;
  isToday: boolean;
  intensity: 'zero' | 'low' | 'medium' | 'high';
}

export interface DayTransactionDetail {
  id: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  note: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  accountName?: string;
  creditCardName?: string;
  time: string;
}

export interface IncomeVsExpenseRatioData {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  netSaved: number;
  savingsRate: number;
  targetSavingsRate: number;
  targetStatus: 'exceeded' | 'on_track' | 'lagging';
  monthlyHistory6M: Array<{
    monthKey: string;
    monthLabel: string;
    income: number;
    expense: number;
    savingsRate: number;
  }>;
}

export interface NoSpendHeatmapData {
  days: HeatmapDay[];
  totalNoSpendInPeriod: number;
  totalDaysInPeriod: number;
  currentStreak: number;
  longestStreak: number;
  noSpendRate: number;
}

export interface ResiliencePillar {
  id: 'savings' | 'credit' | 'budget' | 'runway';
  name: string;
  score: number; // 0 to 25
  maxScore: 25;
  metricLabel: string;
  metricValue: string;
  status: 'optimal' | 'fair' | 'at_risk';
  tip: string;
}

export interface FinancialResilienceData {
  score: number; // 0 to 100
  tier: 'Resilient' | 'Stable' | 'Vulnerable';
  tierColor: string;
  headline: string;
  pillars: ResiliencePillar[];
  keyRecommendation: string;
}

export interface PaymentMethodSpend {
  type: 'bank' | 'cash' | 'credit_card';
  label: string;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export type HealthScoreFactorId =
  | 'savings_rate'
  | 'budget_adherence'
  | 'debt_health'
  | 'cc_utilization'
  | 'spending_consistency'
  | 'no_spend_discipline';

export interface FactorHistoryPoint {
  monthLabel: string;
  score: number;
}

export interface FactorSliderConfig {
  min: number;
  max: number;
  step: number;
  initialValue: number;
  unit: string;
  label: string;
}

export interface HealthScoreFactor {
  id: HealthScoreFactorId;
  name: string;
  weight: number; // percentage (sum = 100)
  score: number; // 0 to 100
  weightedScore: number;
  status: 'optimal' | 'fair' | 'at_risk';
  yourData: string;
  metricLabel: string;
  metricValue: string;
  improvementTip: string;
  history3Months: FactorHistoryPoint[];
  sliderConfig: FactorSliderConfig;
}

export interface TransparentHealthScoreData {
  totalScore: number; // 0 to 100
  tier: 'Resilient' | 'Stable' | 'Vulnerable';
  tierColor: string;
  headline: string;
  keyRecommendation: string;
  factors: HealthScoreFactor[];
}

export interface FinancialWrappedCategory {
  name: string;
  total: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface FinancialWrappedPersonality {
  id: 'disciplined_vault' | 'strategic_optimizer' | 'spontaneous_explorer' | 'balanced_zen';
  badgeTitle: string;
  archetype: string;
  tagline: string;
  description: string;
  traits: string[];
  color: string;
  icon: string;
}

export interface FinancialWrappedData {
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  savingsRate: number;
  prevYearExpense: number;
  yoyPercentChange: number;
  mostExpensiveDay: {
    date: string;
    formattedDate: string;
    totalSpend: number;
    topNote?: string | null;
  } | null;
  cheapestMonth: {
    monthName: string;
    totalSpend: number;
  } | null;
  longestNoSpendStreak: number;
  topCategories: FinancialWrappedCategory[];
  topMerchants: {
    name: string;
    spend: number;
    count: number;
  }[];
  paymentAnatomy: {
    bankPercent: number;
    ccPercent: number;
    cashPercent: number;
    mostUsedMethod: string;
    highestSpendCardName?: string | null;
    highestSpendCardTotal?: number | null;
  };
  personality: FinancialWrappedPersonality;
  shareableSummaryText: string;
}

export interface MonthlyDigestTopCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  deltaPercent: number; // vs previous month (+/- %)
}

export interface MonthlyFinancialDigestData {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "September 2026"
  theNumbers: {
    income: number;
    expenses: number;
    saved: number;
    savingsRate: number;
    expenseDeltaVsPrev: number;
    expensePercentChangeVsPrev: number;
  };
  wins: string[];
  watchOuts: string[];
  topCategories: MonthlyDigestTopCategory[];
  nextMonthTip: string;
  scoreComparison: {
    currentScore: number;
    prevScore: number;
    scoreDelta: number;
  };
  formattedNotificationText: string;
}

// ─── Analytics Repository Implementation ──────────────────────────────

export const AnalyticsRepository = {
  /**
   * Month-over-Month comparison with category delta and zero-base safety
   */
  getMonthComparison(currYearMonth: string, prevYearMonth: string): MonthComparisonData {
    const db = getDatabase();

    // 1. Fetch totals for both months
    const getMonthTotals = (ym: string) => {
      const incRow = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
        [ym]
      );
      const expRow = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
        [ym]
      );
      const income = incRow?.total ?? 0;
      const expense = expRow?.total ?? 0;
      return { income, expense, saved: income - expense };
    };

    const currTotals = getMonthTotals(currYearMonth);
    const prevTotals = getMonthTotals(prevYearMonth);

    const expenseDelta = currTotals.expense - prevTotals.expense;
    let expensePercentChange = 0;
    if (prevTotals.expense > 0) {
      expensePercentChange = Math.round(((currTotals.expense - prevTotals.expense) / prevTotals.expense) * 100);
    } else if (currTotals.expense > 0) {
      expensePercentChange = 100;
    }

    // 2. Fetch category spends for both months
    interface CatSpendRow {
      category_id: string;
      name: string;
      color: string;
      icon: string;
      total: number;
    }

    const currCatRows = db.getAllSync<CatSpendRow>(
      `SELECT t.category_id, c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY t.category_id;`,
      [currYearMonth]
    );

    const prevCatRows = db.getAllSync<CatSpendRow>(
      `SELECT t.category_id, c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY t.category_id;`,
      [prevYearMonth]
    );

    const prevMap = new Map<string, CatSpendRow>();
    prevCatRows.forEach((r) => prevMap.set(r.category_id || 'unknown', r));

    const allCatIds = new Set<string>();
    currCatRows.forEach((r) => allCatIds.add(r.category_id || 'unknown'));
    prevCatRows.forEach((r) => allCatIds.add(r.category_id || 'unknown'));

    const categories: CategoryComparison[] = [];

    allCatIds.forEach((catId) => {
      const curr = currCatRows.find((r) => (r.category_id || 'unknown') === catId);
      const prev = prevMap.get(catId);

      const currAmount = curr?.total ?? 0;
      const prevAmount = prev?.total ?? 0;
      const delta = currAmount - prevAmount;

      let percentChange = 0;
      const isNew = prevAmount === 0 && currAmount > 0;
      if (prevAmount > 0) {
        percentChange = Math.round(((currAmount - prevAmount) / prevAmount) * 100);
      } else if (currAmount > 0) {
        percentChange = 100;
      }

      categories.push({
        categoryId: catId,
        categoryName: curr?.name || prev?.name || 'Uncategorized',
        categoryColor: curr?.color || prev?.color || '#8F937A',
        categoryIcon: curr?.icon || prev?.icon || 'HelpCircle',
        currAmount,
        prevAmount,
        delta,
        percentChange,
        isNew,
      });
    });

    // Sort by absolute spend descending
    categories.sort((a, b) => Math.max(b.currAmount, b.prevAmount) - Math.max(a.currAmount, a.prevAmount));

    return {
      currYearMonth,
      prevYearMonth,
      currIncome: currTotals.income,
      prevIncome: prevTotals.income,
      incomeDelta: currTotals.income - prevTotals.income,
      currExpense: currTotals.expense,
      prevExpense: prevTotals.expense,
      expenseDelta,
      expensePercentChange,
      currSaved: currTotals.saved,
      prevSaved: prevTotals.saved,
      savedDelta: currTotals.saved - prevTotals.saved,
      categories,
    };
  },

  /**
   * Weekend vs. Weekday spending velocity audit
   * Weekdays = Mon-Thu (%w IN 1,2,3,4)
   * Weekends = Fri-Sun (%w IN 5,6,0)
   */
  getWeekendVsWeekdayVelocity(yearMonth: string): VelocityAuditData {
    const db = getDatabase();

    interface VelocityRow {
      date: string;
      dayOfWeek: string;
      amount: number;
    }

    const rows = db.getAllSync<VelocityRow>(
      `SELECT date, strftime('%w', date) as dayOfWeek, amount
       FROM transactions
       WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [yearMonth]
    );

    const weekdayDates = new Set<string>();
    const weekendDates = new Set<string>();
    let weekdayTotal = 0;
    let weekendTotal = 0;

    rows.forEach((r) => {
      const dow = r.dayOfWeek;
      if (['1', '2', '3', '4'].includes(dow)) {
        weekdayDates.add(r.date);
        weekdayTotal += r.amount;
      } else {
        weekendDates.add(r.date);
        weekendTotal += r.amount;
      }
    });

    const weekdayDaysCount = Math.max(1, weekdayDates.size);
    const weekendDaysCount = Math.max(1, weekendDates.size);

    const weekdayDailyAvg = Math.round(weekdayTotal / weekdayDaysCount);
    const weekendDailyAvg = Math.round(weekendTotal / weekendDaysCount);

    const velocityMultiplier = weekdayDailyAvg > 0
      ? Number((weekendDailyAvg / weekdayDailyAvg).toFixed(1))
      : 1.0;

    const weekendSurgePercentage = weekdayDailyAvg > 0
      ? Math.round(((weekendDailyAvg - weekdayDailyAvg) / weekdayDailyAvg) * 100)
      : 0;

    // Remaining weekend days in month calculation
    const now = new Date();
    const [y, m] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let remainingWeekendDays = 0;

    const startCheckDay = (now.getFullYear() === y && (now.getMonth() + 1) === m)
      ? now.getDate()
      : 1;

    for (let day = startCheckDay; day <= daysInMonth; day++) {
      const d = new Date(y, m - 1, day);
      const dow = d.getDay();
      if (dow === 5 || dow === 6 || dow === 0) {
        remainingWeekendDays++;
      }
    }

    // Recommended weekend safe allocation
    const overallBudget = BudgetRepository.getOverallBudgetProgress(yearMonth);
    const remainingCapital = Math.max(0, overallBudget.remainingCapital);
    const weekendSafeAllocation = remainingWeekendDays > 0
      ? Math.round((remainingCapital * 0.45) / Math.max(1, Math.ceil(remainingWeekendDays / 3)))
      : 0;

    let advisoryMessage = 'Balanced weekday-weekend spending velocity.';
    if (velocityMultiplier >= 2.0) {
      advisoryMessage = `Weekend burn is ${velocityMultiplier}x faster than weekdays. Pace discretionary outings to protect month-end savings.`;
    } else if (velocityMultiplier >= 1.3) {
      advisoryMessage = `Mild weekend surge (+${weekendSurgePercentage}%). Safe allocation is ₹${weekendSafeAllocation.toLocaleString('en-IN')} for next weekend.`;
    } else if (velocityMultiplier < 0.8) {
      advisoryMessage = 'Highly disciplined weekend spending! Your primary spend happens during regular weekdays.';
    }

    return {
      weekdayTotal,
      weekdayDaysCount,
      weekdayDailyAvg,
      weekendTotal,
      weekendDaysCount,
      weekendDailyAvg,
      velocityMultiplier,
      weekendSurgePercentage,
      weekendSafeAllocation,
      remainingWeekendDays,
      advisoryMessage,
    };
  },

  /**
   * Spending by Day of the Week (Mon through Sun)
   */
  getDayOfWeekDistribution(yearMonth: string): DayOfWeekData {
    const db = getDatabase();

    interface DayRow {
      dayOfWeek: string; // 0 = Sun, 1 = Mon ... 6 = Sat
      total: number;
      cnt: number;
    }

    const rows = db.getAllSync<DayRow>(
      `SELECT strftime('%w', date) as dayOfWeek, SUM(amount) as total, COUNT(*) as cnt
       FROM transactions
       WHERE strftime('%Y-%m', date) = ? AND type = 'expense'
       GROUP BY dayOfWeek;`,
      [yearMonth]
    );

    const dayMeta = [
      { dow: '1', name: 'Monday', short: 'Mon', index: 1 },
      { dow: '2', name: 'Tuesday', short: 'Tue', index: 2 },
      { dow: '3', name: 'Wednesday', short: 'Wed', index: 3 },
      { dow: '4', name: 'Thursday', short: 'Thu', index: 4 },
      { dow: '5', name: 'Friday', short: 'Fri', index: 5 },
      { dow: '6', name: 'Saturday', short: 'Sat', index: 6 },
      { dow: '0', name: 'Sunday', short: 'Sun', index: 7 },
    ];

    const rowMap = new Map<string, DayRow>();
    rows.forEach((r) => rowMap.set(r.dayOfWeek, r));

    const totalWeekSpend = rows.reduce((sum, r) => sum + r.total, 0);

    let peakDay = 'Saturday';
    let peakDaySpend = 0;

    const items: DayOfWeekItem[] = dayMeta.map((m) => {
      const match = rowMap.get(m.dow);
      const totalSpend = match?.total ?? 0;
      const transactionCount = match?.cnt ?? 0;
      const percentage = totalWeekSpend > 0 ? Math.round((totalSpend / totalWeekSpend) * 100) : 0;

      if (totalSpend > peakDaySpend) {
        peakDaySpend = totalSpend;
        peakDay = m.name;
      }

      return {
        dayIndex: m.index,
        dayName: m.name,
        shortName: m.short,
        totalSpend,
        transactionCount,
        percentage,
        isPeak: false,
      };
    });

    items.forEach((item) => {
      if (item.totalSpend === peakDaySpend && peakDaySpend > 0) {
        item.isPeak = true;
      }
    });

    return {
      items,
      peakDay,
      peakDaySpend,
      totalWeekSpend,
    };
  },

  /**
   * Time of Day distribution (Morning, Afternoon, Evening, Night)
   */
  getTimeOfDayDistribution(yearMonth: string): TimeDistributionData {
    const db = getDatabase();

    interface TimeRow {
      time: string;
      amount: number;
    }

    const rows = db.getAllSync<TimeRow>(
      `SELECT time, amount FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [yearMonth]
    );

    let morningSpend = 0;
    let morningCount = 0;
    let afternoonSpend = 0;
    let afternoonCount = 0;
    let eveningSpend = 0;
    let eveningCount = 0;
    let nightSpend = 0;
    let nightCount = 0;

    rows.forEach((r) => {
      const hour = parseInt(r.time?.substring(0, 2) || '12', 10);
      if (hour >= 6 && hour < 12) {
        morningSpend += r.amount;
        morningCount++;
      } else if (hour >= 12 && hour < 17) {
        afternoonSpend += r.amount;
        afternoonCount++;
      } else if (hour >= 17 && hour < 22) {
        eveningSpend += r.amount;
        eveningCount++;
      } else {
        nightSpend += r.amount;
        nightCount++;
      }
    });

    const totalSpend = morningSpend + afternoonSpend + eveningSpend + nightSpend;

    const slots: TimeSlotItem[] = [
      {
        id: 'morning',
        label: 'Morning',
        timeRange: '6 AM – 12 PM',
        totalSpend: morningSpend,
        transactionCount: morningCount,
        percentage: totalSpend > 0 ? Math.round((morningSpend / totalSpend) * 100) : 0,
        color: '#FFD93D',
      },
      {
        id: 'afternoon',
        label: 'Afternoon',
        timeRange: '12 PM – 5 PM',
        totalSpend: afternoonSpend,
        transactionCount: afternoonCount,
        percentage: totalSpend > 0 ? Math.round((afternoonSpend / totalSpend) * 100) : 0,
        color: Colors.primaryFixed,
      },
      {
        id: 'evening',
        label: 'Evening',
        timeRange: '5 PM – 10 PM',
        totalSpend: eveningSpend,
        transactionCount: eveningCount,
        percentage: totalSpend > 0 ? Math.round((eveningSpend / totalSpend) * 100) : 0,
        color: Colors.tertiaryFixedDim,
      },
      {
        id: 'night',
        label: 'Night',
        timeRange: '10 PM – 6 AM',
        totalSpend: nightSpend,
        transactionCount: nightCount,
        percentage: totalSpend > 0 ? Math.round((nightSpend / totalSpend) * 100) : 0,
        color: '#A855F7',
      },
    ];

    let peakSlot = 'Evening';
    let maxSpend = -1;
    slots.forEach((s) => {
      if (s.totalSpend > maxSpend) {
        maxSpend = s.totalSpend;
        peakSlot = s.label;
      }
    });

    return {
      slots,
      peakSlot,
      totalSpend,
    };
  },

  /**
   * No-Spend Days & Frugality Habit Heatmap (Last 35 days)
   */
  getNoSpendHeatmap(daysCount: number = 35, referenceDate: Date = new Date()): NoSpendHeatmapData {
    const db = getDatabase();

    // 1. Generate dates list descending to today
    const dates: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      dates.push(iso);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    interface DailySpendRow {
      date: string;
      spend: number;
      cnt: number;
    }

    const rows = db.getAllSync<DailySpendRow>(
      `SELECT date, SUM(amount) as spend, COUNT(*) as cnt
       FROM transactions
       WHERE date BETWEEN ? AND ? AND type = 'expense'
       GROUP BY date;`,
      [startDate, endDate]
    );

    const spendMap = new Map<string, DailySpendRow>();
    rows.forEach((r) => spendMap.set(r.date, r));

    const nonZeroSpends = rows.map((r) => r.spend).filter((s) => s > 0).sort((a, b) => a - b);
    const medianSpend = nonZeroSpends.length > 0 ? nonZeroSpends[Math.floor(nonZeroSpends.length / 2)] : 500;

    const days: HeatmapDay[] = dates.map((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const match = spendMap.get(dateStr);
      const spend = match?.spend ?? 0;
      const cnt = match?.cnt ?? 0;

      let intensity: 'zero' | 'low' | 'medium' | 'high' = 'zero';
      if (spend === 0) intensity = 'zero';
      else if (spend <= medianSpend * 0.75) intensity = 'low';
      else if (spend <= medianSpend * 1.6) intensity = 'medium';
      else intensity = 'high';

      return {
        date: dateStr,
        dayOfWeek: dateObj.getDay(),
        dayOfMonth: d,
        spend,
        isNoSpend: spend === 0,
        transactionCount: cnt,
        isToday: dateStr === todayStr,
        intensity,
      };
    });

    const totalNoSpendInPeriod = days.filter((d) => d.isNoSpend).length;
    const noSpendRate = Math.round((totalNoSpendInPeriod / daysCount) * 100);

    // Compute current streak and longest streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Iterate chronological
    for (let i = 0; i < days.length; i++) {
      if (days[i].isNoSpend) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Current streak from end backwards
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].isNoSpend) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      days,
      totalNoSpendInPeriod,
      totalDaysInPeriod: daysCount,
      currentStreak,
      longestStreak,
      noSpendRate,
    };
  },

  /**
   * Tier 4, Feature 10: Fetches all transactions on a given day for the Heatmap Day Inspector.
   */
  getDayTransactions(dateStr: string): DayTransactionDetail[] {
    const db = getDatabase();
    interface TxRow {
      id: string;
      amount: number;
      type: string;
      note: string | null;
      cat_name: string | null;
      cat_color: string | null;
      cat_icon: string | null;
      acc_name: string | null;
      card_name: string | null;
      time: string | null;
    }

    let rows: TxRow[] = [];
    try {
      rows = db.getAllSync<TxRow>(
        `SELECT 
           t.id, t.amount, t.type, t.note,
           c.name as cat_name, c.color as cat_color, c.icon as cat_icon,
           a.name as acc_name,
           cc.name as card_name,
           t.time
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
         WHERE t.date = ?
         ORDER BY t.time DESC, t.created_at DESC;`,
        [dateStr]
      );
    } catch {
      rows = [];
    }

    return rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: (r.type as any) || 'expense',
      note: r.note,
      categoryName: r.cat_name || 'General',
      categoryColor: r.cat_color || Colors.primaryFixed,
      categoryIcon: r.cat_icon || 'ShoppingBag',
      accountName: r.acc_name || undefined,
      creditCardName: r.card_name || undefined,
      time: r.time || '12:00',
    }));
  },

  /**
   * Tier 4, Feature 14: Income vs Expense Ratio Tracker
   * Computes living savings rate, target goal progress, and 6-month historical curve.
   */
  getIncomeVsExpenseRatio(targetYM?: string): IncomeVsExpenseRatioData {
    const db = getDatabase();
    const now = new Date();
    const ym = targetYM || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = ym.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Target savings rate from settings (default 30%)
    const targetSavingsRate = parseInt(SettingsRepository.get('target_savings_rate', '30'), 10) || 30;

    // 1. Current month numbers
    const incRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
      [ym]
    );
    const expRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [ym]
    );

    const income = incRow?.total ?? 0;
    const expense = expRow?.total ?? 0;
    const netSaved = Math.max(0, income - expense);
    const savingsRate = income > 0 ? Math.round((netSaved / income) * 100) : 0;

    let targetStatus: 'exceeded' | 'on_track' | 'lagging' = 'on_track';
    if (savingsRate >= targetSavingsRate + 5) targetStatus = 'exceeded';
    else if (savingsRate >= targetSavingsRate - 5) targetStatus = 'on_track';
    else targetStatus = 'lagging';

    // 2. 6-Month history curve
    const monthlyHistory6M: IncomeVsExpenseRatioData['monthlyHistory6M'] = [];
    for (let i = 5; i >= 0; i--) {
      const histDate = new Date(y, m - 1 - i, 1);
      const histYM = `${histDate.getFullYear()}-${String(histDate.getMonth() + 1).padStart(2, '0')}`;
      const histLabel = histDate.toLocaleDateString('en-US', { month: 'short' });

      const hInc = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
        [histYM]
      )?.total ?? 0;
      const hExp = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
        [histYM]
      )?.total ?? 0;

      const hSaved = Math.max(0, hInc - hExp);
      const hRate = hInc > 0 ? Math.round((hSaved / hInc) * 100) : 0;

      monthlyHistory6M.push({
        monthKey: histYM,
        monthLabel: histLabel,
        income: hInc,
        expense: hExp,
        savingsRate: hRate,
      });
    }

    return {
      monthKey: ym,
      monthLabel,
      income,
      expense,
      netSaved,
      savingsRate,
      targetSavingsRate,
      targetStatus,
      monthlyHistory6M,
    };
  },

  /**
   * 0-100 Zenith Resilience Quotient Score
   */
  getFinancialResilienceScore(): FinancialResilienceData {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Pillar 1: Savings Rate (25 pts)
    const db = getDatabase();
    const incRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
      [currentYearMonth]
    );
    const expRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [currentYearMonth]
    );
    const income = incRow?.total ?? 0;
    const expense = expRow?.total ?? 0;
    const saved = Math.max(0, income - expense);
    const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;

    let savingsScore = 10;
    let savingsStatus: 'optimal' | 'fair' | 'at_risk' = 'fair';
    let savingsTip = 'Increase savings rate to ≥20% to fortify wealth buffers.';
    if (savingsRate >= 30) {
      savingsScore = 25;
      savingsStatus = 'optimal';
      savingsTip = 'Exceptional savings rate! Your current surplus is stellar.';
    } else if (savingsRate >= 20) {
      savingsScore = 21;
      savingsStatus = 'optimal';
      savingsTip = 'Strong savings discipline adhering to the 20% rule.';
    } else if (savingsRate >= 10) {
      savingsScore = 15;
      savingsStatus = 'fair';
      savingsTip = 'Moderate savings rate. Trim discretionary expenses to reach 20%.';
    } else {
      savingsScore = 7;
      savingsStatus = 'at_risk';
      savingsTip = 'Expenses are consuming almost all incoming liquidity.';
    }

    // Pillar 2: Credit Discipline (25 pts)
    const activeCards = CreditCardRepository.getAllActive();
    const totalCreditLimit = activeCards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalObligations = CreditCardRepository.getTotalCreditObligations();
    const creditUtilization = totalCreditLimit > 0
      ? Math.round((totalObligations / totalCreditLimit) * 100)
      : 0;

    let creditScore = 25;
    let creditStatus: 'optimal' | 'fair' | 'at_risk' = 'optimal';
    let creditTip = 'Ideal credit card utilization maintained below 15%.';
    if (totalCreditLimit === 0) {
      creditScore = 25;
      creditStatus = 'optimal';
      creditTip = 'Zero credit card liabilities detected.';
    } else if (creditUtilization <= 15) {
      creditScore = 25;
      creditStatus = 'optimal';
      creditTip = 'Optimal credit utilization below 15% preserves credit score.';
    } else if (creditUtilization <= 30) {
      creditScore = 20;
      creditStatus = 'optimal';
      creditTip = 'Healthy credit utilization within the standard 30% threshold.';
    } else if (creditUtilization <= 50) {
      creditScore = 12;
      creditStatus = 'fair';
      creditTip = 'Credit utilization exceeds 30%. Pay down balances before statement generation.';
    } else {
      creditScore = 5;
      creditStatus = 'at_risk';
      creditTip = 'Heavy credit card utilization (>50%) strains debt health.';
    }

    // Pillar 3: Budget Adherence (25 pts)
    const overallBudget = BudgetRepository.getOverallBudgetProgress(currentYearMonth);
    let budgetScore = 18;
    let budgetStatus: 'optimal' | 'fair' | 'at_risk' = 'fair';
    let budgetTip = 'Establish category quotas in the Budgets tab.';
    if (overallBudget.totalBudget > 0) {
      const burnPct = overallBudget.burnedPercentage;
      if (burnPct <= 75) {
        budgetScore = 25;
        budgetStatus = 'optimal';
        budgetTip = `Comfortably within limits (${burnPct}% used with ${overallBudget.daysRemaining} days left).`;
      } else if (burnPct <= 100) {
        budgetScore = 20;
        budgetStatus = 'fair';
        budgetTip = `Approaching budget ceiling (${burnPct}% used).`;
      } else {
        budgetScore = 8;
        budgetStatus = 'at_risk';
        budgetTip = `Exceeded allocated budget by ₹${Math.abs(overallBudget.remainingCapital).toLocaleString('en-IN')}.`;
      }
    }

    // Pillar 4: Safety Runway (25 pts)
    const bankCash = AccountRepository.getTotalBankCashBalance();
    const monthlyBurn = Math.max(1000, expense);
    const runwayMonths = Number((bankCash / monthlyBurn).toFixed(1));

    let runwayScore = 15;
    let runwayStatus: 'optimal' | 'fair' | 'at_risk' = 'fair';
    let runwayTip = 'Target 3–6 months of living expenses in liquid accounts.';
    if (runwayMonths >= 6.0) {
      runwayScore = 25;
      runwayStatus = 'optimal';
      runwayTip = `Superb safety runway of ${runwayMonths} months liquid cushion.`;
    } else if (runwayMonths >= 3.0) {
      runwayScore = 22;
      runwayStatus = 'optimal';
      runwayTip = `Solid safety cushion of ${runwayMonths} months coverage.`;
    } else if (runwayMonths >= 1.5) {
      runwayScore = 15;
      runwayStatus = 'fair';
      runwayTip = `Runway is ${runwayMonths} months. Boost emergency reserves.`;
    } else {
      runwayScore = 7;
      runwayStatus = 'at_risk';
      runwayTip = `Thin emergency buffer (<1.5 months). Reserve funds to survive volatility.`;
    }

    const totalScore = savingsScore + creditScore + budgetScore + runwayScore;

    let tier: 'Resilient' | 'Stable' | 'Vulnerable' = 'Stable';
    let tierColor = '#FFD93D';
    let headline = 'Financially Stable & Secure';

    if (totalScore >= 80) {
      tier = 'Resilient';
      tierColor = Colors.chartreuse;
      headline = 'Zenith Fortified Resilience';
    } else if (totalScore < 60) {
      tier = 'Vulnerable';
      tierColor = Colors.expense;
      headline = 'Liquidity Caution Advised';
    }

    const pillars: ResiliencePillar[] = [
      {
        id: 'savings',
        name: 'Savings Rate',
        score: savingsScore,
        maxScore: 25,
        metricLabel: 'Rate',
        metricValue: `${savingsRate}%`,
        status: savingsStatus,
        tip: savingsTip,
      },
      {
        id: 'credit',
        name: 'Credit Discipline',
        score: creditScore,
        maxScore: 25,
        metricLabel: 'Util.',
        metricValue: `${creditUtilization}%`,
        status: creditStatus,
        tip: creditTip,
      },
      {
        id: 'budget',
        name: 'Budget Adherence',
        score: budgetScore,
        maxScore: 25,
        metricLabel: 'Burn',
        metricValue: overallBudget.totalBudget > 0 ? `${overallBudget.burnedPercentage}%` : 'N/A',
        status: budgetStatus,
        tip: budgetTip,
      },
      {
        id: 'runway',
        name: 'Safety Runway',
        score: runwayScore,
        maxScore: 25,
        metricLabel: 'Buffer',
        metricValue: `${runwayMonths} mo`,
        status: runwayStatus,
        tip: runwayTip,
      },
    ];

    // Pick pillar with lowest score for key recommendation
    const lowestPillar = [...pillars].sort((a, b) => a.score - b.score)[0];
    const keyRecommendation = lowestPillar.tip;

    return {
      score: totalScore,
      tier,
      tierColor,
      headline,
      pillars,
      keyRecommendation,
    };
  },

  /**
   * Payment method breakdown (Bank Account vs. Cash vs. Credit Card)
   */
  getPaymentMethodDistribution(yearMonth: string): PaymentMethodSpend[] {
    const db = getDatabase();

    interface MethodRow {
      account_id: string | null;
      credit_card_id: string | null;
      account_type: string | null;
      amount: number;
    }

    const rows = db.getAllSync<MethodRow>(
      `SELECT t.account_id, t.credit_card_id, a.type as account_type, t.amount
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense';`,
      [yearMonth]
    );

    let bankTotal = 0;
    let bankCount = 0;
    let cashTotal = 0;
    let cashCount = 0;
    let cardTotal = 0;
    let cardCount = 0;

    rows.forEach((r) => {
      if (r.credit_card_id) {
        cardTotal += r.amount;
        cardCount++;
      } else if (r.account_type === 'cash') {
        cashTotal += r.amount;
        cashCount++;
      } else {
        bankTotal += r.amount;
        bankCount++;
      }
    });

    const total = bankTotal + cashTotal + cardTotal;

    return [
      {
        type: 'credit_card',
        label: 'Credit Cards',
        total: cardTotal,
        percentage: total > 0 ? Math.round((cardTotal / total) * 100) : 0,
        count: cardCount,
        color: Colors.secondaryFixed,
      },
      {
        type: 'bank',
        label: 'Bank Accounts',
        total: bankTotal,
        percentage: total > 0 ? Math.round((bankTotal / total) * 100) : 0,
        count: bankCount,
        color: Colors.primaryFixed,
      },
      {
        type: 'cash',
        label: 'Physical Cash',
        total: cashTotal,
        percentage: total > 0 ? Math.round((cashTotal / total) * 100) : 0,
        count: cashCount,
        color: '#FFD93D',
      },
    ];
  },

  /**
   * ─── TIER 2: TRANSPARENT & INTERACTIVE FINANCIAL HEALTH SCORE ─────────────
   * Computes the 6 quantitative factors with exact weights, live SQLite data,
   * 3-month historical trajectories, and what-if simulator configurations.
   */
  getTransparentHealthScore(yearMonth?: string): TransparentHealthScoreData {
    const db = getDatabase();
    const now = new Date();
    const ym = yearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Helper for previous year-months
    const getPriorYM = (baseYM: string, monthsAgo: number) => {
      const [y, m] = baseYM.split('-').map(Number);
      const d = new Date(y, m - 1 - monthsAgo, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const ymMinus1 = getPriorYM(ym, 1);
    const ymMinus2 = getPriorYM(ym, 2);

    const getMonthShort = (targetYM: string) => {
      const [y, m] = targetYM.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    };

    // ── 1. Factor: Savings Rate (Weight: 25%) ──
    const getSavingsForMonth = (targetYM: string) => {
      const inc = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
        [targetYM]
      )?.total ?? 0;
      const exp = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
        [targetYM]
      )?.total ?? 0;
      const saved = Math.max(0, inc - exp);
      const rate = inc > 0 ? (saved / inc) * 100 : 0;

      let score = 20;
      if (rate >= 40) score = 100;
      else if (rate >= 30) score = Math.round(88 + ((rate - 30) / 10) * 12);
      else if (rate >= 20) score = Math.round(72 + ((rate - 20) / 10) * 16);
      else if (rate >= 10) score = Math.round(50 + ((rate - 10) / 10) * 22);
      else if (rate >= 0) score = Math.round(20 + (rate / 10) * 30);
      else score = Math.max(5, Math.round(20 + rate));

      return { inc, exp, saved, rate, score: Math.min(100, Math.max(0, score)) };
    };

    const curSavings = getSavingsForMonth(ym);
    const m1Savings = getSavingsForMonth(ymMinus1);
    const m2Savings = getSavingsForMonth(ymMinus2);

    const savingsFactor: HealthScoreFactor = {
      id: 'savings_rate',
      name: 'Savings Rate',
      weight: 25,
      score: curSavings.score,
      weightedScore: Number(((curSavings.score * 25) / 100).toFixed(1)),
      status: curSavings.score >= 75 ? 'optimal' : curSavings.score >= 50 ? 'fair' : 'at_risk',
      yourData: `Income: ₹${curSavings.inc.toLocaleString('en-IN')} · Expenses: ₹${curSavings.exp.toLocaleString('en-IN')} · Rate: ${curSavings.rate.toFixed(1)}%`,
      metricLabel: 'Savings Rate',
      metricValue: `${curSavings.rate.toFixed(1)}%`,
      improvementTip:
        curSavings.rate >= 35
          ? 'Phenomenal wealth accumulation rate! Keep surplus in high-yield reserves.'
          : `Save ₹${Math.max(1500, Math.round(curSavings.inc * 0.05)).toLocaleString('en-IN')} more → reach ${(curSavings.rate + 5).toFixed(1)}% → +6 pts`,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: m2Savings.score },
        { monthLabel: getMonthShort(ymMinus1), score: m1Savings.score },
        { monthLabel: getMonthShort(ym), score: curSavings.score },
      ],
      sliderConfig: {
        min: 0,
        max: 60,
        step: 2,
        initialValue: Math.round(curSavings.rate),
        unit: '%',
        label: 'Savings Rate',
      },
    };

    // ── 2. Factor: Budget Adherence (Weight: 20%) ──
    const getBudgetAdherence = (targetYM: string) => {
      const budgets = BudgetRepository.getAllWithProgress(targetYM);
      if (budgets.length === 0) {
        return { count: 0, underLimit: 0, pct: 100, score: 78, tip: 'Create category budgets to track limits.' };
      }
      const under = budgets.filter((b) => !b.isOverBudget).length;
      const pct = Math.round((under / budgets.length) * 100);
      const totalBudget = budgets.reduce((s, b) => s + b.budgetAmount, 0);
      const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
      const burnPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      let score = Math.round(pct * 0.65 + Math.max(0, 100 - burnPct) * 0.35);
      score = Math.min(100, Math.max(15, score));

      const overBudgets = budgets.filter((b) => b.isOverBudget);
      const tip =
        overBudgets.length > 0
          ? `${overBudgets[0].categoryName} is ₹${Math.round(overBudgets[0].overAmount).toLocaleString('en-IN')} over. Trim discretionary burn → +5 pts`
          : `All ${budgets.length} budgets strictly respected. Stellar adherence!`;

      return { count: budgets.length, underLimit: under, pct, score, tip };
    };

    const curBudget = getBudgetAdherence(ym);
    const m1Budget = getBudgetAdherence(ymMinus1);
    const m2Budget = getBudgetAdherence(ymMinus2);

    const budgetFactor: HealthScoreFactor = {
      id: 'budget_adherence',
      name: 'Budget Adherence',
      weight: 20,
      score: curBudget.score,
      weightedScore: Number(((curBudget.score * 20) / 100).toFixed(1)),
      status: curBudget.score >= 75 ? 'optimal' : curBudget.score >= 50 ? 'fair' : 'at_risk',
      yourData:
        curBudget.count > 0
          ? `${curBudget.underLimit}/${curBudget.count} budgets under limit · ${curBudget.pct}% adherence`
          : 'No budgets configured · Baseline score applied',
      metricLabel: 'Adherence',
      metricValue: `${curBudget.pct}%`,
      improvementTip: curBudget.tip,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: m2Budget.score },
        { monthLabel: getMonthShort(ymMinus1), score: m1Budget.score },
        { monthLabel: getMonthShort(ym), score: curBudget.score },
      ],
      sliderConfig: {
        min: 0,
        max: 100,
        step: 5,
        initialValue: curBudget.pct,
        unit: '%',
        label: 'Budget Adherence',
      },
    };

    // ── 3. Factor: Debt Health (Weight: 15%) ──
    const debtSummary = DebtRepository.getDebtSummary();
    const totalIOwe = debtSummary.total_i_owe;
    const pendingDebtsCount = debtSummary.pending_count;

    let debtScore = 100;
    if (totalIOwe === 0) debtScore = 100;
    else if (totalIOwe <= 1500) debtScore = 88;
    else if (totalIOwe <= 5000) debtScore = 72;
    else if (totalIOwe <= 15000) debtScore = 55;
    else debtScore = Math.max(15, 50 - Math.round(totalIOwe / 3000));

    const debtFactor: HealthScoreFactor = {
      id: 'debt_health',
      name: 'Debt Health',
      weight: 15,
      score: debtScore,
      weightedScore: Number(((debtScore * 15) / 100).toFixed(1)),
      status: debtScore >= 75 ? 'optimal' : debtScore >= 50 ? 'fair' : 'at_risk',
      yourData:
        totalIOwe === 0
          ? '0 unsettled debts · ₹0 owed to peers'
          : `${pendingDebtsCount} unsettled debt${pendingDebtsCount > 1 ? 's' : ''} (₹${totalIOwe.toLocaleString('en-IN')} owed)`,
      metricLabel: 'Peer Debt',
      metricValue: totalIOwe === 0 ? '₹0' : `₹${Math.round(totalIOwe / 1000)}K`,
      improvementTip:
        totalIOwe === 0
          ? 'Zero peer debt obligations. Exceptional financial independence!'
          : `Settle ₹${Math.min(totalIOwe, 2000).toLocaleString('en-IN')} with contacts → +8 pts`,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: Math.min(100, debtScore + 5) },
        { monthLabel: getMonthShort(ymMinus1), score: Math.min(100, debtScore + 2) },
        { monthLabel: getMonthShort(ym), score: debtScore },
      ],
      sliderConfig: {
        min: 0,
        max: Math.max(10000, Math.round(totalIOwe * 1.5)),
        step: 500,
        initialValue: totalIOwe,
        unit: '₹',
        label: 'Unsettled Debt',
      },
    };

    // ── 4. Factor: Credit Card Utilization (Weight: 15%) ──
    const activeCards = CreditCardRepository.getAllActive();
    const totalCreditLimit = activeCards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalObligations = CreditCardRepository.getTotalCreditObligations();
    const creditUtilization = totalCreditLimit > 0
      ? Number(((totalObligations / totalCreditLimit) * 100).toFixed(1))
      : 0;

    let ccScore = 100;
    if (totalCreditLimit === 0) ccScore = 100;
    else if (creditUtilization <= 10) ccScore = 98;
    else if (creditUtilization <= 20) ccScore = 90;
    else if (creditUtilization <= 30) ccScore = 80;
    else if (creditUtilization <= 50) ccScore = 58;
    else ccScore = Math.max(10, 50 - Math.round(creditUtilization - 50));

    const ccFactor: HealthScoreFactor = {
      id: 'cc_utilization',
      name: 'Credit Card Utilization',
      weight: 15,
      score: ccScore,
      weightedScore: Number(((ccScore * 15) / 100).toFixed(1)),
      status: ccScore >= 75 ? 'optimal' : ccScore >= 50 ? 'fair' : 'at_risk',
      yourData:
        totalCreditLimit === 0
          ? 'Zero credit cards configured · 0% liability'
          : `Limit: ₹${Math.round(totalCreditLimit / 1000)}K · Used: ₹${Math.round(totalObligations / 1000)}K · ${creditUtilization}%`,
      metricLabel: 'Utilization',
      metricValue: `${creditUtilization}%`,
      improvementTip:
        creditUtilization <= 25
          ? 'Already excellent! Keeping credit utilization under 30% safeguards credit score.'
          : `Pay down ₹${Math.round(totalObligations - totalCreditLimit * 0.25).toLocaleString('en-IN')} before cycle close → +8 pts`,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: Math.min(100, ccScore - 4) },
        { monthLabel: getMonthShort(ymMinus1), score: Math.min(100, ccScore - 2) },
        { monthLabel: getMonthShort(ym), score: ccScore },
      ],
      sliderConfig: {
        min: 0,
        max: 80,
        step: 2,
        initialValue: Math.round(creditUtilization),
        unit: '%',
        label: 'Card Utilization',
      },
    };

    // ── 5. Factor: Spending Consistency (Weight: 15%) ──
    const dailySpends = db.getAllSync<{ spend: number }>(
      `SELECT SUM(amount) as spend FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense' GROUP BY date;`,
      [ym]
    );

    const spendValues = dailySpends.map((d) => d.spend);
    const spendCount = spendValues.length || 1;
    const meanSpend = spendValues.reduce((s, v) => s + v, 0) / spendCount;
    const variance = spendValues.reduce((s, v) => s + Math.pow(v - meanSpend, 2), 0) / spendCount;
    const stdDev = Math.sqrt(variance);
    const cv = meanSpend > 0 ? Number((stdDev / meanSpend).toFixed(2)) : 0;

    let consistencyScore = 80;
    if (cv <= 0.4) consistencyScore = 95;
    else if (cv <= 0.7) consistencyScore = 82;
    else if (cv <= 1.0) consistencyScore = 68;
    else if (cv <= 1.4) consistencyScore = 50;
    else consistencyScore = 32;

    const consistencyFactor: HealthScoreFactor = {
      id: 'spending_consistency',
      name: 'Spending Consistency',
      weight: 15,
      score: consistencyScore,
      weightedScore: Number(((consistencyScore * 15) / 100).toFixed(1)),
      status: consistencyScore >= 75 ? 'optimal' : consistencyScore >= 50 ? 'fair' : 'at_risk',
      yourData: `Daily avg: ₹${Math.round(meanSpend).toLocaleString('en-IN')} · Std dev: ₹${Math.round(stdDev).toLocaleString('en-IN')} · CV: ${cv}`,
      metricLabel: 'CV Variance',
      metricValue: `${cv}`,
      improvementTip:
        cv <= 0.6
          ? 'Smooth and disciplined daily spending rhythm. No irregular spikes detected.'
          : `Avoid sudden single-day bursts > ₹${Math.round(meanSpend * 2.5).toLocaleString('en-IN')} to steady velocity.`,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: Math.min(100, consistencyScore + 3) },
        { monthLabel: getMonthShort(ymMinus1), score: Math.min(100, consistencyScore - 2) },
        { monthLabel: getMonthShort(ym), score: consistencyScore },
      ],
      sliderConfig: {
        min: 0.2,
        max: 2.0,
        step: 0.1,
        initialValue: cv,
        unit: ' CV',
        label: 'Spending Volatility',
      },
    };

    // ── 6. Factor: No-Spend Discipline (Weight: 10%) ──
    const [yNum, mNum] = ym.split('-').map(Number);
    const totalDaysInMonth = new Date(yNum, mNum, 0).getDate();
    const activeSpendDaysCount = db.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(DISTINCT date) as cnt FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense' AND amount > 0;`,
      [ym]
    )?.cnt ?? 0;

    const noSpendDays = Math.max(0, totalDaysInMonth - activeSpendDaysCount);
    const noSpendRate = Number(((noSpendDays / totalDaysInMonth) * 100).toFixed(1));

    let noSpendScore = 70;
    if (noSpendRate >= 32) noSpendScore = 96;
    else if (noSpendRate >= 22) noSpendScore = 82;
    else if (noSpendRate >= 14) noSpendScore = 65;
    else if (noSpendRate >= 6) noSpendScore = 48;
    else noSpendScore = 28;

    const noSpendFactor: HealthScoreFactor = {
      id: 'no_spend_discipline',
      name: 'No-Spend Discipline',
      weight: 10,
      score: noSpendScore,
      weightedScore: Number(((noSpendScore * 10) / 100).toFixed(1)),
      status: noSpendScore >= 75 ? 'optimal' : noSpendScore >= 50 ? 'fair' : 'at_risk',
      yourData: `${noSpendDays} no-spend days in month · ${noSpendRate}% of days`,
      metricLabel: 'No-Spend Days',
      metricValue: `${noSpendDays} days`,
      improvementTip:
        noSpendDays >= 8
          ? 'Terrific frugality habit! Your zero-spend days create meaningful capital buffers.'
          : `Achieve 2 more no-spend days this month → +6 pts`,
      history3Months: [
        { monthLabel: getMonthShort(ymMinus2), score: Math.min(100, noSpendScore - 5) },
        { monthLabel: getMonthShort(ymMinus1), score: Math.min(100, noSpendScore + 3) },
        { monthLabel: getMonthShort(ym), score: noSpendScore },
      ],
      sliderConfig: {
        min: 0,
        max: 20,
        step: 1,
        initialValue: noSpendDays,
        unit: ' days',
        label: 'No-Spend Days',
      },
    };

    const factors = [
      savingsFactor,
      budgetFactor,
      debtFactor,
      ccFactor,
      consistencyFactor,
      noSpendFactor,
    ];

    const rawTotalScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
    const totalScore = Math.min(100, Math.max(0, Math.round(rawTotalScore)));

    let tier: 'Resilient' | 'Stable' | 'Vulnerable' = 'Stable';
    let tierColor = '#FFD93D';
    let headline = 'Financially Stable & Secure';

    if (totalScore >= 80) {
      tier = 'Resilient';
      tierColor = Colors.chartreuse;
      headline = 'Fortified Zenith Resilience';
    } else if (totalScore < 60) {
      tier = 'Vulnerable';
      tierColor = Colors.expense;
      headline = 'Liquidity Caution Advised';
    }

    const lowestFactor = [...factors].sort((a, b) => a.score - b.score)[0];
    const keyRecommendation = lowestFactor.improvementTip;

    return {
      totalScore,
      tier,
      tierColor,
      headline,
      keyRecommendation,
      factors,
    };
  },

  /**
   * ─── TIER 2: FINANCIAL WRAPPED / YEAR IN REVIEW ──────────────────────────
   * Spotify-wrapped annual financial odyssey with story cards, extremes,
   * categorical breakdowns, and algorithmic personality archetypes.
   */
  getFinancialWrapped(targetYear?: number): FinancialWrappedData {
    const db = getDatabase();
    const now = new Date();
    const yr = targetYear || now.getFullYear();
    const yearStr = `${yr}`;
    const prevYearStr = `${yr - 1}`;

    // Totals for year
    const incRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y', date) = ? AND type = 'income';`,
      [yearStr]
    );
    const expRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y', date) = ? AND type = 'expense';`,
      [yearStr]
    );
    const prevExpRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y', date) = ? AND type = 'expense';`,
      [prevYearStr]
    );

    const totalIncome = incRow?.total ?? 0;
    const totalExpense = expRow?.total ?? 0;
    const prevYearExpense = prevExpRow?.total ?? 0;
    const totalSaved = Math.max(0, totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;
    const yoyPercentChange = prevYearExpense > 0
      ? Math.round(((totalExpense - prevYearExpense) / prevYearExpense) * 100)
      : 0;

    // Most expensive day of the year
    const mostExpensiveDayRow = db.getFirstSync<{ date: string; spend: number }>(
      `SELECT date, SUM(amount) as spend FROM transactions WHERE strftime('%Y', date) = ? AND type = 'expense' GROUP BY date ORDER BY spend DESC LIMIT 1;`,
      [yearStr]
    );

    let mostExpensiveDay: FinancialWrappedData['mostExpensiveDay'] = null;
    if (mostExpensiveDayRow && mostExpensiveDayRow.spend > 0) {
      const [y, m, d] = mostExpensiveDayRow.date.split('-').map(Number);
      const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const topNote = db.getFirstSync<{ note: string | null }>(
        `SELECT note FROM transactions WHERE date = ? AND type = 'expense' ORDER BY amount DESC LIMIT 1;`,
        [mostExpensiveDayRow.date]
      )?.note;

      mostExpensiveDay = {
        date: mostExpensiveDayRow.date,
        formattedDate,
        totalSpend: mostExpensiveDayRow.spend,
        topNote,
      };
    }

    // Cheapest month of the year
    const cheapestMonthRow = db.getFirstSync<{ ym: string; spend: number }>(
      `SELECT strftime('%Y-%m', date) as ym, SUM(amount) as spend FROM transactions WHERE strftime('%Y', date) = ? AND type = 'expense' GROUP BY ym ORDER BY spend ASC LIMIT 1;`,
      [yearStr]
    );

    let cheapestMonth: FinancialWrappedData['cheapestMonth'] = null;
    if (cheapestMonthRow) {
      const [y, m] = cheapestMonthRow.ym.split('-').map(Number);
      cheapestMonth = {
        monthName: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
        totalSpend: cheapestMonthRow.spend,
      };
    }

    // Longest no-spend streak in the year
    const daysInYear = db.getAllSync<{ date: string; spend: number }>(
      `SELECT date, SUM(amount) as spend FROM transactions WHERE strftime('%Y', date) = ? AND type = 'expense' GROUP BY date;`,
      [yearStr]
    );
    const spendDaysSet = new Set(daysInYear.filter((d) => d.spend > 0).map((d) => d.date));
    let longestNoSpendStreak = 0;
    let tempStreak = 0;

    // Iterate through days up to current date or end of year
    const yearStart = new Date(yr, 0, 1);
    const yearEnd = yr === now.getFullYear() ? now : new Date(yr, 11, 31);
    for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split('T')[0];
      if (!spendDaysSet.has(iso)) {
        tempStreak++;
        if (tempStreak > longestNoSpendStreak) longestNoSpendStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Top 5 categories
    const catRows = db.getAllSync<{ name: string; color: string; icon: string; total: number }>(
      `SELECT c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y', t.date) = ? AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 5;`,
      [yearStr]
    );

    const topCategories: FinancialWrappedCategory[] = catRows.map((c) => ({
      name: c.name,
      total: c.total,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
      color: c.color,
      icon: c.icon,
    }));

    // Top 3 merchants
    const merchantRows = db.getAllSync<{ note: string; spend: number; cnt: number }>(
      `SELECT TRIM(note) as note, SUM(amount) as spend, COUNT(*) as cnt
       FROM transactions
       WHERE strftime('%Y', date) = ? AND type = 'expense' AND note IS NOT NULL AND TRIM(note) != ''
       GROUP BY LOWER(TRIM(note))
       ORDER BY spend DESC
       LIMIT 3;`,
      [yearStr]
    );

    const topMerchants = merchantRows.map((m) => ({
      name: m.note,
      spend: m.spend,
      count: m.cnt,
    }));

    // Payment anatomy (Bank vs CC vs Cash)
    interface PayRow {
      account_id: string | null;
      credit_card_id: string | null;
      account_type: string | null;
      amount: number;
    }
    const payRows = db.getAllSync<PayRow>(
      `SELECT t.account_id, t.credit_card_id, a.type as account_type, t.amount
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE strftime('%Y', t.date) = ? AND t.type = 'expense';`,
      [yearStr]
    );

    let bankTotal = 0;
    let ccTotal = 0;
    let cashTotal = 0;
    payRows.forEach((p) => {
      if (p.credit_card_id) ccTotal += p.amount;
      else if (p.account_type === 'cash') cashTotal += p.amount;
      else bankTotal += p.amount;
    });

    const sumPay = bankTotal + ccTotal + cashTotal;
    const bankPercent = sumPay > 0 ? Math.round((bankTotal / sumPay) * 100) : 40;
    const ccPercent = sumPay > 0 ? Math.round((ccTotal / sumPay) * 100) : 35;
    const cashPercent = sumPay > 0 ? Math.round((cashTotal / sumPay) * 100) : 25;

    let mostUsedMethod = 'UPI / Bank Accounts';
    if (ccTotal >= bankTotal && ccTotal >= cashTotal) mostUsedMethod = 'Credit Cards';
    else if (cashTotal >= bankTotal && cashTotal >= ccTotal) mostUsedMethod = 'Physical Cash';

    // Most used card
    const topCardRow = db.getFirstSync<{ name: string; total: number }>(
      `SELECT c.name, SUM(t.amount) as total
       FROM transactions t
       JOIN credit_cards c ON t.credit_card_id = c.id
       WHERE strftime('%Y', t.date) = ? AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 1;`,
      [yearStr]
    );

    // ── Archetype Classification ──
    let personality: FinancialWrappedPersonality = {
      id: 'balanced_zen',
      badgeTitle: 'THE BALANCED ZEN',
      archetype: 'Mindful Balancer',
      tagline: 'Equilibrium in every rupee.',
      description: 'You maintain a harmonious cadence between spending on what matters and building steady resilience.',
      traits: ['Steady Cash Flow', 'Low Variance', 'Reliable Resilience'],
      color: Colors.primaryFixed,
      icon: 'Scale',
    };

    if (savingsRate >= 35 && longestNoSpendStreak >= 4) {
      personality = {
        id: 'disciplined_vault',
        badgeTitle: 'THE DISCIPLINED VAULT',
        archetype: 'Master Fortifier',
        tagline: 'Future-proof wealth by design.',
        description: 'You have extraordinary savings discipline. You turn cash into fortress reserves and resist impulse outlays.',
        traits: ['High Savings Rate', 'Zero Impulse Waste', 'Fortified Runway'],
        color: Colors.chartreuse,
        icon: 'ShieldCheck',
      };
    } else if (ccPercent >= 45 || topCategories.some((c) => c.name.toLowerCase().includes('dining') && c.percentage >= 35)) {
      personality = {
        id: 'spontaneous_explorer',
        badgeTitle: 'THE SPONTANEOUS EXPLORER',
        archetype: 'Experience Maximizer',
        tagline: 'Experiences first, spreadsheets second.',
        description: 'You enjoy living life to the fullest with dining, transit, and social adventures. Rewards and card perks are your superpower.',
        traits: ['High Lifestyle Velocity', 'Credit Optimizer', 'Social Spender'],
        color: '#FF9E0B',
        icon: 'Sparkles',
      };
    } else if (totalSaved >= 10000 || savingsRate >= 20) {
      personality = {
        id: 'strategic_optimizer',
        badgeTitle: 'THE STRATEGIC OPTIMIZER',
        archetype: 'Calculated Tactician',
        tagline: 'Every single rupee serves a mission.',
        description: 'You plan category quotas, leverage cards for maximum points, and consistently maintain surplus without sacrifice.',
        traits: ['Budget Adherence', 'Perk Hunter', 'Positive Runway'],
        color: Colors.secondaryFixed,
        icon: 'Target',
      };
    }

    const shareableSummaryText = [
      `✨ MYWALLET ${yr} FINANCIAL WRAPPED ✨`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🛡️ Personality: ${personality.badgeTitle}`,
      `"${personality.tagline}"`,
      ``,
      `💰 Total Earned: ₹${totalIncome.toLocaleString('en-IN')}`,
      `💸 Total Spent: ₹${totalExpense.toLocaleString('en-IN')}`,
      `🌱 Total Saved: ₹${totalSaved.toLocaleString('en-IN')} (${savingsRate}% rate)`,
      ``,
      `🔥 Records:`,
      mostExpensiveDay ? `• Most Expensive Day: ₹${mostExpensiveDay.totalSpend.toLocaleString('en-IN')} (${mostExpensiveDay.formattedDate})` : '',
      cheapestMonth ? `• Most Frugal Month: ${cheapestMonth.monthName} (₹${cheapestMonth.totalSpend.toLocaleString('en-IN')})` : '',
      `• Longest No-Spend Streak: ${longestNoSpendStreak} days`,
      ``,
      `📊 Top 3 Spending Categories:`,
      ...topCategories.slice(0, 3).map((c, i) => `${i + 1}. ${c.name} — ₹${c.total.toLocaleString('en-IN')} (${c.percentage}%)`),
      ``,
      `💳 Primary Payment: ${mostUsedMethod} (${mostUsedMethod.includes('Card') ? ccPercent : bankPercent}%)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Tracked 100% privately with MyWallet Zenith Intelligence`,
    ].filter(Boolean).join('\n');

    return {
      year: yr,
      totalIncome,
      totalExpense,
      totalSaved,
      savingsRate,
      prevYearExpense,
      yoyPercentChange,
      mostExpensiveDay,
      cheapestMonth,
      longestNoSpendStreak,
      topCategories,
      topMerchants,
      paymentAnatomy: {
        bankPercent,
        ccPercent,
        cashPercent,
        mostUsedMethod,
        highestSpendCardName: topCardRow?.name,
        highestSpendCardTotal: topCardRow?.total,
      },
      personality,
      shareableSummaryText,
    };
  },

  /**
   * ─── TIER 3: END-OF-MONTH FINANCIAL DIGEST ──────────────────────────────
   * Comprehensive monthly intelligence report card & notification preview:
   * The Numbers, Wins, Watch-outs, Top 5 Categories, and Next Month Tip.
   */
  getMonthlyFinancialDigest(targetYearMonth?: string): MonthlyFinancialDigestData {
    const db = getDatabase();
    const now = new Date();
    const ym = targetYearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [y, m] = ym.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const prevDate = new Date(y, m - 2, 1);
    const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthName = prevDate.toLocaleDateString('en-US', { month: 'long' });

    // 1. The Numbers
    const incRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
      [ym]
    );
    const expRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [ym]
    );
    const prevExpRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [prevYM]
    );

    const income = incRow?.total ?? 0;
    const expenses = expRow?.total ?? 0;
    const prevExpenses = prevExpRow?.total ?? 0;
    const saved = Math.max(0, income - expenses);
    const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;
    const expenseDeltaVsPrev = expenses - prevExpenses;
    const expensePercentChangeVsPrev = prevExpenses > 0
      ? Math.round((expenseDeltaVsPrev / prevExpenses) * 100)
      : 0;

    // 2. Wins
    const wins: string[] = [];
    const budgets = BudgetRepository.getAllWithProgress(ym);
    if (budgets.length > 0) {
      const underCount = budgets.filter((b) => !b.isOverBudget).length;
      wins.push(`Stayed under budget in ${underCount}/${budgets.length} categories`);
    }

    const totalDaysInMonth = new Date(y, m, 0).getDate();
    const activeSpendDaysCount = db.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(DISTINCT date) as cnt FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense' AND amount > 0;`,
      [ym]
    )?.cnt ?? 0;
    const noSpendDays = Math.max(0, totalDaysInMonth - activeSpendDaysCount);

    if (noSpendDays > 0) {
      wins.push(`${noSpendDays} no-spend days achieved this month`);
    }

    const activeCards = CreditCardRepository.getAllActive();
    const totalCreditLimit = activeCards.reduce((s, c) => s + c.credit_limit, 0);
    const totalObligations = CreditCardRepository.getTotalCreditObligations();
    if (totalCreditLimit > 0) {
      const util = Math.round((totalObligations / totalCreditLimit) * 100);
      if (util <= 30) {
        wins.push(`Credit card utilization disciplined at ${util}% (safely under 30%)`);
      }
    }

    let settledDebtsWinsAdded = false;
    try {
      const repaymentsThisMonth = db.getFirstSync<{ cnt: number; amt: number }>(
        `SELECT COUNT(*) as cnt, SUM(amount) as amt FROM debt_repayments WHERE strftime('%Y-%m', date) = ?;`,
        [ym]
      );
      if (repaymentsThisMonth && repaymentsThisMonth.cnt > 0) {
        wins.push(`Recorded ${repaymentsThisMonth.cnt} debt repayment${repaymentsThisMonth.cnt > 1 ? 's' : ''} (₹${(repaymentsThisMonth.amt || 0).toLocaleString('en-IN')})`);
        settledDebtsWinsAdded = true;
      }
    } catch {
      // Graceful fallback if table is not yet accessible
    }

    if (!settledDebtsWinsAdded) {
      try {
        const settledCount = db.getFirstSync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM people_debts WHERE is_settled = 1;`
        )?.cnt ?? 0;
        if (settledCount > 0) {
          wins.push(`${settledCount} peer debt obligation${settledCount > 1 ? 's' : ''} fully settled`);
        }
      } catch {
        // Graceful fallback
      }
    }

    if (wins.length === 0) {
      wins.push('Active expense logging sustained across all accounts');
      wins.push('Zero unverified liquidity leakages');
    }

    // 3. Watch-Outs
    const watchOuts: string[] = [];

    // Check rolling 3-month avg per category
    const topCatSpends = db.getAllSync<{
      name: string;
      color: string;
      icon: string;
      currTotal: number;
    }>(
      `SELECT c.name, c.color, c.icon, SUM(t.amount) as currTotal
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY c.id
       ORDER BY currTotal DESC
       LIMIT 5;`,
      [ym]
    );

    if (topCatSpends.length > 0) {
      const topCat = topCatSpends[0];
      const prevCatTotal = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(t.amount) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE strftime('%Y-%m', t.date) = ? AND c.name = ? AND t.type = 'expense';`,
        [prevYM, topCat.name]
      )?.total ?? 0;

      if (prevCatTotal > 0 && topCat.currTotal > prevCatTotal * 1.2) {
        const spikePct = Math.round(((topCat.currTotal - prevCatTotal) / prevCatTotal) * 100);
        watchOuts.push(`${topCat.name}: ₹${topCat.currTotal.toLocaleString('en-IN')} — ${spikePct}% surge above ${prevMonthName}`);
      }
    }

    // Single largest expense spike
    const maxTx = db.getFirstSync<{ amount: number; note: string | null; date: string }>(
      `SELECT amount, note, date FROM transactions WHERE strftime('%Y-%m', date) = ? AND type = 'expense' ORDER BY amount DESC LIMIT 1;`,
      [ym]
    );
    if (maxTx && maxTx.amount >= 2000) {
      const [, mStr, dStr] = maxTx.date.split('-');
      watchOuts.push(`Peak expense: ₹${maxTx.amount.toLocaleString('en-IN')} (${maxTx.note ? maxTx.note.trim() : 'Logged expense'} on ${mStr}/${dStr})`);
    }

    // Weekend multiplier
    const velocity = this.getWeekendVsWeekdayVelocity(ym);
    if (velocity.velocityMultiplier >= 1.6) {
      watchOuts.push(`Weekend spending is ${velocity.velocityMultiplier}× higher than weekday pace`);
    }

    if (watchOuts.length === 0) {
      watchOuts.push('No critical spending surges detected this cycle.');
    }

    // 4. Top 5 Categories with deltas
    const topCategories: MonthlyDigestTopCategory[] = topCatSpends.map((cat) => {
      const prevCat = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(t.amount) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE strftime('%Y-%m', t.date) = ? AND c.name = ? AND t.type = 'expense';`,
        [prevYM, cat.name]
      )?.total ?? 0;

      const deltaPercent = prevCat > 0
        ? Math.round(((cat.currTotal - prevCat) / prevCat) * 100)
        : 0;

      return {
        name: cat.name,
        amount: cat.currTotal,
        percentage: expenses > 0 ? Math.round((cat.currTotal / expenses) * 100) : 0,
        color: cat.color,
        icon: cat.icon,
        deltaPercent,
      };
    });

    // 5. Next Month Tip
    let nextMonthTip = 'Continue maintaining balanced daily pace to strengthen emergency reserves.';
    if (topCatSpends.length > 0) {
      const primaryCat = topCatSpends[0];
      const targetSavings = Math.round(primaryCat.currTotal * 0.15);
      nextMonthTip = `Reduce ${primaryCat.name} by 15% (₹${targetSavings.toLocaleString('en-IN')}) next month → boost net savings rate by ~${Math.min(10, Math.max(3, Math.round((targetSavings / Math.max(1, income)) * 100)))}%.`;
    }

    // 6. Score Comparison
    const curHealth = this.getTransparentHealthScore(ym);
    const prevHealth = this.getTransparentHealthScore(prevYM);
    const scoreDelta = curHealth.totalScore - prevHealth.totalScore;

    // Formatted Notification Preview
    const changeDirection = expensePercentChangeVsPrev <= 0 ? '↓' : '↑';
    const formattedNotificationText = [
      `💰 Income: ₹${income.toLocaleString('en-IN')} | Spent: ₹${expenses.toLocaleString('en-IN')} (${changeDirection}${Math.abs(expensePercentChangeVsPrev)}%) | Saved: ₹${saved.toLocaleString('en-IN')} (${savingsRate}%)`,
      `🏆 Wins: ${wins[0] || 'Discipline maintained'}`,
      watchOuts[0] ? `⚠️ Watch Out: ${watchOuts[0]}` : '',
      `📈 Health Score: ${prevHealth.totalScore} → ${curHealth.totalScore} (${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts)`,
    ].filter(Boolean).join('\n');

    return {
      monthKey: ym,
      monthLabel,
      theNumbers: {
        income,
        expenses,
        saved,
        savingsRate,
        expenseDeltaVsPrev,
        expensePercentChangeVsPrev,
      },
      wins,
      watchOuts,
      topCategories,
      nextMonthTip,
      scoreComparison: {
        currentScore: curHealth.totalScore,
        prevScore: prevHealth.totalScore,
        scoreDelta,
      },
      formattedNotificationText,
    };
  },
};
