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

let inMemoryTemporaryTransactions: any[] = [
  {
    id: 'temp_seed_1',
    title: 'Dinner at Bistro',
    person_name: 'Rahul',
    amount: 1450,
    payment_source_type: 'account',
    payment_source_id: 'acc_main',
    payment_source_name: 'HDFC Bank',
    category_id: 'cat_food',
    date: new Date().toISOString().split('T')[0],
    time: '19:30:00',
    is_returned: 0,
    returned_date: null,
    notes: 'Paid for Rahul, will UPI back by Sunday',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// In-memory mock storage for web preview
const mockDb = {
  execSync: (_sql: string) => {},
  runSync: (sql: string, params?: any[]) => {
    if (sql.includes('INSERT INTO temporary_transactions') && params) {
      const [
        id,
        title,
        person_name,
        amount,
        payment_source_type,
        payment_source_id,
        payment_source_name,
        category_id,
        date,
        time,
        is_returned,
        returned_date,
        notes,
        created_at,
        updated_at,
      ] = params;
      inMemoryTemporaryTransactions.unshift({
        id,
        title,
        person_name,
        amount,
        payment_source_type,
        payment_source_id,
        payment_source_name,
        category_id,
        date,
        time,
        is_returned: is_returned ?? 0,
        returned_date: returned_date ?? null,
        notes,
        created_at,
        updated_at,
      });
      return { changes: 1, lastInsertRowId: 1 };
    }
    if (sql.includes('UPDATE temporary_transactions SET is_returned') && params) {
      const isReturnedVal = params[0];
      const returnedDateVal = params[1];
      const updatedAtVal = params[2];
      const id = params[3];
      const item = inMemoryTemporaryTransactions.find((t) => t.id === id);
      if (item) {
        item.is_returned = isReturnedVal;
        item.returned_date = returnedDateVal;
        item.updated_at = updatedAtVal;
      }
      return { changes: 1, lastInsertRowId: 0 };
    }
    if (sql.includes('DELETE FROM temporary_transactions') && params) {
      const id = params[0];
      inMemoryTemporaryTransactions = inMemoryTemporaryTransactions.filter((t) => t.id !== id);
      return { changes: 1, lastInsertRowId: 0 };
    }
    return { changes: 0, lastInsertRowId: 0 };
  },
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

    // 9. Temporary transactions query
    if (sql.includes('FROM temporary_transactions')) {
      let result = [...inMemoryTemporaryTransactions];
      if (sql.includes('is_returned = 0')) {
        result = result.filter((t) => t.is_returned === 0);
      } else if (sql.includes('is_returned = 1')) {
        result = result.filter((t) => t.is_returned === 1);
      }
      return result as unknown as T[];
    }

    return [];
  },

  getFirstSync: <T>(sql: string, params?: any[]): T | null => {
    if (sql.includes('FROM temporary_transactions') && sql.includes('SUM(amount)')) {
      const sum = inMemoryTemporaryTransactions
        .filter((t) => t.is_returned === 0)
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      return { total: sum } as unknown as T;
    }
    if (sql.includes('FROM temporary_transactions')) {
      const id = params?.[0];
      const found = inMemoryTemporaryTransactions.find((t) => t.id === id);
      return (found || inMemoryTemporaryTransactions[0] || null) as unknown as T;
    }
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
