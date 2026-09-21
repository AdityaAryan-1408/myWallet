/**
 * MyWallet — Budget Filter Pills
 * 
 * Matches media_1789928829209.png mockup:
 * - ALL <count> | • HEALTHY | • CAUTION | • EXCEEDED
 * - Active chartreuse pill indicator
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';

export type BudgetFilterType = 'ALL' | 'HEALTHY' | 'CAUTION' | 'EXCEEDED';

interface BudgetFilterPillsProps {
  activeFilter: BudgetFilterType;
  onSelectFilter: (filter: BudgetFilterType) => void;
  totalCount: number;
}

export function BudgetFilterPills({
  activeFilter,
  onSelectFilter,
  totalCount,
}: BudgetFilterPillsProps) {
  const filters: Array<{ type: BudgetFilterType; label: string; dotColor?: string }> = [
    { type: 'ALL', label: `ALL ${totalCount}` },
    { type: 'HEALTHY', label: 'HEALTHY', dotColor: Colors.income },
    { type: 'CAUTION', label: 'CAUTION', dotColor: '#FFD93D' },
    { type: 'EXCEEDED', label: 'EXCEEDED', dotColor: Colors.expense },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.container}>
      {filters.map((item) => {
        const isActive = activeFilter === item.type;
        return (
          <TouchableOpacity
            key={item.type}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelectFilter(item.type)}
            activeOpacity={0.7}
          >
            {item.dotColor && (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isActive ? Colors.onPrimary : item.dotColor },
                ]}
              />
            )}
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    backgroundColor: 'transparent',
    gap: 5,
  },
  pillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: FontFamily.headingSemiBold,
  },
  pillTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
