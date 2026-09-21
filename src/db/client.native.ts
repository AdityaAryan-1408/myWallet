/**
 * MyWallet — SQLite Client Singleton & Initialization (Native)
 * 
 * Manages native SQLite connection via expo-sqlite on Android and iOS.
 */

import * as SQLite from 'expo-sqlite';
import {
  CREATE_ACCOUNTS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_CREDIT_CARDS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_RESERVATIONS_TABLE,
  CREATE_PEOPLE_DEBTS_TABLE,
  CREATE_DASHBOARD_NOTES_TABLE,
  CREATE_USER_SETTINGS_TABLE,
  CREATE_INDEXES,
} from './schema';
import { SEED_DATA } from './seed';

const DB_NAME = 'mywallet.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  if (!isInitialized) {
    initDatabase();
  }
  return dbInstance;
}

/**
 * Initializes tables and populates default data if database is empty.
 */
export function initDatabase(): void {
  if (isInitialized) {
    return;
  }

  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  const db = dbInstance;

  try {
    // Enable Write-Ahead Logging (WAL) and foreign keys for high performance
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync('PRAGMA foreign_keys = ON;');

    // Create tables
    db.execSync(CREATE_ACCOUNTS_TABLE);
    db.execSync(CREATE_CATEGORIES_TABLE);
    db.execSync(CREATE_CREDIT_CARDS_TABLE);
    db.execSync(CREATE_TRANSACTIONS_TABLE);
    db.execSync(CREATE_RESERVATIONS_TABLE);
    db.execSync(CREATE_PEOPLE_DEBTS_TABLE);
    db.execSync(CREATE_DASHBOARD_NOTES_TABLE);
    db.execSync(CREATE_USER_SETTINGS_TABLE);
    db.execSync(CREATE_INDEXES);

    // Check if initial categories already exist
    const categoryCountResult = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories;'
    );
    const categoryCount = categoryCountResult?.count ?? 0;

    if (categoryCount === 0) {
      seedDatabase(db);
    }

    isInitialized = true;
  } catch (error) {
    console.error('Error initializing native database:', error);
    throw error;
  }
}

/**
 * Seeds initial categories, accounts, credit cards, and reservations.
 */
function seedDatabase(db: SQLite.SQLiteDatabase): void {
  const now = new Date().toISOString();

  // Seed Categories
  const catStmt = db.prepareSync(
    `INSERT OR IGNORE INTO categories (id, name, icon, color, parent_id, display_order, is_active, type, created_at)
     VALUES ($id, $name, $icon, $color, $parent_id, $display_order, 1, $type, $created_at);`
  );
  for (const cat of SEED_DATA.categories) {
    catStmt.executeSync({
      $id: cat.id,
      $name: cat.name,
      $icon: cat.icon,
      $color: cat.color,
      $parent_id: cat.parent_id ?? null,
      $display_order: cat.display_order,
      $type: cat.type,
      $created_at: now,
    });
  }
  catStmt.finalizeSync();

  // Seed Accounts
  const accStmt = db.prepareSync(
    `INSERT OR IGNORE INTO accounts (id, name, type, balance, institution, currency, is_primary, is_active, display_order, created_at, updated_at)
     VALUES ($id, $name, $type, $balance, $institution, $currency, $is_primary, 1, $display_order, $created_at, $updated_at);`
  );
  for (const acc of SEED_DATA.accounts) {
    accStmt.executeSync({
      $id: acc.id,
      $name: acc.name,
      $type: acc.type,
      $balance: acc.balance,
      $institution: acc.institution,
      $currency: acc.currency,
      $is_primary: acc.is_primary,
      $display_order: acc.display_order,
      $created_at: now,
      $updated_at: now,
    });
  }
  accStmt.finalizeSync();

  // Seed Credit Cards
  const cardStmt = db.prepareSync(
    `INSERT OR IGNORE INTO credit_cards (id, name, issuer, credit_limit, cycle_reset_day, is_active, last4, color, created_at)
     VALUES ($id, $name, $issuer, $credit_limit, $cycle_reset_day, 1, $last4, $color, $created_at);`
  );
  for (const card of SEED_DATA.creditCards) {
    cardStmt.executeSync({
      $id: card.id,
      $name: card.name,
      $issuer: card.issuer,
      $credit_limit: card.credit_limit,
      $cycle_reset_day: card.cycle_reset_day,
      $last4: card.last4,
      $color: card.color,
      $created_at: now,
    });
  }
  cardStmt.finalizeSync();

  // Seed Reservations
  const resStmt = db.prepareSync(
    `INSERT OR IGNORE INTO reservations (id, name, amount, target_amount, note, affects_available, is_active, created_at)
     VALUES ($id, $name, $amount, $target_amount, $note, $affects_available, 1, $created_at);`
  );
  for (const res of SEED_DATA.reservations) {
    resStmt.executeSync({
      $id: res.id,
      $name: res.name,
      $amount: res.amount,
      $target_amount: res.target_amount,
      $note: res.note,
      $affects_available: res.affects_available,
      $created_at: now,
    });
  }
  resStmt.finalizeSync();

  // Seed Transactions
  const txStmt = db.prepareSync(
    `INSERT OR IGNORE INTO transactions (id, type, amount, account_id, credit_card_id, category_id, date, time, note, created_at, updated_at)
     VALUES ($id, $type, $amount, $account_id, $credit_card_id, $category_id, $date, $time, $note, $created_at, $updated_at);`
  );
  for (const tx of SEED_DATA.transactions) {
    txStmt.executeSync({
      $id: tx.id,
      $type: tx.type,
      $amount: tx.amount,
      $account_id: tx.account_id ?? null,
      $credit_card_id: tx.credit_card_id ?? null,
      $category_id: tx.category_id ?? null,
      $date: tx.date,
      $time: tx.time,
      $note: tx.note,
      $created_at: now,
      $updated_at: now,
    });
  }
  txStmt.finalizeSync();

  // Seed Debts
  const debtStmt = db.prepareSync(
    `INSERT OR IGNORE INTO people_debts (id, person_name, amount, direction, reason, is_settled, created_at)
     VALUES ($id, $person_name, $amount, $direction, $reason, 0, $created_at);`
  );
  for (const debt of SEED_DATA.debts) {
    debtStmt.executeSync({
      $id: debt.id,
      $person_name: debt.person_name,
      $amount: debt.amount,
      $direction: debt.direction,
      $reason: debt.reason,
      $created_at: now,
    });
  }
  debtStmt.finalizeSync();
}
