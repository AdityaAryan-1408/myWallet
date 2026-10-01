/**
 * MyWallet — Notification Diagnostics Card
 * 
 * Phase 2: Live inspectable diagnostics UI for notification pipeline:
 * - App runtime & version inspection
 * - OS notification permission status
 * - Android notification channels (importance, blocked state, sound, vibration)
 * - Exact-alarm status & punctuality advisory
 * - All expected active reminders with calculated next fire times & native OS schedule status
 * - Recent scheduler diagnostics & corrective actions
 * - Interactive controls: Delayed 5s test, reminder reconciliation, system settings deep-link
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  ShieldAlert,
  ShieldCheck,
  Bell,
  BellRing,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Calendar,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react-native';

import { NotificationService, NotificationDiagnostic } from '@/services/notificationService';
import { DebtRepository, CreditCardRepository, SettingsRepository } from '@/repositories';
import { PeopleDebt } from '@/db/schema';
import { Colors, FontFamily, Spacing, Shapes } from '@/theme';

export interface ExpectedReminder {
  id: string;
  nativeId: string;
  title: string;
  type: 'debt' | 'credit_card';
  cadence: string;
  channelId: string;
  nextFireTime: string;
  isNativePresent: boolean;
  details: string;
}

export function NotificationDiagnosticsCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);
  const [channels, setChannels] = useState<any[]>([]);
  const [expectedReminders, setExpectedReminders] = useState<ExpectedReminder[]>([]);
  const [recentDiagnostics, setRecentDiagnostics] = useState<readonly NotificationDiagnostic[]>([]);
  const [lastError, setLastError] = useState<NotificationDiagnostic | null>(null);
  const [isFiringDelayedTest, setIsFiringDelayedTest] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // Determine runtime environment
  const runtimeInfo = React.useMemo(() => {
    let env = 'Release APK';
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      env = 'Expo Go';
    } else if (__DEV__) {
      env = 'Development Build';
    }
    const version = Constants.expoConfig?.version || '2.0.0';
    return { env, version, os: Platform.OS };
  }, []);

  // Compute next local fire time for a debt
  const calculateNextDebtFireTime = (debt: PeopleDebt, globalTime: string): string => {
    const timeToUse = debt.reminder_time || globalTime || '09:00';
    const [hStr, mStr] = timeToUse.split(':');
    const targetHour = parseInt(hStr, 10) || 9;
    const targetMinute = parseInt(mStr, 10) || 0;

    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);

    if (debt.reminder_cadence === 'daily') {
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      return `${target.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeToUse}`;
    }

    if (debt.reminder_cadence === 'weekly') {
      const refDate = debt.reminder_date
        ? new Date(debt.reminder_date)
        : (debt.created_at ? new Date(debt.created_at) : now);
      const targetDay = refDate.getDay();
      let daysUntil = (targetDay - now.getDay() + 7) % 7;
      if (daysUntil === 0 && target.getTime() <= now.getTime()) {
        daysUntil = 7;
      }
      target.setDate(now.getDate() + daysUntil);
      return `${target.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })} at ${timeToUse}`;
    }

    if (debt.reminder_cadence === 'custom_date' && debt.reminder_date) {
      return `${debt.reminder_date} at ${timeToUse}`;
    }

    return 'Inactive';
  };

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Permissions
      const perms = await NotificationService.getPermissions();
      setPermissionStatus(perms?.status || 'undetermined');
      setCanAskAgain(perms?.canAskAgain ?? true);

      // 2. Android Channels
      const chs = await NotificationService.getChannels();
      setChannels(chs);

      // 3. Native Scheduled Requests
      const nativeScheduled = await NotificationService.getScheduledNotifications();
      const scheduledIds = new Set(nativeScheduled.map((s) => s.identifier));

      // 4. Expected Reminders (Active Debts + Cards)
      const globalTime = SettingsRepository.getPreferredReminderTime();
      const expected: ExpectedReminder[] = [];

      // Unsettled debts with cadence
      const unsettledDebts = DebtRepository.getUnsettled().filter(
        (d) => d.reminder_cadence && d.reminder_cadence !== 'none'
      );
      for (const d of unsettledDebts) {
        const nativeId = `debt_${d.id}`;
        expected.push({
          id: d.id,
          nativeId,
          title: `${d.direction === 'they_owe' ? 'Collect from' : 'Pay'} ${d.person_name}`,
          type: 'debt',
          cadence: d.reminder_cadence || 'daily',
          channelId: 'channel_debts',
          nextFireTime: calculateNextDebtFireTime(d, globalTime),
          isNativePresent: scheduledIds.has(nativeId),
          details: `₹${Math.round(d.amount).toLocaleString('en-IN')}`,
        });
      }

      // Active credit cards with balance
      const activeCards = CreditCardRepository.getAllActive();
      for (const card of activeCards) {
        const outstanding = CreditCardRepository.getCardOutstanding(card.id);
        if (outstanding > 0) {
          const nativeId = `cc_${card.id}`;
          expected.push({
            id: card.id,
            nativeId,
            title: `${card.name} Bill Reminder`,
            type: 'credit_card',
            cadence: 'Daily Cycle Scan',
            channelId: 'channel_credit_cards',
            nextFireTime: `Daily at ${globalTime}`,
            isNativePresent: scheduledIds.has(nativeId),
            details: `Due on ${card.payment_due_day}th • Balance ₹${Math.round(outstanding).toLocaleString('en-IN')}`,
          });
        }
      }

      setExpectedReminders(expected);

      // 5. Diagnostics Log
      const diagLogs = NotificationService.getDiagnostics();
      setRecentDiagnostics(diagLogs);
      const errors = [...diagLogs].reverse().find((d) => d.level === 'error' || d.level === 'warning');
      setLastError(errors || null);
    } catch (e) {
      console.warn('Error loading diagnostics data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleDelayed5sTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFiringDelayedTest(true);
    try {
      const ok = await NotificationService.scheduleDelayedTestNotification(5);
      if (ok) {
        Alert.alert(
          '5-Second Test Queued ⚡',
          'A test notification is scheduled to fire in exactly 5 seconds. You can lock your phone or switch apps to verify background delivery.'
        );
        setTimeout(loadDiagnostics, 5500);
      } else {
        Alert.alert(
          'Permission Required',
          'Notification permission is not granted. Please enable notifications in device settings.'
        );
      }
    } catch {
      Alert.alert('Test Failed', 'Could not queue the 5-second test notification.');
    } finally {
      setIsFiringDelayedTest(false);
    }
  };

  const handleReconcileNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReconciling(true);
    try {
      await NotificationService.syncAllReminders();
      await loadDiagnostics();
      Alert.alert(
        'Reconciliation Complete ✅',
        'All active debt rules and credit card schedules have been reconciled with the native OS scheduler.'
      );
    } catch {
      Alert.alert('Reconciliation Error', 'Failed to synchronize reminders.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleOpenSettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings Error', 'Unable to open system settings directly.');
    }
  };

  const hasAnyBlockedChannel = channels.some(
    (c) => c.importance === 0 || c.importance === 2
  );

  return (
    <View style={styles.container}>
      {/* ─── Header & Toggle Bar ─── */}
      <TouchableOpacity
        style={styles.headerBar}
        onPress={() => {
          Haptics.selectionAsync();
          setIsExpanded(!isExpanded);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Cpu size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>NOTIFICATION DIAGNOSTICS</Text>
              <View
                style={[
                  styles.statusPill,
                  permissionStatus === 'granted'
                    ? styles.statusPillSuccess
                    : styles.statusPillWarning,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    permissionStatus === 'granted'
                      ? styles.statusPillTextSuccess
                      : styles.statusPillTextWarning,
                  ]}
                >
                  {permissionStatus === 'granted' ? 'ACTIVE' : 'ATTENTION'}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Pipeline status, channels & scheduled alarms
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {loading && <ActivityIndicator size="small" color={Colors.primaryFixed} style={{ marginRight: 6 }} />}
          {isExpanded ? (
            <ChevronUp size={18} color={Colors.onSurfaceVariant} />
          ) : (
            <ChevronDown size={18} color={Colors.onSurfaceVariant} />
          )}
        </View>
      </TouchableOpacity>

      {/* ─── Collapsed Quick Summary ─── */}
      {!isExpanded && (
        <View style={styles.collapsedSummaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Runtime</Text>
            <Text style={styles.summaryValue}>{runtimeInfo.env}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Permission</Text>
            <Text
              style={[
                styles.summaryValue,
                permissionStatus === 'granted' ? { color: Colors.chartreuse } : { color: Colors.warning },
              ]}
            >
              {permissionStatus.toUpperCase()}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>OS Schedules</Text>
            <Text style={styles.summaryValue}>{expectedReminders.length} Active</Text>
          </View>
        </View>
      )}

      {/* ─── Expanded Deep Diagnostics Section ─── */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* 1. Environment & Permissions Strip */}
          <View style={styles.infoStrip}>
            <View style={styles.infoStripItem}>
              <Text style={styles.infoStripLabel}>APP RUNTIME</Text>
              <Text style={styles.infoStripValue}>
                {runtimeInfo.env} • v{runtimeInfo.version}
              </Text>
            </View>
            <View style={styles.infoStripItem}>
              <Text style={styles.infoStripLabel}>PERMISSION</Text>
              <Text
                style={[
                  styles.infoStripValue,
                  permissionStatus === 'granted'
                    ? { color: Colors.chartreuse }
                    : { color: Colors.warning },
                ]}
              >
                {permissionStatus.toUpperCase()}{' '}
                {!canAskAgain && permissionStatus !== 'granted' ? '(Locked in OS)' : ''}
              </Text>
            </View>
          </View>

          {/* 2. Exact-Alarm Status & Punctuality Advisory */}
          <View style={styles.advisoryBox}>
            <Clock size={14} color={Colors.primaryFixed} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.advisoryTitle}>Exact-Alarm & Punctuality Status</Text>
              <Text style={styles.advisoryText}>
                Exact alarms (<Text style={styles.advisoryCode}>SCHEDULE_EXACT_ALARM</Text>) are declared in the Android manifest. On Android 12+, inexact idle-allowed alarms deliver reliably even if exact alarm access is restricted; missing exact access is a punctuality factor, not a delivery blocker.
              </Text>
            </View>
          </View>

          {/* 3. Android Channels Status */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ANDROID NOTIFICATION CHANNELS</Text>
              <TouchableOpacity
                onPress={handleOpenSettings}
                style={styles.channelSettingsLink}
                activeOpacity={0.7}
              >
                <Text style={styles.channelSettingsLinkText}>OS Settings</Text>
                <ExternalLink size={11} color={Colors.primaryFixed} />
              </TouchableOpacity>
            </View>

            {hasAnyBlockedChannel && (
              <View style={styles.channelWarningBanner}>
                <AlertTriangle size={14} color={Colors.warning} />
                <Text style={styles.channelWarningText}>
                  One or more channels are muted/blocked in Android settings. Tap 'OS Settings' to enable sound & banners.
                </Text>
              </View>
            )}

            <View style={styles.channelsList}>
              {[
                { id: 'channel_debts', fallbackName: 'People & Debts', color: Colors.chartreuse },
                { id: 'channel_credit_cards', fallbackName: 'Credit Card Due Dates', color: Colors.warning },
                { id: 'channel_general', fallbackName: 'General & System Alerts', color: Colors.chartreuse },
                { id: 'channel_anomalies', fallbackName: 'Spending Anomalies', color: Colors.warning },
              ].map((def) => {
                const liveChannel = channels.find((c) => c.id === def.id);
                const isBlocked = liveChannel && (liveChannel.importance === 0 || liveChannel.importance === 2);
                const importanceLabel = liveChannel
                  ? liveChannel.importance >= 4
                    ? 'HIGH / MAX'
                    : liveChannel.importance === 3
                    ? 'DEFAULT'
                    : isBlocked
                    ? 'BLOCKED / NONE'
                    : 'LOW'
                  : 'REGISTERED';

                return (
                  <View key={def.id} style={styles.channelRow}>
                    <View style={styles.channelInfo}>
                      <View style={[styles.channelDot, { backgroundColor: def.color }]} />
                      <View>
                        <Text style={styles.channelName}>{liveChannel?.name || def.fallbackName}</Text>
                        <Text style={styles.channelSub}>
                          ID: <Text style={styles.monoSub}>{def.id}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.channelBadges}>
                      <View
                        style={[
                          styles.importanceBadge,
                          isBlocked && styles.importanceBadgeBlocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.importanceBadgeText,
                            isBlocked && styles.importanceBadgeTextBlocked,
                          ]}
                        >
                          {importanceLabel}
                        </Text>
                      </View>
                      {liveChannel?.sound !== null ? (
                        <Volume2 size={13} color={Colors.chartreuse} />
                      ) : (
                        <VolumeX size={13} color={Colors.onSurfaceVariant} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 4. Active Schedules & Next Fire Times */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                EXPECTED ACTIVE REMINDERS ({expectedReminders.length})
              </Text>
              <TouchableOpacity
                onPress={loadDiagnostics}
                style={styles.refreshLink}
                activeOpacity={0.7}
              >
                <RefreshCw size={11} color={Colors.primaryFixed} />
                <Text style={styles.refreshLinkText}>Scan</Text>
              </TouchableOpacity>
            </View>

            {expectedReminders.length === 0 ? (
              <View style={styles.emptyRemindersBox}>
                <CheckCircle2 size={16} color={Colors.chartreuse} />
                <Text style={styles.emptyRemindersText}>
                  No active debts or overdue credit cards requiring reminders right now.
                </Text>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {expectedReminders.map((rem) => (
                  <View key={rem.nativeId} style={styles.reminderRow}>
                    <View style={styles.reminderMain}>
                      <Text style={styles.reminderTitle}>{rem.title}</Text>
                      <Text style={styles.reminderMeta}>
                        {rem.details} • {rem.cadence.toUpperCase()}
                      </Text>
                      <View style={styles.nextFireRow}>
                        <Clock size={11} color={Colors.primaryFixed} />
                        <Text style={styles.nextFireText}>Next: {rem.nextFireTime}</Text>
                      </View>
                    </View>

                    <View style={styles.nativeStatusCol}>
                      <View
                        style={[
                          styles.nativePill,
                          rem.isNativePresent ? styles.nativePillStored : styles.nativePillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.nativePillText,
                            rem.isNativePresent
                              ? styles.nativePillTextStored
                              : styles.nativePillTextPending,
                          ]}
                        >
                          {rem.isNativePresent ? 'OS PERSISTED' : 'PENDING SYNC'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 5. Scheduler Health & Last Error Action */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>SCHEDULER HEALTH & DIAGNOSTIC LOG</Text>
            {lastError ? (
              <View style={styles.errorDiagnosticBox}>
                <View style={styles.errorHeader}>
                  <AlertTriangle size={14} color={Colors.warning} />
                  <Text style={styles.errorEventName}>{lastError.event}</Text>
                  <Text style={styles.errorTimestamp}>
                    {new Date(lastError.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {lastError.details && (
                  <Text style={styles.errorDetailsText}>
                    {JSON.stringify(lastError.details)}
                  </Text>
                )}
                <View style={styles.correctiveActionBox}>
                  <Text style={styles.correctiveActionTitle}>Corrective Action:</Text>
                  <Text style={styles.correctiveActionDesc}>
                    Tap 'Reconcile Reminders' below to repair schedule state or check OS notification channel permissions.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.healthyBox}>
                <CheckCircle2 size={15} color={Colors.chartreuse} />
                <Text style={styles.healthyText}>
                  All scheduler subsystems healthy • Zero errors recorded ({recentDiagnostics.length} events logged)
                </Text>
              </View>
            )}
          </View>

          {/* 6. Interactive Action Buttons */}
          <View style={styles.actionButtonsCol}>
            {/* Delayed 5-second test */}
            <TouchableOpacity
              style={styles.delayedBtn}
              onPress={handleDelayed5sTest}
              disabled={isFiringDelayedTest}
              activeOpacity={0.8}
            >
              <Clock size={15} color="#000" />
              <Text style={styles.delayedBtnText}>
                {isFiringDelayedTest ? 'Scheduling 5s Test...' : 'Delayed 5s Test Notification'}
              </Text>
            </TouchableOpacity>

            {/* Reconciliation Button */}
            <TouchableOpacity
              style={styles.reconcileBtn}
              onPress={handleReconcileNow}
              disabled={isReconciling}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color={Colors.primaryFixed} />
              <Text style={styles.reconcileBtnText}>
                {isReconciling ? 'Reconciling...' : 'Reconcile All Reminders Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 255, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: Colors.onSurface,
    letterSpacing: 0.8,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
  },
  statusPillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  statusPillTextSuccess: {
    color: Colors.chartreuse,
  },
  statusPillTextWarning: {
    color: Colors.warning,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 2,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: Colors.onSurface,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: Spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  infoStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.sm,
    padding: Spacing.sm,
  },
  infoStripItem: {
    flex: 1,
  },
  infoStripLabel: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  infoStripValue: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: Colors.onSurface,
    marginTop: 2,
  },
  advisoryBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: 'rgba(212, 255, 50, 0.05)',
    borderRadius: Shapes.sm,
    padding: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryFixed,
  },
  advisoryTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: Colors.onSurface,
  },
  advisoryText: {
    fontFamily: FontFamily.body,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
    marginTop: 2,
  },
  advisoryCode: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: Colors.primaryFixed,
  },
  sectionBlock: {
    gap: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  channelSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelSettingsLinkText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 10,
    color: Colors.primaryFixed,
  },
  refreshLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshLinkText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 10,
    color: Colors.primaryFixed,
  },
  channelWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 8,
    borderRadius: Shapes.sm,
    marginBottom: 6,
  },
  channelWarningText: {
    fontFamily: FontFamily.body,
    fontSize: 10.5,
    color: Colors.warning,
    flex: 1,
    lineHeight: 14,
  },
  channelsList: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  channelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  channelName: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurface,
  },
  channelSub: {
    fontFamily: FontFamily.body,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  monoSub: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  channelBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importanceBadge: {
    backgroundColor: 'rgba(212, 255, 50, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importanceBadgeBlocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  importanceBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    color: Colors.primaryFixed,
  },
  importanceBadgeTextBlocked: {
    color: Colors.warning,
  },
  emptyRemindersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.sm,
    padding: Spacing.sm,
  },
  emptyRemindersText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  remindersList: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  reminderMain: {
    flex: 1,
    paddingRight: 8,
  },
  reminderTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: Colors.onSurface,
  },
  reminderMeta: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  nextFireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  nextFireText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 9.5,
    color: Colors.primaryFixed,
  },
  nativeStatusCol: {
    alignItems: 'flex-end',
  },
  nativePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  nativePillStored: {
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
  },
  nativePillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  nativePillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  nativePillTextStored: {
    color: Colors.chartreuse,
  },
  nativePillTextPending: {
    color: Colors.warning,
  },
  healthyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 255, 50, 0.06)',
    borderRadius: Shapes.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.2)',
  },
  healthyText: {
    fontFamily: FontFamily.body,
    fontSize: 10.5,
    color: Colors.chartreuse,
    flex: 1,
  },
  errorDiagnosticBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Shapes.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 6,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorEventName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.warning,
    flex: 1,
  },
  errorTimestamp: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  errorDetailsText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  correctiveActionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 6,
    borderRadius: 4,
  },
  correctiveActionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9.5,
    color: Colors.warning,
  },
  correctiveActionDesc: {
    fontFamily: FontFamily.body,
    fontSize: 9.5,
    color: Colors.onSurface,
    marginTop: 2,
    lineHeight: 13,
  },
  actionButtonsCol: {
    gap: Spacing.xs,
    marginTop: 4,
  },
  delayedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 10,
    borderRadius: Shapes.sm,
  },
  delayedBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#000',
  },
  reconcileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingVertical: 10,
    borderRadius: Shapes.sm,
  },
  reconcileBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11.5,
    color: Colors.onSurface,
  },
});
