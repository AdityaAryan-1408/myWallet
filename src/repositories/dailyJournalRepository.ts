/**
 * MyWallet — Daily Journal Repository (Feature B3: Money Memory)
 * 
 * Manages contextual daily diary entries and tags in SQLite:
 * Allows user to annotate any day with a custom one-line story/context
 * (e.g. "First day of new job", "Sick day at home", "Weekend trip to Goa").
 */

import { getDatabase } from '@/db/client';
import { DailyJournal } from '@/db/schema';

export const DailyJournalRepository = {
  /**
   * Retrieves all journal entries as a map keyed by YYYY-MM-DD.
   */
  getAll(): Record<string, DailyJournal> {
    try {
      const db = getDatabase();
      const rows = db.getAllSync<DailyJournal>(
        'SELECT * FROM daily_journals ORDER BY date DESC;'
      );
      const map: Record<string, DailyJournal> = {};
      for (const row of rows) {
        map[row.date] = row;
      }
      return map;
    } catch (e) {
      console.warn('Error fetching all daily journals:', e);
      return {};
    }
  },

  /**
   * Retrieves a single journal entry for a given date.
   */
  getByDate(date: string): DailyJournal | null {
    try {
      const db = getDatabase();
      return db.getFirstSync<DailyJournal>(
        'SELECT * FROM daily_journals WHERE date = ?;',
        [date]
      );
    } catch (e) {
      console.warn(`Error fetching daily journal for ${date}:`, e);
      return null;
    }
  },

  /**
   * Upserts a journal entry for a given date.
   */
  save(date: string, note: string, emoji?: string | null, tag?: string | null): DailyJournal {
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanNote = note.trim();
    const cleanEmoji = emoji?.trim() || null;
    const cleanTag = tag?.trim() || null;

    db.runSync(
      `INSERT INTO daily_journals (date, note, emoji, tag, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         note = excluded.note,
         emoji = excluded.emoji,
         tag = excluded.tag,
         updated_at = excluded.updated_at;`,
      [date, cleanNote, cleanEmoji, cleanTag, now, now]
    );

    return {
      date,
      note: cleanNote,
      emoji: cleanEmoji,
      tag: cleanTag,
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Deletes a journal entry for a given date.
   */
  delete(date: string): void {
    try {
      const db = getDatabase();
      db.runSync('DELETE FROM daily_journals WHERE date = ?;', [date]);
    } catch (e) {
      console.warn(`Error deleting daily journal for ${date}:`, e);
    }
  },
};
