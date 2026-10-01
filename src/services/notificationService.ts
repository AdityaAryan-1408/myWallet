/**
 * MyWallet — Native & Local Notification Service
 * 
 * 100% offline, privacy-first local notification scheduler:
 * - Configures Android notification channels (debts, credit cards, summary)
 * - Schedules recurring or date-specific reminders for People & Debts
 * - Auto-manages Credit Card statement, grace period, and due date alerts
 * - Synchronizes with SQLite in_app_notifications table
 * - Supports local notifications in Expo Go, development builds, and release builds
 */

import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';
import { CreditCard, PeopleDebt } from '@/db/schema';
import { SettingsRepository, CreditCardRepository, NotificationRepository, DebtRepository } from '@/repositories';
import { calculateCreditCardLifecycle } from '@/domain/financialCalculations';

type NotificationChannelId =
  | 'channel_general'
  | 'channel_credit_cards'
  | 'channel_debts'
  | 'channel_anomalies';

type NotificationDiagnosticLevel = 'info' | 'warning' | 'error';

export type NotificationDiagnostic = {
  timestamp: string;
  level: NotificationDiagnosticLevel;
  event: string;
  details?: Record<string, unknown>;
};

// Local notifications are supported in every native runtime, including Expo Go.
// Only remote push-token features require a development/release build.
let Notifications: typeof ExpoNotifications | null = null;
let initializationPromise: Promise<boolean> | null = null;
const diagnostics: NotificationDiagnostic[] = [];

if (Platform.OS !== 'web') {
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
    console.warn('expo-notifications is unavailable:', e);
  }
}

