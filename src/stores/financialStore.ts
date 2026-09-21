/**
 * MyWallet — Financial Zustand Store
 * 
 * Central reactive state holding derived financial metrics, accounts,
 * recent transactions, and category spending distributions.
 */

import { create } from 'zustand';
import { initDatabase } from '@/db/client';
import { Account, CreditCard, Reservation, Transaction, Category, PeopleDebt, DebtRepayment } from '@/db/schema';
import {
  AccountRepository,
  CreditCardRepository,
  ReservationRepository,
  TransactionRepository,
  SettingsRepository,
  BudgetRepository,
  CategoryRepository,
  CategoryWithStats,
  DebtRepository,
  DebtWithRepayments,
  DebtSummary,
  CategorySpend,
  MonthlyTotals,
  BudgetWithProgress,
  OverallBudgetProgress,
} from '@/repositories';
import {
  calculateAvailableToSpend,
  calculateDailyPacing,
} from '@/domain/financialCalculations';

interface FinancialState {
  isInitialized: boolean;
  userName: string;
  avatarBadge: string;
  currency: string;
  themeMode: 'dark' | 'light' | 'system';
  // Derived Core Metrics
  availableToSpend: number;
  totalBankCashBalance: number;
  totalCreditObligations: number;
  totalReservedMoney: number;
  dailySpendLimit: number;
  daysRemainingInMonth: number;
  // Monthly Totals
  monthlyTotals: MonthlyTotals;
  categorySpends: CategorySpend[];
  // Entity Collections
  accounts: Account[];
  creditCards: CreditCard[];
  reservations: Reservation[];
  recentTransactions: Transaction[];
  budgets: BudgetWithProgress[];
  overallBudget: OverallBudgetProgress | null;
  categories: Category[];
  categoriesWithStats: CategoryWithStats[];
  debts: DebtWithRepayments[];
  debtSummary: DebtSummary | null;

  // Actions
  initialize: () => void;
  refreshFinancials: () => void;
  setUserName: (name: string) => void;
  setAvatarBadge: (badge: string) => void;
  setCurrency: (currency: string) => void;
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void;
  deleteTransaction: (id: string) => void;
  deleteCard: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  deleteBudget: (id: string) => void;
  // Account CRUD (Phase 9)
  createAccount: (data: Omit<Account, 'created_at' | 'updated_at'>) => void;
  updateAccount: (id: string, fields: Partial<Pick<Account, 'name' | 'type' | 'balance' | 'institution' | 'is_primary' | 'notes'>>) => void;
  deleteAccount: (id: string) => void;
  // Reservation CRUD (Phase 9)
  createReservation: (data: Omit<Reservation, 'created_at'>) => void;
  updateReservation: (id: string, fields: Partial<Pick<Reservation, 'name' | 'amount' | 'target_amount' | 'note' | 'affects_available'>>) => void;
  deleteReservation: (id: string) => void;
  // Category CRUD (Phase 10)
  createCategory: (data: Omit<Category, 'created_at'>) => void;
  updateCategory: (id: string, fields: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'parent_id' | 'display_order' | 'type' | 'is_active'>>) => void;
  archiveCategory: (id: string) => void;
  unarchiveCategory: (id: string) => void;
  refreshCategories: () => void;
  // People & Debts (Phase 11)
  createDebt: (data: Omit<PeopleDebt, 'created_at'>) => void;
  updateDebt: (id: string, fields: Partial<Pick<PeopleDebt, 'person_name' | 'amount' | 'direction' | 'reason' | 'note' | 'is_settled'>>) => void;
  deleteDebt: (id: string) => void;
  settleDebt: (id: string) => void;
  unsettleDebt: (id: string) => void;
  recordDebtRepayment: (debtId: string, amount: number, date: string, note?: string) => void;
  refreshDebts: () => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  isInitialized: false,
  userName: 'Aditya',
  avatarBadge: '🚀',
  currency: 'INR',
  themeMode: 'dark',
  availableToSpend: 0,
  totalBankCashBalance: 0,
  totalCreditObligations: 0,
  totalReservedMoney: 0,
  dailySpendLimit: 0,
  daysRemainingInMonth: 0,
  monthlyTotals: {
    income: 0,
    expense: 0,
    saved: 0,
  },
  categorySpends: [],
  accounts: [],
  creditCards: [],
  reservations: [],
  recentTransactions: [],
  budgets: [],
  overallBudget: null,
  categories: [],
  categoriesWithStats: [],
  debts: [],
  debtSummary: null,

  initialize: () => {
    try {
      initDatabase();
      const userName = SettingsRepository.getUserName();
      const avatarBadge = SettingsRepository.getAvatarBadge();
      const currency = SettingsRepository.getCurrency();
      const themeMode = SettingsRepository.getThemeMode();
      get().refreshFinancials();
      set({ isInitialized: true, userName, avatarBadge, currency, themeMode });
    } catch (error) {
      console.error('Failed to initialize financial store:', error);
      set({ isInitialized: true });
    }
  },

