/**
 * MyWallet — Settings & Preferences Screen
 * 
 * Comprehensive management screen with 4 segmented sections:
 * 1. PREFERENCES: Theme appearance, currency format, cycle reset day, haptics
 * 2. PROFILE: Name customization, avatar badges, lifetime wallet stats
 * 3. SECURITY: 4-digit PIN lock, biometrics, auto-lock timeout, test lock
 * 4. DATA & CLOUD: JSON export/import, Google Drive snapshot, double-confirmed database reset
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  DevSettings,
  NativeModules,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Moon,
  Sun,
  Smartphone,
  Coins,
  Calendar,
  Sparkles,
  ShieldCheck,
  Database,
  Cloud,
  Trash2,
  User,
  ChevronRight,
  Check,
  Vibrate,
  Activity,
  RotateCcw,
  Bell,
  BellRing,
} from 'lucide-react-native';

import {
  SettingsRepository,
  BackupRepository,
  TransactionRepository,
} from '@/repositories';
import { NotificationService } from '@/services';
import { WidgetPreviewCard } from '@/components/widget';
import { useFinancialStore } from '@/stores';
import {
  ProfileEditorModal,
  BackupExportModal,
  ResetConfirmModal,
} from '@/components/settings';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

type SettingsTab = 'preferences' | 'profile' | 'backup';

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const CYCLE_DAYS = [1, 5, 10, 15, 20, 25];

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string }>();

  const {
    userName,
    avatarBadge,
    currency,
    themeMode,
    setCurrency,
    setThemeMode,
    accounts,
    creditCards,
    recentTransactions,
  } = useFinancialStore();

  // Active section tab
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (params.section === 'profile') return 'profile';
    if (params.section === 'backup' || params.section === 'data') return 'backup';
    return 'preferences';
  });

  // Sync section param changes
  useEffect(() => {
    if (params.section === 'profile') setActiveTab('profile');
    else if (params.section === 'backup' || params.section === 'data') setActiveTab('backup');
    else if (params.section === 'preferences') setActiveTab('preferences');
  }, [params.section]);

  // Local settings state
  const [cycleResetDay, setCycleResetDay] = useState<number>(() =>
    SettingsRepository.getCycleResetDay()
  );
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() =>
    SettingsRepository.getHapticsEnabled()
  );

  const totalTransactionsCount = useMemo(() => {
    try {
      return TransactionRepository.getTotalCount();
    } catch {
      return 0;
    }
  }, [recentTransactions]);

  // Notification state (Phase 16)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    SettingsRepository.getNotificationsEnabled()
  );
  const [debtRemindersEnabled, setDebtRemindersEnabled] = useState<boolean>(() =>
    SettingsRepository.getDebtRemindersEnabled()
  );
  const [cardRemindersEnabled, setCardRemindersEnabled] = useState<boolean>(() =>
    SettingsRepository.getCardRemindersEnabled()
  );
  const [reminderTime, setReminderTime] = useState<string>(() =>
    SettingsRepository.getPreferredReminderTime()
  );

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Storage stats for Data tab
  const storageStats = useMemo(() => BackupRepository.getStorageStats(), [backupModalVisible, resetModalVisible]);
  const cloudStatus = useMemo(() => BackupRepository.getGoogleDriveStatus(), [backupModalVisible]);

  // Preferences Handlers
  const handleSelectTheme = (mode: 'dark' | 'light' | 'system') => {
    Haptics.selectionAsync();
    setThemeMode(mode);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('mywallet_theme_mode', mode);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
      }, 100);
    } else {
      // Native Android / iOS: Save to SharedPreferences and restart smoothly
      try {
        if (NativeModules.AppTheme?.setTheme) {
          NativeModules.AppTheme.setTheme(mode);
        }
      } catch (e) {
        console.warn('Could not set native theme:', e);
      }

      setTimeout(() => {
        try {
          if (NativeModules.AppTheme?.restartApp) {
            NativeModules.AppTheme.restartApp();
          } else if (__DEV__ && DevSettings?.reload) {
            DevSettings.reload();
          }
        } catch (e) {
          console.warn('Could not restart app:', e);
        }
      }, 150);
    }
  };

  const handleSelectCurrency = (code: string) => {
    Haptics.selectionAsync();
    setCurrency(code);
  };

  const handleSelectCycleDay = (day: number) => {
    Haptics.selectionAsync();
    setCycleResetDay(day);
    SettingsRepository.setCycleResetDay(day);
  };

  const handleToggleHaptics = (val: boolean) => {
    setHapticsEnabled(val);
    SettingsRepository.setHapticsEnabled(val);
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleNotifications = async (val: boolean) => {
    Haptics.selectionAsync();
    setNotificationsEnabled(val);
    SettingsRepository.setNotificationsEnabled(val);
    if (val) {
      await NotificationService.initialize();
      await NotificationService.syncAllReminders();
    } else {
      await NotificationService.cancelAll();
    }
  };

  const handleToggleDebtReminders = (val: boolean) => {
    Haptics.selectionAsync();
    setDebtRemindersEnabled(val);
    SettingsRepository.setDebtRemindersEnabled(val);
    NotificationService.syncAllReminders().catch(() => {});
  };

  const handleToggleCardReminders = (val: boolean) => {
    Haptics.selectionAsync();
    setCardRemindersEnabled(val);
    SettingsRepository.setCardRemindersEnabled(val);
    NotificationService.syncAllReminders().catch(() => {});
  };

  const handleSelectReminderTime = async (time: string) => {
    Haptics.selectionAsync();
    setReminderTime(time);
    SettingsRepository.setPreferredReminderTime(time);
    await NotificationService.cancelAll();
    NotificationService.syncAllReminders().catch(() => {});
  };

  const handleSendTestNotification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSendingTest(true);
    try {
      const success = await NotificationService.sendTestNotification();
      if (success) {
        Alert.alert(
          'Notification Sent! ⚡',
          'Check your status bar and lock screen for the MyWallet alert.'
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Could not send notification. Please enable notifications for MyWallet in your phone settings.'
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to send test notification.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ─── Top Header Bar ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.topBarTitles}>
          <Text style={styles.topBarTitle}>Settings & Preferences</Text>
          <Text style={styles.topBarSub}>Ledger config, profile & data</Text>
        </View>
      </View>

      {/* ─── 3-Segmented Section Tabs ─── */}
      <View style={styles.tabsRow}>
        {(
          [
            { id: 'preferences', label: 'PREFERENCES' },
            { id: 'profile', label: 'PROFILE' },
            { id: 'backup', label: 'DATA & CLOUD' },
          ] as Array<{ id: SettingsTab; label: string }>
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Scrollable Body Content ─── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════ SECTION 1: PREFERENCES ═════════ */}
        {activeTab === 'preferences' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Theme Mode Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Moon size={16} color={Colors.primaryFixed} />
                <Text style={styles.cardHeaderTitle}>THEME APPEARANCE</Text>
              </View>
              <Text style={styles.cardDesc}>
                Zenith Obsidian dark palette tailored for AMOLED displays.
              </Text>

              <View style={styles.themeOptionsRow}>
                {[
                  { mode: 'dark' as const, label: 'Dark', icon: Moon },
                  { mode: 'light' as const, label: 'Light', icon: Sun },
                  { mode: 'system' as const, label: 'System', icon: Smartphone },
                ].map((item) => {
                  const isSelected = themeMode === item.mode;
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.mode}
                      style={[
                        styles.themeOptionPill,
                        isSelected && styles.themeOptionPillActive,
                      ]}
                      onPress={() => handleSelectTheme(item.mode)}
                      activeOpacity={0.7}
                    >
                      <IconComp
                        size={16}
                        color={isSelected ? Colors.onPrimary : Colors.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          isSelected && styles.themeOptionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Currency Format Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Coins size={16} color={Colors.chartreuse} />
                <Text style={styles.cardHeaderTitle}>CURRENCY DISPLAY</Text>
              </View>
              <Text style={styles.cardDesc}>
                Active symbol used across ledger balances and metrics.
              </Text>

              <View style={styles.currencyGrid}>
                {CURRENCY_OPTIONS.map((c) => {
                  const isSelected = currency === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.currencyPill,
                        isSelected && styles.currencyPillActive,
                      ]}
                      onPress={() => handleSelectCurrency(c.code)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.currencySymbolText,
                          isSelected && { color: Colors.onPrimary },
                        ]}
                      >
                        {c.symbol}
                      </Text>
                      <Text
                        style={[
                          styles.currencyLabelText,
                          isSelected && { color: Colors.onPrimary },
                        ]}
                      >
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Financial Cycle Reset Day */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Calendar size={16} color={Colors.secondaryFixed} />
                <Text style={styles.cardHeaderTitle}>FINANCIAL CYCLE RESET DAY</Text>
              </View>
              <Text style={styles.cardDesc}>
                Controls monthly pacing calculation and spending cycle reset.
              </Text>

              <View style={styles.cycleDaysRow}>
                {CYCLE_DAYS.map((day) => {
                  const isSelected = cycleResetDay === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.cycleDayBtn,
                        isSelected && styles.cycleDayBtnActive,
                      ]}
                      onPress={() => handleSelectCycleDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.cycleDayText,
                          isSelected && styles.cycleDayTextActive,
                        ]}
                      >
                        {day}
                        {day === 1 ? 'st' : 'th'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Haptics Switch */}
            <View style={styles.sectionCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchMeta}>
                  <View style={styles.cardHeader}>
                    <Vibrate size={16} color={Colors.primaryFixed} />
                    <Text style={styles.cardHeaderTitle}>HAPTIC TOUCH FEEDBACK</Text>
                  </View>
                  <Text style={styles.cardDesc}>
                    Tactile vibrations for keypad entry and navigation.
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primaryContainer }}
                  thumbColor={hapticsEnabled ? Colors.primaryFixed : Colors.onSurfaceVariant}
                />
              </View>
            </View>

            {/* Notifications & Reminders (Phase 16) */}
            <View style={styles.sectionCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchMeta}>
                  <View style={styles.cardHeader}>
                    <Bell size={16} color={Colors.primaryFixed} />
                    <Text style={styles.cardHeaderTitle}>LOCAL NOTIFICATIONS & ALERTS</Text>
                  </View>
                  <Text style={styles.cardDesc}>
                    100% offline, privacy-safe reminders for dues and credit schedules.
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primaryContainer }}
                  thumbColor={notificationsEnabled ? Colors.primaryFixed : Colors.onSurfaceVariant}
                />
              </View>

              {notificationsEnabled && (
                <View style={{ marginTop: 12, gap: 12 }}>
                  {/* Debt Reminders Toggle */}
                  <View style={styles.subSwitchRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.subSwitchTitle}>People & Debts Reminders</Text>
                      <Text style={styles.subSwitchDesc}>Alerts to collect from or return money to contacts</Text>
                    </View>
                    <Switch
                      value={debtRemindersEnabled}
                      onValueChange={handleToggleDebtReminders}
                      trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primaryContainer }}
                      thumbColor={debtRemindersEnabled ? Colors.primaryFixed : Colors.onSurfaceVariant}
                    />
                  </View>

                  {/* Credit Card Dues Toggle */}
                  <View style={styles.subSwitchRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.subSwitchTitle}>Credit Card Payment Alerts</Text>
                      <Text style={styles.subSwitchDesc}>Statement generation, grace period & due date urgency</Text>
                    </View>
                    <Switch
                      value={cardRemindersEnabled}
                      onValueChange={handleToggleCardReminders}
                      trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primaryContainer }}
                      thumbColor={cardRemindersEnabled ? Colors.primaryFixed : Colors.onSurfaceVariant}
                    />
                  </View>

                  {/* Preferred Reminder Time */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.cardHeaderTitle, { fontSize: 10, marginBottom: 8 }]}>PREFERRED REMINDER TIME</Text>
                    <View style={styles.timeChipsRow}>
                      {[
                        { time: '08:00', label: '8:00 AM' },
                        { time: '09:00', label: '9:00 AM' },
                        { time: '12:00', label: '12:00 PM' },
                        { time: '18:00', label: '6:00 PM' },
                        { time: '20:00', label: '8:00 PM' },
                      ].map((item) => {
                        const isSelected = reminderTime === item.time;
                        return (
                          <TouchableOpacity
                            key={item.time}
                            style={[styles.timeChip, isSelected && styles.timeChipActive]}
                            onPress={() => handleSelectReminderTime(item.time)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Immediate Test Notification Button */}
                  <TouchableOpacity
                    style={styles.testNotificationBtn}
                    onPress={handleSendTestNotification}
                    disabled={isSendingTest}
                    activeOpacity={0.7}
                  >
                    <BellRing size={16} color={Colors.primaryFixed} />
                    <Text style={styles.testNotificationBtnText}>
                      {isSendingTest ? 'Firing Notification...' : 'Send Test Notification Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Android Home Screen Widget (Phase 18) */}
            <WidgetPreviewCard />
          </Animated.View>
        )}

        {/* ═════════ SECTION 2: PROFILE ═════════ */}
        {activeTab === 'profile' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* User Profile Overview */}
            <View style={styles.profileCard}>
              <View style={styles.avatarBigBox}>
                <Text style={styles.avatarBigEmoji}>{avatarBadge || '🚀'}</Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileSubtitle}>Zenith Wallet Owner</Text>
                <View style={styles.localBadge}>
                  <ShieldCheck size={11} color={Colors.primaryFixed} />
                  <Text style={styles.localBadgeText}>LOCAL PROFILE • ENCRYPTED</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setProfileModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.editProfileBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Lifetime Metrics */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Activity size={16} color={Colors.primaryFixed} />
                <Text style={styles.cardHeaderTitle}>LIFETIME METRICS</Text>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{accounts.length}</Text>
                  <Text style={styles.metricLabel}>Accounts</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{creditCards.length}</Text>
                  <Text style={styles.metricLabel}>Cards</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{totalTransactionsCount}</Text>
                  <Text style={styles.metricLabel}>Transactions</Text>
                </View>
              </View>
            </View>

            {/* Privacy & Sovereignty Commitment */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <ShieldCheck size={16} color={Colors.chartreuse} />
                <Text style={[styles.cardHeaderTitle, { color: Colors.chartreuse }]}>
                  ZERO-TELEMETRY GUARANTEE
                </Text>
              </View>
              <Text style={styles.privacyText}>
                • All database records stay on your local storage.{'\n'}
                • No cloud trackers, analytics SDKs, or remote accounts.{'\n'}
                • Your profile name and avatar badge are saved strictly in on-device SQLite.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ═════════ SECTION 3: DATA & CLOUD ═════════ */}
        {activeTab === 'backup' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Storage Stats Banner */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Database size={16} color={Colors.primaryFixed} />
                <Text style={styles.cardHeaderTitle}>LOCAL DATABASE STATUS</Text>
              </View>
              <Text style={styles.cardDesc}>
                All financial data is stored locally in SQLite ({storageStats.estimatedSizeKb} KB).
              </Text>

              <View style={styles.storageGrid}>
                <View style={styles.storageCell}>
                  <Text style={styles.storageCellNum}>{storageStats.totalTransactions}</Text>
                  <Text style={styles.storageCellLbl}>Transactions</Text>
                </View>
                <View style={styles.storageCell}>
                  <Text style={styles.storageCellNum}>{storageStats.totalAccounts}</Text>
                  <Text style={styles.storageCellLbl}>Accounts</Text>
                </View>
                <View style={styles.storageCell}>
                  <Text style={styles.storageCellNum}>{storageStats.totalCards}</Text>
                  <Text style={styles.storageCellLbl}>Cards</Text>
                </View>
                <View style={styles.storageCell}>
                  <Text style={styles.storageCellNum}>{storageStats.totalDebts}</Text>
                  <Text style={styles.storageCellLbl}>Debts</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBackupModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Database size={16} color={Colors.surface} />
                <Text style={styles.actionBtnPrimaryText}>Export / Restore Data</Text>
              </TouchableOpacity>
            </View>

            {/* Google Drive Cloud Snapshot */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Cloud size={16} color={Colors.transfer} />
                <Text style={[styles.cardHeaderTitle, { color: Colors.transfer }]}>
                  GOOGLE DRIVE CLOUD SNAPSHOT
                </Text>
              </View>
              <Text style={styles.cardDesc}>
                Backup and migrate ledger seamlessly when changing devices.
              </Text>
              <View style={styles.cloudInfoRow}>
                <Text style={styles.cloudStatusText}>
                  {cloudStatus.lastSyncDate
                    ? `Last Snapshot: ${new Date(cloudStatus.lastSyncDate).toLocaleDateString()}`
                    : 'No snapshot recorded yet'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cloudActionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBackupModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cloudActionBtnText}>Manage Cloud Snapshots</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone: Database Reset */}
            <View style={[styles.sectionCard, styles.dangerCard]}>
              <View style={styles.cardHeader}>
                <Trash2 size={16} color={Colors.error} />
                <Text style={[styles.cardHeaderTitle, { color: Colors.error }]}>
                  DANGER ZONE
                </Text>
              </View>
              <Text style={styles.cardDesc}>
                Double-confirmed ledger wipe. Allows restoring sample seed data or clearing all balances.
              </Text>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setResetModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={Colors.error} />
                <Text style={styles.resetBtnText}>Reset & Wipe Database</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Modals ─── */}
      <ProfileEditorModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <BackupExportModal
        visible={backupModalVisible}
        onClose={() => setBackupModalVisible(false)}
      />

      <ResetConfirmModal
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitles: {
    flex: 1,
  },
  topBarTitle: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  topBarSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Shapes.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  tabText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: Colors.primaryFixed,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: Spacing.md,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Shapes.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  themeOptionPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  themeOptionText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
  },
  themeOptionTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Shapes.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  currencyPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  currencySymbolText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
    color: Colors.onSurface,
  },
  currencyLabelText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    marginTop: 2,
  },
  cycleDaysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cycleDayBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  cycleDayBtnActive: {
    backgroundColor: Colors.secondaryFixed,
    borderColor: Colors.secondaryFixed,
  },
  cycleDayText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurface,
  },
  cycleDayTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchMeta: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginBottom: Spacing.md,
    gap: 12,
  },
  avatarBigBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1.5,
    borderColor: `${Colors.primaryFixed}60`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigEmoji: {
    fontSize: 26,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  localBadgeText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 9,
    color: Colors.primaryFixed,
    letterSpacing: 0.5,
  },
  editProfileBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  editProfileBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 20,
    color: Colors.onSurface,
  },
  metricLabel: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.strokeSubtle,
  },
  privacyText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  storageGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: 10,
    marginBottom: Spacing.md,
  },
  storageCell: {
    flex: 1,
    alignItems: 'center',
  },
  storageCellNum: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  storageCellLbl: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: Colors.primaryFixed,
    borderRadius: Shapes.lg,
  },
  actionBtnPrimaryText: {
    ...Typography.bodySmMedium,
    fontWeight: '700',
    color: Colors.surface,
  },
  cloudInfoRow: {
    marginBottom: Spacing.md,
  },
  cloudStatusText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.transfer,
  },
  cloudActionBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  cloudActionBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.transfer,
    fontWeight: '700',
  },
  dangerCard: {
    borderColor: `${Colors.error}40`,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: `${Colors.error}15`,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  resetBtnText: {
    ...Typography.bodySmMedium,
    fontWeight: '700',
    color: Colors.error,
  },

  // Notification Styles (Phase 16)
  subSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
    paddingTop: 8,
  },
  subSwitchTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 13,
  },
  subSwitchDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  timeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  timeChipActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  timeChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timeChipTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.35)',
  },
  testNotificationBtnText: {
    ...Typography.bodySmMedium,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryFixed,
    letterSpacing: 0.5,
  },
});
