/**
 * MyWallet — Budget Repository
 * 
 * Manages category budgets, monthly progress aggregations, health statuses,
 * safe daily pacing, and burn rate forecasts.
 */

import { getDatabase } from '@/db/client';
import { Budget, Category } from '@/db/schema';
import { Colors } from '@/theme';

export interface BudgetWithProgress {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercentage: number;
  healthStatus: 'healthy' | 'caution' | 'warning' | 'exceeded';
  healthLabel: string;
  healthColor: string;
  isOverBudget: boolean;
  overAmount: number;
}

export interface OverallBudgetProgress {
  totalBudget: number;
  totalSpent: number;
  remainingCapital: number;
  burnedPercentage: number;
  cycleStartDate: string;
  cycleEndDate: string;
  daysRemaining: number;
  totalDaysInMonth: number;
  daysPassed: number;
  safeDailyPace: number;
  estimatedCushion: number;
  isSurplus: boolean;
}

export const BudgetRepository = {
  getAllActive(): Budget[] {
    const db = getDatabase();
    return db.getAllSync<Budget>(
      'SELECT * FROM budgets WHERE is_active = 1 ORDER BY created_at ASC;'
    );
  },

  getById(id: string): Budget | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Budget>('SELECT * FROM budgets WHERE id = ?;', [id]) ?? null
    );
  },

  getByCategoryId(categoryId: string): Budget | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Budget>(
        'SELECT * FROM budgets WHERE category_id = ? AND is_active = 1;',
        [categoryId]
      ) ?? null
    );
  },

  getAllWithProgress(yearMonth?: string): BudgetWithProgress[] {
    const db = getDatabase();
    const ym = yearMonth || getCurrentYearMonth();

    interface RawBudgetRow {
      id: string;
      category_id: string;
      amount: number;
      category_name: string;
      category_icon: string;
      category_color: string;
    }

    const budgets = db.getAllSync<RawBudgetRow>(
      `SELECT 
        b.id,
        b.category_id,
        b.amount,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.is_active = 1
       ORDER BY c.display_order ASC, c.name ASC;`
    );

    return budgets.map((b) => {
      // Sum all expenses for this category AND any of its subcategories
      const spentRow = db.getFirstSync<{ total: number | null }>(
        `SELECT SUM(amount) as total 
         FROM transactions 
         WHERE type = 'expense' 
           AND strftime('%Y-%m', date) = ?
           AND (
             category_id = ? 
             OR subcategory_id IN (SELECT id FROM categories WHERE parent_id = ?)
           );`,
        [ym, b.category_id, b.category_id]
      );

      const spentAmount = spentRow?.total ?? 0;
      const budgetAmount = b.amount;
      const remainingAmount = budgetAmount - spentAmount;
      const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const isOverBudget = spentAmount > budgetAmount;
      const overAmount = isOverBudget ? spentAmount - budgetAmount : 0;

      let healthStatus: 'healthy' | 'caution' | 'warning' | 'exceeded';
      let healthLabel: string;
      let healthColor: string;

      if (spentPercentage > 100) {
        healthStatus = 'exceeded';
        healthLabel = `Over by ₹${Math.round(overAmount).toLocaleString('en-IN')}`;
        healthColor = Colors.expense;
      } else if (spentPercentage >= 90) {
        healthStatus = 'warning';
        healthLabel = `${spentPercentage.toFixed(1)}% Used`;
        healthColor = '#FF8C32';
      } else if (spentPercentage >= 70) {
        healthStatus = 'caution';
        healthLabel = `Approaching (${Math.round(spentPercentage)}%)`;
        healthColor = '#FFD93D';
      } else {
        healthStatus = 'healthy';
        healthLabel = spentPercentage >= 60 ? 'On Track' : 'Healthy';
        healthColor = Colors.income;
      }

      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: b.category_name,
        categoryIcon: b.category_icon || 'ShoppingBag',
        categoryColor: b.category_color || '#8F937A',
        budgetAmount,
        spentAmount,
        remainingAmount,
        spentPercentage,
        healthStatus,
        healthLabel,
        healthColor,
        isOverBudget,
        overAmount,
      };
    });
  },

  getOverallBudgetProgress(yearMonth?: string): OverallBudgetProgress {
    const ym = yearMonth || getCurrentYearMonth();
    const items = this.getAllWithProgress(ym);

    const now = new Date();
    const [yearStr, monthStr] = ym.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1..12

    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const daysRemaining = Math.max(1, daysInMonth - currentDay);
    const daysPassed = Math.max(1, currentDay);

    const totalBudget = items.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpent = items.reduce((sum, item) => sum + item.spentAmount, 0);
    const remainingCapital = Math.max(0, totalBudget - totalSpent);
    const burnedPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

    const safeDailyPace = daysRemaining > 0 ? Math.round(remainingCapital / daysRemaining) : 0;

    // Projected spend: daily velocity multiplied by days in month
    const dailyVelocity = totalSpent / daysPassed;
    const projectedMonthEndSpend = dailyVelocity * daysInMonth;
    const cushion = totalBudget - projectedMonthEndSpend;
    const isSurplus = cushion >= 0;

    // Cycle date strings (e.g. "SEP 1" and "SEP 30")
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const cycleStartDate = `${monthName} 1`;
    const cycleEndDate = `${daysInMonth}`;

    return {
      totalBudget,
      totalSpent,
      remainingCapital,
      burnedPercentage,
      cycleStartDate,
      cycleEndDate,
      daysRemaining,
      totalDaysInMonth: daysInMonth,
      daysPassed,
      safeDailyPace,
      estimatedCushion: Math.round(Math.abs(cushion)),
      isSurplus,
    };
  },

  setBudget(categoryId: string, amount: number): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = this.getByCategoryId(categoryId);

    if (existing) {
      db.runSync(
        'UPDATE budgets SET amount = ?, is_active = 1, updated_at = ? WHERE id = ?;',
        [amount, now, existing.id]
      );
    } else {
      const id = `bgt_${Date.now()}`;
      db.runSync(
        `INSERT INTO budgets (id, category_id, amount, period, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 'monthly', 1, ?, ?);`,
        [id, categoryId, amount, now, now]
      );
    }
  },

  deleteBudget(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync('UPDATE budgets SET is_active = 0, updated_at = ? WHERE id = ?;', [now, id]);
  },

  getUnbudgetedExpenseCategories(): Category[] {
    const db = getDatabase();
    return db.getAllSync<Category>(
      `SELECT * FROM categories 
       WHERE type = 'expense' 
         AND is_active = 1 
         AND parent_id IS NULL 
         AND id NOT IN (SELECT category_id FROM budgets WHERE is_active = 1)
       ORDER BY display_order ASC, name ASC;`
    );
  },
};

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
