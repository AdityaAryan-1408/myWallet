/**
 * MyWallet — Available to Spend Breakdown Screen
 *
 * Phase 8: Deep transparency into the safe-to-spend formula.
 * Shows a step-by-step mathematical derivation:
 *   Available = Liquid Assets − Card Obligations − Reserved Money
 *
 * Features:
 * - Live sync status indicator
 * - Hero card with animated available amount
 * - 3-step derivation with connecting operator circles
 * - Itemized breakdown per step (accounts, cards, reservations)
 * - Educational explainer with real personalised numbers
 * - Interactive CTAs: Pay Bill, Adjust Reserved Funds
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Plus,
  Minus,
  Equal,
  Lightbulb,
  CreditCard as CreditCardIcon,
  Landmark,
  Coins,
  Shield,
  Target,
  SlidersHorizontal,
} from 'lucide-react-native';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PayCardBillModal } from '@/components/cards/PayCardBillModal';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';
import { CreditCardRepository } from '@/repositories';

export default function BreakdownScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    availableToSpend,
    totalBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
    accounts,
    creditCards,
    reservations,
    refreshFinancials,
  } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [payBillVisible, setPayBillVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<typeof creditCards[0] | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Active bank/cash accounts for Step 1
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts],
  );

  // Active credit cards with outstanding for Step 2
  const activeCards = useMemo(
    () =>
      creditCards
        .filter((c) => c.is_active)
        .map((c) => ({
          ...c,
          outstanding: CreditCardRepository.getCardOutstanding(c.id),
          utilPercent: Math.round(
            (CreditCardRepository.getCardOutstanding(c.id) / c.credit_limit) * 100,
          ),
        })),
    [creditCards],
  );

  // Active reservations for Step 3
  const activeReservations = useMemo(
    () => reservations.filter((r) => r.is_active && r.affects_available),
    [reservations],
  );

  // Primary card for educational explainer & Pay Bill CTA
  const primaryCard = activeCards.length > 0 ? activeCards[0] : null;
  const primaryBankAccount = activeAccounts.find((a) => a.is_primary) || activeAccounts[0];

  const handlePayBill = () => {
    if (primaryCard) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedCard(primaryCard);
      setPayBillVisible(true);
    }
  };

  const handleAdjustReserves = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/accounts' as any, params: { section: 'reservations' } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ─── Top Bar ─── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <View style={styles.topBarLogo}>
            <Wallet size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.topBarTitle}>Calculation Breakdown</Text>
            <Text style={styles.topBarSubtitle}>MYWALLET</Text>
          </View>
        </View>

        <View style={styles.topBarAvatar}>
          <Text style={styles.avatarInitial}>
            {useFinancialStore.getState().userName?.[0]?.toUpperCase() || 'A'}
          </Text>
        </View>
      </Animated.View>

      {/* ─── Live Sync Sub-Header ─── */}
      <Animated.View entering={FadeIn.duration(400).delay(100)} style={styles.syncBar}>
        <View style={styles.syncPill}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>LIVE CALCULATION</Text>
        </View>
        <Text style={styles.syncRight}>Real-time sync</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
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
        {/* ═══════════════════════════════════════════════════════════
            HERO CARD — Available to Spend
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={[
            styles.heroCard,
            availableToSpend < 0 && styles.heroCardDeficit,
          ]}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>AVAILABLE TO SPEND</Text>
            <ShieldCheck size={22} color={Colors.income} />
          </View>

          <View style={styles.heroAmountRow}>
            <AnimatedNumber
              value={availableToSpend}
              fontSize={48}
              lineHeight={56}
              prefix="₹"
              suffix=""
              textStyle={{
                color: availableToSpend < 0 ? Colors.expense : Colors.chartreuse,
              }}
            />
            <Text style={styles.heroCurrency}>INR</Text>
          </View>

          <View style={styles.heroNoteContainer}>
            <Text style={styles.heroNote}>
              Money available after accounting for outstanding credit card obligations
              and deliberately reserved savings. This is not an editable account balance.
            </Text>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            DERIVED FINANCIAL MATH — Section Header
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>∑</Text>
          <Text style={styles.sectionTitle}>DERIVED FINANCIAL MATH</Text>
        </Animated.View>

        {/* ───────────────────────────────────────────────────────────
            STEP 1: Starting Assets (Total Liquid Funds)
            ─────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeGreen]}>
              <Plus size={16} color="#000" />
            </View>
            <View style={styles.stepTitleBlock}>
              <Text style={styles.stepLabel}>STEP 1 • STARTING ASSETS</Text>
              <Text style={styles.stepTitle}>Total Liquid Funds</Text>
            </View>
            <Text style={[styles.stepTotal, { color: Colors.income }]}>
              +₹{totalBankCashBalance.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Itemised accounts */}
          {activeAccounts.map((acc) => (
            <View key={acc.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                {acc.type === 'bank' ? (
                  <Landmark size={14} color={Colors.onSurfaceVariant} />
                ) : (
                  <Coins size={14} color={Colors.onSurfaceVariant} />
                )}
                <Text style={styles.itemName}>
                  {acc.name}
                  {acc.is_primary ? ' (Primary)' : ''}
                </Text>
              </View>
              <Text style={styles.itemAmount}>
                ₹{acc.balance.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          {activeAccounts.length === 0 && (
            <Text style={styles.emptyHint}>No active accounts configured</Text>
          )}
        </Animated.View>

        {/* ─── Operator Circle: Minus ─── */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.operatorRow}>
          <View style={[styles.operatorCircle, styles.operatorMinus]}>
            <Minus size={16} color={Colors.onSurface} />
          </View>
        </Animated.View>

        {/* ───────────────────────────────────────────────────────────
            STEP 2: Floating Debts (Card Obligations)
            ─────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeRed]}>
              <Minus size={16} color="#fff" />
            </View>
            <View style={styles.stepTitleBlock}>
              <Text style={[styles.stepLabel, { color: Colors.expense }]}>
                STEP 2 • FLOATING DEBTS
              </Text>
              <Text style={styles.stepTitle}>Card Obligations</Text>
            </View>
            <Text style={[styles.stepTotal, { color: Colors.expense }]}>
              -₹{totalCreditObligations.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Itemised credit cards */}
          {activeCards.map((card) => (
            <View key={card.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <CreditCardIcon size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.itemName}>{card.name}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemAmount}>
                  ₹{card.outstanding.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.utilTag}>
                  {card.utilPercent}% limit used
                </Text>
              </View>
            </View>
          ))}

          {activeCards.length === 0 && (
            <Text style={styles.emptyHint}>No active credit cards</Text>
          )}

          <Text style={styles.stepFootnote}>
            Pending credit purchases reduce your spendable money immediately before bill payment.
          </Text>
        </Animated.View>

        {/* ─── Operator Circle: Minus ─── */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.operatorRow}>
          <View style={[styles.operatorCircle, styles.operatorMinus]}>
            <Minus size={16} color={Colors.onSurface} />
          </View>
        </Animated.View>

        {/* ───────────────────────────────────────────────────────────
            STEP 3: Protected Goals (Reserved Money)
            ─────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeLavender]}>
              <Minus size={16} color="#fff" />
            </View>
            <View style={styles.stepTitleBlock}>
              <Text style={[styles.stepLabel, { color: '#DDB7FF' }]}>
                STEP 3 • PROTECTED GOALS
              </Text>
              <Text style={styles.stepTitle}>Reserved Money</Text>
            </View>
            <Text style={[styles.stepTotal, { color: '#DDB7FF' }]}>
              -₹{totalReservedMoney.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Itemised reservations */}
          {activeReservations.map((res) => (
            <View key={res.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                {res.target_amount ? (
                  <Target size={14} color={Colors.onSurfaceVariant} />
                ) : (
                  <Shield size={14} color={Colors.onSurfaceVariant} />
                )}
                <Text style={styles.itemName}>{res.name}</Text>
              </View>
              <Text style={styles.itemAmount}>
                ₹{res.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          {activeReservations.length === 0 && (
            <Text style={styles.emptyHint}>No active reservations</Text>
          )}

          <Text style={styles.stepFootnote}>
            Locked from daily spending to protect targets.
          </Text>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            RESULT CARD — Net Real Discretionary
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.resultCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeChartreuse]}>
              <Equal size={16} color="#000" />
            </View>
            <View style={styles.stepTitleBlock}>
              <Text style={[styles.stepLabel, { color: Colors.chartreuse }]}>
                NET REAL DISCRETIONARY
              </Text>
              <Text style={styles.stepTitle}>Available to Spend</Text>
            </View>
            <Text style={styles.resultAmount}>
              ₹{availableToSpend.toLocaleString('en-IN')}
            </Text>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            EDUCATIONAL EXPLAINER — How Credit Spending Works
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500).delay(550)} style={styles.explainerCard}>
          <View style={styles.explainerHeader}>
            <Lightbulb size={16} color={Colors.secondaryContainer} />
            <Text style={styles.explainerTitle}>HOW CREDIT SPENDING WORKS</Text>
          </View>
          <Text style={styles.explainerBody}>
            Spending{' '}
            <Text style={styles.explainerHighlight}>₹20</Text>
            {' '}on {primaryCard?.name || 'your card'} keeps bank balance at{' '}
            <Text style={styles.explainerHighlight}>
              ₹{(primaryBankAccount?.balance ?? 0).toLocaleString('en-IN')}
            </Text>
            , raises {primaryCard?.name || 'card'} obligation to{' '}
            <Text style={styles.explainerHighlight}>
              ₹{((primaryCard?.outstanding ?? 0) + 20).toLocaleString('en-IN')}
            </Text>
            , reducing your Available to Spend to{' '}
            <Text style={styles.explainerHighlight}>
              ₹{(availableToSpend - 20).toLocaleString('en-IN')}
            </Text>
            {' '}immediately.
          </Text>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            ACTION BUTTONS
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.actionsContainer}>
          {/* Primary CTA: Pay Card Bill */}
          {primaryCard && (
            <TouchableOpacity
              style={styles.primaryCTA}
              onPress={handlePayBill}
              activeOpacity={0.85}
            >
              <CreditCardIcon size={18} color="#000" />
              <Text style={styles.primaryCTAText}>
                Pay {primaryCard.name} Bill (₹{primaryCard.outstanding.toLocaleString('en-IN')})
              </Text>
            </TouchableOpacity>
          )}

          {/* Secondary CTA: Adjust Reserved Funds */}
          <TouchableOpacity
            style={styles.secondaryCTA}
            onPress={handleAdjustReserves}
            activeOpacity={0.85}
          >
            <SlidersHorizontal size={18} color={Colors.onSurface} />
            <Text style={styles.secondaryCTAText}>Adjust Reserved Funds</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ─── Pay Card Bill Modal ─── */}
      <PayCardBillModal
        visible={payBillVisible}
        card={selectedCard}
        onClose={() => {
          setPayBillVisible(false);
          setSelectedCard(null);
        }}
        onPaymentSuccess={() => {
          setPayBillVisible(false);
          setSelectedCard(null);
          refreshFinancials();
        }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // ─── Top Bar ──────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topBarLogo: {
    width: 34,
    height: 34,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  topBarTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  topBarSubtitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  topBarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  avatarInitial: {
    ...Typography.bodyMdMedium,
    color: Colors.primaryFixed,
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Sync Bar ─────────────────────────────────────────────────────
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.20)',
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.income,
  },
  syncText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 10,
    letterSpacing: 1.0,
  },
  syncRight: {
    fontFamily: FontFamily.numeric,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  // ─── Scroll ───────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.md,
  },

  // ─── Hero Card ────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.18)',
    ...Elevation.medium,
  },
  heroCardDeficit: {
    borderColor: 'rgba(255, 82, 82, 0.30)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroEyebrow: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  heroCurrency: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  heroNoteContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Shapes.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  heroNote: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },

  // ─── Section Header ──────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  sectionIcon: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.0,
  },

  // ─── Step Cards ──────────────────────────────────────────────────
  stepCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeGreen: {
    backgroundColor: Colors.income,
  },
  stepBadgeRed: {
    backgroundColor: Colors.expense,
  },
  stepBadgeLavender: {
    backgroundColor: '#8A33D9',
  },
  stepBadgeChartreuse: {
    backgroundColor: Colors.chartreuse,
  },
  stepTitleBlock: {
    flex: 1,
    gap: 1,
  },
  stepLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.income,
    letterSpacing: 0.8,
  },
  stepTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  stepTotal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },

  // ─── Item Rows (Accounts, Cards, Reservations) ───────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemName: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 13,
  },
  itemAmount: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 13,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  utilTag: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  emptyHint: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    paddingHorizontal: 4,
    fontSize: 12,
  },
  stepFootnote: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: 2,
  },

  // ─── Operator Circles ────────────────────────────────────────────
  operatorRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  operatorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  operatorMinus: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderColor: Colors.strokeBright,
  },

  // ─── Result Card ─────────────────────────────────────────────────
  resultCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.18)',
    ...Elevation.low,
  },
  resultAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
    color: Colors.chartreuse,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // ─── Explainer Card ──────────────────────────────────────────────
  explainerCard: {
    padding: Spacing.cardPadding,
    gap: Spacing.sm,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explainerTitle: {
    ...Typography.labelCaps,
    color: Colors.secondaryContainer,
    fontSize: 11,
    letterSpacing: 1.0,
  },
  explainerBody: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  explainerHighlight: {
    fontFamily: FontFamily.numericBold,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  // ─── Action Buttons ──────────────────────────────────────────────
  actionsContainer: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.chartreuse,
    paddingVertical: 16,
    borderRadius: Shapes.pill,
    ...Elevation.medium,
  },
  primaryCTAText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
  },
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 16,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeBright,
  },
  secondaryCTAText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
});
