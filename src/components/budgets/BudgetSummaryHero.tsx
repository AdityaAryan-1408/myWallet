/**
 * MyWallet — Budget Summary Hero Card
 * 
 * Matches media_1789928829209.png mockup:
 * - Available Capital remaining readout with cycle range
 * - Burned percentage and continuous glowing progress bar
 * - Spent amount and days remaining counter
 * - Dual metric tiles: "Safe Pace (₹X/day)" and "Estimated Spill (+₹Y cushion)"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Compass, PiggyBank, AlertTriangle } from 'lucide-react-native';

import { OverallBudgetProgress } from '@/repositories';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

interface BudgetSummaryHeroProps {
  progress: OverallBudgetProgress | null;
}

export function BudgetSummaryHero({ progress }: BudgetSummaryHeroProps) {
  if (!progress) {
    return null;
  }

  const {
    totalBudget,
    totalSpent,
    remainingCapital,
    burnedPercentage,
    cycleStartDate,
    cycleEndDate,
    daysRemaining,
    safeDailyPace,
    estimatedCushion,
    isSurplus,
  } = progress;

  // Determine hero progress bar color
  const barColor =
    burnedPercentage > 100
      ? Colors.expense
      : burnedPercentage > 90
      ? Colors.warning
      : Colors.primaryFixed;

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <Text style={styles.heroLabel}>AVAILABLE CAPITAL •</Text>
          <Text style={styles.heroAmount}>
            ₹{remainingCapital.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.heroSub}>
            Remaining of ₹{totalBudget.toLocaleString('en-IN')} budget
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.cycleText}>CYCLE: {cycleStartDate}–{cycleEndDate}</Text>
          <Text style={styles.burnedPct}>{burnedPercentage}%</Text>
          <Text style={styles.burnedLabel}>BURNED</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(burnedPercentage, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Bar Sub-Footer */}
      <View style={styles.barFooterRow}>
        <Text style={styles.barFooterText}>
          ₹{totalSpent.toLocaleString('en-IN')} spent
        </Text>
        <Text style={styles.barFooterText}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
        </Text>
      </View>

      {/* Dual Metric Tiles */}
      <View style={styles.metricsRow}>
        {/* Tile 1: Safe Pace */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            <Compass size={14} color={Colors.primaryFixed} />
            <Text style={styles.metricLabel}>Safe Pace</Text>
          </View>
          <Text style={styles.metricValue}>
            ₹{safeDailyPace.toLocaleString('en-IN')} <Text style={styles.metricUnit}>/ day</Text>
          </Text>
        </View>

        {/* Tile 2: Estimated Spill / Cushion */}
        <View style={styles.metricTile}>
          <View style={styles.metricHeader}>
            {isSurplus ? (
              <PiggyBank size={14} color={Colors.income} />
            ) : (
              <AlertTriangle size={14} color={Colors.expense} />
            )}
            <Text style={styles.metricLabel}>Estimated Spill</Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: isSurplus ? Colors.income : Colors.expense },
            ]}
          >
            {isSurplus ? `+₹${estimatedCushion.toLocaleString('en-IN')}` : `−₹${estimatedCushion.toLocaleString('en-IN')}`}{' '}
            <Text
              style={[
                styles.metricUnit,
                { color: isSurplus ? Colors.income : Colors.expense },
              ]}
            >
              {isSurplus ? 'cushion' : 'spill'}
            </Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: Colors.strokeLight,
    gap: 12,
    ...Elevation.low,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
  },
  heroLabel: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 34,
    color: Colors.onSurface,
    marginVertical: 2,
    fontVariant: ['tabular-nums'],
  },
  heroSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  cycleText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 1,
  },
  burnedPct: {
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
    color: Colors.onSurface,
    lineHeight: 32,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  burnedLabel: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Shapes.pill,
  },
  barFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barFooterText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metricTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    borderRadius: Shapes.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  metricValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 15,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: FontFamily.body,
  },
});
