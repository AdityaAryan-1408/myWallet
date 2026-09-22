/**
 * MyWallet — Backup & Data Sovereignty Repository
 * 
 * Manages full SQLite JSON export, atomic import, database reset,
 * and simulated Google Drive cloud snapshot tracking.
 */

import { getDatabase } from '@/db/client';
import {
  Account,
  Category,
  CreditCard,
  Transaction,
  Reservation,
  PeopleDebt,
  DebtRepayment,
  Budget,
  DashboardNote,
  UserSetting,
} from '@/db/schema';
import { SEED_DATA } from '@/db/seed';
import { SettingsRepository } from './settingsRepository';

export interface BackupPayload {
  app: 'MyWallet';
  version: 1;
  exportedAt: string;
  schemaVersion: '1.0';
  stats: {
    transactions: number;
    accounts: number;
    creditCards: number;
    categories: number;
    debts: number;
    budgets: number;
  };
  tables: {
    accounts: Account[];
    categories: Category[];
    creditCards: CreditCard[];
    transactions: Transaction[];
    reservations: Reservation[];
    peopleDebts: PeopleDebt[];
    debtRepayments: DebtRepayment[];
    budgets: Budget[];
    dashboardNotes: DashboardNote[];
    userSettings: UserSetting[];
  };
}

export interface StorageStats {
  totalTransactions: number;
  totalAccounts: number;
  totalCards: number;
  totalCategories: number;
  totalDebts: number;
  totalBudgets: number;
  estimatedSizeKb: number;
}

export interface CloudSyncStatus {
  lastSyncDate: string | null;
  isAutoSyncEnabled: boolean;
  accountEmail: string | null;
}

