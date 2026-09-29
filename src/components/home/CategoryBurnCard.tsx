/**
 * MyWallet — Category Burn Dashboard Card
 * 
 * Displays SVG Segmented Donut and Category Spend Chips.
 * Feature 15: Extracted for modular dashboard arrangement.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { CategoryDonut } from '@/components/ui/CategoryDonut';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';

interface CategoryBurnCardProps {
  onNavigateAnalytics?: (tab: string) => void;
}

export function CategoryBurnCard({ onNavigateAnalytics }: CategoryBurnCardProps) {
  const router = useRouter();
  const { categorySpends, monthlyTotals } = useFinancialStore();

  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  }, []);

  const handleHeaderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onNavigateAnalytics) {
      onNavigateAnalytics('overview');
    } else {
      router.push({ pathname: '/analytics' as any, params: { tab: 'overview' } });
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={handleHeaderPress}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>Category Burn</Text>
        <View style={styles.headerRight}>
          <Text style={styles.cardSubtextRight}>{monthLabel}</Text>
          <Text style={styles.linkText}>View &gt;</Text>
        </View>
      </TouchableOpacity>

      {/* SVG Segmented Donut */}
      <CategoryDonut
        categories={categorySpends}
        totalSpend={monthlyTotals.expense}
        size={180}
        strokeWidth={22}
      />

      {/* Category Chips Grid */}
      {categorySpends.length === 0 ? (
        <View style={styles.emptyDonutBox}>
          <Text style={styles.emptyDonutText}>
            No category expenses logged this month
          </Text>
        </View>
      ) : (
        <View style={styles.categoryPills}>
          {categorySpends.slice(0, 6).map((cat) => (
            <View key={cat.categoryId} style={styles.categoryPill}>
              <View style={[styles.categoryDot, { backgroundColor: cat.categoryColor }]} />
              <Text style={styles.categoryPillText} numberOfLines={1}>
                {cat.categoryName.split(' ')[0]} {cat.percentage}%
              </Text>
              <Text style={styles.categoryPillAmount}>
                ₹{cat.total.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSubtextRight: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  linkText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 12,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryPillText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
  },
  categoryPillAmount: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  emptyDonutBox: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDonutText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
