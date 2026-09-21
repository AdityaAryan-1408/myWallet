/**
 * MyWallet — Merchant Intelligence Card
 * 
 * Displays:
 * - Merchant name and spend ranking badge (#1, #2, etc.)
 * - Associated primary category with icon and color pill
 * - Cumulative historical spend and total order count
 * - Credit card perk recommendation badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ShoppingBag } from 'lucide-react-native';

import { MerchantSummary } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

interface MerchantCardProps {
  merchant: MerchantSummary;
  rank: number;
}

export function MerchantCard({ merchant, rank }: MerchantCardProps) {
  const catColor = merchant.category_color || Colors.secondaryFixed;
  const rankColor =
    rank === 1
      ? Colors.chartreuse
      : rank === 2
        ? Colors.secondaryFixed
        : rank === 3
          ? Colors.income
          : Colors.onSurfaceVariant;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Left: Rank & Merchant Info */}
        <View style={styles.leftCol}>
          <View style={[styles.rankBadge, { borderColor: `${rankColor}40` }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>#{rank}</Text>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.merchantName}>{merchant.name}</Text>
            {merchant.category_name && (
              <View style={[styles.categoryPill, { backgroundColor: `${catColor}18` }]}>
                <CategoryIcon
                  name={merchant.category_icon || 'ShoppingBag'}
                  size={11}
                  color={catColor}
                />
                <Text style={[styles.categoryText, { color: catColor }]}>
                  {merchant.category_name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Spend & Frequency */}
        <View style={styles.rightCol}>
          <Text style={styles.spendText}>
            ₹{merchant.total_spend.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.countText}>
            {merchant.transaction_count} {merchant.transaction_count === 1 ? 'order' : 'orders'}
          </Text>
        </View>
      </View>

      {/* ─── Reward Optimization Tip Banner ─── */}
      {merchant.reward_tip && (
        <View style={styles.tipBanner}>
          <Sparkles size={13} color={Colors.chartreuse} />
          <Text style={styles.tipText} numberOfLines={2}>
            {merchant.reward_tip}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: 10,
    ...Elevation.low,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rankText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  merchantName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  categoryText: {
    ...Typography.labelCaps,
    fontSize: 9,
    fontWeight: '600',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  spendText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  countText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: Shapes.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
  },
  tipText: {
    ...Typography.bodySm,
    color: Colors.chartreuse,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
});
