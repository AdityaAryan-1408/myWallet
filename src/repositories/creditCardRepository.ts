/**
 * MyWallet — Credit Card Repository
 * 
 * Manages credit cards, limits, cycle dates, and outstandings.
 */

import { getDatabase } from '@/db/client';
import { CreditCard } from '@/db/schema';
import { SEED_DATA } from '@/db/seed';

// Map of initial seed outstandings for demo accuracy until full bill tracker is added
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
    const row = db.getFirstSync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE credit_card_id = ? AND type = 'expense';`,
      [cardId]
    );

    const loggedTotal = row?.total ?? 0;
    const baseInitial = INITIAL_OUTSTANDINGS[cardId] ?? 0;
    return Math.max(loggedTotal, baseInitial);
  },

  getTotalCreditObligations(): number {
    const cards = this.getAllActive();
    return cards.reduce((sum, card) => sum + this.getCardOutstanding(card.id), 0);
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
};
