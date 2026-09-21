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

    const todayStr = referenceDate.toISOString().split('T')[0];

    const days: HeatmapDay[] = dates.map((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const match = spendMap.get(dateStr);
      const spend = match?.spend ?? 0;
      const cnt = match?.cnt ?? 0;

      return {
        date: dateStr,
        dayOfWeek: dateObj.getDay(),
        dayOfMonth: d,
        spend,
        isNoSpend: spend === 0,
        transactionCount: cnt,
        isToday: dateStr === todayStr,
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
};