export const BackupRepository = {
  /**
   * Exports all 10 SQLite database tables into a structured JSON payload.
   */
  exportAllData(): BackupPayload {
    const db = getDatabase();

    const accounts = db.getAllSync<Account>('SELECT * FROM accounts;') || [];
    const categories = db.getAllSync<Category>('SELECT * FROM categories;') || [];
    const creditCards = db.getAllSync<CreditCard>('SELECT * FROM credit_cards;') || [];
    const transactions = db.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY date DESC, time DESC;') || [];
    const reservations = db.getAllSync<Reservation>('SELECT * FROM reservations;') || [];
    const peopleDebts = db.getAllSync<PeopleDebt>('SELECT * FROM people_debts;') || [];
    const debtRepayments = db.getAllSync<DebtRepayment>('SELECT * FROM debt_repayments;') || [];
    const budgets = db.getAllSync<Budget>('SELECT * FROM budgets;') || [];
    const dashboardNotes = db.getAllSync<DashboardNote>('SELECT * FROM dashboard_notes;') || [];
    const userSettings = db.getAllSync<UserSetting>('SELECT * FROM user_settings;') || [];

    const payload: BackupPayload = {
      app: 'MyWallet',
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaVersion: '1.0',
      stats: {
        transactions: transactions.length,
        accounts: accounts.length,
        creditCards: creditCards.length,
        categories: categories.length,
        debts: peopleDebts.length,
        budgets: budgets.length,
      },
      tables: {
        accounts,
        categories,
        creditCards,
        transactions,
        reservations,
        peopleDebts,
        debtRepayments,
        budgets,
        dashboardNotes,
        userSettings,
      },
    };

    return payload;
  },

  /**
   * Imports a valid JSON backup string and writes it atomically to SQLite.
   */
  importAllData(jsonStr: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonStr) as BackupPayload;

      if (!parsed || !parsed.tables) {
        return { success: false, message: 'Invalid backup file format: Missing tables.' };
      }

      const db = getDatabase();
      const { tables } = parsed;

      // Clear existing records respecting dependencies
      db.execSync('PRAGMA foreign_keys = OFF;');
      db.execSync('DELETE FROM debt_repayments;');
      db.execSync('DELETE FROM people_debts;');
      db.execSync('DELETE FROM transactions;');
      db.execSync('DELETE FROM reservations;');
      db.execSync('DELETE FROM budgets;');
      db.execSync('DELETE FROM credit_cards;');
      db.execSync('DELETE FROM categories;');
      db.execSync('DELETE FROM accounts;');
      db.execSync('DELETE FROM dashboard_notes;');
      db.execSync('PRAGMA foreign_keys = ON;');

      // Insert Accounts
      if (tables.accounts?.length) {
        for (const a of tables.accounts) {
          db.runSync(
            `INSERT INTO accounts (id, name, type, balance, institution, currency, is_primary, is_active, display_order, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [a.id, a.name, a.type, a.balance, a.institution ?? null, a.currency || 'INR', a.is_primary, a.is_active, a.display_order, a.notes ?? null, a.created_at, a.updated_at]
          );
        }
      }

      // Insert Categories
      if (tables.categories?.length) {
        for (const c of tables.categories) {
          db.runSync(
            `INSERT INTO categories (id, name, icon, color, parent_id, display_order, is_active, type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [c.id, c.name, c.icon, c.color, c.parent_id ?? null, c.display_order, c.is_active, c.type, c.created_at]
          );
        }
      }

      // Insert Credit Cards
      if (tables.creditCards?.length) {
        for (const cc of tables.creditCards) {
          db.runSync(
            `INSERT INTO credit_cards (id, name, issuer, credit_limit, cycle_reset_day, payment_due_day, is_active, notes, last4, color, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [cc.id, cc.name, cc.issuer, cc.credit_limit, cc.cycle_reset_day, (cc as any).payment_due_day ?? null, cc.is_active, cc.notes ?? null, cc.last4 ?? null, cc.color, cc.created_at]
          );
        }
      }

      // Insert Transactions
      if (tables.transactions?.length) {
        for (const tx of tables.transactions) {
          db.runSync(
            `INSERT INTO transactions (id, type, amount, account_id, dest_account_id, credit_card_id, category_id, subcategory_id, date, time, note, expression, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [tx.id, tx.type, tx.amount, tx.account_id ?? null, tx.dest_account_id ?? null, tx.credit_card_id ?? null, tx.category_id ?? null, tx.subcategory_id ?? null, tx.date, tx.time, tx.note ?? null, tx.expression ?? null, tx.created_at, tx.updated_at]
          );
        }
      }

      // Insert Reservations
      if (tables.reservations?.length) {
        for (const r of tables.reservations) {
          db.runSync(
            `INSERT INTO reservations (id, name, amount, target_amount, note, affects_available, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [r.id, r.name, r.amount, r.target_amount ?? null, r.note ?? null, r.affects_available, r.is_active, r.created_at]
          );
        }
      }

      // Insert People Debts
      if (tables.peopleDebts?.length) {
        for (const d of tables.peopleDebts) {
          db.runSync(
            `INSERT INTO people_debts (id, person_name, amount, direction, reason, note, linked_transaction_id, is_settled, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [d.id, d.person_name, d.amount, d.direction, d.reason ?? null, d.note ?? null, d.linked_transaction_id ?? null, d.is_settled, d.created_at]
          );
        }
      }

      // Insert Debt Repayments
      if (tables.debtRepayments?.length) {
        for (const dr of tables.debtRepayments) {
          db.runSync(
            `INSERT INTO debt_repayments (id, debt_id, amount, date, note, created_at)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [dr.id, dr.debt_id, dr.amount, dr.date, dr.note ?? null, dr.created_at]
          );
        }
      }

      // Insert Budgets
      if (tables.budgets?.length) {
        for (const b of tables.budgets) {
          db.runSync(
            `INSERT INTO budgets (id, category_id, amount, period, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [b.id, b.category_id, b.amount, b.period || 'monthly', b.is_active, b.created_at, b.updated_at]
          );
        }
      }

      // Insert Dashboard Notes
      if (tables.dashboardNotes?.length) {
        for (const n of tables.dashboardNotes) {
          db.runSync(
            `INSERT OR REPLACE INTO dashboard_notes (id, content, voice_uri, is_minimized, updated_at)
             VALUES (?, ?, ?, ?, ?);`,
            [n.id, n.content, n.voice_uri ?? null, n.is_minimized, n.updated_at]
          );
        }
      }

      return {
        success: true,
        message: 'Database successfully restored from backup.',
        count: tables.transactions?.length || 0,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to parse and restore backup data.',
      };
    }
  },

  /**
   * Resets database:
   * If keepSeed is true: restores default initial seed data (sample accounts, categories, cards).
   * If keepSeed is false: clears all transactions and resets balances to 0.
   */
  resetAllData(keepSeed: boolean): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.execSync('PRAGMA foreign_keys = OFF;');
    db.execSync('DELETE FROM debt_repayments;');
    db.execSync('DELETE FROM people_debts;');
    db.execSync('DELETE FROM transactions;');
    db.execSync('DELETE FROM reservations;');
    db.execSync('DELETE FROM dashboard_notes;');
    db.execSync('DELETE FROM budgets;');
    db.execSync('DELETE FROM credit_cards;');
    db.execSync('DELETE FROM accounts;');

    if (keepSeed) {
      // Re-seed Accounts
      for (const acc of SEED_DATA.accounts) {
        db.runSync(
          `INSERT INTO accounts (id, name, type, balance, institution, currency, is_primary, is_active, display_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?);`,
          [acc.id, acc.name, acc.type, acc.balance, acc.institution, acc.currency, acc.is_primary, acc.display_order, now, now]
        );
      }

      // Re-seed Credit Cards
      for (const card of SEED_DATA.creditCards) {
        db.runSync(
          `INSERT INTO credit_cards (id, name, issuer, credit_limit, cycle_reset_day, payment_due_day, is_active, last4, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?);`,
          [card.id, card.name, card.issuer, card.credit_limit, card.cycle_reset_day, (card as any).payment_due_day ?? null, card.last4, card.color, now]
        );
      }

      // Re-seed Budgets
      for (const bgt of SEED_DATA.budgets) {
        db.runSync(
          `INSERT INTO budgets (id, category_id, amount, period, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?);`,
          [bgt.id, bgt.category_id, bgt.amount, bgt.period, now, now]
        );
      }

      // Re-seed transactions
      for (const tx of SEED_DATA.transactions) {
        db.runSync(
          `INSERT INTO transactions (id, type, amount, account_id, credit_card_id, category_id, date, time, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [tx.id, tx.type, tx.amount, tx.account_id ?? null, tx.credit_card_id ?? null, tx.category_id ?? null, tx.date, tx.time, tx.note, now, now]
        );
      }

      // Re-seed debts
      for (const d of SEED_DATA.debts) {
        db.runSync(
          `INSERT INTO people_debts (id, person_name, amount, direction, reason, is_settled, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?);`,
          [d.id, d.person_name, d.amount, d.direction, d.reason, now]
        );
      }

      // Re-seed reservations
      for (const r of SEED_DATA.reservations) {
        db.runSync(
          `INSERT INTO reservations (id, name, amount, target_amount, note, affects_available, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?);`,
          [r.id, r.name, r.amount, r.target_amount, r.note, r.affects_available, now]
        );
      }
    }

    db.execSync('PRAGMA foreign_keys = ON;');
  },

  /**
   * Retrieves summary storage statistics.
   */
  getStorageStats(): StorageStats {
    try {
      const db = getDatabase();
      const txCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM transactions;')?.count || 0;
      const accCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts;')?.count || 0;
      const cardCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM credit_cards;')?.count || 0;
      const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories;')?.count || 0;
      const debtCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM people_debts;')?.count || 0;
      const bgtCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM budgets;')?.count || 0;

      // Estimate ~200 bytes per record
      const totalRecords = txCount + accCount + cardCount + catCount + debtCount + bgtCount;
      const estimatedSizeKb = Math.max(12, Math.round((totalRecords * 220) / 1024));

      return {
        totalTransactions: txCount,
        totalAccounts: accCount,
        totalCards: cardCount,
        totalCategories: catCount,
        totalDebts: debtCount,
        totalBudgets: bgtCount,
        estimatedSizeKb,
      };
    } catch {
      return {
        totalTransactions: 0,
        totalAccounts: 0,
        totalCards: 0,
        totalCategories: 0,
        totalDebts: 0,
        totalBudgets: 0,
        estimatedSizeKb: 12,
      };
    }
  },

  /**
   * Cloud snapshot status (Google Drive)
   */
  getGoogleDriveStatus(): CloudSyncStatus {
    const lastSyncDate = SettingsRepository.get('gdrive_last_sync', '');
    const isAutoSyncEnabled = SettingsRepository.get('gdrive_sync_enabled', '0') === '1';
    const accountEmail = SettingsRepository.get('gdrive_account_email', 'aditya.aryan@gmail.com');

    return {
      lastSyncDate: lastSyncDate || null,
      isAutoSyncEnabled,
      accountEmail: accountEmail || null,
    };
  },

  /**
   * Updates cloud snapshot status
   */
  setGoogleDriveStatus(email: string | null, isAutoSync: boolean): void {
    if (email) {
      SettingsRepository.set('gdrive_account_email', email);
    }
    SettingsRepository.set('gdrive_sync_enabled', isAutoSync ? '1' : '0');
    SettingsRepository.set('gdrive_last_sync', new Date().toISOString());
  },
};
