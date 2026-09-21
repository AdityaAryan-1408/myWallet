/**
 * MyWallet — Database Client (Web Stub)
 * 
 * Avoids loading native expo-sqlite WebAssembly bundle on web previews.
 */

import { SEED_DATA } from './seed';

// In-memory mock storage for web preview
const mockDb = {
  execSync: (_sql: string) => {},
  runSync: (_sql: string, _params?: any[]) => ({ changes: 0, lastInsertRowId: 0 }),
  getAllSync: <T>(sql: string, _params?: any[]): T[] => {
    if (sql.includes('FROM accounts')) {
      return SEED_DATA.accounts as unknown as T[];
    }
    if (sql.includes('FROM credit_cards')) {
      return SEED_DATA.creditCards as unknown as T[];
    }
    if (sql.includes('FROM reservations')) {
      return SEED_DATA.reservations as unknown as T[];
    }
    if (sql.includes('FROM categories')) {
      return SEED_DATA.categories as unknown as T[];
    }
    if (sql.includes('FROM transactions')) {
      return SEED_DATA.transactions as unknown as T[];
    }
    if (sql.includes('FROM people_debts')) {
      return SEED_DATA.debts as unknown as T[];
    }
    if (sql.includes('FROM budgets')) {
      return SEED_DATA.budgets as unknown as T[];
    }
    return [];
  },
  getFirstSync: <T>(sql: string, _params?: any[]): T | null => {
    if (sql.includes('COUNT(*)')) {
      return { count: SEED_DATA.categories.length } as unknown as T;
    }
    if (sql.includes('SUM(balance)')) {
      const total = SEED_DATA.accounts.reduce((s, a) => s + a.balance, 0);
      return { total } as unknown as T;
    }
    if (sql.includes('SUM(amount)')) {
      return { total: 4500 } as unknown as T;
    }
    if (sql.includes('FROM accounts')) {
      return SEED_DATA.accounts[0] as unknown as T;
    }
    return null;
  },
  prepareSync: () => ({
    executeSync: () => {},
    finalizeSync: () => {},
  }),
};

export function getDatabase(): any {
  return mockDb;
}

export function initDatabase(): void {
  // Web stub initialized with seed constants
}
