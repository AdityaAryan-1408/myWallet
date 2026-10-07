/**
 * MyWallet — Category Burn Dashboard Card
 * 
 * Displays SVG Segmented Donut and Category Spend Chips.
 * Feature 15: Extracted for modular dashboard arrangement.
 * Includes segmented toggle (Month / Today) with Month as default.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PieChart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { CategoryDonut } from '@/components/ui/CategoryDonut';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';
import { TransactionRepository } from '@/repositories';

interface CategoryBurnCardProps {
  onNavigateAnalytics?: (tab: string) => void;
}

export function CategoryBurnCard({ onNavigateAnalytics }: CategoryBurnCardProps) {
  const router = useRouter();
  const { categorySpends, monthlyTotals, recentTransactions } = useFinancialStore();

  const [activeTab, setActiveTab] = useState<'month' | 'today'>('month');

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute live spending for today from SQLite database
  const todayData = useMemo(() => {
    const spends = TransactionRepository.getCategoryDailySpend(todayStr);
    const total = TransactionRepository.getDailyExpenseTotal(todayStr);
    return { spends, total };
  }, [todayStr, monthlyTotals.expense, recentTransactions]);

  const displayedCategories = (activeTab === 'month' ? categorySpends : todayData.spends) ?? [];
  const displayedTotal = (activeTab === 'month' ? monthlyTotals.expense : todayData.total) ?? 0;
  const displayedCenterLabel = activeTab === 'month' ? "MONTH'S SPEND" : "TODAY'S SPEND";

  const handleHeaderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onNavigateAnalytics) {
      onNavigateAnalytics('overview');
    } else {
      router.push({ pathname: '/analytics' as any, params: { tab: 'overview' } });
    }
  };

  const handleTabChange = (tab: 'month' | 'today') => {
    if (activeTab === tab) return;
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.cardHeaderLeft}
          onPress={handleHeaderPress}
          activeOpacity={0.7}
        >
          <PieChart size={16} color={Colors.onSurface} />
          <Text style={styles.cardTitle}>Category Burn</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Segmented Toggle: Month | Today */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'month' && styles.tabButtonActive]}
              onPress={() => handleTabChange('month')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabButtonText, activeTab === 'month' && styles.tabButtonTextActive]}>
                Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
              onPress={() => handleTabChange('today')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabButtonText, activeTab === 'today' && styles.tabButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.7}>
            <Text style={styles.linkText}>View &gt;</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SVG Segmented Donut */}
      <CategoryDonut
        categories={displayedCategories}
        totalSpend={displayedTotal}
        size={180}
        strokeWidth={22}
        centerLabel={displayedCenterLabel}
      />

      {/* Category Chips Grid */}
      {displayedCategories.length === 0 ? (
        <View style={styles.emptyDonutBox}>
          <Text style={styles.emptyDonutText}>
            {activeTab === 'month'
              ? 'No category expenses logged this month'
              : 'No expenses logged today'}
          </Text>
        </View>
      ) : (
        <View style={styles.categoryPills}>
          {displayedCategories.slice(0, 6).map((cat) => (
            <View key={cat.categoryId || Math.random().toString()} style={styles.categoryPill}>
              <View style={[styles.categoryDot, { backgroundColor: cat.categoryColor || Colors.primaryFixed }]} />
              <Text style={styles.categoryPillText} numberOfLines={1}>
                {(cat.categoryName || 'General').split(' ')[0]} {cat.percentage ?? 0}%
              </Text>
              <Text style={styles.categoryPillAmount}>
                ₹{(cat.total ?? 0).toLocaleString('en-IN')}
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  tabButton: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  tabButtonActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  tabButtonText: {
    ...Typography.bodySmMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: Colors.onSurface,
    fontWeight: '700',
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
