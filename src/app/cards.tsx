/**
 * MyWallet — Cards Screen (Placeholder)
 * 
 * Phase 1: Static placeholder for Credit Cards management.
 * Displays credit obligations, active cards, limits, cycle days, and utilization.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CreditCard, AlertCircle, Plus, Calendar, ArrowRight } from 'lucide-react-native';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Colors, Typography, Spacing, Shapes, Elevation } from '@/theme';

const CREDIT_CARDS = [
  {
    id: '1',
    name: 'HDFC Millennia',
    bank: 'HDFC Bank',
    last4: '4092',
    outstanding: 18450,
    limit: 150000,
    resetDay: 20,
    daysRemaining: 18,
    color: '#1E3A8A',
  },
  {
    id: '2',
    name: 'Amazon Pay ICICI',
    bank: 'ICICI Bank',
    last4: '8821',
    outstanding: 6230,
    limit: 100000,
    resetDay: 12,
    daysRemaining: 10,
    color: '#7C2D12',
  },
];

export default function CardsScreen() {
  const totalObligations = CREDIT_CARDS.reduce((sum, c) => sum + c.outstanding, 0);
  const totalLimit = CREDIT_CARDS.reduce((sum, c) => sum + c.limit, 0);
  const overallUtilization = Math.round((totalObligations / totalLimit) * 100);

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="CREDIT CARDS" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Credit Obligations Hero Card */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.heroCard}
        >
          <View style={styles.heroEyebrow}>
            <CreditCard size={14} color={Colors.primaryFixed} />
            <Text style={styles.eyebrowLabel}>TOTAL CREDIT OBLIGATIONS</Text>
          </View>

          <View style={styles.heroAmountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.heroAmount}>{totalObligations.toLocaleString('en-IN')}</Text>
            <Text style={styles.heroDecimals}>.00</Text>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>OVERALL UTILIZATION</Text>
              <Text style={[styles.statValue, { color: overallUtilization > 30 ? Colors.warning : Colors.income }]}>
                {overallUtilization}%
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>TOTAL CREDIT LIMIT</Text>
              <Text style={styles.statValue}>₹{totalLimit.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(overallUtilization, 100)}%` }]} />
          </View>
        </Animated.View>

        {/* Section Header */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>YOUR CARDS</Text>
          <TouchableOpacity style={styles.addCardButton} activeOpacity={0.7}>
            <Plus size={14} color={Colors.primaryFixed} />
            <Text style={styles.addCardText}>Add Card</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cards List */}
        {CREDIT_CARDS.map((card, idx) => {
          const util = Math.round((card.outstanding / card.limit) * 100);
          return (
            <Animated.View
              key={card.id}
              entering={FadeInDown.duration(600).delay(300 + idx * 100)}
              style={styles.cardItem}
            >
              {/* Card visual badge & title */}
              <View style={styles.cardItemHeader}>
                <View style={[styles.cardChip, { backgroundColor: card.color }]}>
                  <CreditCard size={18} color="#ffffff" />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardMeta}>{card.bank} • •••• {card.last4}</Text>
                </View>
                <View style={[styles.utilBadge, { backgroundColor: util > 30 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 230, 118, 0.15)' }]}>
                  <Text style={[styles.utilBadgeText, { color: util > 30 ? Colors.warning : Colors.income }]}>
                    {util}% used
                  </Text>
                </View>
              </View>

              {/* Outstanding & Limit */}
              <View style={styles.cardMetrics}>
                <View>
                  <Text style={styles.metricLabel}>OUTSTANDING DUE</Text>
                  <Text style={styles.metricValue}>₹{card.outstanding.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metricLabel}>CREDIT LIMIT</Text>
                  <Text style={styles.metricSubValue}>₹{card.limit.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Card utilization bar */}
              <View style={styles.cardProgressBarBg}>
                <View
                  style={[
                    styles.cardProgressBarFill,
                    {
                      width: `${Math.min(util, 100)}%`,
                      backgroundColor: util > 30 ? Colors.warning : Colors.primaryFixed,
                    },
                  ]}
                />
              </View>

              {/* Cycle info & Pay Action */}
              <View style={styles.cardFooter}>
                <View style={styles.cycleInfo}>
                  <Calendar size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.cycleText}>
                    Resets on {card.resetDay}th ({card.daysRemaining}d left)
                  </Text>
                </View>

                <TouchableOpacity style={styles.payButton} activeOpacity={0.8}>
                  <Text style={styles.payButtonText}>Pay Bill</Text>
                  <ArrowRight size={12} color={Colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}

        {/* Info notice */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.infoNotice}
        >
          <AlertCircle size={16} color={Colors.onSurfaceVariant} />
          <Text style={styles.infoNoticeText}>
            Credit card outstandings are subtracted automatically from your Total Bank Balance to calculate your real Available to Spend.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    paddingBottom: 110,
    gap: Spacing.cardGap,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.medium,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  eyebrowLabel: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.xs,
  },
  currencySymbol: {
    fontFamily: Typography.headlineSm.fontFamily,
    fontSize: 22,
    color: Colors.expense,
    marginTop: 4,
    marginRight: 2,
    fontWeight: '600',
  },
  heroAmount: {
    ...Typography.numericLg,
    fontSize: 36,
    lineHeight: 42,
    color: Colors.expense,
    fontWeight: '700',
  },
  heroDecimals: {
    ...Typography.numericMd,
    fontSize: 20,
    color: Colors.onSurfaceVariant,
    marginTop: 8,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  heroStat: {
    flex: 1,
  },
  statLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  statValue: {
    ...Typography.numericMd,
    color: Colors.onSurface,
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeSubtle,
    marginHorizontal: Spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.expense,
    borderRadius: Shapes.pill,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  addCardText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 12,
  },
  cardItem: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.sm,
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardChip: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBox: {
    flex: 1,
  },
  cardName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  cardMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  utilBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  utilBadgeText: {
    ...Typography.labelCaps,
    fontSize: 10,
    fontWeight: '700',
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  metricValue: {
    ...Typography.numericMd,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSubValue: {
    ...Typography.numericSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardProgressBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    overflow: 'hidden',
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: Shapes.pill,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  cycleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cycleText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  payButtonText: {
    ...Typography.bodySmMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginTop: Spacing.xs,
  },
  infoNoticeText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
});
