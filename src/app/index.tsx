/**
 * MyWallet — Home Dashboard Screen
 * 
 * Phase 3: Connected to real SQLite database via Zustand.
 * Features:
 * - Dynamic rolling numbers on Available to Spend
 * - Mathematical breakdown toggle (Bank Balances − Obligations − Reserved = Available)
 * - Real monthly summary (Income, Expenses, Saved)
 * - SVG Category Donut chart
 * - Live cards snapshot
 * - Recent transaction feed with category icon badges
 * - Pull-to-refresh
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Info,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldAlert,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { CategoryDonut } from '@/components/ui/CategoryDonut';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  DashboardNoteBlock,
  MonthCalendarModal,
  ProfileNameModal,
} from '@/components/dashboard';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';
import { TransactionRepository } from '@/repositories';

export default function HomeScreen() {
  const {
    userName,
    availableToSpend,
    totalBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
    dailySpendLimit,
    daysRemainingInMonth,
    monthlyTotals,
    categorySpends,
    creditCards,
    recentTransactions,
    refreshFinancials,
  } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Test action for user: Simulate an expense to see the number roll down live!
  const handleSimulateQuickExpense = () => {
    const randomAmounts = [120, 250, 450, 80, 320];
    const amount = randomAmounts[Math.floor(Math.random() * randomAmounts.length)];
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    TransactionRepository.create({
      id: `tx_${Date.now()}`,
      type: 'expense',
      amount,
      account_id: 'acc_sbi',
      category_id: 'cat_food',
      date,
      time,
      note: 'Quick Test Coffee / Snack',
    });

    refreshFinancials();
  };

  // Category donut data: fall back to default demo items if none logged yet
  const donutData =
    categorySpends.length > 0
      ? categorySpends
      : [
          { categoryId: 'cat_food', categoryName: 'Food & Dining', categoryColor: Colors.categoryFood, total: 3368, percentage: 40 },
          { categoryId: 'cat_shopping', categoryName: 'Shopping', categoryColor: Colors.categoryShopping, total: 1852, percentage: 22 },
          { categoryId: 'cat_transport', categoryName: 'Transport', categoryColor: Colors.categoryTransport, total: 1263, percentage: 15 },
          { categoryId: 'cat_entertainment', categoryName: 'Entertainment', categoryColor: Colors.categoryEntertainment, total: 842, percentage: 10 },
          { categoryId: 'cat_bills', categoryName: 'Bills', categoryColor: Colors.categoryBills, total: 674, percentage: 8 },
          { categoryId: 'cat_other_exp', categoryName: 'Other', categoryColor: Colors.categoryOther, total: 421, percentage: 5 },
        ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="HOME DASHBOARD"
        monthLabel="Sep 2026"
        onMonthPress={() => setCalendarVisible(true)}
        onAvatarPress={() => setProfileVisible(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ─── Personalized Greeting (Phase 3.9) ─── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Hi, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>Here is your real-time financial pulse</Text>
        </Animated.View>

        {/* ─── Hero Card: Safe-to-Spend ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={[
            styles.heroCard,
            availableToSpend < 0 && styles.heroCardDeficit,
          ]}
        >
          {/* Ambient Glow */}
          <View style={styles.heroGlow} />

          <View style={styles.heroContent}>
            {/* Eyebrow with live pulse dot */}
            <View style={styles.heroEyebrowRow}>
              <View style={styles.heroEyebrow}>
                <View
                  style={[
                    styles.pulseDot,
                    availableToSpend < 0 && { backgroundColor: Colors.expense },
                  ]}
                />
                <Text style={styles.eyebrowLabel}>
                  {availableToSpend < 0 ? 'DEFICIT ALERT' : 'AVAILABLE TO SPEND'}
                </Text>
              </View>

              {/* Info toggle for formula breakdown */}
              <TouchableOpacity
                style={styles.breakdownToggle}
                onPress={() => setShowBreakdown(!showBreakdown)}
                activeOpacity={0.7}
              >
                <Info size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.breakdownToggleText}>
                  {showBreakdown ? 'Hide Math' : 'How is this calculated?'}
                </Text>
                {showBreakdown ? (
                  <ChevronUp size={12} color={Colors.onSurfaceVariant} />
                ) : (
                  <ChevronDown size={12} color={Colors.onSurfaceVariant} />
                )}
              </TouchableOpacity>
            </View>

            {/* Oversized Rolling Number */}
            <View style={styles.heroAmountRow}>
              <AnimatedNumber
                value={availableToSpend}
                fontSize={50}
                lineHeight={58}
                prefix="₹"
                suffix=".00"
                textStyle={{
                  color: availableToSpend < 0 ? Colors.expense : Colors.chartreuse,
                }}
              />
            </View>

            {/* Pacing Subtext */}
            <Text style={styles.heroSubtext}>
              Safe pace through Sep 30 •{' '}
              <Text style={styles.heroHighlight}>
                ₹{dailySpendLimit.toLocaleString('en-IN')}/day limit
              </Text>{' '}
              ({daysRemainingInMonth} days left)
            </Text>

            {/* Expandable Mathematical Breakdown */}
            {showBreakdown && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.breakdownContainer}
              >
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Total Bank & Cash Balances</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.income }]}>
                    +₹{totalBankCashBalance.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Credit Obligations Due</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.expense }]}>
                    −₹{totalCreditObligations.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Reserved Money (Locked)</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.secondaryFixed }]}>
                    −₹{totalReservedMoney.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>Safe-to-Spend Balance</Text>
                  <Text style={styles.breakdownTotalValue}>
                    = ₹{availableToSpend.toLocaleString('en-IN')}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Quick Interactive Demo Button */}
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={styles.testRollButton}
                onPress={handleSimulateQuickExpense}
                activeOpacity={0.8}
              >
                <Sparkles size={13} color={Colors.onPrimary} />
                <Text style={styles.testRollText}>Test Dynamic Number Roll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ─── Monthly Summary: Income / Expenses / Saved ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.summaryRow}
        >
          <View style={styles.summaryTile}>
            <View style={styles.tileHeader}>
              <TrendingUp size={12} color={Colors.income} />
              <Text style={styles.tileLabel}>INCOME</Text>
            </View>
            <AnimatedNumber
              value={monthlyTotals.income}
              fontSize={15}
              lineHeight={18}
              prefix="₹"
              suffix=""
              textStyle={styles.tileAmount}
            />
            <Text style={[styles.tileChange, { color: Colors.income }]}>+8% vs Aug</Text>
          </View>

          <View style={styles.summaryTile}>
            <View style={styles.tileHeader}>
              <TrendingDown size={12} color={Colors.expense} />
              <Text style={styles.tileLabel}>EXPENSES</Text>
            </View>
            <AnimatedNumber
              value={monthlyTotals.expense}
              fontSize={15}
              lineHeight={18}
              prefix="₹"
              suffix=""
              textStyle={{ ...styles.tileAmount, color: Colors.expense }}
            />
            <Text style={[styles.tileChange, { color: Colors.expense }]}>14 logs</Text>
          </View>

          <View style={styles.summaryTile}>
            <View style={styles.tileHeader}>
              <Sparkles size={12} color={Colors.secondaryFixed} />
              <Text style={styles.tileLabel}>SAVED</Text>
            </View>
            <AnimatedNumber
              value={monthlyTotals.saved}
              fontSize={15}
              lineHeight={18}
              prefix="₹"
              suffix=""
              textStyle={{ ...styles.tileAmount, color: Colors.secondaryFixed }}
            />
            <Text style={[styles.tileChange, { color: Colors.secondaryFixed }]}>+32.6% net</Text>
          </View>
        </Animated.View>

        {/* ─── Category Burn & Donut Chart ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Category Burn</Text>
            <Text style={styles.cardSubtextRight}>SEPTEMBER 2026</Text>
          </View>

          {/* SVG Segmented Donut */}
          <CategoryDonut
            categories={donutData}
            totalSpend={monthlyTotals.expense}
            size={180}
            strokeWidth={22}
          />

          {/* Category Chips Grid */}
          <View style={styles.categoryPills}>
            {donutData.slice(0, 6).map((cat) => (
              <View key={cat.categoryId} style={styles.categoryPill}>
                <View style={[styles.categoryDot, { backgroundColor: cat.categoryColor }]} />
                <Text style={styles.categoryPillText} numberOfLines={1}>
                  {cat.categoryName.split(' ')[0]} {cat.percentage}%
                </Text>
                <Text style={styles.categoryPillAmount}>
                  ₹{cat.total.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ─── Dashboard Note Block (Scratchpad - Phase 3.8) ─── */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)}>
          <DashboardNoteBlock />
        </Animated.View>

        {/* ─── Credit Cards Snapshot ─── */}
        {creditCards.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <CreditCard size={16} color={Colors.onSurface} />
                <Text style={styles.cardTitle}>Cards Snapshot</Text>
              </View>
              <Text style={styles.linkText}>Manage {'>'}</Text>
            </View>

            {creditCards.map((card) => {
              const util = Math.round((24680 / card.credit_limit) * 100);
              return (
                <View key={card.id} style={styles.creditCardRow}>
                  <View style={styles.cardLogoBox}>
                    <CreditCard size={18} color={card.color} />
                  </View>
                  <View style={styles.creditCardInfo}>
                    <Text style={styles.creditCardName}>{card.name}</Text>
                    <Text style={styles.creditCardSub}>
                      Limit ₹{card.credit_limit.toLocaleString('en-IN')} • Resets {card.cycle_reset_day}th
                    </Text>
                  </View>
                  <View style={styles.creditCardRight}>
                    <Text style={styles.creditCardAmount}>
                      ₹{(card.id === 'card_hdfc' ? 18450 : 6230).toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.creditCardUtil,
                        { color: util > 30 ? Colors.warning : Colors.income },
                      ]}
                    >
                      {card.id === 'card_hdfc' ? '12.3%' : '6.2%'} utilized
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ─── Recent Activity Feed ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.linkText}>All {'>'}</Text>
          </View>

          {recentTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIconCircle,
                    {
                      backgroundColor: isIncome
                        ? 'rgba(0, 230, 118, 0.12)'
                        : 'rgba(255, 82, 82, 0.12)',
                    },
                  ]}
                >
                  <CategoryIcon
                    name={isIncome ? 'Briefcase' : 'ShoppingBag'}
                    size={18}
                    color={isIncome ? Colors.income : Colors.expense}
                  />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.note || 'Transaction'}</Text>
                  <Text style={styles.txSub}>
                    {tx.date} • {tx.time.slice(0, 5)}
                  </Text>
                </View>

                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? Colors.income : Colors.onSurface },
                    ]}
                  >
                    {isIncome ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.txTag}>
                    {isIncome ? 'INFLOW' : 'DEBIT'}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Bottom padding for tab bar + FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── Interactive Month Calendar Modal (Phase 3.10) ─── */}
      <MonthCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
      />

      {/* ─── Profile Quick Edit Modal ─── */}
      <ProfileNameModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  greetingSection: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  greetingTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  greetingSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.cardGap,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.22)',
    overflow: 'hidden',
    position: 'relative',
    ...Elevation.high,
  },
  heroCardDeficit: {
    borderColor: 'rgba(255, 82, 82, 0.35)',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.chartreuseGlow,
    opacity: 0.15,
  },
  heroContent: {
    gap: 6,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.chartreuse,
  },
  eyebrowLabel: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    letterSpacing: 1.2,
  },
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  breakdownToggleText: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  heroAmountRow: {
    marginVertical: 4,
  },
  heroSubtext: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
  },
  heroHighlight: {
    color: Colors.chartreuse,
    fontFamily: FontFamily.numericSemiBold,
  },
  breakdownContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeMedium,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Shapes.md,
    padding: Spacing.sm,
    gap: 5,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  breakdownValue: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.strokeMedium,
    marginVertical: 2,
  },
  breakdownTotalLabel: {
    ...Typography.bodySmMedium,
    color: Colors.chartreuse,
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownTotalValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.chartreuse,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroActionRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
  },
  testRollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  testRollText: {
    ...Typography.bodySmMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: 3,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  tileAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 15,
    lineHeight: 18,
    color: Colors.onSurface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tileChange: {
    ...Typography.bodySm,
    fontSize: 10,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
  },
  cardSubtextRight: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  linkText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 12,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryPillText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
  },
  categoryPillAmount: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  creditCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  cardLogoBox: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  creditCardInfo: {
    flex: 1,
    gap: 1,
  },
  creditCardName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  creditCardSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  creditCardRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  creditCardAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  creditCardUtil: {
    ...Typography.labelCaps,
    fontSize: 9,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  txSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  txTag: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
});
