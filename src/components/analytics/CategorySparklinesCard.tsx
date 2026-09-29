/**
 * MyWallet — Category Trend Sparklines Card
 * 
 * Tier 4, Feature 11: 6-Month Spending Curves per Category.
 * - Mini sparkline visualization for every active expense category.
 * - Spot climbing vs cooling categories at a glance.
 * - Tap to expand full 6-month monthly spend history with percent deltas.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { CategoryTrendItem } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface CategorySparklinesCardProps {
  trends: CategoryTrendItem[];
}

export function CategorySparklinesCard({ trends }: CategorySparklinesCardProps) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rising' | 'cooling'>('all');

  const filteredTrends = trends.filter((t) => {
    if (filter === 'rising') return t.trendDirection === 'rising';
    if (filter === 'cooling') return t.trendDirection === 'falling';
    return true;
  });

  const toggleExpand = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCatId((prev) => (prev === catId ? null : catId));
  };

  const getTrendBadge = (direction: CategoryTrendItem['trendDirection']) => {
    switch (direction) {
      case 'rising':
        return { label: 'RISING', color: Colors.expense, icon: TrendingUp };
      case 'falling':
        return { label: 'COOLING', color: Colors.income, icon: TrendingDown };
      case 'stable':
      default:
        return { label: 'STABLE', color: Colors.onSurfaceVariant, icon: Minus };
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.primaryFixed}1A` }]}>
            <Activity size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>CATEGORY TREND SPARKLINES</Text>
            <Text style={styles.headerSubtitle}>6-Month Spending Trajectories</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'rising', 'cooling'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.filterPill, filter === mode && styles.filterPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(mode);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === mode && styles.filterTextActive,
                ]}
              >
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categories List */}
      <View style={styles.categoriesList}>
        {filteredTrends.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No category trends found for filter.</Text>
          </View>
        ) : (
          filteredTrends.map((cat, idx) => {
            const isExpanded = expandedCatId === cat.categoryId;
            const badge = getTrendBadge(cat.trendDirection);
            const BadgeIcon = badge.icon;
            const maxVal = Math.max(1, cat.maxAmount);

            return (
              <View key={cat.categoryId} style={styles.categoryCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.categoryRow,
                    isExpanded && styles.categoryRowExpanded,
                  ]}
                  onPress={() => toggleExpand(cat.categoryId)}
                  activeOpacity={0.75}
                >
                  {/* Category Identity */}
                  <View style={styles.catIdentity}>
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: `${cat.categoryColor}1A` },
                      ]}
                    >
                      <CategoryIcon
                        icon={cat.categoryIcon}
                        color={cat.categoryColor}
                        size={15}
                      />
                    </View>
                    <View style={styles.nameBlock}>
                      <Text style={styles.catName} numberOfLines={1}>
                        {cat.categoryName}
                      </Text>
                      <Text style={styles.avgSpendText}>
                        Avg: ₹{cat.averageAmount.toLocaleString('en-IN')}/mo
                      </Text>
                    </View>
                  </View>

                  {/* 6-Month Sparkline Bars */}
                  <View style={styles.sparklineContainer}>
                    {cat.monthlySpends.map((m, mIdx) => {
                      const heightPct = Math.max(12, Math.round((m.amount / maxVal) * 100));
                      const isLatest = mIdx === cat.monthlySpends.length - 1;
                      return (
                        <View key={m.monthKey} style={styles.sparkCol}>
                          <View style={styles.sparkBarTrack}>
                            <View
                              style={[
                                styles.sparkBarFill,
                                {
                                  height: `${heightPct}%`,
                                  backgroundColor: isLatest ? badge.color : `${cat.categoryColor}80`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.sparkMonthLabel}>{m.monthLabel[0]}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Spend & Direction */}
                  <View style={styles.rightMeta}>
                    <Text style={styles.currentSpend}>
                      ₹{cat.currentAmount.toLocaleString('en-IN')}
                    </Text>

                    <View style={[styles.trendBadge, { backgroundColor: `${badge.color}1A` }]}>
                      <BadgeIcon size={10} color={badge.color} />
                      <Text style={[styles.trendBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Month-by-Month Breakdown */}
                {isExpanded && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.expandedDrawer}>
                    <Text style={styles.drawerTitle}>6-Month Spending Breakdown</Text>
                    <View style={styles.monthsGrid}>
                      {cat.monthlySpends.map((m, mIdx) => {
                        const prev = mIdx > 0 ? cat.monthlySpends[mIdx - 1].amount : 0;
                        const momPct = prev > 0 ? Math.round(((m.amount - prev) / prev) * 100) : 0;
                        return (
                          <View key={m.monthKey} style={styles.monthBox}>
                            <Text style={styles.monthBoxLabel}>{m.monthLabel}</Text>
                            <Text style={styles.monthBoxAmount}>
                              ₹{m.amount.toLocaleString('en-IN')}
                            </Text>
                            {mIdx > 0 ? (
                              <Text
                                style={[
                                  styles.monthBoxMom,
                                  { color: momPct > 0 ? Colors.expense : momPct < 0 ? Colors.income : Colors.onSurfaceVariant },
                                ]}
                              >
                                {momPct > 0 ? `+${momPct}%` : momPct < 0 ? `${momPct}%` : '═'}
                              </Text>
                            ) : (
                              <Text style={styles.monthBoxMom}>Base</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 3,
    borderRadius: 8,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  filterPillActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  filterText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: Colors.onSurface,
  },
  categoriesList: {
    gap: Spacing.sm,
  },
  emptyBox: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  categoryCardWrapper: {
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  categoryRowExpanded: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  catIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '38%',
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
    gap: 1,
  },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  avgSpendText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 38,
    flex: 1,
    justifyContent: 'center',
  },
  sparkCol: {
    alignItems: 'center',
    gap: 2,
    width: 12,
  },
  sparkBarTrack: {
    width: 5,
    height: 26,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 2.5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sparkBarFill: {
    width: '100%',
    borderRadius: 2.5,
  },
  sparkMonthLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 7.5,
    color: Colors.onSurfaceVariant,
  },
  rightMeta: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 70,
  },
  currentSpend: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  trendBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
  },
  expandedDrawer: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
    gap: Spacing.xs,
  },
  drawerTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  monthsGrid: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  monthBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 2,
  },
  monthBoxLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  monthBoxAmount: {
    fontFamily: FontFamily.display,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  monthBoxMom: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
});
