/**
 * MyWallet — Temporary Transaction Repository
 * 
 * Manages floating outlays / payments made on behalf of friends or others.
 * These records intentionally DO NOT deduct from bank balances or affect
 * "Available to Spend" to prevent calculation discrepancies.
 */

import { getDatabase } from '@/db/client';
import { TemporaryTransaction } from '@/db/schema';

export const TemporaryTransactionRepository = {
  getAll(): TemporaryTransaction[] {
    const db = getDatabase();
    return db.getAllSync<TemporaryTransaction>(
      'SELECT * FROM temporary_transactions ORDER BY is_returned ASC, date DESC, created_at DESC;'
    );
  },

  getPending(): TemporaryTransaction[] {
    const db = getDatabase();
    return db.getAllSync<TemporaryTransaction>(
      'SELECT * FROM temporary_transactions WHERE is_returned = 0 ORDER BY date DESC, created_at DESC;'
    );
  },

  getReturned(): TemporaryTransaction[] {
    const db = getDatabase();
    return db.getAllSync<TemporaryTransaction>(
      'SELECT * FROM temporary_transactions WHERE is_returned = 1 ORDER BY date DESC, created_at DESC;'
    );
  },

  getById(id: string): TemporaryTransaction | null {
    const db = getDatabase();
    return (
      db.getFirstSync<TemporaryTransaction>(
        'SELECT * FROM temporary_transactions WHERE id = ?;',
        [id]
      ) ?? null
    );
  },

  getTotalPendingAmount(): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM temporary_transactions WHERE is_returned = 0;'
    );
    return result?.total ?? 0;
  },

  create(tx: TemporaryTransaction): void {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO temporary_transactions (
        id, title, person_name, amount, payment_source_type,
        payment_source_id, payment_source_name, category_id,
        date, time, is_returned, returned_date, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        tx.id,
        tx.title,
        tx.person_name ?? null,
        tx.amount,
        tx.payment_source_type ?? 'none',
        tx.payment_source_id ?? null,
        tx.payment_source_name ?? null,
        tx.category_id ?? null,
        tx.date,
        tx.time,
        tx.is_returned ?? 0,
        tx.returned_date ?? null,
        tx.notes ?? null,
        tx.created_at,
        tx.updated_at,
      ]
    );
  },

  markAsReturned(id: string): void {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE temporary_transactions SET is_returned = 1, returned_date = ?, updated_at = ? WHERE id = ?;',
      [today, now, id]
    );
  },

  markAsPending(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE temporary_transactions SET is_returned = 0, returned_date = NULL, updated_at = ? WHERE id = ?;',
      [now, id]
    );
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync('DELETE FROM temporary_transactions WHERE id = ?;', [id]);
  },
};
