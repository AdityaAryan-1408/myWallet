/**
 * MyWallet — Income vs Expense Ratio Tracker Card
 * 
 * Tier 4, Feature 14: Monthly Savings Rate as a Living Metric.
 * - Split proportional bar: Inflow (100%) vs Living Outflows vs Wealth Preserved.
 * - Savings rate % front-and-center with target goal tracker.
 * - Interactive target goal setter (persists to user_settings).
 * - 6-month historical savings rate curve.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  PieChart,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Sliders,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { IncomeVsExpenseRatioData, SettingsRepository } from '@/repositories';

interface IncomeExpenseRatioCardProps {
  data: IncomeVsExpenseRatioData;
  onTargetUpdated?: () => void;
}

const TARGET_PRESETS = [20, 25, 30, 40, 50];

export function IncomeExpenseRatioCard({
  data,
  onTargetUpdated,
}: IncomeExpenseRatioCardProps) {
  const [currentTarget, setCurrentTarget] = useState(data.targetSavingsRate);

  const handleSelectTarget = (target: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentTarget(target);
    SettingsRepository.set('target_savings_rate', String(target));
    onTargetUpdated?.();
  };

  const isExceeded = data.savingsRate >= currentTarget;
  const deltaVsTarget = data.savingsRate - currentTarget;

  const totalInflow = Math.max(1, data.income);
  const expensePct = Math.min(100, Math.round((data.expense / totalInflow) * 100));
  const savedPct = Math.min(100, Math.round((data.netSaved / totalInflow) * 100));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.income}1A` }]}>
            <PieChart size={16} color={Colors.income} />
          </View>
          <View>
            <Text style={styles.headerTitle}>INCOME VS EXPENSE RATIO</Text>
            <Text style={styles.headerSubtitle}>{data.monthLabel} Wealth Preservation</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            isExceeded ? styles.statusPillGood : styles.statusPillLagging,
          ]}
        >
          <Target size={11} color={isExceeded ? Colors.income : Colors.expense} />
          <Text
            style={[
              styles.statusPillText,
              { color: isExceeded ? Colors.income : Colors.expense },
            ]}
          >
            {isExceeded ? `TARGET MET (+${deltaVsTarget}%)` : `LAGGING (${deltaVsTarget}%)`}
          </Text>
        </View>
      </View>

      {/* Main Savings Rate Hero Banner */}
      <View style={styles.heroBox}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>LIVING SAVINGS RATE</Text>
          <View style={styles.rateRow}>
            <Text style={styles.rateValue}>{data.savingsRate}%</Text>
            <Text style={styles.rateSub}>of total income preserved</Text>
          </View>

          <Text style={styles.heroSurplus}>
            Surplus: <Text style={styles.boldAmount}>₹{data.netSaved.toLocaleString('en-IN')}</Text>
          </Text>
        </View>

        <View style={styles.targetGaugeWrapper}>
          <View style={styles.targetCircle}>
            <Text style={styles.targetDigit}>{currentTarget}%</Text>
            <Text style={styles.targetTag}>GOAL</Text>
          </View>
        </View>
      </View>

      {/* Living Split Bar (Expense vs Saved) */}
      <View style={styles.splitBarSection}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLegendLeft}>
            Burn: ₹{data.expense.toLocaleString('en-IN')} ({expensePct}%)
          </Text>
          <Text style={styles.barLegendRight}>
            Saved: ₹{data.netSaved.toLocaleString('en-IN')} ({savedPct}%)
          </Text>
        </View>

        <View style={styles.splitTrack}>
          <View
            style={[
              styles.splitExpenseFill,
              { width: `${expensePct}%` },
            ]}
          />
          <View
            style={[
              styles.splitSavedFill,
              { width: `${savedPct}%` },
            ]}
          />
        </View>
      </View>

      {/* Interactive Goal Presets */}
      <View style={styles.goalSetterRow}>
        <Text style={styles.goalSetterLabel}>SET MONTHLY TARGET:</Text>
        <View style={styles.presetsList}>
          {TARGET_PRESETS.map((p) => {
            const isSelected = currentTarget === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetBtn,
                  isSelected && styles.presetBtnSelected,
                ]}
                onPress={() => handleSelectTarget(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    isSelected && styles.presetTextSelected,
                  ]}
                >
                  {p}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6-Month Savings Trajectory */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>6-Month Savings Rate Trajectory</Text>
        <View style={styles.historyRow}>
          {data.monthlyHistory6M.map((h, idx) => {
            const isLatest = idx === data.monthlyHistory6M.length - 1;
            const barHeightPct = Math.min(100, Math.max(12, h.savingsRate));
            const isOverTarget = h.savingsRate >= currentTarget;

            return (
              <View key={h.monthKey} style={styles.histCol}>
                <Text style={styles.histRateText}>{h.savingsRate}%</Text>
                <View style={styles.histBarTrack}>
                  <View
                    style={[
                      styles.histBarFill,
                      {
                        height: `${barHeightPct}%`,
                        backgroundColor: isOverTarget
                          ? Colors.income
                          : isLatest
                          ? Colors.chartreuse
                          : '#FFD93D',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.histMonthLabel,
                    isLatest && { color: Colors.chartreuse, fontWeight: '700' },
                  ]}
                >
                  {h.monthLabel}
                </Text>
              </View>
            );
          })}
        </View>
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  statusPillGood: {
    backgroundColor: `${Colors.income}1A`,
    borderColor: `${Colors.income}40`,
  },
  statusPillLagging: {
    backgroundColor: `${Colors.expense}1A`,
    borderColor: `${Colors.expense}40`,
  },
  statusPillText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '700',
  },
  heroBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  heroLeft: {
    gap: 2,
    flex: 1,
  },
  heroLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  rateValue: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.income,
  },
  rateSub: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  heroSurplus: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  boldAmount: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  targetGaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.chartreuse}14`,
    borderWidth: 2,
    borderColor: Colors.chartreuse,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  targetDigit: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.chartreuse,
  },
  targetTag: {
    fontFamily: FontFamily.mono,
    fontSize: 7.5,
    fontWeight: '700',
    color: Colors.chartreuse,
  },
  splitBarSection: {
    gap: Spacing.xs,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLegendLeft: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.expense,
  },
  barLegendRight: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.income,
  },
  splitTrack: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4,
    overflow: 'hidden',
  },
  splitExpenseFill: {
    height: '100%',
    backgroundColor: Colors.expense,
  },
  splitSavedFill: {
    height: '100%',
    backgroundColor: Colors.income,
  },
  goalSetterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  goalSetterLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  presetsList: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  presetBtnSelected: {
    backgroundColor: `${Colors.chartreuse}20`,
    borderColor: Colors.chartreuse,
  },
  presetText: {
    fontFamily: FontFamily.mono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  presetTextSelected: {
    color: Colors.chartreuse,
  },
  historySection: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  historyTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
  },
  histCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  histRateText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  histBarTrack: {
    width: 14,
    height: 40,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  histBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  histMonthLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});
