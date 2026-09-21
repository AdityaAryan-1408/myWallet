/**
 * MyWallet — Spending by Day of Week Chart
 * 
 * Phase 12: Mon–Sun spending distribution bar chart with peak day highlight
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalendarDays, Star } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { DayOfWeekData, DayOfWeekItem } from '@/repositories';

interface DayOfWeekChartProps {
  data: DayOfWeekData;
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeekItem | null>(
    data.items.find((i) => i.isPeak) || data.items[0] || null
  );

  const maxSpend = Math.max(1, Math.max(...data.items.map((i) => i.totalSpend)));

  const handleBarPress = (item: DayOfWeekItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(item);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <CalendarDays size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>SPENDING BY DAY OF WEEK</Text>
            <Text style={styles.headerSubtitle}>Weekly Rhythm & Peak Velocity</Text>
          </View>
        </View>

        {data.peakDay && (
          <View style={styles.peakPill}>
            <Star size={11} color={Colors.chartreuse} fill={Colors.chartreuse} />
            <Text style={styles.peakPillText}>Peak: {data.peakDay.substring(0, 3)}</Text>
          </View>
        )}
      </View>

      {/* Bar Chart Area */}
      <View style={styles.chartArea}>
        {data.items.map((item) => {
          const heightPct = Math.max(8, Math.round((item.totalSpend / maxSpend) * 100));
          const isSelected = selectedDay?.dayName === item.dayName;
          const isPeak = item.isPeak;

          return (
            <TouchableOpacity
              key={item.dayName}
              style={styles.colContainer}
              activeOpacity={0.7}
              onPress={() => handleBarPress(item)}
            >
              {/* Amount over bar for selected or peak */}
              <View style={styles.barTopSlot}>
                {isSelected ? (
                  <Text style={[styles.barAmountText, isPeak && styles.peakText]}>
                    ₹{item.totalSpend > 999 ? `${(item.totalSpend / 1000).toFixed(1)}k` : item.totalSpend}
                  </Text>
                ) : (
                  <View style={{ height: 12 }} />
                )}
              </View>

              {/* Bar track and fill */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPct}%` },
                    isPeak ? styles.barPeak : styles.barNormal,
                    isSelected && styles.barSelected,
                  ]}
                />
              </View>

              {/* Day Label */}
              <Text
                style={[
                  styles.dayLabel,
                  isPeak && styles.peakDayLabel,
                  isSelected && styles.selectedDayLabel,
                ]}
              >
                {item.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Inspector */}
      {selectedDay && (
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Text style={styles.detailDayName}>{selectedDay.dayName}</Text>
            <Text style={styles.detailCount}>
              {selectedDay.transactionCount} transaction{selectedDay.transactionCount !== 1 ? 's' : ''} • {selectedDay.percentage}% of week
            </Text>
          </View>
          <Text style={[styles.detailAmount, selectedDay.isPeak && styles.peakText]}>
            ₹{selectedDay.totalSpend.toLocaleString('en-IN')}
          </Text>
        </View>
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
    backgroundColor: `${Colors.primaryFixed}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primaryFixed}33`,
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
  peakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: `${Colors.chartreuse}1A`,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}4D`,
    gap: 4,
  },
  peakPillText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
    color: Colors.chartreuse,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  colContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barTopSlot: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barAmountText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  peakText: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  barTrack: {
    width: 22,
    height: 95,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: Shapes.sm,
  },
  barNormal: {
    backgroundColor: Colors.primaryFixed,
    opacity: 0.85,
  },
  barPeak: {
    backgroundColor: Colors.chartreuse,
  },
  barSelected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    opacity: 1,
  },
  dayLabel: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  peakDayLabel: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  selectedDayLabel: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  detailLeft: {
    gap: 2,
  },
  detailDayName: {
    ...Typography.bodyMdMedium,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  detailCount: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  detailAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 15,
    color: Colors.onSurface,
  },
});
