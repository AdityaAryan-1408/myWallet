/**
 * MyWallet — Settings Repository
 * 
 * Manages user preferences and display settings in SQLite.
 */

import { getDatabase } from '@/db/client';
import { UserSetting } from '@/db/schema';

const DEFAULT_USER_NAME = 'Aditya';

export const SettingsRepository = {
  getUserName(): string {
    try {
      const db = getDatabase();
      const row = db.getFirstSync<UserSetting>(
        'SELECT * FROM user_settings WHERE key = ?;',
        ['user_name']
      );
      return row?.value ?? DEFAULT_USER_NAME;
    } catch {
      return DEFAULT_USER_NAME;
    }
  },

  setUserName(name: string): void {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      db.runSync(
        `INSERT INTO user_settings (key, value, updated_at)
         VALUES ('user_name', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [name.trim() || DEFAULT_USER_NAME, now]
      );
    } catch (e) {
      console.warn('Could not save user name:', e);
    }
  },

  get(key: string, defaultValue: string = ''): string {
    try {
      const db = getDatabase();
      const row = db.getFirstSync<UserSetting>(
        'SELECT * FROM user_settings WHERE key = ?;',
        [key]
      );
      return row?.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key: string, value: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO user_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, now]
    );
  },
};