export const NotificationService = {
  _listenerRegistered: false,

  recordDiagnostic(
    level: NotificationDiagnosticLevel,
    event: string,
    details?: Record<string, unknown>
  ): void {
    const entry: NotificationDiagnostic = {
      timestamp: new Date().toISOString(),
      level,
      event,
      details,
    };
    diagnostics.push(entry);
    if (diagnostics.length > 100) diagnostics.shift();

    const message = `[Notifications] ${event}`;
    if (level === 'error') console.error(message, details);
    else if (level === 'warning') console.warn(message, details);
    else console.info(message, details);
  },

  getDiagnostics(): readonly NotificationDiagnostic[] {
    return diagnostics;
  },

  /**
   * Initializes notification channels on Android and requests permissions.
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) {
      this.recordDiagnostic('warning', 'local_notifications_unavailable', {
        platform: Platform.OS,
      });
      return false;
    }

    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
      try {
        // Setup Android notification channels before any notification is scheduled.
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

        await Notifications.setNotificationChannelAsync('channel_anomalies', {
          name: 'Spending Anomalies',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 350, 200, 350],
          lightColor: '#F59E0B',
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

        // Set up notification received listener once
        if (!this._listenerRegistered && Notifications) {
        this._listenerRegistered = true;
        Notifications.addNotificationReceivedListener((notification) => {
          try {
            const data = notification.request.content.data as Record<string, any> | undefined;
            if (data?.entityType === 'debt' && typeof data?.entityId === 'string') {
              const debt = DebtRepository.getById(data.entityId);
              if (debt && debt.is_settled === 0) {
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

                NotificationRepository.create({
                  id: `inapp_debt_${debt.id}`,
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
                DebtRepository.update(debt.id, { last_reminded_at: new Date().toISOString() });
              }
            }
          } catch (e) {
            console.warn('Error handling received notification in listener:', e);
          }
        });
        }

        const granted = finalStatus === 'granted';
        this.recordDiagnostic(granted ? 'info' : 'warning', 'notification_system_initialized', {
          permission: finalStatus,
          platform: Platform.OS,
        });
        return granted;
      } catch (e) {
        this.recordDiagnostic('error', 'notification_system_initialization_failed', {
          error: e instanceof Error ? e.message : String(e),
        });
        return false;
      }
    })();

    try {
      return await initializationPromise;
    } finally {
      initializationPromise = null;
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
    channelId?: NotificationChannelId;
    data?: Record<string, any>;
  }): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;

    if (!SettingsRepository.getNotificationsEnabled()) {
      return false;
    }

    try {
      const hasPermission = await this.initialize();
      if (!hasPermission) {
        this.recordDiagnostic('warning', 'immediate_notification_not_posted', {
          reason: 'permission_not_granted',
          channelId,
        });
        return false;
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

      this.recordDiagnostic('info', 'immediate_notification_posted', { id, channelId });
      return true;
    } catch (e) {
      this.recordDiagnostic('error', 'immediate_notification_failed', {
        id,
        channelId,
        error: e instanceof Error ? e.message : String(e),
      });
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
   * Returns hour and minute for a debt, respecting custom reminder_time if set,
   * otherwise falling back to global preferred reminder time.
   */
  getDebtTimeParts(debt?: PeopleDebt | null): { hour: number; minute: number } {
    if (debt?.reminder_time && debt.reminder_time.includes(':')) {
      const parts = debt.reminder_time.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return {
          hour: Math.max(0, Math.min(23, h)),
          minute: Math.max(0, Math.min(59, m)),
        };
      }
    }
    return this.getPreferredTimeParts();
  },

  /**
   * Evaluates if an in-app debt reminder should be generated right now based on cadence.
   */
  shouldCreateInAppDebtReminder(debt: PeopleDebt, hour: number, minute: number): boolean {
    if (debt.is_settled === 1 || !debt.reminder_cadence || debt.reminder_cadence === 'none') {
      return false;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = hour * 60 + minute;
    const isPreferredTimePassed = nowMinutes >= targetMinutes;

    if (debt.reminder_cadence === 'daily') {
      if (debt.last_reminded_at) {
        const lastDate = debt.last_reminded_at.split('T')[0];
        if (lastDate === todayStr) {
          // Already reminded today
          return false;
        }
      }
      return isPreferredTimePassed;
    }

    if (debt.reminder_cadence === 'weekly') {
      if (debt.last_reminded_at) {
        const lastRemindedTime = new Date(debt.last_reminded_at).getTime();
        const daysSince = (now.getTime() - lastRemindedTime) / (1000 * 60 * 60 * 24);
        if (daysSince < 6) {
          // Reminded within past 6 days
          return false;
        }
      }
      // Check if today matches the scheduled weekday
      const refDate = debt.reminder_date
        ? new Date(debt.reminder_date)
        : (debt.created_at ? new Date(debt.created_at) : now);
      const isCorrectDayOfWeek = now.getDay() === refDate.getDay();
      return isCorrectDayOfWeek && isPreferredTimePassed;
    }

    if (debt.reminder_cadence === 'custom_date' && debt.reminder_date) {
      if (debt.last_reminded_at) {
        return false;
      }
      const isDateReached = todayStr >= debt.reminder_date;
      return isDateReached && isPreferredTimePassed;
    }

    return false;
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
      await this.cancelReminder(notifId);
      this.recordDiagnostic('info', 'debt_reminder_cancelled', {
        debtId: debt.id,
        reason: 'notifications_disabled',
      });
      return;
    }

    if (!(await this.initialize())) {
      this.recordDiagnostic('warning', 'debt_reminder_not_scheduled', {
        debtId: debt.id,
        reason: 'notification_system_unavailable',
      });
      return;
    }

    const { hour, minute } = this.getDebtTimeParts(debt);
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

    // 1. In-App Notification check: Only create/update when cadence indicates it is due!
    if (this.shouldCreateInAppDebtReminder(debt, hour, minute)) {
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
      DebtRepository.update(debt.id, { last_reminded_at: new Date().toISOString() });
    }

    // 2. Schedule native recurring reminder. The OS triggers it at the configured time.
    if (!Notifications) return;

    try {
      await this.cancelReminder(notifId);

      if (debt.reminder_cadence === 'daily') {
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
        await this.verifyScheduledReminder(notifId, 'channel_debts');
      } else if (debt.reminder_cadence === 'weekly') {
        const refDate = debt.reminder_date
          ? new Date(debt.reminder_date)
          : (debt.created_at ? new Date(debt.created_at) : new Date());
        // Expo Notifications weekly trigger weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        const weekday = refDate.getDay() + 1;

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
            weekday,
            hour,
            minute,
            channelId: 'channel_debts',
          },
        });
        await this.verifyScheduledReminder(notifId, 'channel_debts');
      } else if (debt.reminder_cadence === 'custom_date' && debt.reminder_date) {
        const targetDate = new Date(`${debt.reminder_date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
        if (!Number.isNaN(targetDate.getTime()) && targetDate.getTime() > Date.now()) {
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
          await this.verifyScheduledReminder(notifId, 'channel_debts');
        } else {
          this.recordDiagnostic('warning', 'debt_reminder_not_scheduled', {
            debtId: debt.id,
            reason: 'date_is_invalid_or_not_in_the_future',
            reminderDate: debt.reminder_date,
          });
        }
      }
    } catch (e) {
      this.recordDiagnostic('error', 'debt_reminder_scheduling_failed', {
        debtId: debt.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  /**
   * Evaluates all credit cards and schedules statement or due date reminders.
   */
  async syncCreditCardReminders(cards?: CreditCard[]): Promise<void> {
    const allCards = cards || CreditCardRepository.getAllActive();
    const notificationsEnabled = SettingsRepository.getNotificationsEnabled();
    const cardRemindersEnabled = SettingsRepository.getCardRemindersEnabled();

    const schedulingAllowed =
      notificationsEnabled && cardRemindersEnabled && (await this.initialize());

    if (notificationsEnabled && cardRemindersEnabled && !schedulingAllowed) {
      this.recordDiagnostic('warning', 'card_reminders_not_scheduled', {
        reason: 'notification_system_unavailable',
      });
    }

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

      if (!notificationsEnabled || !cardRemindersEnabled || !schedulingAllowed) {
        await this.cancelReminder(notifId);
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
        const existing = NotificationRepository.getAll().find(
          (n) => n.entity_type === 'credit_card' && n.entity_id === card.id
        );

        NotificationRepository.create({
          id: inAppId,
          type: notifType,
          title,
          body,
          entity_type: 'credit_card',
          entity_id: card.id,
          action_type: 'pay_card',
          action_payload: card.id,
          is_read: existing ? existing.is_read : 0,
          is_dismissed: 0,
        });

        // Schedule daily repeating reminder with Notifications module
        if (Notifications) {
          try {
            await this.cancelReminder(notifId);
            const { hour, minute } = this.getPreferredTimeParts();

            await Notifications.scheduleNotificationAsync({
              identifier: notifId,
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
            await this.verifyScheduledReminder(notifId, 'channel_credit_cards');
          } catch (e) {
            this.recordDiagnostic('error', 'card_reminder_scheduling_failed', {
              cardId: card.id,
              error: e instanceof Error ? e.message : String(e),
            });
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
      const notificationsEnabled = SettingsRepository.getNotificationsEnabled();
      if (notificationsEnabled && !(await this.initialize())) {
        this.recordDiagnostic('warning', 'reminder_reconciliation_skipped', {
          reason: 'notification_system_unavailable',
        });
        return;
      }

      // 1. Sync unsettled debts
      const debts = DebtRepository.getUnsettled();
      for (const debt of debts) {
        await this.scheduleDebtReminder(debt);
      }

      // 2. Sync credit cards
      const cards = CreditCardRepository.getAllActive();
      await this.syncCreditCardReminders(cards);
      this.recordDiagnostic('info', 'reminder_reconciliation_completed', {
        debtCount: debts.length,
        cardCount: cards.length,
      });
    } catch (e) {
      this.recordDiagnostic('error', 'reminder_reconciliation_failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  /**
   * Confirms that the native scheduler persisted the request we just created.
   */
  async verifyScheduledReminder(identifier: string, channelId: NotificationChannelId): Promise<void> {
    if (!Notifications) {
      throw new Error('expo-notifications is unavailable');
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const request = scheduled.find((item) => item.identifier === identifier);
    if (!request) {
      throw new Error(`Native scheduler did not retain ${identifier}`);
    }

    const requestChannel = request.trigger && typeof request.trigger === 'object' && 'channelId' in request.trigger
      ? request.trigger.channelId
      : undefined;
    if (Platform.OS === 'android' && requestChannel !== channelId) {
      throw new Error(`Scheduled ${identifier} on ${String(requestChannel)} instead of ${channelId}`);
    }

    this.recordDiagnostic('info', 'reminder_schedule_verified', { identifier, channelId });
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
    } catch (e) {
      this.recordDiagnostic('warning', 'reminder_cancellation_failed', {
        identifier,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  /**
   * Cancels all scheduled notifications and dismisses all active alerts.
   */
  async cancelAll(): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      this.recordDiagnostic('info', 'all_reminders_cancelled');
    } catch (e) {
      this.recordDiagnostic('warning', 'all_reminders_cancellation_failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  /**
   * Schedules a delayed test notification to verify timing & background delivery.
   */
  async scheduleDelayedTestNotification(delaySeconds: number = 5): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const hasPermission = await this.initialize();
      if (!hasPermission) {
        this.recordDiagnostic('warning', 'delayed_test_permission_not_granted');
        return false;
      }

      const notifId = `test_delayed_${Date.now()}`;
      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: 'MyWallet • 5s Delayed Test ⚡',
          body: `5-second test fired successfully! Background delivery & exact timing verified.`,
          sound: true,
          color: '#D4FF32',
          data: { test: true, delayed: true },
          ...(Platform.OS === 'android' && { channelId: 'channel_general' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, delaySeconds),
          channelId: 'channel_general',
        },
      });

      this.recordDiagnostic('info', 'delayed_test_notification_scheduled', { delaySeconds, notifId });
      return true;
    } catch (e) {
      this.recordDiagnostic('error', 'delayed_test_notification_failed', {
        error: e instanceof Error ? e.message : String(e),
      });
      return false;
    }
  },

  /**
   * Read-only diagnostics helper: retrieves current Android notification channels.
   */
  async getChannels(): Promise<ExpoNotifications.NotificationChannel[]> {
    if (Platform.OS !== 'android' || !Notifications) return [];
    try {
      return (await Notifications.getNotificationChannelsAsync()) ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Read-only diagnostics helper: retrieves all currently scheduled pending notifications.
   */
  async getScheduledNotifications(): Promise<ExpoNotifications.NotificationRequest[]> {
    if (!Notifications) return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch {
      return [];
    }
  },

  /**
   * Read-only diagnostics helper: retrieves app notification permissions status.
   */
  async getPermissions(): Promise<ExpoNotifications.NotificationPermissionsStatus | null> {
    if (!Notifications) return null;
    try {
      return await Notifications.getPermissionsAsync();
    } catch {
      return null;
    }
  },
};
