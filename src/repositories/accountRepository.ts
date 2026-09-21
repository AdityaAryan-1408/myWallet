/**
 * MyWallet — Account Repository
 * 
 * Manages bank and cash accounts in the SQLite database.
 */

import { getDatabase } from '@/db/client';
import { Account } from '@/db/schema';

export const AccountRepository = {
  getAllActive(): Account[] {
    const db = getDatabase();
    return db.getAllSync<Account>(
      'SELECT * FROM accounts WHERE is_active = 1 ORDER BY display_order ASC, name ASC;'
    );
  },

  getPrimary(): Account | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Account>(
        'SELECT * FROM accounts WHERE is_primary = 1 AND is_active = 1 LIMIT 1;'
      ) ?? null
    );
  },

  getById(id: string): Account | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ?;', [id]) ?? null
    );
  },

  getTotalBankCashBalance(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ total: number | null }>(
      'SELECT SUM(balance) as total FROM accounts WHERE is_active = 1;'
    );
    return row?.total ?? 0;
  },

  updateBalance(id: string, newBalance: number): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?;',
      [newBalance, now, id]
    );
  },

  create(account: Omit<Account, 'created_at' | 'updated_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO accounts (id, name, type, balance, institution, currency, is_primary, is_active, display_order, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        account.id,
        account.name,
        account.type,
        account.balance,
        account.institution ?? null,
        account.currency || 'INR',
        account.is_primary,
        account.is_active,
        account.display_order,
        account.notes ?? null,
        now,
        now,
      ]
    );
  },

  archive(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync('UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?;', [
      now,
      id,
    ]);
  },

  update(
    id: string,
    fields: Partial<Pick<Account, 'name' | 'type' | 'balance' | 'institution' | 'is_primary' | 'notes' | 'display_order'>>,
  ): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const sets: string[] = [];
    const values: any[] = [];

    if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
    if (fields.type !== undefined) { sets.push('type = ?'); values.push(fields.type); }
    if (fields.balance !== undefined) { sets.push('balance = ?'); values.push(fields.balance); }
    if (fields.institution !== undefined) { sets.push('institution = ?'); values.push(fields.institution); }
    if (fields.is_primary !== undefined) { sets.push('is_primary = ?'); values.push(fields.is_primary); }
    if (fields.notes !== undefined) { sets.push('notes = ?'); values.push(fields.notes); }
    if (fields.display_order !== undefined) { sets.push('display_order = ?'); values.push(fields.display_order); }

    if (sets.length === 0) return;
    sets.push('updated_at = ?');
    values.push(now, id);
    db.runSync(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?;`, values);
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync('DELETE FROM accounts WHERE id = ?;', [id]);
  },

  setPrimary(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    // Clear all primaries, then set the requested one
    db.runSync('UPDATE accounts SET is_primary = 0, updated_at = ? WHERE is_primary = 1;', [now]);
    db.runSync('UPDATE accounts SET is_primary = 1, updated_at = ? WHERE id = ?;', [now, id]);
  },

  getCount(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM accounts WHERE is_active = 1;');
    return row?.cnt ?? 0;
  },
};
