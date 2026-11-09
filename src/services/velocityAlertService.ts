/**
 * MyWallet — Spending Velocity Alert Service (Feature B2)
 * 
 * Real-time Burn Rate Monitor:
 * 1. Short-Window Burst: Detects 3+ transactions in 3 hours exceeding 2.0x typical baseline
 * 2. Weekend Surge: Detects weekend daily spend exceeding 2.2x weekday historical average
 * 3. Budget Depletion Velocity: Detects category burn pace projected to exhaust monthly budget early
 * 
 * Features:
 * - Emits system push alerts via channel_anomalies
 * - Synchronizes with in_app_notifications table
 * - Non-intrusive, dismissible in-app floating banner on HomeScreen
 * - Zero pulse on hero card to avoid overriding dynamic health color (A3)
 */

import { getDatabase } from '@/db/client';
import { Transaction, InAppNotification } from '@/db/schema';
import { NotificationRepository } from '@/repositories/notificationRepository';
import { NotificationService } from '@/services/notificationService';

export type VelocityAlertType = 'window_burst' | 'weekend_surge' | 'budget_exhaustion';

export interface VelocityAlert {
  id: string;
  type: VelocityAlertType;
  title: string;
  message: string;
  amount?: number;
  count?: number;
  multiplier?: number;
  categoryName?: string;
  exhaustionDay?: number;
  timestamp: string;
}

// Memory cache of locally dismissed alert IDs in current session
const dismissedAlertIds = new Set<string>();
let activeMemoryAlert: VelocityAlert | null = null;

function getOrdinalSuffix(day: number): string {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
}

