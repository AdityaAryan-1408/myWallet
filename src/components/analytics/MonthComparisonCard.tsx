/**
 * MyWallet — Month-over-Month Comparison Card
 * 
 * Phase 12: Current vs Previous Month category-by-category shift analysis
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { MonthComparisonData, CategoryComparison } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface MonthComparisonCardProps {
  data: MonthComparisonData;
}

export function MonthComparisonCard({ data }: MonthComparisonCardProps) {
  const isExpenseUp = data.expenseDelta > 0;
  const isExpenseDown = data.expenseDelta < 0;

  const formatMonthTitle = (ym: string) => {
    try {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <ArrowUpDown size={16} color={Colors.secondaryFixed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>MONTH-OVER-MONTH COMPARISON</Text>
            <Text style={styles.headerSubtitle}>
              {formatMonthTitle(data.currYearMonth)} vs. {formatMonthTitle(data.prevYearMonth)}
            </Text>
          </View>
        </View>

        {/* Delta Badge */}
        <View
          style={[
            styles.deltaPill,
            isExpenseDown ? styles.deltaPillGood : styles.deltaPillCaution,
          ]}
        >
          {isExpenseDown ? (
            <TrendingDown size={13} color={Colors.income} />
          ) : isExpenseUp ? (
            <TrendingUp size={13} color={Colors.expense} />
          ) : (
            <Minus size={13} color={Colors.onSurfaceVariant} />
          )}
          <Text
            style={[
              styles.deltaPillText,
              isExpenseDown ? styles.textGood : isExpenseUp ? styles.textCaution : styles.textNeutral,
            ]}
          >
            {isExpenseDown ? '-' : isExpenseUp ? '+' : ''}₹{Math.abs(data.expenseDelta).toLocaleString('en-IN')} (
            {data.expensePercentChange}%)
          </Text>
        </View>
      </View>

      {/* Summary Delta Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>CURRENT SPEND</Text>
          <Text style={styles.summaryVal}>₹{data.currExpense.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>PREVIOUS SPEND</Text>
          <Text style={styles.summaryVal}>₹{data.prevExpense.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>SAVED DELTA</Text>
          <Text
            style={[
              styles.summaryVal,
              data.savedDelta >= 0 ? styles.textGood : styles.textCaution,
            ]}
          >
            {data.savedDelta >= 0 ? '+' : '-'}₹{Math.abs(data.savedDelta).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Category-by-Category Shift List */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionHeader}>CATEGORY SHIFTS</Text>

        {data.categories.length === 0 ? (
          <Text style={styles.emptyText}>No comparative category expenses recorded.</Text>
        ) : (
          data.categories.map((cat) => {
            const isUp = cat.delta > 0;
            const isDown = cat.delta < 0;
            const maxVal = Math.max(1, Math.max(cat.currAmount, cat.prevAmount));
            const currBarPct = Math.round((cat.currAmount / maxVal) * 100);
            const prevBarPct = Math.round((cat.prevAmount / maxVal) * 100);

            return (
              <View key={cat.categoryId} style={styles.catRow}>
                {/* Category Icon */}
                <View
                  style={[
                    styles.catIconBox,
                    { backgroundColor: `${cat.categoryColor}1A` },
                  ]}
                >
                  <CategoryIcon
                    name={cat.categoryIcon}
                    size={16}
                    color={cat.categoryColor}
                  />
                </View>

                {/* Details */}
                <View style={styles.catContent}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catName} numberOfLines={1}>
                      {cat.categoryName}
                    </Text>

                    {/* Shift Pill */}
                    {cat.isNew ? (
                      <View style={styles.newBadge}>
                        <Sparkles size={10} color={Colors.chartreuse} />
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.shiftBadge,
                          isDown ? styles.shiftGood : isUp ? styles.shiftCaution : styles.shiftNeutral,
                        ]}
                      >
                        {isDown ? (
                          <TrendingDown size={11} color={Colors.income} />
                        ) : isUp ? (
                          <TrendingUp size={11} color={Colors.expense} />
                        ) : null}
                        <Text
                          style={[
                            styles.shiftText,
                            isDown ? styles.textGood : isUp ? styles.textCaution : styles.textNeutral,
                          ]}
                        >
                          {isDown ? '-' : isUp ? '+' : ''}₹{Math.abs(cat.delta).toLocaleString('en-IN')}
                          {cat.percentChange !== 0 ? ` (${cat.percentChange}%)` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Dual comparison bars */}
                  <View style={styles.barsWrapper}>
                    {/* Current Month Bar */}
                    <View style={styles.barLine}>
                      <Text style={styles.barPeriodLabel}>This Mo</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${currBarPct}%`, backgroundColor: cat.categoryColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.barAmt}>₹{cat.currAmount.toLocaleString('en-IN')}</Text>
                    </View>

                    {/* Previous Month Bar */}
                    <View style={styles.barLine}>
                      <Text style={styles.barPeriodLabel}>Last Mo</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${prevBarPct}%`, backgroundColor: Colors.surfaceContainerHighest },
                          ]}
                        />
                      </View>
                      <Text style={styles.barAmt}>₹{cat.prevAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>
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
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.secondaryFixed}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.secondaryFixed}33`,
  },
  headerTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 11,
    letterSpacing: 1.0,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    gap: 4,
  },
  deltaPillGood: {
    backgroundColor: `${Colors.income}1A`,
    borderColor: `${Colors.income}4D`,
  },
  deltaPillCaution: {
    backgroundColor: `${Colors.expense}1A`,
    borderColor: `${Colors.expense}4D`,
  },
  deltaPillText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  summaryVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13.5,
    color: Colors.onSurface,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  categoriesSection: {
    gap: Spacing.sm + 2,
  },
  sectionHeader: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    paddingVertical: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  catIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  catContent: {
    flex: 1,
    gap: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  shiftGood: {
    backgroundColor: `${Colors.income}1A`,
  },
  shiftCaution: {
    backgroundColor: `${Colors.expense}1A`,
  },
  shiftNeutral: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  shiftText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    backgroundColor: `${Colors.chartreuse}1A`,
  },
  newBadgeText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 9.5,
    color: Colors.chartreuse,
  },
  barsWrapper: {
    gap: 4,
  },
  barLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barPeriodLabel: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    width: 44,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barAmt: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurface,
    width: 58,
    textAlign: 'right',
  },
  textGood: {
    color: Colors.income,
  },
  textCaution: {
    color: Colors.expense,
  },
  textNeutral: {
    color: Colors.onSurfaceVariant,
  },
});
