/**
 * MyWallet — Budget Category Card
 * 
 * Matches media_1789928829209.png mockup:
 * - Category icon with custom colored wash
 * - Category name & remaining balance readout
 * - Contextual health status badge (On Track, Approaching, Healthy, Over by ₹X, X% Used)
 * - State-colored progress bar
 * - Spent vs Budget ratio and exact percentage
 * - Tap to inspect / edit / delete budget target
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckCircle2,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BudgetWithProgress } from '@/repositories';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

interface BudgetCardProps {
  budget: BudgetWithProgress;
  index: number;
  onPress: (budget: BudgetWithProgress) => void;
}

export function BudgetCard({ budget, index, onPress }: BudgetCardProps) {
  const {
    categoryName,
    categoryIcon,
    categoryColor,
    budgetAmount,
    spentAmount,
    remainingAmount,
    spentPercentage,
    healthStatus,
    healthLabel,
    healthColor,
    isOverBudget,
    overAmount,
  } = budget;

  // Render contextual icon inside badge
  const renderBadgeIcon = () => {
    switch (healthStatus) {
      case 'exceeded':
        return <AlertTriangle size={11} color={Colors.expense} style={{ marginRight: 4 }} />;
      case 'warning':
        return <Clock size={11} color={healthColor} style={{ marginRight: 4 }} />;
      case 'caution':
        return <Bell size={11} color={healthColor} style={{ marginRight: 4 }} />;
      case 'healthy':
      default:
        if (healthLabel === 'On Track') {
          return <CheckCircle2 size={11} color={Colors.income} style={{ marginRight: 4 }} />;
        }
        return <ShieldCheck size={11} color={Colors.income} style={{ marginRight: 4 }} />;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(150 + index * 60)}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(budget)}
        activeOpacity={0.7}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Category Icon & Titles */}
          <View style={styles.leftGroup}>
            <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}1F` }]}>
              <CategoryIcon name={categoryIcon} size={20} color={categoryColor} />
            </View>

            <View style={styles.nameCol}>
              <Text style={styles.categoryTitle} numberOfLines={1}>
                {categoryName}
              </Text>
              <Text
                style={[
                  styles.remainingText,
                  isOverBudget && { color: Colors.expense },
                ]}
              >
                {isOverBudget
                  ? `Limit reached (over ₹${Math.round(overAmount).toLocaleString('en-IN')})`
                  : `Remaining: ₹${Math.max(0, Math.round(remainingAmount)).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>

          {/* Health Badge */}
          <View
            style={[
              styles.healthBadge,
              {
                borderColor: healthColor,
                backgroundColor:
                  healthStatus === 'exceeded'
                    ? 'rgba(255, 82, 82, 0.16)'
                    : 'transparent',
              },
            ]}
          >
            {renderBadgeIcon()}
            <Text style={[styles.healthBadgeText, { color: healthColor }]}>
              {healthLabel}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(spentPercentage, 100)}%`,
                backgroundColor: healthColor,
              },
            ]}
          />
        </View>

        {/* Footer: Spent / Budget & Percentage */}
        <View style={styles.footerRow}>
          <Text style={styles.ratioText}>
            ₹{spentAmount.toLocaleString('en-IN')} / ₹{budgetAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.percentText, { color: healthColor }]}>
            {spentPercentage.toFixed(1)}%
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 12,
    ...Elevation.low,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
  },
  categoryTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    fontFamily: FontFamily.headingSemiBold,
  },
  remainingText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  healthBadgeText: {
    ...Typography.labelCaps,
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: FontFamily.headingSemiBold,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Shapes.pill,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  percentText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
