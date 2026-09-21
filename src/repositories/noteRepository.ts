/**
 * MyWallet — Note Repository
 * 
 * Manages persistence for the Home Dashboard scratchpad note and voice memo.
 */

import { getDatabase } from '@/db/client';
import { DashboardNote } from '@/db/schema';

const ACTIVE_NOTE_ID = 'active_note';

export const NoteRepository = {
  getActiveNote(): DashboardNote {
    const db = getDatabase();
    try {
      const row = db.getFirstSync<DashboardNote>(
        'SELECT * FROM dashboard_notes WHERE id = ?;',
        [ACTIVE_NOTE_ID]
      );

      if (row) {
        return row;
      }
    } catch (e) {
      console.warn('Could not query active note:', e);
    }

    // Default note if not yet created
    const now = new Date().toISOString();
    const initialNote: DashboardNote = {
      id: ACTIVE_NOTE_ID,
      content: '',
      voice_uri: null,
      is_minimized: 0,
      updated_at: now,
    };

    try {
      db.runSync(
        `INSERT OR IGNORE INTO dashboard_notes (id, content, voice_uri, is_minimized, updated_at)
         VALUES (?, ?, ?, ?, ?);`,
        [ACTIVE_NOTE_ID, '', null, 0, now]
      );
    } catch {
      // Fallback
    }

    return initialNote;
  },

  saveContent(content: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO dashboard_notes (id, content, voice_uri, is_minimized, updated_at)
       VALUES (?, ?, null, 0, ?)
       ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at;`,
      [ACTIVE_NOTE_ID, content, now]
    );
  },

  saveVoiceUri(voiceUri: string | null): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO dashboard_notes (id, content, voice_uri, is_minimized, updated_at)
       VALUES (?, '', ?, 0, ?)
       ON CONFLICT(id) DO UPDATE SET voice_uri = excluded.voice_uri, updated_at = excluded.updated_at;`,
      [ACTIVE_NOTE_ID, voiceUri, now]
    );
  },

  setMinimized(isMinimized: boolean): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO dashboard_notes (id, content, voice_uri, is_minimized, updated_at)
       VALUES (?, '', null, ?, ?)
       ON CONFLICT(id) DO UPDATE SET is_minimized = excluded.is_minimized, updated_at = excluded.updated_at;`,
      [ACTIVE_NOTE_ID, isMinimized ? 1 : 0, now]
    );
  },
};
