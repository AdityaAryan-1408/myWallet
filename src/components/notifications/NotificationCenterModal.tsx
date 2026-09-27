/**
 * MyWallet — In-App Notification Center Modal
 * 
 * Sliding bottom sheet displaying active financial reminders:
 * - Debt collection / payback alerts with 1-tap Settle action
 * - Credit card statement closing & payment due date urgency alerts with 1-tap Pay action
 * - Filter pills (ALL / UNREAD)
 * - "Mark all as read" & swipe/tap dismiss
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Bell,
  BellOff,
  CreditCard as CreditCardIcon,
  Users,
  AlertTriangle,
  CheckCheck,
  Trash2,
  Calendar,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';

import { InAppNotification } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onPayCard?: (cardId: string) => void;
  onSettleDebt?: (debtId: string) => void;
}

export function NotificationCenterModal({
  visible,
  onClose,
  onPayCard,
  onSettleDebt,
}: NotificationCenterModalProps) {
  const insets = useSafeAreaInsets();
  const {
    inAppNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
  } = useFinancialStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return inAppNotifications.filter((n) => n.is_read === 0);
    }
    return inAppNotifications;
  }, [inAppNotifications, activeFilter]);

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    markAllNotificationsAsRead();
  };

  const handleDismiss = (id: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    dismissNotification(id);
  };

  const handleAction = (notification: InAppNotification) => {
    markNotificationAsRead(notification.id);
    onClose();

    if (notification.action_type === 'pay_card' && notification.entity_id) {
      onPayCard?.(notification.entity_id);
    } else if (notification.action_type === 'settle_debt' && notification.entity_id) {
      onSettleDebt?.(notification.entity_id);
    }
  };

  const getNotificationIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'debt_reminder':
        return <Users size={18} color={Colors.primaryFixed} />;
      case 'cc_overdue':
        return <ShieldAlert size={18} color="#EF4444" />;
      case 'cc_due_soon':
        return <AlertTriangle size={18} color="#F59E0B" />;
      case 'cc_statement':
        return <Calendar size={18} color={Colors.primaryFixed} />;
      case 'cc_daily_reminder':
        return <CreditCardIcon size={18} color="#38BDF8" />;
      default:
        return <Bell size={18} color={Colors.primaryFixed} />;
    }
  };

  const getAccentColor = (type: InAppNotification['type']) => {
    switch (type) {
      case 'debt_reminder':
        return Colors.primaryFixed;
      case 'cc_overdue':
        return '#EF4444';
      case 'cc_due_soon':
        return '#F59E0B';
      case 'cc_statement':
        return Colors.primaryFixed;
      case 'cc_daily_reminder':
        return '#38BDF8';
      default:
        return Colors.primaryFixed;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.bellIconBox}>
                <Bell size={18} color={Colors.primaryFixed} />
                {unreadNotificationsCount > 0 && <View style={styles.unreadDot} />}
              </View>
              <View>
                <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                <Text style={styles.headerSub}>
                  {unreadNotificationsCount > 0
                    ? `${unreadNotificationsCount} unread reminder${unreadNotificationsCount > 1 ? 's' : ''}`
                    : 'All caught up'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {unreadNotificationsCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color={Colors.primaryFixed} />
                  <Text style={styles.markAllText}>Read All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
              onPress={() => setActiveFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
                All ({inAppNotifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'unread' && styles.filterPillActive]}
              onPress={() => setActiveFilter('unread')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, activeFilter === 'unread' && styles.filterPillTextActive]}>
                Unread ({unreadNotificationsCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <BellOff size={32} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeFilter === 'unread' ? 'No Unread Alerts' : 'No Active Notifications'}
                </Text>
                <Text style={styles.emptySub}>
                  {activeFilter === 'unread'
                    ? 'All your debt reminders and credit card schedules have been reviewed.'
                    : 'You have no scheduled reminders or pending payment warnings.'}
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notification) => {
                const accent = getAccentColor(notification.type);
                const isUnread = notification.is_read === 0;

                return (
                  <View
                    key={notification.id}
                    style={[
                      styles.card,
                      isUnread && { borderColor: `${accent}40`, backgroundColor: Colors.surfaceContainer },
                    ]}
                  >
                    {/* Unread Accent Bar */}
                    {isUnread && <View style={[styles.accentBar, { backgroundColor: accent }]} />}

                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}>
                          {getNotificationIcon(notification.type)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {notification.title}
                          </Text>
                          <Text style={styles.cardTime}>
                            {new Date(notification.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => handleDismiss(notification.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={15} color={Colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cardBody}>{notification.body}</Text>

                    {/* Action Row */}
                    {notification.action_type && notification.action_type !== 'none' && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: `${accent}60`, backgroundColor: `${accent}12` }]}
                          onPress={() => handleAction(notification)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, { color: accent }]}>
                            {notification.action_type === 'pay_card'
                              ? 'Pay Card Bill'
                              : notification.action_type === 'settle_debt'
                              ? 'Settle / Record Repayment'
                              : 'View Details'}
                          </Text>
                          <ArrowRight size={14} color={accent} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    borderTopWidth: 1,
    borderColor: Colors.strokeMedium,
    maxHeight: '85%',
    ...Elevation.high,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.onSurfaceVariant,
    opacity: 0.4,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryFixed,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.chartreuseWash,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.25)',
  },
  markAllText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  filterPillActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  filterPillText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.sm,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  cardTime: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  dismissBtn: {
    padding: 6,
    borderRadius: Shapes.md,
  },
  cardBody: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.onSurfaceVariant,
    marginLeft: 44,
  },
  actionRow: {
    marginTop: 4,
    marginLeft: 44,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Shapes.lg,
    borderWidth: 1,
  },
  actionBtnText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginBottom: 4,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptySub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});
