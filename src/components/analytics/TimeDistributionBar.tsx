/**
 * MyWallet — Time of Day Distribution Bar & Grid
 * 
 * Phase 12: Morning, Afternoon, Evening, Night spending breakdown
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Sun, Sunset, Moon, Coffee } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { TimeDistributionData, TimeSlotItem } from '@/repositories';

interface TimeDistributionBarProps {
  data: TimeDistributionData;
}

export function TimeDistributionBar({ data }: TimeDistributionBarProps) {
  const getSlotIcon = (id: string, color: string) => {
    switch (id) {
      case 'morning':
        return <Coffee size={14} color={color} />;
      case 'afternoon':
        return <Sun size={14} color={color} />;
      case 'evening':
        return <Sunset size={14} color={color} />;
      case 'night':
        return <Moon size={14} color={color} />;
      default:
        return <Clock size={14} color={color} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Clock size={16} color={Colors.tertiaryFixedDim} />
          </View>
          <View>
            <Text style={styles.headerTitle}>TIME OF DAY DISTRIBUTION</Text>
            <Text style={styles.headerSubtitle}>24-Hour Diurnal Spending Habits</Text>
          </View>
        </View>

        {data.peakSlot && (
          <View style={styles.peakPill}>
            <Text style={styles.peakPillText}>Peak: {data.peakSlot}</Text>
          </View>
        )}
      </View>

      {/* Segmented Horizontal Bar */}
      <View style={styles.segmentedBar}>
        {data.slots.map((slot) => {
          if (slot.percentage <= 0) return null;
          return (
            <View
              key={slot.id}
              style={[
                styles.barSegment,
                { width: `${slot.percentage}%`, backgroundColor: slot.color },
              ]}
            />
          );
        })}
      </View>

      {/* 2x2 Slots Grid */}
      <View style={styles.slotsGrid}>
        {data.slots.map((slot) => {
          const isPeak = slot.label === data.peakSlot && slot.totalSpend > 0;
          return (
            <View
              key={slot.id}
              style={[
                styles.slotCard,
                isPeak && { borderColor: `${slot.color}80`, backgroundColor: `${slot.color}0D` },
              ]}
            >
              <View style={styles.slotTop}>
                <View style={[styles.slotIconBox, { backgroundColor: `${slot.color}1A` }]}>
                  {getSlotIcon(slot.id, slot.color)}
                </View>
                <Text style={[styles.slotPct, { color: slot.color }]}>{slot.percentage}%</Text>
              </View>

              <Text style={styles.slotLabel}>{slot.label}</Text>
              <Text style={styles.slotRange}>{slot.timeRange}</Text>

              <View style={styles.slotFooter}>
                <Text style={styles.slotAmount}>₹{slot.totalSpend.toLocaleString('en-IN')}</Text>
                <Text style={styles.slotCount}>
                  {slot.transactionCount} tx{slot.transactionCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          );
        })}
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
    backgroundColor: `${Colors.tertiaryFixedDim}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.tertiaryFixedDim}33`,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: `${Colors.tertiaryFixedDim}1A`,
    borderWidth: 1,
    borderColor: `${Colors.tertiaryFixedDim}4D`,
  },
  peakPillText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
    color: Colors.tertiaryFixedDim,
  },
  segmentedBar: {
    height: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barSegment: {
    height: '100%',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotCard: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 4,
  },
  slotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPct: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
  },
  slotLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  slotRange: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
  },
  slotAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  slotCount: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
});
