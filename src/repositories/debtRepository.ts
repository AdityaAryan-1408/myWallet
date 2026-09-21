/**
 * MyWallet — People Debt Repository
 * 
 * Manages tracking of peer debts (who owes me, whom I owe).
 */

import { getDatabase } from '@/db/client';
import { PeopleDebt } from '@/db/schema';

export const DebtRepository = {
  getUnsettled(): PeopleDebt[] {
    const db = getDatabase();
    return db.getAllSync<PeopleDebt>(
      'SELECT * FROM people_debts WHERE is_settled = 0 ORDER BY created_at DESC;'
    );
  },

  getAll(): PeopleDebt[] {
    const db = getDatabase();
    return db.getAllSync<PeopleDebt>(
      'SELECT * FROM people_debts ORDER BY is_settled ASC, created_at DESC;'
    );
  },

  create(debt: Omit<PeopleDebt, 'created_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO people_debts (id, person_name, amount, direction, reason, note, linked_transaction_id, is_settled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        debt.id,
        debt.person_name,
        debt.amount,
        debt.direction,
        debt.reason ?? null,
        debt.note ?? null,
        debt.linked_transaction_id ?? null,
        debt.is_settled,
        now,
      ]
    );
  },

  settle(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE people_debts SET is_settled = 1 WHERE id = ?;', [id]);
  },
};
