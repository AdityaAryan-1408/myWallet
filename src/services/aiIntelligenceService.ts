/**
 * MyWallet — AI Intelligence Service
 * 
 * Manages automated AI analysis triggers, anomaly detection alerts,
 * and system/in-app notification delivery for Tier 1 features.
 */

import { Platform } from 'react-native';
import { Transaction } from '@/db/schema';
import { AiRepository, SpendingAnomaly, MonthlyReportCard } from '@/repositories/aiRepository';
import { NotificationRepository } from '@/repositories/notificationRepository';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { NotificationService } from '@/services/notificationService';

export const AiIntelligenceService = {
  /**
   * Called immediately upon transaction logging to detect statistical anomalies
   * and fire both In-App and System alerts.
   */
  async auditTransaction(transaction: Transaction): Promise<SpendingAnomaly | null> {
    try {
      const anomaly = AiRepository.checkTransactionAnomaly(transaction);
      if (!anomaly) return null;

      const inAppId = `anomaly_${transaction.id}`;
      const title = `⚠️ Spending Anomaly Detected`;
      const body = anomaly.message;

      // 1. Create In-App Notification entry
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

      // 2. Fire immediate Android system notification (if notifications enabled)
      await NotificationService.postSystemNotification({
        id: inAppId,
        title,
        body,
        channelId: 'channel_credit_cards',
        data: { type: 'anomaly', transactionId: transaction.id },
      });

      return anomaly;
    } catch (e) {
      console.warn('Error during transaction anomaly audit:', e);
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
   * Triggers an immediate sample anomaly notification (in-app + system) for instant test verification.
   */
  async triggerTestAnomalyNotification(): Promise<void> {
    try {
      const inAppId = `anomaly_test_${Date.now()}`;
      const title = '⚠️ Spending Anomaly Detected';
      const body = '₹8,500 at Electronics is 3.8× your typical shopping spend (median ₹2,200).';

      // 1. Create In-App Notification entry
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

      // 2. Fire immediate Android system notification
      await NotificationService.postSystemNotification({
        id: inAppId,
        title,
        body,
        channelId: 'channel_credit_cards',
        data: { type: 'anomaly', test: true },
      });
    } catch (e) {
      console.warn('Error triggering test anomaly notification:', e);
    }
  },
};
