/**
 * MyWallet — Screen Header
 * 
 * Top bar matching the refined dashboard UI:
 * - MyWallet logo + name + wallet icon
 * - Screen subtitle (HOME DASHBOARD, ACTIVITY, etc.)
 * - Month selector pill
 * - Profile avatar
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Wallet, Calendar, ChevronDown, Bell } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shapes } from '@/theme';
import { useFinancialStore } from '@/stores';
import { CreditCard } from '@/db/schema';
import { NotificationCenterModal } from '@/components/notifications';
import { PayCardBillModal } from '@/components/cards/PayCardBillModal';

interface ScreenHeaderProps {
  subtitle: string;
  showMonthPicker?: boolean;
  monthLabel?: string;
  onMonthPress?: () => void;
  onAvatarPress?: () => void;
}

export function ScreenHeader({
  subtitle,
  showMonthPicker = true,
  monthLabel = 'Sep 2026',
  onMonthPress,
  onAvatarPress,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userName, avatarBadge, unreadNotificationsCount, creditCards } = useFinancialStore();
  const avatarInitial = userName ? userName.trim()[0]?.toUpperCase() || 'A' : 'A';

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedCardToPay, setSelectedCardToPay] = useState<CreditCard | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/settings?section=profile' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Left: Logo + App Name */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Wallet size={18} color={Colors.primaryFixed} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.appName}>MyWallet</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {/* Right: Month Picker + Notification Bell + Avatar */}
        <View style={styles.rightSection}>
          {showMonthPicker && (
            <TouchableOpacity
              style={styles.monthPill}
              activeOpacity={0.7}
              onPress={onMonthPress}
            >
              <Calendar size={13} color={Colors.onSurfaceVariant} />
              <Text style={styles.monthText}>{monthLabel}</Text>
              <ChevronDown size={13} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => setNotificationModalVisible(true)}
          >
            <Bell size={16} color={Colors.onSurface} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badgeDot}>
                {unreadNotificationsCount > 9 ? (
                  <Text style={styles.badgeText}>9+</Text>
                ) : null}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.7}
            onPress={handleAvatarPress}
          >
            <View style={styles.avatar}>
              {avatarBadge ? (
                <Text style={{ fontSize: 16 }}>{avatarBadge}</Text>
              ) : (
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Notification Center Modal */}
      <NotificationCenterModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onPayCard={(cardId) => {
          setNotificationModalVisible(false);
          const targetCard = creditCards.find((c) => c.id === cardId);
          if (targetCard) {
            setSelectedCardToPay(targetCard);
            setPayModalVisible(true);
          } else {
            router.push('/cards' as any);
          }
        }}
        onSettleDebt={() => {
          setNotificationModalVisible(false);
          router.push('/debts' as any);
        }}
      />

      {/* Direct Pay Card Bill Modal trigger */}
      {selectedCardToPay && (
        <PayCardBillModal
          visible={payModalVisible}
          card={selectedCardToPay}
          onClose={() => {
            setPayModalVisible(false);
            setSelectedCardToPay(null);
          }}
          onPaymentSuccess={() => {
            setPayModalVisible(false);
            setSelectedCardToPay(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingBottom: 12,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  logoContainer: {
    width: 34,
    height: 34,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  titleContainer: {
    gap: 1,
  },
  appName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  monthText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 6,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  avatarText: {
    ...Typography.bodyMdMedium,
    color: Colors.primaryFixed,
    fontWeight: '700',
    fontSize: 13,
  },
});
