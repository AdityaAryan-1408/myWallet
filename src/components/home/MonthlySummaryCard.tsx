/**
 * MyWallet — Monthly Summary Dashboard Card
 * 
 * Displays Income, Expenses, and Net Saved metrics with rolling numbers.
 * Feature 15: Extracted for modular dashboard arrangement.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';

interface MonthlySummaryCardProps {
  onNavigateTab?: (index: number) => void;
}

export function MonthlySummaryCard({ onNavigateTab }: MonthlySummaryCardProps) {
  const { monthlyTotals, categorySpends } = useFinancialStore();

  const handlePress = () => {
    if (onNavigateTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onNavigateTab(1); // Jump to Activity tab
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.summaryRow}
    >
      <View style={styles.summaryTile}>
        <View style={styles.tileHeader}>
          <TrendingUp size={12} color={Colors.income} />
          <Text style={styles.tileLabel}>INCOME</Text>
        </View>
        <AnimatedNumber
          value={monthlyTotals.income}
          fontSize={15}
          lineHeight={18}
          prefix="₹"
          suffix=""
          textStyle={styles.tileAmount}
        />
        <Text style={[styles.tileChange, { color: Colors.income }]}>
          {monthlyTotals.income > 0 ? 'This month' : 'No inflow'}
        </Text>
      </View>

      <View style={styles.summaryTile}>
        <View style={styles.tileHeader}>
          <TrendingDown size={12} color={Colors.expense} />
          <Text style={styles.tileLabel}>EXPENSES</Text>
        </View>
        <AnimatedNumber
          value={monthlyTotals.expense}
          fontSize={15}
          lineHeight={18}
          prefix="₹"
          suffix=""
          textStyle={{ ...styles.tileAmount, color: Colors.expense }}
        />
        <Text style={[styles.tileChange, { color: Colors.expense }]}>
          {monthlyTotals.expense > 0 ? `${categorySpends.length} categories` : '0 logs'}
        </Text>
      </View>

      <View style={styles.summaryTile}>
        <View style={styles.tileHeader}>
          <Sparkles size={12} color={Colors.secondaryFixed} />
          <Text style={styles.tileLabel}>SAVED</Text>
        </View>
        <AnimatedNumber
          value={monthlyTotals.saved}
          fontSize={15}
          lineHeight={18}
          prefix="₹"
          suffix=""
          textStyle={{ ...styles.tileAmount, color: Colors.secondaryFixed }}
        />
        <Text style={[styles.tileChange, { color: Colors.secondaryFixed }]}>
          {monthlyTotals.saved > 0 ? 'Net savings' : 'Net zero'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: 3,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  tileAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 15,
    lineHeight: 18,
    color: Colors.onSurface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tileChange: {
    ...Typography.bodySm,
    fontSize: 10,
  },
});
