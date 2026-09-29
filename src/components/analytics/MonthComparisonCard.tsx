/**
 * MyWallet — Side-by-Side Two Month Comparison Card
 * 
 * Tier 4, Feature 12: Visual diff of ANY two months.
 * - Select Month A and Month B from past 12 months.
 * - Side-by-side total spend & savings comparison.
 * - Category-by-category shift analysis with dual comparison bars.
 * - Proportional shifts and surge vs cool-down highlights.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  ChevronDown,
  X,
  Check,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { MonthComparisonData, CategoryComparison, AnalyticsRepository } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface MonthComparisonCardProps {
  initialData?: MonthComparisonData;
  data?: MonthComparisonData;
}

export function MonthComparisonCard({ initialData, data }: MonthComparisonCardProps) {
  const activeInputData = initialData || data;
  const now = new Date();
  const defaultCurrentYM =
    activeInputData?.currYearMonth ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const getPriorYM = (baseYM: string, monthsAgo: number) => {
    const [y, m] = baseYM.split('-').map(Number);
    const d = new Date(y, m - 1 - monthsAgo, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const defaultPrevYM = activeInputData?.prevYearMonth || getPriorYM(defaultCurrentYM, 1);

  const [monthA, setMonthA] = useState(defaultCurrentYM);
  const [monthB, setMonthB] = useState(defaultPrevYM);
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);

  // Available past 12 months for selector
  const availableMonths = useMemo(() => {
    const list: Array<{ ym: string; label: string }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      list.push({ ym, label });
    }
    return list;
  }, []);

  const comparisonData = useMemo(() => {
    return AnalyticsRepository.getMonthComparison(monthA, monthB);
  }, [monthA, monthB]);

  const formatMonthTitle = (ym: string) => {
    try {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  const isExpenseUp = comparisonData.expenseDelta > 0;
  const isExpenseDown = comparisonData.expenseDelta < 0;

  const handleSelectMonth = (ym: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pickerTarget === 'A') setMonthA(ym);
    else if (pickerTarget === 'B') setMonthB(ym);
    setPickerTarget(null);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.secondaryFixed}1A` }]}>
            <ArrowUpDown size={16} color={Colors.secondaryFixed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>COMPARE TWO MONTHS</Text>
            <Text style={styles.headerSubtitle}>Side-by-Side Spending Diff</Text>
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
            {isExpenseDown ? '-' : isExpenseUp ? '+' : ''}₹
            {Math.abs(comparisonData.expenseDelta).toLocaleString('en-IN')} (
            {comparisonData.expensePercentChange}%)
          </Text>
        </View>
      </View>

      {/* Interactive Month Pickers (Month A vs Month B) */}
      <View style={styles.monthPickerRow}>
        <TouchableOpacity
          style={styles.monthSelectorBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerTarget('A');
          }}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.selectorLabel}>BASE MONTH (A)</Text>
            <Text style={styles.selectorVal}>{formatMonthTitle(monthA)}</Text>
          </View>
          <ChevronDown size={14} color={Colors.primaryFixed} />
        </TouchableOpacity>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <TouchableOpacity
          style={styles.monthSelectorBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerTarget('B');
          }}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.selectorLabel}>COMPARE TO (B)</Text>
            <Text style={styles.selectorVal}>{formatMonthTitle(monthB)}</Text>
          </View>
          <ChevronDown size={14} color={Colors.secondaryFixed} />
        </TouchableOpacity>
      </View>

      {/* Summary Delta Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>{formatMonthTitle(monthA).toUpperCase()}</Text>
          <Text style={styles.summaryVal}>
            ₹{comparisonData.currExpense.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>{formatMonthTitle(monthB).toUpperCase()}</Text>
          <Text style={styles.summaryVal}>
            ₹{comparisonData.prevExpense.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>NET DELTA</Text>
          <Text
            style={[
              styles.summaryVal,
              comparisonData.savedDelta >= 0 ? styles.textGood : styles.textCaution,
            ]}
          >
            {comparisonData.savedDelta >= 0 ? '+' : '-'}₹
            {Math.abs(comparisonData.savedDelta).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Category-by-Category Shift List */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionHeader}>CATEGORY SHIFTS ({formatMonthTitle(monthA)} vs {formatMonthTitle(monthB)})</Text>

        {comparisonData.categories.length === 0 ? (
          <Text style={styles.emptyText}>No comparative category expenses recorded.</Text>
        ) : (
          comparisonData.categories.map((cat) => {
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
                    icon={cat.categoryIcon}
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
                    {/* Month A Bar */}
                    <View style={styles.barLine}>
                      <Text style={styles.barPeriodLabel}>{formatMonthTitle(monthA).split(' ')[0]}</Text>
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

                    {/* Month B Bar */}
                    <View style={styles.barLine}>
                      <Text style={styles.barPeriodLabel}>{formatMonthTitle(monthB).split(' ')[0]}</Text>
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

      {/* Month Picker Modal */}
      {pickerTarget && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setPickerTarget(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setPickerTarget(null)} />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  Select Month {pickerTarget === 'A' ? 'A (Base)' : 'B (Compare)'}
                </Text>
                <TouchableOpacity onPress={() => setPickerTarget(null)}>
                  <X size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.pickerList}>
                {availableMonths.map((m) => {
                  const isCurrent = pickerTarget === 'A' ? monthA === m.ym : monthB === m.ym;
                  return (
                    <TouchableOpacity
                      key={m.ym}
                      style={[styles.pickerItem, isCurrent && styles.pickerItemActive]}
                      onPress={() => handleSelectMonth(m.ym)}
                    >
                      <Text style={[styles.pickerItemText, isCurrent && styles.pickerItemTextActive]}>
                        {m.label}
                      </Text>
                      {isCurrent && <Check size={16} color={Colors.chartreuse} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  deltaPillGood: {
    backgroundColor: `${Colors.income}1A`,
    borderColor: `${Colors.income}40`,
  },
  deltaPillCaution: {
    backgroundColor: `${Colors.expense}1A`,
    borderColor: `${Colors.expense}40`,
  },
  deltaPillText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
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
  monthPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  monthSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  selectorLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  selectorVal: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 1,
  },
  vsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.strokeSubtle,
  },
  summaryLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontFamily: FontFamily.display,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  categoriesSection: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    paddingVertical: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  catIconBox: {
    width: 32,
    height: 32,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catContent: {
    flex: 1,
    gap: 4,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  shiftGood: {
    backgroundColor: `${Colors.income}1A`,
  },
  shiftCaution: {
    backgroundColor: `${Colors.expense}1A`,
  },
  shiftNeutral: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  shiftText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '700',
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: `${Colors.chartreuse}1A`,
  },
  newBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.chartreuse,
  },
  barsWrapper: {
    gap: 2,
    marginTop: 2,
  },
  barLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barPeriodLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    width: 44,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barAmt: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.onSurface,
    width: 60,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    padding: Spacing.xl,
    maxHeight: '60%',
    gap: Spacing.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
    paddingBottom: Spacing.sm,
  },
  pickerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  pickerItemActive: {
    backgroundColor: `${Colors.chartreuse}0D`,
  },
  pickerItemText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Colors.onSurface,
  },
  pickerItemTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
});
