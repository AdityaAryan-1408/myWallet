/**
 * MyWallet — AI Intelligence Service
 * 
 * Manages automated AI analysis triggers, anomaly detection alerts,
 * and system/in-app notification delivery for Tier 1 features.
 */

import { Platform } from 'react-native';
import { Transaction } from '@/db/schema';
import { getDatabase } from '@/db/client';
import { AiRepository, SpendingAnomaly, MonthlyReportCard } from '@/repositories/aiRepository';
import { NotificationRepository } from '@/repositories/notificationRepository';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { NotificationService } from '@/services/notificationService';

export type AnomalyOutcomeStatus =
  | 'not_eligible'
  | 'insufficient_history'
  | 'below_threshold'
  | 'scheduled'
  | 'delivery_failed';

export interface AnomalyAuditOutcome {
  status: AnomalyOutcomeStatus;
  message: string;
  transactionId: string;
  categoryName?: string;
  amount?: number;
  historyCount?: number;
  median?: number;
  threshold?: number;
  multiplier?: number;
  timestamp: string;
}

export interface CategoryBaselineInfo {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  historyCount: number;
  median: number;
  threshold: number;
  isReady: boolean;
}

let lastAnomalyOutcome: AnomalyAuditOutcome | null = null;

export const AiIntelligenceService = {
  /**
   * Retrieves the outcome of the most recent anomaly audit.
   */
  getLastAnomalyOutcome(): AnomalyAuditOutcome | null {
    return lastAnomalyOutcome;
  },

  /**
   * Calculates baseline readiness (median, 2.5x threshold, history count)
   * for all active expense categories.
   */
  getCategoryBaselines(): CategoryBaselineInfo[] {
    try {
      const db = getDatabase();
      const categories = db.getAllSync<{ id: string; name: string; color: string; icon: string }>(
        `SELECT id, name, color, icon FROM categories WHERE type = 'expense' ORDER BY display_order ASC, name ASC;`
      );

      return categories.map((cat) => {
        const rows = db.getAllSync<{ amount: number }>(
          `SELECT amount FROM transactions WHERE category_id = ? AND type = 'expense' ORDER BY amount ASC;`,
          [cat.id]
        );
        const count = rows.length;
        const median = count > 0 ? rows[Math.floor(count / 2)].amount : 0;
        const threshold = Math.round(median * 2.5);
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          historyCount: count,
          median: Math.round(median),
          threshold,
          isReady: count >= 2,
        };
      });
    } catch (e) {
      console.warn('Error computing category baselines:', e);
      return [];
    }
  },

  /**
   * Called immediately upon transaction logging to detect statistical anomalies
   * and fire both In-App and System alerts.
   * 
   * Returns a structured outcome:
   * 'not_eligible' | 'insufficient_history' | 'below_threshold' | 'scheduled' | 'delivery_failed'
   */
  async auditTransaction(transaction: Transaction): Promise<SpendingAnomaly | null> {
    const timestamp = new Date().toISOString();

    try {
      const db = getDatabase();

      // 1. Eligibility Check
      if (transaction.type !== 'expense') {
        lastAnomalyOutcome = {
          status: 'not_eligible',
          message: `Transaction type is ${transaction.type}; only expenses qualify for anomaly alerts.`,
          transactionId: transaction.id,
          amount: transaction.amount,
          timestamp,
        };
        return null;
      }

      if (!transaction.category_id) {
        lastAnomalyOutcome = {
          status: 'not_eligible',
          message: 'Transaction is uncategorized; a category is required to establish statistical baseline.',
          transactionId: transaction.id,
          amount: transaction.amount,
          timestamp,
        };
        return null;
      }

      const catRow = db.getFirstSync<{ name: string; color: string; icon: string }>(
        `SELECT name, color, icon FROM categories WHERE id = ?;`,
        [transaction.category_id]
      );
      const categoryName = catRow?.name || 'Selected Category';

      if (transaction.amount < 300) {
        lastAnomalyOutcome = {
          status: 'not_eligible',
          message: `Amount (₹${Math.round(transaction.amount)}) is below the ₹300 minimum anomaly threshold.`,
          transactionId: transaction.id,
          categoryName,
          amount: transaction.amount,
          timestamp,
        };
        return null;
      }

      // 2. History Check
      const priorRows = db.getAllSync<{ amount: number }>(
        `SELECT amount FROM transactions 
         WHERE category_id = ? AND type = 'expense' AND id != ?
         ORDER BY date DESC LIMIT 30;`,
        [transaction.category_id, transaction.id]
      );

      if (priorRows.length < 2) {
        lastAnomalyOutcome = {
          status: 'insufficient_history',
          message: `${categoryName} has only ${priorRows.length} prior expense(s). At least 2 prior expenses are required to establish a median baseline.`,
          transactionId: transaction.id,
          categoryName,
          amount: transaction.amount,
          historyCount: priorRows.length,
          timestamp,
        };
        return null;
      }

      // 3. Threshold Evaluation (>= 2.5x median)
      const amounts = priorRows.map((r) => r.amount).sort((a, b) => a - b);
      const median = amounts[Math.floor(amounts.length / 2)];
      const threshold = Math.round(median * 2.5);

      if (transaction.amount < threshold) {
        lastAnomalyOutcome = {
          status: 'below_threshold',
          message: `₹${Math.round(transaction.amount)} on ${categoryName} is below the 2.5× anomaly threshold of ₹${threshold} (median: ₹${Math.round(median)}).`,
          transactionId: transaction.id,
          categoryName,
          amount: transaction.amount,
          historyCount: priorRows.length,
          median: Math.round(median),
          threshold,
          timestamp,
        };
        return null;
      }

      // 4. Anomaly Confirmed — Dispatch In-App & System Notifications
      const anomaly = AiRepository.checkTransactionAnomaly(transaction);
      const multiplier = parseFloat((transaction.amount / (median || 1)).toFixed(1));

      const inAppId = `anomaly_${transaction.id}`;
      const title = `⚠️ Spending Anomaly Detected`;
      const body = anomaly?.message || `₹${Math.round(transaction.amount)} on ${categoryName} is ${multiplier}× your usual spend.`;

      // 4a. In-App Notification entry
      NotificationRepository.create({
        id: inAppId,
        type: 'system',
        title,
        body,
        entity_type: 'system',
        entity_id: transaction.id,
        action_type: 'view_screen',
        action_payload: '/intelligence',
        is_read: 0,
        is_dismissed: 0,
      });

      // 4b. Android system notification on dedicated channel_anomalies
      const posted = await NotificationService.postSystemNotification({
        id: inAppId,
        title,
        body,
        channelId: 'channel_anomalies',
        data: { type: 'anomaly', transactionId: transaction.id },
      });

      if (posted) {
        lastAnomalyOutcome = {
          status: 'scheduled',
          message: `High-priority anomaly notification dispatched to Spending Anomalies channel (${multiplier}× median).`,
          transactionId: transaction.id,
          categoryName,
          amount: transaction.amount,
          historyCount: priorRows.length,
          median: Math.round(median),
          threshold,
          multiplier,
          timestamp,
        };
      } else {
        lastAnomalyOutcome = {
          status: 'delivery_failed',
          message: `Anomaly detected (${multiplier}× median), but system alert could not be delivered (notifications disabled or channel muted).`,
          transactionId: transaction.id,
          categoryName,
          amount: transaction.amount,
          historyCount: priorRows.length,
          median: Math.round(median),
          threshold,
          multiplier,
          timestamp,
        };
      }

      return anomaly;
    } catch (e) {
      console.warn('Error during transaction anomaly audit:', e);
      lastAnomalyOutcome = {
        status: 'delivery_failed',
        message: e instanceof Error ? e.message : 'Unknown error during anomaly audit',
        transactionId: transaction.id,
        amount: transaction.amount,
        timestamp,
      };
      return null;
    }
  },

  /**
   * Dispatches the Monthly Spending Report Card notification.
   */
  async dispatchMonthlyReportNotification(report?: MonthlyReportCard): Promise<void> {
    try {
      const reportCard = report || AiRepository.getSpendingReportCard();
      const inAppId = `report_${reportCard.yearMonth}_${Date.now()}`;
      const title = `🧠 ${reportCard.monthName} • Zenith Report Card (${reportCard.grade})`;
      const body = reportCard.summaryNarrative;

      // 1. In-App Notification
      NotificationRepository.create({
        id: inAppId,
        type: 'system',
        title,
        body,
        entity_type: 'system',
        action_type: 'view_screen',
        action_payload: '/intelligence',
        is_read: 0,
        is_dismissed: 0,
      });

      // 2. Native System Notification
      await NotificationService.postSystemNotification({
        id: inAppId,
        title,
        body,
        channelId: 'channel_general',
        data: { type: 'monthly_report', yearMonth: reportCard.yearMonth },
      });
    } catch (e) {
      console.warn('Error dispatching monthly report notification:', e);
    }
  },

  /**
   * Purges any stale test/simulated anomaly notifications from the in-app notifications table.
   * Called at app launch to clean up artifacts left by removed debug features.
   */
  purgeTestNotifications(): void {
    try {
      NotificationRepository.purgeFakeTestNotifications();
    } catch (e) {
      console.warn('Error purging test notifications:', e);
    }
  },
};
