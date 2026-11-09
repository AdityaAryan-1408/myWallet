/**
 * MyWallet — SMS Staging Repository
 * 
 * Stores incoming bank SMS transactions staged for user verification.
 */

import { getDatabase } from '@/db/client';
import { SmsStagedTransaction } from '@/db/schema';

export const SmsStagingRepository = {
  create(staged: SmsStagedTransaction): void {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO sms_staged_transactions 
        (id, sender, raw_body, amount, type, account_id, credit_card_id, category_id, merchant_name, notification_id, status, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        staged.id,
        staged.sender,
        staged.raw_body,
        staged.amount,
        staged.type,
        staged.account_id ?? null,
        staged.credit_card_id ?? null,
        staged.category_id ?? null,
        staged.merchant_name ?? null,
        staged.notification_id,
        staged.status || 'pending',
        staged.received_at,
      ]
    );
  },

  getPending(): SmsStagedTransaction[] {
    const db = getDatabase();
    try {
      return db.getAllSync<SmsStagedTransaction>(
        `SELECT * FROM sms_staged_transactions WHERE status = 'pending' ORDER BY received_at DESC;`
      );
    } catch {
      return [];
    }
  },

  getById(id: string): SmsStagedTransaction | null {
    const db = getDatabase();
    try {
      return (
        db.getFirstSync<SmsStagedTransaction>(
          'SELECT * FROM sms_staged_transactions WHERE id = ?;',
          [id]
        ) || null
      );
    } catch {
      return null;
    }
  },

  markConverted(id: string): void {
    const db = getDatabase();
    try {
      db.runSync(
        `UPDATE sms_staged_transactions SET status = 'converted' WHERE id = ?;`,
        [id]
      );
    } catch (e) {
      console.warn('Failed to mark staged SMS as converted:', e);
    }
  },

  markDismissed(id: string): void {
    const db = getDatabase();
    try {
      db.runSync(
        `UPDATE sms_staged_transactions SET status = 'dismissed' WHERE id = ?;`,
        [id]
      );
    } catch (e) {
      console.warn('Failed to mark staged SMS as dismissed:', e);
    }
  },

  getPendingCount(): number {
    const db = getDatabase();
    try {
      const row = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sms_staged_transactions WHERE status = 'pending';`
      );
      return row?.count ?? 0;
    } catch {
      return 0;
    }
  },
};
