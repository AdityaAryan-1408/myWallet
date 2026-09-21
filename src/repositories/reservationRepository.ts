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

  archive(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE reservations SET is_active = 0 WHERE id = ?;', [id]);
  },
};
