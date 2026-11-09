/**
 * MyWallet — Streaks & Achievements Engine (Feature B6)
 * 
 * Elegant, non-intrusive gamification layer celebrating positive financial habits:
 * - Consecutive daily logging streaks (e.g. 7-day, 14-day, 30-day tracking)
 * - Under-budget consecutive streaks
 * - Savings goal milestones (50% halfway, 100% completed)
 * - No-impulse discipline week (no expense > ₹2,000 in past 7 days)
 * 
 * Never punitive, never shaming bad months — only reinforces healthy behavior.
 */

import { getDatabase } from '@/db/client';
import { SettingsRepository } from '@/repositories/settingsRepository';

export interface Achievement {
  id: string;
  category: 'streak' | 'budget' | 'goal' | 'discipline';
  title: string;
  description: string;
  emoji: string;
  unlockedAt: string | null;
  progress: number; // 0 to 1
  progressLabel: string;
}

export interface StreaksSummary {
  currentStreakDays: number;
  longestStreakDays: number;
  totalTransactionsLogged: number;
  monthsUnderBudget: number;
  unlockedCount: number;
  totalCount: number;
  achievements: Achievement[];
}

export const StreaksService = {
  /**
   * Calculates real-time logging streaks, milestones, and badge statuses.
   */
  getStreaksSummary(): StreaksSummary {
    try {
      const db = getDatabase();

      // ─────────────────────────────────────────────────────────────
      // 1. CALCULATE CONSECUTIVE DAILY LOGGING STREAK
      // ─────────────────────────────────────────────────────────────
      const dateRows = db.getAllSync<{ date: string }>(
        `SELECT DISTINCT date FROM transactions ORDER BY date DESC;`
      );

      const dateSet = new Set(dateRows.map((r) => r.date));

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      let currentStreak = 0;
      let walkDate = new Date();

      // If user logged today, start from today; otherwise if logged yesterday, start from yesterday
      if (dateSet.has(todayStr)) {
        walkDate = new Date();
      } else if (dateSet.has(yesterdayStr)) {
        walkDate = new Date(yesterday);
      } else {
        walkDate = new Date(0); // broken streak
      }

      if (walkDate.getTime() > 0) {
        while (true) {
          const dStr = `${walkDate.getFullYear()}-${String(walkDate.getMonth() + 1).padStart(2, '0')}-${String(walkDate.getDate()).padStart(2, '0')}`;
          if (dateSet.has(dStr)) {
            currentStreak++;
            walkDate.setDate(walkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak historically
      let longestStreak = currentStreak;
      const sortedDates = Array.from(dateSet).sort(); // ascending
      let tempStreak = 0;
      let prevDateObj: Date | null = null;

      for (const dStr of sortedDates) {
        const [y, m, d] = dStr.split('-').map(Number);
        const curDate = new Date(y, m - 1, d);

        if (!prevDateObj) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curDate.getTime() - prevDateObj.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        prevDateObj = curDate;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2. TOTAL LOGS & UNDER-BUDGET MONTHS
      // ─────────────────────────────────────────────────────────────
      const countRow = db.getFirstSync<{ total: number }>(
        'SELECT COUNT(*) as total FROM transactions;'
      );
      const totalLogs = countRow?.total ?? 0;

      // Total monthly budget configured across active categories
      const budgetTotalRow = db.getFirstSync<{ total_budget: number | null }>(
        'SELECT SUM(amount) as total_budget FROM budgets WHERE is_active = 1;'
      );
      const totalBudget = budgetTotalRow?.total_budget ?? 0;

      let monthsUnderBudget = 0;
      if (totalBudget > 0) {
        interface MonthSpend {
          month: string;
          spent: number;
        }
        const monthSpends = db.getAllSync<MonthSpend>(
          `SELECT strftime('%Y-%m', date) as month, SUM(amount) as spent
           FROM transactions
           WHERE type = 'expense'
           GROUP BY strftime('%Y-%m', date);`
        );
        for (const row of monthSpends) {
          if (row.spent <= totalBudget) {
            monthsUnderBudget++;
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. GOAL / RESERVATION COMPLETION
      // ─────────────────────────────────────────────────────────────
      interface GoalRow {
        amount: number;
        target_amount: number | null;
      }
      const goals = db.getAllSync<GoalRow>(
        'SELECT amount, target_amount FROM reservations WHERE target_amount > 0;'
      );

      let maxGoalRatio = 0;
      for (const g of goals) {
        if (g.target_amount && g.target_amount > 0) {
          const ratio = g.amount / g.target_amount;
          if (ratio > maxGoalRatio) maxGoalRatio = ratio;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 4. NO-IMPULSE WEEK (No single expense > ₹2,000 in past 7 days)
      // ─────────────────────────────────────────────────────────────
      const weekMaxRow = db.getFirstSync<{ max_amount: number | null; count: number }>(
        `SELECT MAX(amount) as max_amount, COUNT(*) as count 
         FROM transactions 
         WHERE type = 'expense' AND date >= date('now', '-7 days');`
      );

      const weekTxsCount = weekMaxRow?.count ?? 0;
      const weekMaxExpense = weekMaxRow?.max_amount ?? 0;
      const isNoImpulseWeek = weekTxsCount >= 3 && weekMaxExpense <= 2000;

      // ─────────────────────────────────────────────────────────────
      // 5. ASSEMBLE BADGES / ACHIEVEMENTS COLLECTION
      // ─────────────────────────────────────────────────────────────
      const achievements: Achievement[] = [
        {
          id: 'streak_3',
          category: 'streak',
          title: 'Spark of Habit',
          description: 'Log transactions for 3 consecutive days',
          emoji: '✨',
          unlockedAt: currentStreak >= 3 ? todayStr : null,
          progress: Math.min(currentStreak / 3, 1),
          progressLabel: `${currentStreak} / 3 days`,
        },
        {
          id: 'streak_7',
          category: 'streak',
          title: 'Flame Keeper',
          description: '7 days of uninterrupted consistent tracking',
          emoji: '🔥',
          unlockedAt: currentStreak >= 7 ? todayStr : null,
          progress: Math.min(currentStreak / 7, 1),
          progressLabel: `${currentStreak} / 7 days`,
        },
        {
          id: 'streak_14',
          category: 'streak',
          title: 'Consistent Tracker',
          description: '14 consecutive days of financial mindfulness',
          emoji: '⚡',
          unlockedAt: currentStreak >= 14 ? todayStr : null,
          progress: Math.min(currentStreak / 14, 1),
          progressLabel: `${currentStreak} / 14 days`,
        },
        {
          id: 'streak_30',
          category: 'streak',
          title: 'Habit Titan',
          description: '30 consecutive days of mastering your money',
          emoji: '👑',
          unlockedAt: currentStreak >= 30 ? todayStr : null,
          progress: Math.min(currentStreak / 30, 1),
          progressLabel: `${currentStreak} / 30 days`,
        },
        {
          id: 'budget_keeper',
          category: 'budget',
          title: 'Budget Guardian',
          description: 'Finished a monthly cycle comfortably under budget',
          emoji: '💪',
          unlockedAt: monthsUnderBudget >= 1 ? todayStr : null,
          progress: Math.min(monthsUnderBudget / 1, 1),
          progressLabel: monthsUnderBudget >= 1 ? 'Unlocked' : '0 / 1 month',
        },
        {
          id: 'budget_triple',
          category: 'budget',
          title: 'Triple Crown',
          description: 'Stay under budget for 3 consecutive months',
          emoji: '🛡️',
          unlockedAt: monthsUnderBudget >= 3 ? todayStr : null,
          progress: Math.min(monthsUnderBudget / 3, 1),
          progressLabel: `${monthsUnderBudget} / 3 months`,
        },
        {
          id: 'goal_halfway',
          category: 'goal',
          title: 'Halfway There',
          description: 'Cross 50% of any target savings reservation',
          emoji: '🎯',
          unlockedAt: maxGoalRatio >= 0.5 ? todayStr : null,
          progress: Math.min(maxGoalRatio / 0.5, 1),
          progressLabel: `${Math.round(maxGoalRatio * 100)}% / 50%`,
        },
        {
          id: 'goal_complete',
          category: 'goal',
          title: 'Goal Crusher',
          description: 'Reach 100% of a target savings fund',
          emoji: '🏆',
          unlockedAt: maxGoalRatio >= 1.0 ? todayStr : null,
          progress: Math.min(maxGoalRatio, 1),
          progressLabel: `${Math.round(maxGoalRatio * 100)}% / 100%`,
        },
        {
          id: 'no_impulse',
          category: 'discipline',
          title: 'Zen Spender',
          description: 'No unplanned purchases over ₹2,000 this week',
          emoji: '🧊',
          unlockedAt: isNoImpulseWeek ? todayStr : null,
          progress: isNoImpulseWeek ? 1 : Math.min(weekTxsCount / 3, 0.7),
          progressLabel: isNoImpulseWeek ? 'Active This Week' : 'Tracking week',
        },
        {
          id: 'first_log',
          category: 'streak',
          title: 'Genesis Step',
          description: 'Logged your very first transaction in MyWallet',
          emoji: '🌱',
          unlockedAt: totalLogs >= 1 ? todayStr : null,
          progress: totalLogs >= 1 ? 1 : 0,
          progressLabel: totalLogs >= 1 ? 'Unlocked' : '0 / 1',
        },
      ];

      const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

      return {
        currentStreakDays: currentStreak,
        longestStreakDays: longestStreak,
        totalTransactionsLogged: totalLogs,
        monthsUnderBudget,
        unlockedCount,
        totalCount: achievements.length,
        achievements,
      };
    } catch (e) {
      console.warn('Error computing streaks summary:', e);
      return {
        currentStreakDays: 1,
        longestStreakDays: 1,
        totalTransactionsLogged: 0,
        monthsUnderBudget: 0,
        unlockedCount: 1,
        totalCount: 10,
        achievements: [],
      };
    }
  },
};
