/**
 * MyWallet — Financial Zustand Store
 * 
 * Central reactive state holding derived financial metrics, accounts,
 * recent transactions, and category spending distributions.
 */

import { create } from 'zustand';
import { initDatabase } from '@/db/client';
import { Account, CreditCard, Reservation, Transaction } from '@/db/schema';
import {
  AccountRepository,
  CreditCardRepository,
  ReservationRepository,
  TransactionRepository,
  SettingsRepository,
  BudgetRepository,
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

  // Actions
  initialize: () => void;
  refreshFinancials: () => void;
  setUserName: (name: string) => void;
  deleteTransaction: (id: string) => void;
  deleteCard: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  deleteBudget: (id: string) => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  isInitialized: false,
  userName: 'Aditya',
  availableToSpend: 1934,
  totalBankCashBalance: 31114,
  totalCreditObligations: 24680,
  totalReservedMoney: 4500,
  dailySpendLimit: 128,
  daysRemainingInMonth: 12,
  monthlyTotals: {
    income: 12500,
    expense: 8420,
    saved: 4080,
  },
  categorySpends: [],
  accounts: [],
  creditCards: [],
  reservations: [],
  recentTransactions: [],
  budgets: [],
  overallBudget: null,

  initialize: () => {
    try {
      initDatabase();
      const userName = SettingsRepository.getUserName();
      get().refreshFinancials();
      set({ isInitialized: true, userName });
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
      });
    } catch (error) {
      console.error('Error refreshing financials:', error);
    }
  },
}));

