/**
 * MyWallet — Reservation Repository
 * 
 * Manages reserved funds, sinking funds, and goals that lock capital away from Available to Spend.
 */

import { getDatabase } from '@/db/client';
import { Reservation } from '@/db/schema';

export const ReservationRepository = {
  getAllActive(): Reservation[] {
    const db = getDatabase();
    return db.getAllSync<Reservation>(
      'SELECT * FROM reservations WHERE is_active = 1 ORDER BY amount DESC;'
    );
  },

  getById(id: string): Reservation | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Reservation>('SELECT * FROM reservations WHERE id = ?;', [id]) ?? null
    );
  },

  getTotalReservedAffectingAvailable(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM reservations WHERE is_active = 1 AND affects_available = 1;'
    );
    return row?.total ?? 0;
  },

  create(res: Omit<Reservation, 'created_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO reservations (id, name, amount, target_amount, note, affects_available, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        res.id,
        res.name,
        res.amount,
        res.target_amount ?? null,
        res.note ?? null,
        res.affects_available,
        res.is_active,
        now,
      ]
    );
  },

  updateAmount(id: string, newAmount: number): void {
    const db = getDatabase();
    db.runSync('UPDATE reservations SET amount = ? WHERE id = ?;', [newAmount, id]);
  },

  update(
    id: string,
    fields: Partial<Pick<Reservation, 'name' | 'amount' | 'target_amount' | 'note' | 'affects_available' | 'is_active'>>,
  ): void {
    const db = getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
    if (fields.amount !== undefined) { sets.push('amount = ?'); values.push(fields.amount); }
    if (fields.target_amount !== undefined) { sets.push('target_amount = ?'); values.push(fields.target_amount); }
    if (fields.note !== undefined) { sets.push('note = ?'); values.push(fields.note); }
    if (fields.affects_available !== undefined) { sets.push('affects_available = ?'); values.push(fields.affects_available); }
    if (fields.is_active !== undefined) { sets.push('is_active = ?'); values.push(fields.is_active); }

    if (sets.length === 0) return;
    values.push(id);
    db.runSync(`UPDATE reservations SET ${sets.join(', ')} WHERE id = ?;`, values);
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync('DELETE FROM reservations WHERE id = ?;', [id]);
  },

  getCount(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM reservations WHERE is_active = 1;');
    return row?.cnt ?? 0;
  },

  getTotalReserved(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ total: number | null }>(
      'SELECT SUM(amount) as total FROM reservations WHERE is_active = 1;'
    );
    return row?.total ?? 0;
  },

  archive(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE reservations SET is_active = 0 WHERE id = ?;', [id]);
  },
};
