/**
 * MyWallet — Spending Heatmap Calendar & Habit Density
 * 
 * Tier 4, Feature 10: Full Spending Density Heatmap Calendar.
 * - Multi-level spending intensity color coding:
 *   - No-Spend (Soft emerald outline with spark)
 *   - Low spend (Soft teal/mint tint)
 *   - Medium spend (Warm amber tint)
 *   - High spend (Soft coral/red surge)
 * - Streak Counter Overlay: Current and Longest no-spend streaks prominently tracked.
 * - Tap any day → Interactive Day Inspector with list of all transactions for that date!
 * - View mode toggle: 35-Day rolling vs full current month view.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  Sparkles,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { NoSpendHeatmapData, HeatmapDay, AnalyticsRepository, DayTransactionDetail } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface NoSpendHeatmapProps {
  data: NoSpendHeatmapData;
  onSelectDay?: (day: HeatmapDay) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function NoSpendHeatmap({ data, onSelectDay }: NoSpendHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(
    data.days.find((d) => d.isToday) || data.days[data.days.length - 1] || null
  );
  const [viewMode, setViewMode] = useState<'35d' | 'month'>('35d');

  // Filter days for Month view if selected
  const displayedDays = useMemo(() => {
    if (viewMode === '35d') return data.days;
    const now = new Date();
    const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return data.days.filter((d) => d.date.startsWith(curYearMonth));
  }, [data.days, viewMode]);

  // Fetch transactions for the selected day
  const dayTransactions: DayTransactionDetail[] = useMemo(() => {
    if (!selectedDay) return [];
    return AnalyticsRepository.getDayTransactions(selectedDay.date);
  }, [selectedDay]);

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

  const getCellIntensityStyle = (day: HeatmapDay) => {
    if (day.isNoSpend) return styles.cellZero;
    switch (day.intensity) {
      case 'low':
        return styles.cellLow;
      case 'medium':
        return styles.cellMedium;
      case 'high':
        return styles.cellHigh;
      default:
        return styles.cellSpend;
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
            <Text style={styles.headerTitle}>SPENDING DENSITY HEATMAP</Text>
            <Text style={styles.headerSubtitle}>Calendar Outflow Intensity Map</Text>
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === '35d' && styles.toggleBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('35d');
            }}
          >
            <Text style={[styles.toggleBtnText, viewMode === '35d' && styles.toggleBtnTextActive]}>
              35-DAY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'month' && styles.toggleBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('month');
            }}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'month' && styles.toggleBtnTextActive]}>
              MONTH
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streak Counters Banner */}
      <View style={styles.streakBanner}>
        <View style={styles.streakCol}>
          <View style={styles.streakBadge}>
            <Flame size={14} color="#FF9E0B" />
            <Text style={styles.streakBadgeTitle}>CURRENT STREAK</Text>
          </View>
          <Text style={styles.streakVal}>{data.currentStreak} Days</Text>
          <Text style={styles.streakSub}>Zero outlays active</Text>
        </View>

        <View style={styles.streakDivider} />

        <View style={styles.streakCol}>
          <View style={styles.streakBadge}>
            <Sparkles size={14} color={Colors.chartreuse} />
            <Text style={[styles.streakBadgeTitle, { color: Colors.chartreuse }]}>RECORD STREAK</Text>
          </View>
          <Text style={styles.streakVal}>{data.longestStreak} Days</Text>
          <Text style={styles.streakSub}>Longest fortress streak</Text>
        </View>

        <View style={styles.streakDivider} />

        <View style={styles.streakCol}>
          <View style={styles.streakBadge}>
            <Check size={14} color={Colors.income} />
            <Text style={[styles.streakBadgeTitle, { color: Colors.income }]}>DISCIPLINE</Text>
          </View>
          <Text style={styles.streakVal}>{data.noSpendRate}%</Text>
          <Text style={styles.streakSub}>Zero-spend frequency</Text>
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

        {/* Cells Grid — proper 7-column rows with spacer alignment */}
        {(() => {
          // Convert JS dayOfWeek (0=Sun..6=Sat) to Mon-first column index (Mon=0..Sun=6)
          const toColIndex = (jsDow: number) => (jsDow + 6) % 7;
          
          // Build rows of exactly 7 cells each
          type CellItem = { type: 'spacer'; key: string } | { type: 'day'; day: HeatmapDay };
          const rows: CellItem[][] = [];
          let currentRow: CellItem[] = [];
          
          // Add leading spacers for the first day
          if (displayedDays.length > 0) {
            const firstCol = toColIndex(displayedDays[0].dayOfWeek);
            for (let s = 0; s < firstCol; s++) {
              currentRow.push({ type: 'spacer', key: `spacer-start-${s}` });
            }
          }
          
          // Add all days
          for (const day of displayedDays) {
            currentRow.push({ type: 'day', day });
            if (currentRow.length === 7) {
              rows.push(currentRow);
              currentRow = [];
            }
          }
          
          // Pad last row with trailing spacers
          if (currentRow.length > 0) {
            while (currentRow.length < 7) {
              currentRow.push({ type: 'spacer', key: `spacer-end-${currentRow.length}` });
            }
            rows.push(currentRow);
          }
          
          return rows.map((row, rowIdx) => (
            <View key={`row-${rowIdx}`} style={styles.gridRow}>
              {row.map((cell) => {
                if (cell.type === 'spacer') {
                  return (
                    <View key={cell.key} style={styles.gridColWrapper}>
                      <View style={styles.cellSpacer} />
                    </View>
                  );
                }
                
                const day = cell.day;
                const isSelected = selectedDay?.date === day.date;
                const isToday = day.isToday;
                
                return (
                  <View key={day.date} style={styles.gridColWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.cell,
                        getCellIntensityStyle(day),
                        isToday && styles.cellToday,
                        isSelected && styles.cellSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleCellPress(day)}
                    >
                      <Text
                        style={[
                          styles.cellDayText,
                          day.isNoSpend ? styles.cellDayTextNoSpend : styles.cellDayTextSpend,
                        ]}
                      >
                        {day.dayOfMonth}
                      </Text>
                      {day.isNoSpend && (
                        <View style={styles.noSpendSparkle}>
                          <Sparkles size={7} color={Colors.income} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ));
        })()}
      </View>

      {/* Heatmap Intensity Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellZero]} />
          <Text style={styles.legendText}>₹0 (No-Spend)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellLow]} />
          <Text style={styles.legendText}>Low Spend</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellMedium]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.cellHigh]} />
          <Text style={styles.legendText}>High Surge</Text>
        </View>
      </View>

      {/* Selected Day Inspector Drawer & Transaction Details */}
      {selectedDay && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.inspectorContainer}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorLeft}>
              <View
                style={[
                  styles.statusIconBox,
                  selectedDay.isNoSpend
                    ? { backgroundColor: `${Colors.income}1A` }
                    : { backgroundColor: `${Colors.expense}1A` },
                ]}
              >
                {selectedDay.isNoSpend ? (
                  <Check size={16} color={Colors.income} />
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
                    : `${selectedDay.transactionCount} transaction${selectedDay.transactionCount !== 1 ? 's' : ''} logged`}
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
                {selectedDay.isNoSpend ? 'NO SPEND' : 'ACTIVE SPEND'}
              </Text>
            </View>
          </View>

          {/* Transaction items list for that day */}
          {dayTransactions.length > 0 && (
            <View style={styles.txList}>
              <Text style={styles.txListHeader}>DAY'S TRANSACTIONS</Text>
              {dayTransactions.map((tx) => (
                <View key={tx.id} style={styles.txItem}>
                  <View
                    style={[
                      styles.txIconBox,
                      { backgroundColor: `${tx.categoryColor}1A` },
                    ]}
                  >
                    <CategoryIcon
                      icon={tx.categoryIcon}
                      color={tx.categoryColor}
                      size={13}
                    />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txNote} numberOfLines={1}>
                      {tx.note || tx.categoryName}
                    </Text>
                    <Text style={styles.txTime}>
                      {tx.time} {tx.accountName ? `· ${tx.accountName}` : tx.creditCardName ? `· ${tx.creditCardName}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}
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
    backgroundColor: '#FF9E0B1A',
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  toggleBtnText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  toggleBtnTextActive: {
    color: Colors.onSurface,
  },
  streakBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  streakCol: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  streakDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.strokeSubtle,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakBadgeTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FF9E0B',
    letterSpacing: 0.5,
  },
  streakVal: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  streakSub: {
    fontFamily: FontFamily.sans,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  gridWrapper: {
    gap: Spacing.xs,
  },
  colHeaderRow: {
    flexDirection: 'row',
  },
  colHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colHeaderText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  weekendHeader: {
    color: Colors.primaryFixed,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  gridColWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSpacer: {
    width: 38,
    height: 38,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: Shapes.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  cellZero: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: `${Colors.income}55`,
  },
  cellLow: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderColor: 'rgba(0, 230, 118, 0.4)',
  },
  cellMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: 'rgba(245, 158, 11, 0.55)',
  },
  cellHigh: {
    backgroundColor: 'rgba(255, 82, 82, 0.4)',
    borderColor: 'rgba(255, 82, 82, 0.7)',
  },
  cellSpend: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderColor: Colors.strokeSubtle,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: Colors.chartreuse,
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  cellDayText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  cellDayTextNoSpend: {
    color: Colors.income,
  },
  cellDayTextSpend: {
    color: Colors.onSurface,
  },
  noSpendSparkle: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  inspectorContainer: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorMeta: {
    gap: 1,
    flex: 1,
  },
  inspectorDate: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  inspectorSub: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  inspectorRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  inspectorAmount: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '800',
  },
  textFree: {
    color: Colors.income,
  },
  textSpend: {
    color: Colors.expense,
  },
  inspectorBadge: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  txList: {
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
    paddingTop: Spacing.xs,
    gap: 4,
  },
  txListHeader: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  txIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDetails: {
    flex: 1,
    gap: 1,
  },
  txNote: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  txTime: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  txAmount: {
    fontFamily: FontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
