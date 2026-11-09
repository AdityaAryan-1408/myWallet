/**
 * MyWallet — Streak Flame Badge (Feature B6: Gamification Layer)
 * 
 * Subtle, non-intrusive flame badge mounted on the Home Screen:
 * Displays current tracking streak (e.g. "🔥 7d Streak")
 * Tapping opens the Milestones & Achievements showcase.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { StreaksService } from '@/services/streaksService';
import { Colors, FontFamily, Typography } from '@/theme';
import { useFinancialStore } from '@/stores';

interface StreakFlameBadgeProps {
  onPress: () => void;
}

export function StreakFlameBadge({ onPress }: StreakFlameBadgeProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const recentTransactions = useFinancialStore((s) => s.recentTransactions);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  const streakDays = useMemo(() => {
    return StreaksService.getStreaksSummary().currentStreakDays;
  }, [recentTransactions]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        {
          backgroundColor: isLight ? '#FFF7ED' : 'rgba(249, 115, 22, 0.12)',
          borderColor: isLight ? 'rgba(249, 115, 22, 0.35)' : 'rgba(249, 115, 22, 0.25)',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Flame size={12} color="#F97316" />
      <Text style={[styles.badgeText, { color: isLight ? '#C2410C' : '#FDBA74' }]}>
        {streakDays}d Streak
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
