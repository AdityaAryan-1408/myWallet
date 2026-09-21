/**
 * MyWallet — Weekend vs. Weekday Velocity Audit Card
 * 
 * Phase 12: Spending velocity multiplier & weekend safe pace advisory
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Compass, ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { VelocityAuditData } from '@/repositories';

interface VelocityAuditCardProps {
  data: VelocityAuditData;
}

export function VelocityAuditCard({ data }: VelocityAuditCardProps) {
  const maxAvg = Math.max(1, Math.max(data.weekdayDailyAvg, data.weekendDailyAvg));
  const weekdayBarPct = Math.round((data.weekdayDailyAvg / maxAvg) * 100);
  const weekendBarPct = Math.round((data.weekendDailyAvg / maxAvg) * 100);

  const isSurging = data.velocityMultiplier >= 1.5;
  const isModerate = data.velocityMultiplier >= 1.1 && data.velocityMultiplier < 1.5;
  const multiplierColor = isSurging ? Colors.expense : isModerate ? '#FFD93D' : Colors.income;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Zap size={16} color={multiplierColor} />
          </View>
          <View>
            <Text style={styles.headerTitle}>WEEKEND VELOCITY AUDIT</Text>
            <Text style={styles.headerSubtitle}>Mon–Thu vs. Fri–Sun Burn Dynamics</Text>
          </View>
        </View>

        {/* Multiplier Pill */}
        <View
          style={[
            styles.multiplierPill,
            { backgroundColor: `${multiplierColor}1A`, borderColor: `${multiplierColor}4D` },
          ]}
        >
          <ArrowUpRight size={12} color={multiplierColor} />
          <Text style={[styles.multiplierText, { color: multiplierColor }]}>
            {data.velocityMultiplier}x {isSurging ? 'SURGE' : 'VELOCITY'}
          </Text>
        </View>
      </View>

      {/* Comparison Grid */}
      <View style={styles.compareGrid}>
        {/* Weekday Tile */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Text style={styles.tileLabel}>WEEKDAY (MON–THU)</Text>
            <Text style={styles.tileDays}>{data.weekdayDaysCount} days</Text>
          </View>

          <View style={styles.tileAmountRow}>
            <Text style={styles.tileAvgAmount}>₹{data.weekdayDailyAvg.toLocaleString('en-IN')}</Text>
            <Text style={styles.tileAvgUnit}>/ day</Text>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${weekdayBarPct}%`, backgroundColor: Colors.primaryFixed },
              ]}
            />
          </View>

          <Text style={styles.tileTotal}>Total: ₹{data.weekdayTotal.toLocaleString('en-IN')}</Text>
        </View>

        {/* Weekend Tile */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Text style={styles.tileLabel}>WEEKEND (FRI–SUN)</Text>
            <Text style={styles.tileDays}>{data.weekendDaysCount} days</Text>
          </View>

          <View style={styles.tileAmountRow}>
            <Text style={styles.tileAvgAmount}>₹{data.weekendDailyAvg.toLocaleString('en-IN')}</Text>
            <Text style={styles.tileAvgUnit}>/ day</Text>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${weekendBarPct}%`, backgroundColor: multiplierColor },
              ]}
            />
          </View>

          <Text style={styles.tileTotal}>Total: ₹{data.weekendTotal.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Weekend Safe Allocation Advisory */}
      <View style={styles.advisoryBox}>
        <Compass size={16} color={Colors.chartreuse} style={styles.advisoryIcon} />
        <View style={styles.advisoryContent}>
          <View style={styles.advisoryHeaderRow}>
            <Text style={styles.advisoryTitle}>WEEKEND SAFE PACE ADVISORY</Text>
            {data.weekendSafeAllocation > 0 && (
              <Text style={styles.advisoryTarget}>
                Cap: ₹{data.weekendSafeAllocation.toLocaleString('en-IN')}
              </Text>
            )}
          </View>
          <Text style={styles.advisoryText}>{data.advisoryMessage}</Text>
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
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
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
  multiplierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    gap: 4,
  },
  multiplierText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
  },
  compareGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 6,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileLabel: {
    ...Typography.labelCaps,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  tileDays: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  tileAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tileAvgAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
    color: Colors.onSurface,
  },
  tileAvgUnit: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  barTrack: {
    height: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  tileTotal: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  advisoryBox: {
    flexDirection: 'row',
    backgroundColor: `${Colors.chartreuse}0D`,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}33`,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  advisoryIcon: {
    marginTop: 2,
  },
  advisoryContent: {
    flex: 1,
    gap: 3,
  },
  advisoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advisoryTitle: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.chartreuse,
    letterSpacing: 0.8,
  },
  advisoryTarget: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
    color: Colors.chartreuse,
  },
  advisoryText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.onSurface,
  },
});
