/**
 * MyWallet — Screen Header
 * 
 * Top bar matching the refined dashboard UI:
 * - MyWallet logo + name + wallet icon
 * - Screen subtitle (HOME DASHBOARD, ACTIVITY, etc.)
 * - Month selector pill
 * - Profile avatar
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, Calendar, ChevronDown } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shapes } from '@/theme';
import { useFinancialStore } from '@/stores';

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
  const insets = useSafeAreaInsets();
  const { userName } = useFinancialStore();
  const avatarInitial = userName ? userName.trim()[0]?.toUpperCase() || 'A' : 'A';

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

        {/* Right: Month Picker + Avatar */}
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
            style={styles.avatarContainer}
            activeOpacity={0.7}
            onPress={onAvatarPress}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(16, 19, 25, 0.94)',
    paddingBottom: 12,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
