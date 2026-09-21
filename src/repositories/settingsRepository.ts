/**
 * MyWallet — Settings Repository
 * 
 * Manages user preferences, display settings, and profile personalization in SQLite.
 */

import { getDatabase } from '@/db/client';
import { UserSetting } from '@/db/schema';

const DEFAULT_USER_NAME = 'Aditya';
const DEFAULT_AVATAR_BADGE = '🚀';
const DEFAULT_CURRENCY = 'INR';
const DEFAULT_CYCLE_RESET_DAY = 1;
const DEFAULT_THEME_MODE = 'dark';

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

  getAvatarBadge(): string {
    return this.get('avatar_badge', DEFAULT_AVATAR_BADGE);
  },

  setAvatarBadge(badge: string): void {
    this.set('avatar_badge', badge || DEFAULT_AVATAR_BADGE);
  },

  getCurrency(): string {
    return this.get('currency', DEFAULT_CURRENCY);
  },

  setCurrency(currency: string): void {
    this.set('currency', currency || DEFAULT_CURRENCY);
  },

  getCycleResetDay(): number {
    const val = this.get('cycle_reset_day', String(DEFAULT_CYCLE_RESET_DAY));
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? DEFAULT_CYCLE_RESET_DAY : parsed;
  },

  setCycleResetDay(day: number): void {
    const clamped = Math.max(1, Math.min(28, day));
    this.set('cycle_reset_day', String(clamped));
  },

  getThemeMode(): 'dark' | 'light' | 'system' {
    const val = this.get('theme_mode', DEFAULT_THEME_MODE);
    if (val === 'light' || val === 'system') return val;
    return 'dark';
  },

  setThemeMode(mode: 'dark' | 'light' | 'system'): void {
    this.set('theme_mode', mode);
  },

  getHapticsEnabled(): boolean {
    const val = this.get('haptics_enabled', '1');
    return val === '1';
  },

  setHapticsEnabled(enabled: boolean): void {
    this.set('haptics_enabled', enabled ? '1' : '0');
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
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      db.runSync(
        `INSERT INTO user_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [key, value, now]
      );
    } catch (e) {
      console.warn(`Could not save setting ${key}:`, e);
    }
  },
};
