/**
 * MyWallet — No-Spend Days & Frugality Habit Heatmap
 * 
 * Phase 12: GitHub-style contribution calendar grid
 * Tracks zero-spend days, frugality streaks, and daily spending intensity.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Flame, Sparkles, Check, X, Calendar as CalendarIcon } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { NoSpendHeatmapData, HeatmapDay } from '@/repositories';

interface NoSpendHeatmapProps {
  data: NoSpendHeatmapData;
  onSelectDay?: (day: HeatmapDay) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function NoSpendHeatmap({ data, onSelectDay }: NoSpendHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(
    data.days.find((d) => d.isToday) || data.days[data.days.length - 1] || null
  );

  const handleCellPress = (day: HeatmapDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(day);
    onSelectDay?.(day);
  };

  const formatSelectedDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Flame size={16} color="#FF9E0B" />
          </View>
          <View>
            <Text style={styles.headerTitle}>NO-SPEND HABIT HEATMAP</Text>
            <Text style={styles.headerSubtitle}>35-Day Frugality Velocity Audit</Text>
          </View>
        </View>

        {/* Streak Pill */}
        <View style={styles.streakPill}>
          <Flame size={13} color="#FF9E0B" />
          <Text style={styles.streakText}>{data.currentStreak}d Streak</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>
            {data.totalNoSpendInPeriod} <Text style={styles.metricMax}>/ {data.totalDaysInPeriod}</Text>
          </Text>
          <Text style={styles.metricLbl}>Zero-Spend Days</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{data.noSpendRate}%</Text>
          <Text style={styles.metricLbl}>Discipline Rate</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{data.longestStreak}d</Text>
          <Text style={styles.metricLbl}>Best Streak</Text>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridWrapper}>
        {/* Day Column Headers (Mon - Sun) */}
        <View style={styles.colHeaderRow}>
          {DAY_LABELS.map((lbl, idx) => (
            <View key={`lbl-${idx}`} style={styles.colHeaderCell}>
              <Text
                style={[
                  styles.colHeaderText,
                  (idx === 5 || idx === 6) && styles.weekendHeader,
                ]}
              >
                {lbl}
              </Text>
            </View>
          ))}
        </View>

        {/* Cells Grid */}
        <View style={styles.cellsGrid}>
          {data.days.map((day) => {
            const isSelected = selectedDay?.date === day.date;
            const isNoSpend = day.isNoSpend;
            const isToday = day.isToday;

            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.cell,
                  isNoSpend ? styles.cellNoSpend : styles.cellSpend,
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => handleCellPress(day)}
              >
                <Text
                  style={[
                    styles.cellDayText,
                    isNoSpend ? styles.cellDayTextNoSpend : styles.cellDayTextSpend,
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
                {isNoSpend && (
                  <View style={styles.noSpendSparkle}>
                    <Sparkles size={7} color={Colors.chartreuse} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Inspector Drawer */}
      {selectedDay && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorLeft}>
            <View
              style={[
                styles.statusIconBox,
                selectedDay.isNoSpend
                  ? { backgroundColor: `${Colors.chartreuse}1A` }
                  : { backgroundColor: `${Colors.expense}1A` },
              ]}
            >
              {selectedDay.isNoSpend ? (
                <Check size={16} color={Colors.chartreuse} />
              ) : (
                <CalendarIcon size={16} color={Colors.expense} />
              )}
            </View>
            <View style={styles.inspectorMeta}>
              <Text style={styles.inspectorDate}>
                {formatSelectedDate(selectedDay.date)}
                {selectedDay.isToday ? ' • Today' : ''}
              </Text>
              <Text style={styles.inspectorSub}>
                {selectedDay.isNoSpend
                  ? 'Zero discretionary expense recorded ✨'
                  : `${selectedDay.transactionCount} expense${selectedDay.transactionCount !== 1 ? 's' : ''} logged`}
              </Text>
            </View>
          </View>

          <View style={styles.inspectorRight}>
            <Text
              style={[
                styles.inspectorAmount,
                selectedDay.isNoSpend ? styles.textFree : styles.textSpend,
              ]}
            >
              {selectedDay.isNoSpend
                ? '₹0'
                : `₹${selectedDay.spend.toLocaleString('en-IN')}`}
            </Text>
            <Text style={styles.inspectorBadge}>
              {selectedDay.isNoSpend ? 'NO SPEND' : 'ACTIVE'}
            </Text>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellNoSpend]} />
          <Text style={styles.legendText}>No-Spend Day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellSpend]} />
          <Text style={styles.legendText}>Spend Day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellTodayBorder]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
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
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9E0B1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF9E0B33',
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
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: '#FF9E0B1A',
    borderWidth: 1,
    borderColor: '#FF9E0B4D',
    gap: 4,
  },
  streakText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 11,
    color: '#FF9E0B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 15,
    color: Colors.onSurface,
  },
  metricMax: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  metricLbl: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  gridWrapper: {
    gap: 6,
  },
  colHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  colHeaderCell: {
    width: '13%',
    alignItems: 'center',
  },
  colHeaderText: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  weekendHeader: {
    color: Colors.tertiaryFixedDim,
  },
  cellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  cell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: Shapes.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellNoSpend: {
    backgroundColor: `${Colors.chartreuse}22`,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}66`,
  },
  cellSpend: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHighest,
  },
  cellToday: {
    borderColor: Colors.primaryFixed,
    borderWidth: 1.5,
  },
  cellSelected: {
    transform: [{ scale: 1.08 }],
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cellDayText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10.5,
  },
  cellDayTextNoSpend: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  cellDayTextSpend: {
    color: Colors.onSurfaceVariant,
  },
  noSpendSparkle: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  inspectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorMeta: {
    gap: 2,
    flex: 1,
  },
  inspectorDate: {
    ...Typography.bodyMdMedium,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  inspectorSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  inspectorRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  inspectorAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
  },
  textFree: {
    color: Colors.chartreuse,
  },
  textSpend: {
    color: Colors.expense,
  },
  inspectorBadge: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  cellTodayBorder: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderColor: Colors.primaryFixed,
    borderWidth: 1.5,
  },
  legendText: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});
