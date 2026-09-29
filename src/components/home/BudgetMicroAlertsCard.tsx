/**
 * MyWallet — Daily Budget Micro-Alerts Card
 * 
 * Tier 4, Feature 13: Proactive nudges before overspending.
 * Warns when categories cross 75%, 90%, or 100%+ thresholds
 * with remaining runway and safe daily allowance projection.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  Flame,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { BudgetMicroAlert } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface BudgetMicroAlertsCardProps {
  alerts: BudgetMicroAlert[];
  onDismissAlert?: (budgetId: string) => void;
}

export function BudgetMicroAlertsCard({ alerts }: BudgetMicroAlertsCardProps) {
  const router = useRouter();

  if (!alerts || alerts.length === 0) return null;

  const topAlert = alerts[0];

  const getAlertBadge = (level: BudgetMicroAlert['level']) => {
    switch (level) {
      case 'exceeded':
        return { label: 'BUDGET EXCEEDED', color: Colors.expense, icon: AlertCircle };
      case 'critical':
        return { label: 'NEARLY EXHAUSTED', color: '#FF8C32', icon: Flame };
      case 'caution':
      default:
        return { label: 'BUDGET WATCH', color: '#FFD93D', icon: AlertTriangle };
    }
  };

  const badge = getAlertBadge(topAlert.level);
  const BadgeIcon = badge.icon;

  const handlePressCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/budgets');
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: `${badge.color}4D`, backgroundColor: `${badge.color}0D` },
      ]}
      onPress={handlePressCard}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <View style={[styles.badgePill, { backgroundColor: `${badge.color}20` }]}>
            <BadgeIcon size={11} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          <View style={styles.catRow}>
            <View
              style={[
                styles.catIconWrap,
                { backgroundColor: `${topAlert.categoryColor}1A` },
              ]}
            >
              <CategoryIcon
                icon={topAlert.categoryIcon}
                color={topAlert.categoryColor}
                size={14}
              />
            </View>
            <Text style={styles.catName}>{topAlert.categoryName}</Text>
          </View>
        </View>

        <View style={styles.burnPill}>
          <Text style={[styles.burnPctText, { color: badge.color }]}>
            {topAlert.burnPercentage}%
          </Text>
          <Text style={styles.burnMaxText}>USED</Text>
        </View>
      </View>

      {/* Message and Allowance */}
      <Text style={styles.messageText}>{topAlert.message}</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, topAlert.burnPercentage)}%`,
              backgroundColor: badge.color,
            },
          ]}
        />
      </View>

      {/* Footer runway guidance */}
      <View style={styles.footerRow}>
        <View style={styles.runwayTag}>
          <Clock size={11} color={Colors.onSurfaceVariant} />
          <Text style={styles.runwayText}>
            {topAlert.daysRemaining} days remaining in cycle · Safe pace: ₹
            {topAlert.safeDailyAllowance}/day
          </Text>
        </View>

        <View style={styles.ctaLink}>
          <Text style={[styles.ctaText, { color: badge.color }]}>Manage</Text>
          <ChevronRight size={12} color={badge.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  badgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  burnPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  burnPctText: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '800',
  },
  burnMaxText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  messageText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 16,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  runwayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  runwayText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  ctaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctaText: {
    fontFamily: FontFamily.mono,
    fontSize: 10.5,
    fontWeight: '700',
  },
});
