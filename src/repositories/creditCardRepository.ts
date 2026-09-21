/**
 * MyWallet — Credit Card Repository
 * 
 * Manages credit cards, limits, cycle dates, bill payments, and outstandings.
 */

import { getDatabase } from '@/db/client';
import { CreditCard } from '@/db/schema';
import { TransactionWithDetails, CategorySpend } from './transactionRepository';

// Map of initial seed outstandings for demo accuracy
const INITIAL_OUTSTANDINGS: Record<string, number> = {
  card_hdfc: 18450,
  card_icici: 6230,
};

export const CreditCardRepository = {
  getAllActive(): CreditCard[] {
    const db = getDatabase();
    return db.getAllSync<CreditCard>(
      'SELECT * FROM credit_cards WHERE is_active = 1 ORDER BY name ASC;'
    );
  },

  getById(id: string): CreditCard | null {
    const db = getDatabase();
    return (
      db.getFirstSync<CreditCard>('SELECT * FROM credit_cards WHERE id = ?;', [id]) ?? null
    );
  },

  getCardOutstanding(cardId: string): number {
    const db = getDatabase();
    // Sum of expenses logged on this card
    const expenseRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE credit_card_id = ? AND type = 'expense';`,
      [cardId]
    );

    // Sum of bill payments logged towards this card
    const paymentRow = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE credit_card_id = ? AND type = 'transfer';`,
      [cardId]
    );

    const loggedExpenses = expenseRow?.total ?? 0;
    const loggedPayments = paymentRow?.total ?? 0;
    const baseInitial = INITIAL_OUTSTANDINGS[cardId] ?? 0;

    return Math.max(0, (baseInitial + loggedExpenses) - loggedPayments);
  },

  getTotalCreditObligations(): number {
    const cards = this.getAllActive();
    return cards.reduce((sum, card) => sum + this.getCardOutstanding(card.id), 0);
  },

  getCardTransactions(cardId: string, limit: number = 20): TransactionWithDetails[] {
    const db = getDatabase();
    return db.getAllSync<TransactionWithDetails>(
      `SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        cc.name as credit_card_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories sc ON t.subcategory_id = sc.id
       LEFT JOIN accounts a ON t.account_id = a.id
       LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
       WHERE t.credit_card_id = ?
       ORDER BY t.date DESC, t.time DESC, t.created_at DESC
       LIMIT ?;`,
      [cardId, limit]
    );
  },

  getCardCycleBreakdown(cardId: string): CategorySpend[] {
    const db = getDatabase();
    interface RawRow {
      category_id: string;
      name: string;
      color: string;
      icon: string;
      total: number;
    }

    const rows = db.getAllSync<RawRow>(
      `SELECT t.category_id, c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.credit_card_id = ? AND t.type = 'expense'
       GROUP BY t.category_id
       ORDER BY total DESC;`,
      [cardId]
    );

    const totalSpend = rows.reduce((sum, r) => sum + r.total, 0);

    return rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.name || 'Uncategorized',
      categoryColor: r.color || '#8F937A',
      categoryIcon: r.icon || 'HelpCircle',
      total: r.total,
      percentage: totalSpend > 0 ? Math.round((r.total / totalSpend) * 100) : 0,
    }));
  },

  payBill(cardId: string, sourceAccountId: string, amount: number, note: string = 'Credit Card Bill Payment'): void {
    const db = getDatabase();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const txId = `tx_${Date.now()}`;

    // 1. Create transfer transaction in transactions table
    db.runSync(
      `INSERT INTO transactions (id, type, amount, account_id, credit_card_id, date, time, note, created_at, updated_at)
       VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        txId,
        amount,
        sourceAccountId,
        cardId,
        date,
        time,
        note,
        now.toISOString(),
        now.toISOString(),
      ]
    );

    // 2. Deduct amount from the source bank account
    db.runSync(
      'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;',
      [amount, now.toISOString(), sourceAccountId]
    );
  },

  create(card: Omit<CreditCard, 'created_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO credit_cards (id, name, issuer, credit_limit, cycle_reset_day, is_active, notes, last4, color, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        card.id,
        card.name,
        card.issuer,
        card.credit_limit,
        card.cycle_reset_day,
        card.is_active,
        card.notes ?? null,
        card.last4 ?? null,
        card.color,
        now,
      ]
    );
  },

  update(card: CreditCard): void {
    const db = getDatabase();
    db.runSync(
      `UPDATE credit_cards 
       SET name = ?, issuer = ?, credit_limit = ?, cycle_reset_day = ?, notes = ?, last4 = ?, color = ?
       WHERE id = ?;`,
      [
        card.name,
        card.issuer,
        card.credit_limit,
        card.cycle_reset_day,
        card.notes ?? null,
        card.last4 ?? null,
        card.color,
        card.id,
      ]
    );
  },

  delete(cardId: string): void {
    const db = getDatabase();
    db.runSync('UPDATE credit_cards SET is_active = 0 WHERE id = ?;', [cardId]);
  },
};
