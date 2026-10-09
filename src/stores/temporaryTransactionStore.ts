/**
 * MyWallet — Temporary Transaction Store
 * 
 * Zustand state management for floating outlays / paid on behalf transactions.
 * Keeps UI components reactively synchronized when transactions are logged,
 * settled/returned, or deleted.
 */

import { create } from 'zustand';
import { TemporaryTransaction } from '@/db/schema';
import { TemporaryTransactionRepository } from '@/repositories/temporaryTransactionRepository';
import { useFinancialStore } from './financialStore';

interface TemporaryTransactionState {
  pending: TemporaryTransaction[];
  returned: TemporaryTransaction[];
  totalPendingAmount: number;
  isLoading: boolean;

  // Actions
  refresh: () => void;
  markAsReturned: (id: string) => void;
  markAsPending: (id: string) => void;
  deleteTransaction: (id: string) => void;
}

export const useTemporaryTransactionStore = create<TemporaryTransactionState>((set, get) => ({
  pending: [],
  returned: [],
  totalPendingAmount: 0,
  isLoading: false,

  refresh: () => {
    try {
      const pending = TemporaryTransactionRepository.getPending();
      const returned = TemporaryTransactionRepository.getReturned();
      const totalPendingAmount = TemporaryTransactionRepository.getTotalPendingAmount();
      set({ pending, returned, totalPendingAmount });
    } catch (e) {
      console.warn('Failed to refresh temporary transactions:', e);
    }
  },

  markAsReturned: (id: string) => {
    try {
      TemporaryTransactionRepository.markAsReturned(id);
      get().refresh();
      useFinancialStore.getState().refreshFinancials();
    } catch (e) {
      console.warn('Failed to mark temporary transaction as returned:', e);
    }
  },

  markAsPending: (id: string) => {
    try {
      TemporaryTransactionRepository.markAsPending(id);
      get().refresh();
      useFinancialStore.getState().refreshFinancials();
    } catch (e) {
      console.warn('Failed to mark temporary transaction as pending:', e);
    }
  },

  deleteTransaction: (id: string) => {
    try {
      TemporaryTransactionRepository.delete(id);
      get().refresh();
      useFinancialStore.getState().refreshFinancials();
    } catch (e) {
      console.warn('Failed to delete temporary transaction:', e);
    }
  },
}));
