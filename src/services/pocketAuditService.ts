/**
 * MyWallet — Pocket Audit Service (Feature B7)
 * 
 * 60-second Tinder-style daily review flow for recent unreviewed transactions:
 * - Swipe right / Tap verify: Marks transaction as reviewed ✓
 * - Swipe left / Tap edit: Navigates to edit screen
 * - Swipe up / Tap delete: Deletes with undo capability
 * - Tracks daily review progress (e.g. "4/4 today's transactions verified ✓")
 */

import { TransactionRepository, TransactionWithDetails } from '@/repositories/transactionRepository';
import { Transaction } from '@/db/schema';
import * as Haptics from 'expo-haptics';

export interface AuditQueueState {
  queue: TransactionWithDetails[];
  totalCount: number;
  totalExpenseAmount: number;
  hasPending: boolean;
}

export const PocketAuditService = {
  /**
   * Loads all unreviewed transactions waiting for audit.
   */
  getAuditQueue(limit: number = 100): AuditQueueState {
    try {
      const queue = TransactionRepository.getUnreviewed(limit);
      const totalCount = TransactionRepository.getUnreviewedCount();
      const totalExpenseAmount = queue.reduce((sum, tx) => {
        return tx.type === 'expense' ? sum + tx.amount : sum;
      }, 0);

      return {
        queue,
        totalCount: Math.max(totalCount, queue.length),
        totalExpenseAmount,
        hasPending: totalCount > 0,
      };
    } catch (e) {
      console.warn('PocketAuditService.getAuditQueue failed:', e);
      return {
        queue: [],
        totalCount: 0,
        totalExpenseAmount: 0,
        hasPending: false,
      };
    }
  },

  /**
   * Verifies and confirms a transaction as correct.
   */
  verify(id: string): void {
    TransactionRepository.markReviewed(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Verifies all remaining transactions in batch across the entire ledger.
   */
  verifyAll(ids?: string[]): void {
    if (ids && ids.length > 0) {
      TransactionRepository.markAllReviewed(ids);
    }
    // Also atomically mark all remaining unreviewed records in DB
    TransactionRepository.markAllAsReviewed();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Deletes a transaction, returning the backup copy for undo support.
   */
  deleteWithBackup(id: string): Transaction | null {
    const queue = TransactionRepository.getUnreviewed(100);
    const target = queue.find((t) => t.id === id);
    if (!target) return null;

    TransactionRepository.delete(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    return target;
  },

  /**
   * Restores a previously deleted transaction (Undo).
   */
  restore(tx: Transaction): void {
    TransactionRepository.create({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      account_id: tx.account_id,
      dest_account_id: tx.dest_account_id,
      credit_card_id: tx.credit_card_id,
      category_id: tx.category_id,
      subcategory_id: tx.subcategory_id,
      date: tx.date,
      time: tx.time,
      note: tx.note,
      expression: tx.expression,
      is_reviewed: 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
