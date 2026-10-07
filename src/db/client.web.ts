/**
 * MyWallet — Database Client (Web Stub)
 * 
 * Provides an in-memory SQL mock for Expo web previews without native SQLite.
 * Accurately models aggregations and joined rows so all dashboard cards,
 * reports, and analytics render seamlessly on web browsers.
 */

import { SEED_DATA } from './seed';

// Pre-index categories, accounts, and cards for fast join lookups
const categoryMap = new Map(SEED_DATA.categories.map((c) => [c.id, c]));
const accountMap = new Map(SEED_DATA.accounts.map((a) => [a.id, a]));
const cardMap = new Map(SEED_DATA.creditCards.map((c) => [c.id, c]));

// In-memory mock storage for web preview
const mockDb = {
  execSync: (_sql: string) => {},
  runSync: (_sql: string, _params?: any[]) => ({ changes: 0, lastInsertRowId: 0 }),
  getAllSync: <T>(sql: string, _params?: any[]): T[] => {
    // 1. Category aggregation queries (Category Burn, Donut, Category Analytics)
    if (sql.includes('FROM transactions') && (sql.includes('GROUP BY') || sql.includes('category_id'))) {
      const totalsByCat: Record<string, number> = {};
      for (const t of SEED_DATA.transactions) {
        if (t.type === 'expense' && t.category_id) {
          totalsByCat[t.category_id] = (totalsByCat[t.category_id] || 0) + (t.amount || 0);
        }
      }

      // If no expenses found, provide a mock spread from seed categories
      if (Object.keys(totalsByCat).length === 0) {
        totalsByCat['cat_food'] = 3200;
        totalsByCat['cat_transport'] = 1450;
        totalsByCat['cat_shopping'] = 2100;
        totalsByCat['cat_bills'] = 980;
      }

      const rows = Object.entries(totalsByCat).map(([catId, total]) => {
        const cat = categoryMap.get(catId);
        return {
          category_id: catId,
          name: cat?.name || 'Category',
          color: cat?.color || '#FF6B6B',
          icon: cat?.icon || 'Tag',
          total: total || 0,
        };
      });

      rows.sort((a, b) => b.total - a.total);
      return rows as unknown as T[];
    }

    // 2. Transaction feed with joins (Recent Activity, History)
    if (sql.includes('FROM transactions')) {
      return SEED_DATA.transactions.map((t) => {
        const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
        const acc = t.account_id ? accountMap.get(t.account_id) : undefined;
        const card = t.credit_card_id ? cardMap.get(t.credit_card_id) : undefined;

        return {
          ...t,
          category_name: cat?.name || 'General',
          category_color: cat?.color || '#8F937A',
          category_icon: cat?.icon || 'Tag',
          account_name: acc?.name || 'Main Account',
          card_name: card?.name,
        };
      }) as unknown as T[];
    }

    // 3. Accounts query
    if (sql.includes('FROM accounts')) {
      return SEED_DATA.accounts.map((a) => ({
        ...a,
        is_active: (a as any).is_active ?? 1,
        exclude_from_total: (a as any).exclude_from_total ?? 0,
      })) as unknown as T[];
    }

    // 4. Credit cards query
    if (sql.includes('FROM credit_cards')) {
      return SEED_DATA.creditCards.map((c) => ({
        ...c,
        is_active: (c as any).is_active ?? 1,
      })) as unknown as T[];
    }

    // 5. Reservations query
    if (sql.includes('FROM reservations')) {
      return SEED_DATA.reservations as unknown as T[];
    }

    // 6. Categories query
    if (sql.includes('FROM categories')) {
      return SEED_DATA.categories.map((c) => ({
        ...c,
        is_active: (c as any).is_active ?? 1,
      })) as unknown as T[];
    }

    // 7. Debts query
    if (sql.includes('FROM people_debts')) {
      return SEED_DATA.debts.map((d) => ({
        ...d,
        is_settled: (d as any).is_settled ?? 0,
      })) as unknown as T[];
    }

    // 8. Budgets query
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
      const total = SEED_DATA.accounts.reduce((s, a) => s + (a.balance || 0), 0);
      return { total } as unknown as T;
    }
    if (sql.includes('SUM(amount)') || sql.includes('SUM(t.amount)')) {
      if (sql.includes("type = 'expense'") || sql.includes('expense')) {
        const total = SEED_DATA.transactions
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + (t.amount || 0), 0);
        return { total: total || 4500 } as unknown as T;
      }
      if (sql.includes("type = 'income'") || sql.includes('income')) {
        const total = SEED_DATA.transactions
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + (t.amount || 0), 0);
        return { total: total || 28000 } as unknown as T;
      }
      return { total: 4500 } as unknown as T;
    }
    if (sql.includes('FROM accounts')) {
      const acc = SEED_DATA.accounts[0];
      return {
        ...acc,
        is_active: 1,
        exclude_from_total: 0,
      } as unknown as T;
    }
    if (sql.includes('FROM credit_cards')) {
      const card = SEED_DATA.creditCards[0];
      return {
        ...card,
        is_active: 1,
      } as unknown as T;
    }
    return { total: 0, count: 0 } as unknown as T;
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