  setUserName: (name: string) => {
    try {
      SettingsRepository.setUserName(name);
      set({ userName: name.trim() || 'Aditya' });
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  },

  setAvatarBadge: (badge: string) => {
    try {
      SettingsRepository.setAvatarBadge(badge);
      set({ avatarBadge: badge });
    } catch (error) {
      console.error('Error saving avatar badge:', error);
    }
  },

  setCurrency: (currency: string) => {
    try {
      SettingsRepository.setCurrency(currency);
      set({ currency });
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  },

  setThemeMode: (mode: 'dark' | 'light' | 'system') => {
    try {
      SettingsRepository.setThemeMode(mode);
      set({ themeMode: mode });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  deleteTransaction: (id: string) => {
    try {
      TransactionRepository.delete(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  deleteCard: (id: string) => {
    try {
      CreditCardRepository.delete(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting credit card:', error);
    }
  },

  setBudget: (categoryId: string, amount: number) => {
    try {
      BudgetRepository.setBudget(categoryId, amount);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error saving budget target:', error);
    }
  },

  deleteBudget: (id: string) => {
    try {
      BudgetRepository.deleteBudget(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  },

  // ─── Account CRUD (Phase 9) ─────────────────────────────────────
  createAccount: (data) => {
    try {
      AccountRepository.create(data);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error creating account:', error);
    }
  },

  updateAccount: (id, fields) => {
    try {
      // If setting as primary, use atomic setPrimary
      if (fields.is_primary === 1) {
        AccountRepository.setPrimary(id);
        // Remove is_primary from fields to avoid double-set
        const { is_primary, ...rest } = fields;
        if (Object.keys(rest).length > 0) {
          AccountRepository.update(id, rest);
        }
      } else {
        AccountRepository.update(id, fields);
      }
      get().refreshFinancials();
    } catch (error) {
      console.error('Error updating account:', error);
    }
  },

  deleteAccount: (id) => {
    try {
      AccountRepository.delete(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  },

  // ─── Reservation CRUD (Phase 9) ────────────────────────────────
  createReservation: (data) => {
    try {
      ReservationRepository.create(data);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  },

  updateReservation: (id, fields) => {
    try {
      ReservationRepository.update(id, fields);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  },

  deleteReservation: (id) => {
    try {
      ReservationRepository.delete(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  },

  // ─── Category CRUD (Phase 10) ───────────────────────────────────
  createCategory: (data) => {
    try {
      CategoryRepository.create(data);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  },

  updateCategory: (id, fields) => {
    try {
      CategoryRepository.update(id, fields);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  },

  archiveCategory: (id) => {
    try {
      CategoryRepository.archive(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error archiving category:', error);
    }
  },

  unarchiveCategory: (id) => {
    try {
      CategoryRepository.unarchive(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error unarchiving category:', error);
    }
  },

  refreshCategories: () => {
    try {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const categories = CategoryRepository.getAll();
      const categoriesWithStats = CategoryRepository.getCategoriesWithStats(undefined, currentYearMonth);
      set({ categories, categoriesWithStats });
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  },

  // ─── People & Debts CRUD (Phase 11) ─────────────────────────────
  createDebt: (data) => {
    try {
      DebtRepository.create(data);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error creating debt:', error);
    }
  },

  updateDebt: (id, fields) => {
    try {
      DebtRepository.update(id, fields);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error updating debt:', error);
    }
  },

  deleteDebt: (id) => {
    try {
      DebtRepository.delete(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  },

  settleDebt: (id) => {
    try {
      DebtRepository.settle(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error settling debt:', error);
    }
  },

  unsettleDebt: (id) => {
    try {
      DebtRepository.unsettle(id);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error unsettling debt:', error);
    }
  },

  recordDebtRepayment: (debtId, amount, date, note) => {
    try {
      DebtRepository.recordRepayment(debtId, amount, date, note);
      get().refreshFinancials();
    } catch (error) {
      console.error('Error recording debt repayment:', error);
    }
  },

  refreshDebts: () => {
    try {
      const debts = DebtRepository.getAllWithRepayments();
      const debtSummary = DebtRepository.getDebtSummary();
      set({ debts, debtSummary });
    } catch (error) {
      console.error('Error refreshing debts:', error);
    }
  },

  refreshFinancials: () => {
    try {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 1. Fetch raw balances from repositories
      const accounts = AccountRepository.getAllActive();
      const creditCards = CreditCardRepository.getAllActive();
      const reservations = ReservationRepository.getAllActive();
      const recentTransactions = TransactionRepository.getRecent(10);
      const monthlyTotals = TransactionRepository.getMonthlyTotals(currentYearMonth);
      const categorySpends = TransactionRepository.getCategoryMonthlySpend(currentYearMonth);
      const budgets = BudgetRepository.getAllWithProgress(currentYearMonth);
      const overallBudget = BudgetRepository.getOverallBudgetProgress(currentYearMonth);
      const categories = CategoryRepository.getAll();
      const categoriesWithStats = CategoryRepository.getCategoriesWithStats(undefined, currentYearMonth);
      const debts = DebtRepository.getAllWithRepayments();
      const debtSummary = DebtRepository.getDebtSummary();

      const totalBankCashBalance = AccountRepository.getTotalBankCashBalance();
      const totalCreditObligations = CreditCardRepository.getTotalCreditObligations();
      const totalReservedMoney = ReservationRepository.getTotalReservedAffectingAvailable();

      // 2. Compute central domain calculation
      const { availableToSpend } = calculateAvailableToSpend({
        totalBankCashBalance,
        totalCreditObligations,
        totalReservedMoney,
      });

      // 3. Compute daily pacing limit
      const { dailyLimit, daysRemaining } = calculateDailyPacing(availableToSpend, now);

      set({
        availableToSpend,
        totalBankCashBalance,
        totalCreditObligations,
        totalReservedMoney,
        dailySpendLimit: dailyLimit,
        daysRemainingInMonth: daysRemaining,
        monthlyTotals,
        categorySpends,
        accounts,
        creditCards,
        reservations,
        recentTransactions,
        budgets,
        overallBudget,
        categories,
        categoriesWithStats,
        debts,
        debtSummary,
      });
    } catch (error) {
      console.error('Error refreshing financials:', error);
    }
  },
}));