export const VelocityAlertService = {
  /**
   * Retrieves the currently active velocity alert for HomeScreen display,
   * checking SQLite in_app_notifications and session memory.
   */
  getActiveAlert(): VelocityAlert | null {
    try {
      const db = getDatabase();
      const row = db.getFirstSync<InAppNotification>(
        `SELECT * FROM in_app_notifications 
         WHERE type = 'velocity_alert' AND is_dismissed = 0 
         ORDER BY created_at DESC LIMIT 1;`
      );

      if (!row) {
        if (activeMemoryAlert && !dismissedAlertIds.has(activeMemoryAlert.id)) {
          return activeMemoryAlert;
        }
        return null;
      }

      if (dismissedAlertIds.has(row.id)) {
        return null;
      }

      // Check freshness: dismiss if older than 12 hours
      const createdAtMs = new Date(row.created_at).getTime();
      const ageHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
      if (ageHours > 12) {
        NotificationRepository.dismiss(row.id);
        return null;
      }

      let parsedPayload: Record<string, any> = {};
      try {
        if (row.action_payload) {
          parsedPayload = JSON.parse(row.action_payload);
        }
      } catch {}

      return {
        id: row.id,
        type: (row.entity_id as VelocityAlertType) || 'window_burst',
        title: row.title,
        message: row.body,
        amount: parsedPayload.amount,
        count: parsedPayload.count,
        multiplier: parsedPayload.multiplier,
        categoryName: parsedPayload.categoryName,
        exhaustionDay: parsedPayload.exhaustionDay,
        timestamp: row.created_at,
      };
    } catch (e) {
      console.warn('Error reading active velocity alert:', e);
      return activeMemoryAlert;
    }
  },

  /**
   * Dismisses a velocity alert by ID, both in SQLite and in-memory session.
   */
  dismissAlert(id: string): void {
    dismissedAlertIds.add(id);
    if (activeMemoryAlert?.id === id) {
      activeMemoryAlert = null;
    }
    try {
      NotificationRepository.dismiss(id);
    } catch (e) {
      console.warn('Error dismissing velocity alert:', e);
    }
  },

  /**
   * Audits spending velocity across the 3 patterns:
   * 1. 3-Hour Burst
   * 2. Weekend Surge
   * 3. Category Budget Exhaustion
   */
  async auditVelocity(currentTx?: Transaction): Promise<VelocityAlert | null> {
    try {
      const db = getDatabase();
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timestamp = now.toISOString();

      // ─────────────────────────────────────────────────────────────
      // PATTERN 1: Short-Window Spending Burst (Last 3 Hours)
      // ─────────────────────────────────────────────────────────────
      const cutoffMs = now.getTime() - 3 * 60 * 60 * 1000;
      const cutoffISO = new Date(cutoffMs).toISOString();

      const recentExpenses = db.getAllSync<{
        id: string;
        amount: number;
        category_id: string | null;
        created_at: string;
      }>(
        `SELECT id, amount, category_id, created_at 
         FROM transactions 
         WHERE type = 'expense' 
           AND (created_at >= ? OR date = ?)
         ORDER BY created_at DESC;`,
        [cutoffISO, todayStr]
      );

      // Filter specifically to transactions created within the last 3 hours
      const validBurstExpenses = recentExpenses.filter((tx) => {
        const txTime = new Date(tx.created_at).getTime();
        return txTime >= cutoffMs;
      });

      const burstCount = validBurstExpenses.length;
      const burstSum = validBurstExpenses.reduce((sum, tx) => sum + tx.amount, 0);

      // Threshold: at least 3 transactions and ₹1,000 spend in 3 hours
      if (burstCount >= 3 && burstSum >= 1000) {
        // Compute historical 3-hour baseline from last 30 days
        const historyRow = db.getFirstSync<{ total_spent: number | null; active_days: number | null }>(
          `SELECT SUM(amount) as total_spent, COUNT(DISTINCT date) as active_days 
           FROM transactions 
           WHERE type = 'expense' AND date >= date('now', '-30 days');`
        );

        const totalHistSpent = historyRow?.total_spent ?? 0;
        const activeDays = historyRow?.active_days ?? 0;

        // Daily average spend across active days divided by 4 active 3-hour daytime blocks
        const typical3hRate = (activeDays > 0 && totalHistSpent > 0)
          ? Math.max(Math.round(totalHistSpent / (activeDays * 4)), 300)
          : 400;

        const multiplier = parseFloat((burstSum / typical3hRate).toFixed(1));

        if (multiplier >= 2.0) {
          const windowBlock = Math.floor(now.getHours() / 3);
          const alertId = `velocity_burst_${todayStr}_b${windowBlock}`;

          if (!dismissedAlertIds.has(alertId)) {
            const formattedSum = Math.round(burstSum).toLocaleString('en-IN');
            const alert: VelocityAlert = {
              id: alertId,
              type: 'window_burst',
              title: '⚡ Spending Velocity Alert',
              message: `You've spent ₹${formattedSum} in the last 3 hours across ${burstCount} transactions — that's ${multiplier}× your typical rate.`,
              amount: burstSum,
              count: burstCount,
              multiplier,
              timestamp,
            };

            await this.dispatchAlert(alert);
            return alert;
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PATTERN 2: Weekend Spending Surge (Saturday / Sunday)
      // ─────────────────────────────────────────────────────────────
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const todayExpenseRow = db.getFirstSync<{ total: number | null; count: number | null }>(
          `SELECT SUM(amount) as total, COUNT(*) as count 
           FROM transactions 
           WHERE type = 'expense' AND date = ?;`,
          [todayStr]
        );

        const todayTotal = todayExpenseRow?.total ?? 0;

        if (todayTotal >= 1500) {
          const weekdayHistRow = db.getFirstSync<{ total: number | null; weekday_count: number | null }>(
            `SELECT SUM(amount) as total, COUNT(DISTINCT date) as weekday_count 
             FROM transactions 
             WHERE type = 'expense' 
               AND strftime('%w', date) NOT IN ('0', '6') 
               AND date >= date('now', '-30 days');`
          );

          const weekdayTotal = weekdayHistRow?.total ?? 0;
          const weekdayDays = weekdayHistRow?.weekday_count ?? 0;

          if (weekdayDays > 0 && weekdayTotal > 0) {
            const weekdayAvg = weekdayTotal / weekdayDays;
            const multiplier = parseFloat((todayTotal / weekdayAvg).toFixed(1));

            if (multiplier >= 2.2) {
              const alertId = `velocity_weekend_${todayStr}`;
              if (!dismissedAlertIds.has(alertId)) {
                const alert: VelocityAlert = {
                  id: alertId,
                  type: 'weekend_surge',
                  title: '⚡ Weekend Spending Surge',
                  message: `Your weekend spending is on track to be ${multiplier}× higher than your weekday average.`,
                  amount: todayTotal,
                  multiplier,
                  timestamp,
                };

                await this.dispatchAlert(alert);
                return alert;
              }
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PATTERN 3: Category Budget Burn Exhaustion
      // ─────────────────────────────────────────────────────────────
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const dayOfMonth = now.getDate();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      // Only evaluate if at least 3 days into the month and before final 2 days
      if (dayOfMonth >= 3 && dayOfMonth <= lastDayOfMonth - 2) {
        interface BudgetRow {
          id: string;
          category_id: string;
          category_name: string;
          limit_amount: number;
          spent: number;
        }

        const budgetRows = db.getAllSync<BudgetRow>(
          `SELECT b.id, b.category_id, c.name as category_name, b.amount as limit_amount,
                  COALESCE(SUM(t.amount), 0) as spent
           FROM budgets b
           JOIN categories c ON b.category_id = c.id
           LEFT JOIN transactions t ON (t.category_id = b.category_id OR t.subcategory_id = b.category_id)
             AND t.type = 'expense' 
             AND strftime('%Y-%m', t.date) = ?
           WHERE b.is_active = 1 AND b.amount >= 500
           GROUP BY b.id, b.category_id, c.name, b.amount;`,
          [currentYearMonth]
        );

        let earliestExhaustionDay = 999;
        let mostCriticalBudget: BudgetRow | null = null;

        for (const b of budgetRows) {
          if (b.spent >= b.limit_amount * 0.40) {
            const burnRate = b.spent / dayOfMonth;
            if (burnRate > 0) {
              const projectedExhaustionDay = Math.floor(b.limit_amount / burnRate);
              if (
                projectedExhaustionDay <= lastDayOfMonth &&
                projectedExhaustionDay >= dayOfMonth &&
                projectedExhaustionDay < earliestExhaustionDay
              ) {
                earliestExhaustionDay = projectedExhaustionDay;
                mostCriticalBudget = b;
              }
            }
          }
        }

        if (mostCriticalBudget && earliestExhaustionDay <= lastDayOfMonth) {
          const alertId = `velocity_budget_${mostCriticalBudget.category_id}_${todayStr}`;
          if (!dismissedAlertIds.has(alertId)) {
            const ordinal = getOrdinalSuffix(earliestExhaustionDay);
            const alert: VelocityAlert = {
              id: alertId,
              type: 'budget_exhaustion',
              title: '⚡ Budget Burn Warning',
              message: `At this pace, your ${mostCriticalBudget.category_name} budget will be exhausted by the ${ordinal}.`,
              categoryName: mostCriticalBudget.category_name,
              exhaustionDay: earliestExhaustionDay,
              timestamp,
            };

            await this.dispatchAlert(alert);
            return alert;
          }
        }
      }

      return null;
    } catch (e) {
      console.warn('Error evaluating spending velocity:', e);
      return null;
    }
  },

  /**
   * Dispatches the confirmed velocity alert to SQLite in_app_notifications
   * and sends an immediate OS status bar notification on channel_anomalies.
   */
  async dispatchAlert(alert: VelocityAlert): Promise<void> {
    activeMemoryAlert = alert;

    const db = getDatabase();
    const existing = db.getFirstSync<InAppNotification>(
      'SELECT id, is_dismissed FROM in_app_notifications WHERE id = ?;',
      [alert.id]
    );

    if (existing && existing.is_dismissed === 1) {
      return;
    }

    if (!existing) {
      // 1. Persist to in_app_notifications table
      try {
        NotificationRepository.create({
          id: alert.id,
          type: 'velocity_alert',
          title: alert.title,
          body: alert.message,
          entity_type: 'velocity',
          entity_id: alert.type,
          action_type: 'none',
          action_payload: JSON.stringify({
            amount: alert.amount,
            count: alert.count,
            multiplier: alert.multiplier,
            categoryName: alert.categoryName,
            exhaustionDay: alert.exhaustionDay,
          }),
          is_read: 0,
          is_dismissed: 0,
        });
      } catch (e) {
        console.warn('Failed to save velocity alert to in_app_notifications:', e);
      }

      // 2. Post immediate native system notification
      try {
        await NotificationService.postSystemNotification({
          id: alert.id,
          title: alert.title,
          body: alert.message,
          channelId: 'channel_anomalies',
          data: {
            type: 'velocity_alert',
            alertId: alert.id,
            velocityType: alert.type,
          },
        });
      } catch (e) {
        console.warn('Failed to dispatch system notification for velocity alert:', e);
      }
    }
  },
};
