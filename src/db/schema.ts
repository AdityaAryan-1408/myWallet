/**
 * MyWallet — SQLite Database Schema & Types
 * 
 * Defines the core database entities and table DDL schemas.
 */

// ─── TypeScript Entity Interfaces ──────────────────────────────────

export type AccountType = 'bank' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string | null;
  currency: string;
  is_primary: number; // 0 or 1
  is_active: number;  // 0 or 1
  display_order: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent_id?: string | null;
  display_order: number;
  is_active: number; // 0 or 1
  type: CategoryType;
  created_at: string;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  credit_limit: number;
  cycle_reset_day: number; // 1..31
  is_active: number;       // 0 or 1
  notes?: string | null;
  last4?: string | null;
  color: string;
  created_at: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  account_id?: string | null;
  dest_account_id?: string | null;
  credit_card_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  note?: string | null;
  expression?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  name: string;
  amount: number;
  target_amount?: number | null;
  note?: string | null;
  affects_available: number; // 0 or 1
  is_active: number;         // 0 or 1
  created_at: string;
}

export type DebtDirection = 'i_owe' | 'they_owe';

export interface PeopleDebt {
  id: string;
  person_name: string;
  amount: number;
  direction: DebtDirection;
  reason?: string | null;
  note?: string | null;
  linked_transaction_id?: string | null;
  is_settled: number; // 0 or 1
  created_at: string;
}

export interface DebtRepayment {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
  note?: string | null;
  created_at: string;
}

export interface DashboardNote {
  id: string; // 'active_note'
  content: string;
  voice_uri?: string | null;
  is_minimized: number; // 0 or 1
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly';
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  key: string;
  value: string;
  updated_at: string;
}

// ─── SQL DDL Statements ───────────────────────────────────────────

export const CREATE_ACCOUNTS_TABLE = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('bank', 'cash')),
  balance REAL NOT NULL DEFAULT 0,
  institution TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  created_at TEXT NOT NULL
);
`;

export const CREATE_CREDIT_CARDS_TABLE = `
CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  credit_limit REAL NOT NULL,
  cycle_reset_day INTEGER NOT NULL CHECK(cycle_reset_day BETWEEN 1 AND 31),
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  last4 TEXT,
  color TEXT NOT NULL DEFAULT '#1E3A8A',
  created_at TEXT NOT NULL
);
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
  amount REAL NOT NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  dest_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  credit_card_id TEXT REFERENCES credit_cards(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  note TEXT,
  expression TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_RESERVATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  target_amount REAL,
  note TEXT,
  affects_available INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
`;

export const CREATE_PEOPLE_DEBTS_TABLE = `
CREATE TABLE IF NOT EXISTS people_debts (
  id TEXT PRIMARY KEY,
  person_name TEXT NOT NULL,
  amount REAL NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('i_owe', 'they_owe')),
  reason TEXT,
  note TEXT,
  linked_transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  is_settled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`;

export const CREATE_DEBT_REPAYMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS debt_repayments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES people_debts(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
`;

export const CREATE_DASHBOARD_NOTES_TABLE = `
CREATE TABLE IF NOT EXISTS dashboard_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  voice_uri TEXT,
  is_minimized INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_USER_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_BUDGETS_TABLE = `
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_people_debts_settled ON people_debts(is_settled);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt ON debt_repayments(debt_id);
`;
