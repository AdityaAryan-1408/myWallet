/**
 * MyWallet — People Debt Repository
 * 
 * Manages tracking of peer debts (who owes me, whom I owe),
 * partial repayment event ledgers, and net balance summaries.
 */

import { getDatabase } from '@/db/client';
import { PeopleDebt, DebtRepayment, DebtDirection } from '@/db/schema';

export interface DebtWithRepayments extends PeopleDebt {
  paid_amount: number;
  remaining_amount: number;
  repayments: DebtRepayment[];
}

export interface DebtSummary {
  total_i_owe: number;
  total_they_owe: number;
  net_balance: number; // total_they_owe - total_i_owe (positive = people owe you)
  pending_count: number;
  settled_count: number;
}

export const DebtRepository = {
  getAll(): PeopleDebt[] {
    const db = getDatabase();
    return db.getAllSync<PeopleDebt>(
      'SELECT * FROM people_debts ORDER BY is_settled ASC, created_at DESC;'
    );
  },

  getUnsettled(): PeopleDebt[] {
    const db = getDatabase();
    return db.getAllSync<PeopleDebt>(
      'SELECT * FROM people_debts WHERE is_settled = 0 ORDER BY created_at DESC;'
    );
  },

  getById(id: string): PeopleDebt | null {
    const db = getDatabase();
    return db.getFirstSync<PeopleDebt>('SELECT * FROM people_debts WHERE id = ?;', [id]) ?? null;
  },

  /**
   * Get debts along with repayment events, calculating paid_amount and remaining_amount.
   */
  getAllWithRepayments(filter?: 'all' | 'i_owe' | 'they_owe' | 'settled'): DebtWithRepayments[] {
    const db = getDatabase();

    let query = 'SELECT * FROM people_debts';
    const params: any[] = [];

    if (filter === 'i_owe') {
      query += ' WHERE is_settled = 0 AND direction = ?';
      params.push('i_owe');
    } else if (filter === 'they_owe') {
      query += ' WHERE is_settled = 0 AND direction = ?';
      params.push('they_owe');
    } else if (filter === 'settled') {
      query += ' WHERE is_settled = 1';
    }

    query += ' ORDER BY is_settled ASC, created_at DESC;';

    const debts = db.getAllSync<PeopleDebt>(query, params);

    return debts.map((debt) => {
      const repayments = db.getAllSync<DebtRepayment>(
        'SELECT * FROM debt_repayments WHERE debt_id = ? ORDER BY date DESC, created_at DESC;',
        [debt.id]
      );

      const paid_amount = repayments.reduce((sum, r) => sum + r.amount, 0);
      const remaining_amount = debt.is_settled === 1 ? 0 : Math.max(debt.amount - paid_amount, 0);

      return {
        ...debt,
        paid_amount,
        remaining_amount,
        repayments,
      };
    });
  },

  /**
   * Calculate overall debt summary position:
   * - total_i_owe: Remaining sum you owe others
   * - total_they_owe: Remaining sum others owe you
   * - net_balance: Net receivable (+/-)
   */
  getDebtSummary(): DebtSummary {
    const allDebts = this.getAllWithRepayments('all');

    let total_i_owe = 0;
    let total_they_owe = 0;
    let pending_count = 0;
    let settled_count = 0;

    allDebts.forEach((d) => {
      if (d.is_settled === 1) {
        settled_count++;
      } else {
        pending_count++;
        if (d.direction === 'i_owe') {
          total_i_owe += d.remaining_amount;
        } else if (d.direction === 'they_owe') {
          total_they_owe += d.remaining_amount;
        }
      }
    });

    return {
      total_i_owe,
      total_they_owe,
      net_balance: total_they_owe - total_i_owe,
      pending_count,
      settled_count,
    };
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
        debt.is_settled ?? 0,
        now,
      ]
    );
  },

  update(
    id: string,
    fields: Partial<Pick<PeopleDebt, 'person_name' | 'amount' | 'direction' | 'reason' | 'note' | 'is_settled'>>
  ): void {
    const db = getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    if (fields.person_name !== undefined) { sets.push('person_name = ?'); values.push(fields.person_name); }
    if (fields.amount !== undefined) { sets.push('amount = ?'); values.push(fields.amount); }
    if (fields.direction !== undefined) { sets.push('direction = ?'); values.push(fields.direction); }
    if (fields.reason !== undefined) { sets.push('reason = ?'); values.push(fields.reason); }
    if (fields.note !== undefined) { sets.push('note = ?'); values.push(fields.note); }
    if (fields.is_settled !== undefined) { sets.push('is_settled = ?'); values.push(fields.is_settled); }

    if (sets.length === 0) return;
    values.push(id);
    db.runSync(`UPDATE people_debts SET ${sets.join(', ')} WHERE id = ?;`, values);
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync('DELETE FROM people_debts WHERE id = ?;', [id]);
  },

  settle(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE people_debts SET is_settled = 1 WHERE id = ?;', [id]);
  },

  unsettle(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE people_debts SET is_settled = 0 WHERE id = ?;', [id]);
  },

  /**
   * Log an immutable repayment event.
   * If total repayments cover the principal, marks the debt as settled automatically.
   */
  recordRepayment(debtId: string, amount: number, date: string, note?: string): DebtRepayment {
    const db = getDatabase();
    const now = new Date().toISOString();
    const repaymentId = `rep_${Date.now()}`;

    db.runSync(
      `INSERT INTO debt_repayments (id, debt_id, amount, date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [repaymentId, debtId, amount, date, note ?? null, now]
    );

    // Check if debt is fully paid
    const debt = this.getById(debtId);
    if (debt) {
      const repayments = this.getRepayments(debtId);
      const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
      if (totalPaid >= debt.amount) {
        this.settle(debtId);
      }
    }

    return {
      id: repaymentId,
      debt_id: debtId,
      amount,
      date,
      note: note ?? null,
      created_at: now,
    };
  },

  getRepayments(debtId: string): DebtRepayment[] {
    const db = getDatabase();
    return db.getAllSync<DebtRepayment>(
      'SELECT * FROM debt_repayments WHERE debt_id = ? ORDER BY date DESC, created_at DESC;',
      [debtId]
    );
  },

  deleteRepayment(repaymentId: string): void {
    const db = getDatabase();
    const repayment = db.getFirstSync<DebtRepayment>('SELECT * FROM debt_repayments WHERE id = ?;', [repaymentId]);
    if (repayment) {
      db.runSync('DELETE FROM debt_repayments WHERE id = ?;', [repaymentId]);
      // Re-evaluate debt settled status
      const debt = this.getById(repayment.debt_id);
      if (debt && debt.is_settled === 1) {
        const remainingRepayments = this.getRepayments(repayment.debt_id);
        const totalPaid = remainingRepayments.reduce((sum, r) => sum + r.amount, 0);
        if (totalPaid < debt.amount) {
          this.unsettle(repayment.debt_id);
        }
      }
    }
  },

  /**
   * Returns unique list of person names from previous debts for autocomplete.
   */
  getDistinctPeople(): string[] {
    const db = getDatabase();
    const rows = db.getAllSync<{ person_name: string }>(
      'SELECT DISTINCT person_name FROM people_debts ORDER BY person_name ASC;'
    );
    return rows.map((r) => r.person_name);
  },
};
