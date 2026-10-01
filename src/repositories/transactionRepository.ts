/**
 * MyWallet — Transaction Repository
 * 
 * Manages income, expense, and transfer ledger logs.
 */

import { getDatabase } from '@/db/client';
import { Transaction } from '@/db/schema';
import { AiIntelligenceService } from '@/services/aiIntelligenceService';

export interface MonthlyTotals {
  income: number;
  expense: number;
  saved: number;
}

export interface CategorySpend {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  percentage: number;
}

export interface TransactionWithDetails extends Transaction {
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  subcategory_name?: string | null;
  account_name?: string | null;
  dest_account_name?: string | null;
  credit_card_name?: string | null;
}

export const TransactionRepository = {
  getRecent(limit: number = 20): Transaction[] {
    const db = getDatabase();
    return db.getAllSync<Transaction>(
      'SELECT * FROM transactions ORDER BY date DESC, time DESC LIMIT ?;',
      [limit]
    );
  },

  getTotalCount(): number {
    try {
      const db = getDatabase();
      const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM transactions;');
      return row?.count ?? 0;
    } catch {
      return 0;
    }
  },

  getByDateRange(startDate: string, endDate: string): Transaction[] {
    const db = getDatabase();
    return db.getAllSync<Transaction>(
      'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC;',
      [startDate, endDate]
    );
  },

  getMonthlyTotals(yearMonth: string): MonthlyTotals {
    const db = getDatabase();
    // yearMonth formatted as 'YYYY-MM'
    const incomeRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE strftime('%Y-%m', date) = ? AND type = 'income';`,
      [yearMonth]
    );

    const expenseRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE strftime('%Y-%m', date) = ? AND type = 'expense';`,
      [yearMonth]
    );

    const income = incomeRow?.total ?? 0;
    const expense = expenseRow?.total ?? 0;
    const saved = income - expense;

    return { income, expense, saved };
  },

  getCategoryMonthlySpend(yearMonth: string): CategorySpend[] {
    const db = getDatabase();
    interface RawCategoryRow {
      category_id: string;
      name: string;
      color: string;
      icon: string;
      total: number;
    }

    const rows = db.getAllSync<RawCategoryRow>(
      `SELECT t.category_id, c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE strftime('%Y-%m', t.date) = ? AND t.type = 'expense'
       GROUP BY t.category_id
       ORDER BY total DESC;`,
      [yearMonth]
    );

    const totalSpend = rows.reduce((sum: number, r: RawCategoryRow) => sum + r.total, 0);

    return rows.map((r: RawCategoryRow) => ({
      categoryId: r.category_id,
      categoryName: r.name || 'Uncategorized',
      categoryColor: r.color || '#8F937A',
      categoryIcon: r.icon || 'HelpCircle',
      total: r.total,
      percentage: totalSpend > 0 ? Math.round((r.total / totalSpend) * 100) : 0,
    }));
  },

  create(tx: Omit<Transaction, 'created_at' | 'updated_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Verify foreign keys to prevent FOREIGN KEY constraint failed errors
    let validAccountId: string | null = null;
    if (tx.account_id) {
      const acc = db.getFirstSync<{ id: string }>('SELECT id FROM accounts WHERE id = ?;', [tx.account_id]);
      if (acc) validAccountId = tx.account_id;
    }

    let validDestAccountId: string | null = null;
    if (tx.dest_account_id) {
      const destAcc = db.getFirstSync<{ id: string }>('SELECT id FROM accounts WHERE id = ?;', [tx.dest_account_id]);
      if (destAcc) validDestAccountId = tx.dest_account_id;
    }

    let validCardId: string | null = null;
    if (tx.credit_card_id) {
      const card = db.getFirstSync<{ id: string }>('SELECT id FROM credit_cards WHERE id = ?;', [tx.credit_card_id]);
      if (card) validCardId = tx.credit_card_id;
    }

    let validCategoryId: string | null = null;
    if (tx.category_id) {
      const cat = db.getFirstSync<{ id: string }>('SELECT id FROM categories WHERE id = ?;', [tx.category_id]);
      if (cat) validCategoryId = tx.category_id;
    }

    let validSubcategoryId: string | null = null;
    if (tx.subcategory_id) {
      const subcat = db.getFirstSync<{ id: string }>('SELECT id FROM categories WHERE id = ?;', [tx.subcategory_id]);
      if (subcat) validSubcategoryId = tx.subcategory_id;
    }

    db.runSync(
      `INSERT INTO transactions (id, type, amount, account_id, dest_account_id, credit_card_id, category_id, subcategory_id, date, time, note, expression, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        tx.id,
        tx.type,
        tx.amount,
        validAccountId,
        validDestAccountId,
        validCardId,
        validCategoryId,
        validSubcategoryId,
        tx.date,
        tx.time,
        tx.note ?? null,
        tx.expression ?? null,
        now,
        now,
      ]
    );

    // If transaction affects an account, adjust balance
    if (validAccountId) {
      if (tx.type === 'income') {
        db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          validAccountId,
        ]);
      } else if (tx.type === 'expense') {
        db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          validAccountId,
        ]);
      } else if (tx.type === 'transfer' && validDestAccountId) {
        db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          validAccountId,
        ]);
        db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          validDestAccountId,
        ]);
      }
    }

    // Phase 3.5: Centralized anomaly audit trigger across all transaction creation routes
    try {
      const fullTx: Transaction = {
        ...tx,
        created_at: now,
        updated_at: now,
      };
      AiIntelligenceService.auditTransaction(fullTx).catch((err) => {
        console.warn('Central anomaly audit failed:', err);
      });
    } catch (e) {
      console.warn('Error launching anomaly audit:', e);
    }
  },

  getByDate(date: string): Transaction[] {
    const db = getDatabase();
    return db.getAllSync<Transaction>(
      'SELECT * FROM transactions WHERE date = ? ORDER BY time DESC, created_at DESC;',
      [date]
    );
  },

  getDaysWithActivity(yearMonth: string): Record<string, { hasExpense: boolean; hasIncome: boolean; hasTransfer: boolean; totalSpend: number; count: number }> {
    const db = getDatabase();
    interface ActivityRow {
      date: string;
      type: 'income' | 'expense' | 'transfer';
      amount: number;
    }

    const rows = db.getAllSync<ActivityRow>(
      `SELECT date, type, amount FROM transactions WHERE strftime('%Y-%m', date) = ?;`,
      [yearMonth]
    );

    const result: Record<string, { hasExpense: boolean; hasIncome: boolean; hasTransfer: boolean; totalSpend: number; count: number }> = {};

    for (const r of rows) {
      if (!result[r.date]) {
        result[r.date] = { hasExpense: false, hasIncome: false, hasTransfer: false, totalSpend: 0, count: 0 };
      }
      result[r.date].count += 1;
      if (r.type === 'expense') {
        result[r.date].hasExpense = true;
        result[r.date].totalSpend += r.amount;
      } else if (r.type === 'income') {
        result[r.date].hasIncome = true;
      } else if (r.type === 'transfer') {
        result[r.date].hasTransfer = true;
      }
    }

    return result;
  },

  delete(id: string): void {
    const db = getDatabase();
    const tx = db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [id]);
    if (!tx) {
      return;
    }

    const now = new Date().toISOString();

    // Reverse financial balance impacts
    if (tx.account_id) {
      if (tx.type === 'expense') {
        // Refund spent amount back to account
        db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          tx.account_id,
        ]);
      } else if (tx.type === 'income') {
        // Deduct previously added income from account
        db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          tx.account_id,
        ]);
      } else if (tx.type === 'transfer') {
        // Refund source account, deduct destination account
        db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          tx.account_id,
        ]);
        if (tx.dest_account_id) {
          db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
            tx.amount,
            now,
            tx.dest_account_id,
          ]);
        }
      }
    }

    // Note: If charged to credit_card_id, removing the transaction record
    // automatically decreases the dynamically calculated card outstanding in CreditCardRepository!

    db.runSync('DELETE FROM transactions WHERE id = ?;', [id]);
  },

  getAllWithDetails(): TransactionWithDetails[] {
    const db = getDatabase();
    return db.getAllSync<TransactionWithDetails>(
      `SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        da.name as dest_account_name,
        cc.name as credit_card_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN categories sc ON t.subcategory_id = sc.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts da ON t.dest_account_id = da.id
      LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
      ORDER BY t.date DESC, t.time DESC, t.created_at DESC;`
    );
  },

  update(updatedTx: Transaction): void {
    const db = getDatabase();
    const oldTx = db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [updatedTx.id]);
    if (!oldTx) return;

    // Revert old transaction financial impact
    this.delete(updatedTx.id);

    // Re-create transaction with updated details
    this.create({
      id: updatedTx.id,
      type: updatedTx.type,
      amount: updatedTx.amount,
      account_id: updatedTx.account_id,
      dest_account_id: updatedTx.dest_account_id,
      credit_card_id: updatedTx.credit_card_id,
      category_id: updatedTx.category_id,
      subcategory_id: updatedTx.subcategory_id,
      date: updatedTx.date,
      time: updatedTx.time,
      note: updatedTx.note,
      expression: updatedTx.expression,
    });
  },
};
