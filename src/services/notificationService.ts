/**
 * MyWallet — Native & Local Notification Service
 * 
 * 100% offline, privacy-first local notification scheduler:
 * - Configures Android notification channels (debts, credit cards, summary)
 * - Schedules recurring or date-specific reminders for People & Debts
 * - Auto-manages Credit Card statement, grace period, and due date alerts
 * - Synchronizes with SQLite in_app_notifications table
 * - Gracefully degrades in Expo Go (where native remote/push push modules are disabled)
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { CreditCard, PeopleDebt } from '@/db/schema';
import { SettingsRepository, CreditCardRepository, NotificationRepository, DebtRepository } from '@/repositories';
import { calculateCreditCardLifecycle } from '@/domain/financialCalculations';

// Safely obtain native expo-notifications without throwing in Expo Go
let Notifications: typeof ExpoNotifications | null = null;

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    Notifications = null;
  }
}

export const NotificationService = {
  /**
   * Initializes notification channels on Android and requests permissions.
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;

    try {
      // Setup Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('channel_debts', {
          name: 'People & Debts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4FF32',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('channel_credit_cards', {
          name: 'Credit Card Due Dates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#F59E0B',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('channel_general', {
          name: 'General & System Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4FF32',
          sound: 'default',
        });
      }

      // Check current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error initializing notifications:', e);
      return false;
    }
  },

  /**
   * Post an immediate system notification directly to the Android/iOS status bar.
   * Ensures permissions, channels, and proper system priority.
   */
  async postSystemNotification({
    id,
    title,
    body,
    channelId = 'channel_general',
    data,
  }: {
    id?: string;
    title: string;
    body: string;
    channelId?: 'channel_general' | 'channel_credit_cards' | 'channel_debts';
    data?: Record<string, any>;
  }): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;

    if (!SettingsRepository.getNotificationsEnabled()) {
      return false;
    }

    try {
      const hasPermission = await this.initialize();
      if (!hasPermission) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return false;
      }

      const notifChannel = Platform.OS === 'android' ? channelId : undefined;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          sound: true,
          color: '#D4FF32',
          data: data || {},
          ...(notifChannel && { channelId: notifChannel }),
        },
        trigger: null,
      });

      return true;
    } catch (e) {
      console.warn('Could not post system notification:', e);
      return false;
    }
  },

  /**
   * Fires an immediate test notification to verify OS-level outside-app alert delivery.
   */
  async sendTestNotification(): Promise<boolean> {
    // 1. In-App Notification entry
    NotificationRepository.create({
      id: `test_${Date.now()}`,
      type: 'system',
      title: 'MyWallet • Test Alert ⚡',
      body: 'System notifications, sound, and the custom wallet icon are working perfectly!',
      is_read: 0,
      is_dismissed: 0,
    });

    // 2. Immediate native notification
    return this.postSystemNotification({
      id: `test_${Date.now()}`,
      title: 'MyWallet • Alert Active ⚡',
      body: 'System notifications, sound, and the custom wallet icon are working perfectly!',
      channelId: 'channel_general',
      data: { test: true },
    });
  },

  /**
   * Parses 'HH:mm' string to numbers.
   */
  getPreferredTimeParts(): { hour: number; minute: number } {
    const timeStr = SettingsRepository.getPreferredReminderTime();
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    return {
      hour: isNaN(hour) ? 9 : Math.max(0, Math.min(23, hour)),
      minute: isNaN(minute) ? 0 : Math.max(0, Math.min(59, minute)),
    };
  },

  /**
   * Schedule or update a reminder for a specific debt.
   */
  async scheduleDebtReminder(debt: PeopleDebt): Promise<void> {
    const notifId = `debt_${debt.id}`;
    const inAppId = `inapp_debt_${debt.id}`;

    // If settled or cadence is none, cancel existing
    if (debt.is_settled === 1 || !debt.reminder_cadence || debt.reminder_cadence === 'none') {
      await this.cancelReminder(notifId);
      NotificationRepository.dismissByEntity('debt', debt.id);
      return;
    }

    if (!SettingsRepository.getNotificationsEnabled() || !SettingsRepository.getDebtRemindersEnabled()) {
      return;
    }

    const { hour, minute } = this.getPreferredTimeParts();
    const formattedAmount = `₹${Math.round(debt.amount).toLocaleString('en-IN')}`;
    const isReceivable = debt.direction === 'they_owe';

    const title = isReceivable
      ? `Collect ${formattedAmount} from ${debt.person_name}`
      : `Pay ${formattedAmount} back to ${debt.person_name}`;

    const body = debt.reason
      ? `Note: ${debt.reason}`
      : (isReceivable
          ? `Friendly reminder to collect your pending dues from ${debt.person_name}.`
          : `Friendly reminder to return pending money to ${debt.person_name}.`);

    // 1. Create In-App Notification entry (always active in SQLite!)
    NotificationRepository.create({
      id: inAppId,
      type: 'debt_reminder',
      title,
      body,
      entity_type: 'debt',
      entity_id: debt.id,
      action_type: 'settle_debt',
      action_payload: debt.id,
      is_read: 0,
      is_dismissed: 0,
    });

    // 2. Post immediate system notification so it appears on phone's notification bar!
    await this.postSystemNotification({
      id: notifId,
      title,
      body,
      channelId: 'channel_debts',
      data: { entityType: 'debt', entityId: debt.id },
    });

    // 3. Schedule native recurring reminder if running with Notifications module
    if (!Notifications) return;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const repeatId = `${notifId}_repeat`;
      const isAlreadyScheduled = scheduled.some((s) => s.identifier === repeatId);

      if (debt.reminder_cadence === 'daily') {
        if (!isAlreadyScheduled) {
          await Notifications.scheduleNotificationAsync({
            identifier: notifId,
            content: {
              title,
              body,
              data: { entityType: 'debt', entityId: debt.id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: 'channel_debts',
            },
          });
        }
      } else if (debt.reminder_cadence === 'weekly') {
        if (!isAlreadyScheduled) {
          await Notifications.scheduleNotificationAsync({
            identifier: notifId,
            content: {
              title,
              body,
              data: { entityType: 'debt', entityId: debt.id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: 2, // Tuesday default
              hour,
              minute,
              channelId: 'channel_debts',
            },
          });
        }
      } else if (debt.reminder_cadence === 'custom_date' && debt.reminder_date) {
        await this.cancelReminder(notifId);
        const targetDate = new Date(`${debt.reminder_date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
        if (targetDate.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            identifier: notifId,
            content: {
              title,
              body,
              data: { entityType: 'debt', entityId: debt.id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate,
              channelId: 'channel_debts',
            },
          });
        }
      }
    } catch (e) {
      console.warn(`Could not schedule native debt notification for ${debt.id}:`, e);
    }
  },

  /**
   * Evaluates all credit cards and schedules statement or due date reminders.
   */
  async syncCreditCardReminders(cards?: CreditCard[]): Promise<void> {
    const allCards = cards || CreditCardRepository.getAllActive();
    const notificationsEnabled = SettingsRepository.getNotificationsEnabled();
    const cardRemindersEnabled = SettingsRepository.getCardRemindersEnabled();

    for (const card of allCards) {
      const notifId = `cc_${card.id}`;
      const inAppId = `inapp_cc_${card.id}`;
      const outstanding = CreditCardRepository.getCardOutstanding(card.id);

      // Check if last statement is already paid
      const now = new Date();
      const statementDate = new Date(now.getFullYear(), now.getMonth(), card.cycle_reset_day);
      const isPaid = CreditCardRepository.isLastStatementPaid(
        card.id,
        statementDate.toISOString().split('T')[0]
      );

      const lifecycle = calculateCreditCardLifecycle(
        outstanding,
        card.credit_limit,
        card.cycle_reset_day,
        card.payment_due_day,
        isPaid
      );

      // If card has zero outstanding or statement is fully paid, dismiss reminders
      if (outstanding <= 0 || isPaid) {
        await this.cancelReminder(notifId);
        NotificationRepository.dismissByEntity('credit_card', card.id);
        continue;
      }

      if (!notificationsEnabled || !cardRemindersEnabled) {
        continue;
      }

      const formattedOutstanding = `₹${Math.round(outstanding).toLocaleString('en-IN')}`;
      let title = '';
      let body = '';
      let notifType: 'cc_due_soon' | 'cc_overdue' | 'cc_daily_reminder' | 'cc_statement' = 'cc_daily_reminder';

      if (lifecycle.lifecycleStatus === 'OVERDUE') {
        notifType = 'cc_overdue';
        title = `OVERDUE: ${card.name} (${formattedOutstanding})`;
        body = `Your bill payment of ${formattedOutstanding} is past due date. Settle immediately to avoid finance charges.`;
      } else if (lifecycle.lifecycleStatus === 'DUE_TODAY') {
        notifType = 'cc_due_soon';
        title = `DUE TODAY: ${card.name} (${formattedOutstanding})`;
        body = `Today is the payment due date for your ${card.name}. Tap to settle now.`;
      } else if (lifecycle.lifecycleStatus === 'DUE_SOON') {
        notifType = 'cc_due_soon';
        title = `Payment Due Soon: ${card.name} (${lifecycle.daysUntilDue}d left)`;
        body = `Your bill payment of ${formattedOutstanding} is due in ${lifecycle.daysUntilDue} days.`;
      } else if (lifecycle.lifecycleStatus === 'GRACE_PERIOD') {
        notifType = 'cc_daily_reminder';
        title = `Card Bill Active: ${card.name}`;
        body = `Statement balance of ${formattedOutstanding} is due on ${card.payment_due_day}th.`;
      } else if (lifecycle.daysUntilReset <= 2) {
        notifType = 'cc_statement';
        title = `Statement Closing Soon: ${card.name}`;
        body = `Billing cycle ends in ${lifecycle.daysUntilReset} days. Current balance: ${formattedOutstanding}.`;
      }

      if (title && body) {
        // Sync in-app notification (always active in SQLite!)
        NotificationRepository.create({
          id: inAppId,
          type: notifType,
          title,
          body,
          entity_type: 'credit_card',
          entity_id: card.id,
          action_type: 'pay_card',
          action_payload: card.id,
          is_read: 0,
          is_dismissed: 0,
        });

        // Post immediate system notification so it appears on the phone's notification bar!
        await this.postSystemNotification({
          id: notifId,
          title,
          body,
          channelId: 'channel_credit_cards',
          data: { entityType: 'credit_card', entityId: card.id },
        });

        // Schedule daily repeating reminder with Notifications module
        if (Notifications) {
          try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const repeatId = `${notifId}_repeat`;
            const isAlreadyScheduled = scheduled.some((s) => s.identifier === repeatId);

            if (!isAlreadyScheduled) {
              const { hour, minute } = this.getPreferredTimeParts();

              await Notifications.scheduleNotificationAsync({
                identifier: repeatId,
                content: {
                  title,
                  body,
                  data: { entityType: 'credit_card', entityId: card.id },
                  sound: true,
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DAILY,
                  hour,
                  minute,
                  channelId: 'channel_credit_cards',
                },
              });
            }
          } catch (e) {
            console.warn(`Could not schedule native card notification for ${card.id}:`, e);
          }
        }
      }
    }
  },

  /**
   * Called when a credit card bill payment occurs.
   * Cancels scheduled reminders and dismisses related in-app notifications.
   */
  async onCardBillPaid(cardId: string): Promise<void> {
    await this.cancelReminder(`cc_${cardId}`);
    NotificationRepository.dismissByEntity('credit_card', cardId);
  },

  /**
   * Called when a peer debt is settled or deleted.
   */
  async onDebtSettled(debtId: string): Promise<void> {
    await this.cancelReminder(`debt_${debtId}`);
    NotificationRepository.dismissByEntity('debt', debtId);
  },

  /**
   * Synchronizes all reminders across active debts and credit cards.
   */
  async syncAllReminders(): Promise<void> {
    try {
      // 1. Sync unsettled debts
      const debts = DebtRepository.getUnsettled();
      for (const debt of debts) {
        await this.scheduleDebtReminder(debt);
      }

      // 2. Sync credit cards
      const cards = CreditCardRepository.getAllActive();
      await this.syncCreditCardReminders(cards);
    } catch (e) {
      console.warn('Error syncing reminders:', e);
    }
  },

  /**
   * Cancels a scheduled native notification and dismisses it from status bar.
   */
  async cancelReminder(identifier: string): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await Notifications.cancelScheduledNotificationAsync(`${identifier}_repeat`);
      await Notifications.dismissNotificationAsync(identifier);
      await Notifications.dismissNotificationAsync(`${identifier}_repeat`);
    } catch {}
  },

  /**
   * Cancels all scheduled notifications and dismisses all active alerts.
   */
  async cancelAll(): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch {}
  },
};
