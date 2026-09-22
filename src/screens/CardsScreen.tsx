/**
 * MyWallet — Credit Cards Management Screen
 * 
 * Phase 6: Full credit card management matching Zenith Obsidian design:
 * - Dynamic portfolio utilization hero with health gauge
 * - Upcoming Cycle Due alert card
 * - Live cards list with auto-cycle countdowns and utilization progress bars
 * - Integrated Pay Bill modal with debt settlement semantics
 * - Card Detail inspection modal and Add/Edit Card flow
 * - Pull-to-refresh connected to SQLite
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CreditCard as CreditCardIcon,
  AlertCircle,
  Plus,
  Calendar,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import {
  PayCardBillModal,
  CardDetailModal,
  AddEditCardModal,
} from '@/components/cards';
import { CreditCard } from '@/db/schema';
import { CreditCardRepository } from '@/repositories';
import {
  calculateCardCycle,
  calculateCreditCardLifecycle,
  CreditCardLifecycleStatus,
} from '@/domain/financialCalculations';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

interface CardWithMetrics {
  card: CreditCard;
  outstanding: number;
  availableCredit: number;
  utilizationPercentage: number;
  daysRemaining: number;
  cycleStartDate: Date;
  cycleEndDate: Date;
  paymentDueDate: Date | null;
  daysUntilDue: number | null;
  lifecycleStatus: CreditCardLifecycleStatus;
  statusBadgeText: string;
  lifecycleStatusColor: string;
  statusColor: string;
  statusLabel: string;
}

export default function CardsScreen() {
  const { creditCards, refreshFinancials } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [snoozedAlertCardId, setSnoozedAlertCardId] = useState<string | null>(null);

  // Modals state
  const [payModalCard, setPayModalCard] = useState<CreditCard | null>(null);
  const [detailModalCard, setDetailModalCard] = useState<CreditCard | null>(null);
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshFinancials]);

  // Compute live metrics for each card
  const cardsWithMetrics = useMemo<CardWithMetrics[]>(() => {
    return creditCards.map((card) => {
      const outstanding = CreditCardRepository.getCardOutstanding(card.id);
      const availableCredit = Math.max(0, card.credit_limit - outstanding);
      const cycle = calculateCardCycle(outstanding, card.credit_limit, card.cycle_reset_day);

      const isPaid = CreditCardRepository.isLastStatementPaid(
        card.id,
        cycle.cycleStartDate.toISOString().split('T')[0]
      );

      const lifecycle = calculateCreditCardLifecycle(
        outstanding,
        card.credit_limit,
        card.cycle_reset_day,
        card.payment_due_day,
        isPaid
      );

      const isOptimal = cycle.utilizationPercentage <= 30;
      const isWarning = cycle.utilizationPercentage > 30 && cycle.utilizationPercentage <= 50;

      const statusColor = isOptimal
        ? Colors.income
        : isWarning
        ? Colors.warning
        : Colors.expense;

      const statusLabel = isOptimal
        ? 'OPTIMAL'
        : isWarning
        ? 'CAUTION'
        : 'HIGH';

      return {
        card,
        outstanding,
        availableCredit,
        utilizationPercentage: cycle.utilizationPercentage,
        daysRemaining: cycle.daysRemaining,
        cycleStartDate: cycle.cycleStartDate,
        cycleEndDate: cycle.cycleEndDate,
        paymentDueDate: lifecycle.paymentDueDate,
        daysUntilDue: lifecycle.daysUntilDue,
        lifecycleStatus: lifecycle.lifecycleStatus,
        statusBadgeText: lifecycle.statusBadgeText,
        lifecycleStatusColor: lifecycle.statusColor,
        statusColor,
        statusLabel,
      };
    });
  }, [creditCards]);

  // Portfolio Aggregates
  const portfolio = useMemo(() => {
    const totalOutstanding = cardsWithMetrics.reduce((sum, c) => sum + c.outstanding, 0);
    const totalLimit = cardsWithMetrics.reduce((sum, c) => sum + c.card.credit_limit, 0);
    const totalAvailable = Math.max(0, totalLimit - totalOutstanding);
    const overallUtil = totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0;

    const isOptimal = overallUtil <= 30;
    const isWarning = overallUtil > 30 && overallUtil <= 50;

    const statusColor = isOptimal
      ? Colors.income
      : isWarning
      ? Colors.warning
      : Colors.expense;

    const statusLabel = isOptimal
      ? 'OPTIMAL RATIO'
      : isWarning
      ? 'CAUTION RATIO'
      : 'HIGH UTILIZATION';

    return {
      totalOutstanding,
      totalLimit,
      totalAvailable,
      overallUtil,
      statusColor,
      statusLabel,
    };
  }, [cardsWithMetrics]);

  // Upcoming cycle due card (prioritizes overdue, due today/soon, or nearest due date)
  const nearestDueCard = useMemo(() => {
    const activeWithDues = cardsWithMetrics.filter(
      (c) => c.outstanding > 0 && c.card.id !== snoozedAlertCardId
    );
    if (activeWithDues.length === 0) return null;

    // Priority 1: Overdue cards first
    const overdueCard = activeWithDues.find((c) => c.lifecycleStatus === 'OVERDUE');
    if (overdueCard) return overdueCard;

    // Priority 2: Due today or Due soon (<= 3 days)
    const dueSoonCard = activeWithDues.find(
      (c) => c.lifecycleStatus === 'DUE_TODAY' || c.lifecycleStatus === 'DUE_SOON'
    );
    if (dueSoonCard) return dueSoonCard;

    // Priority 3: Grace period cards with closest payment due date
    const graceCards = activeWithDues.filter(
      (c) => c.lifecycleStatus === 'GRACE_PERIOD' && c.daysUntilDue !== null
    );
    if (graceCards.length > 0) {
      return graceCards.reduce((min, curr) =>
        (curr.daysUntilDue ?? 999) < (min.daysUntilDue ?? 999) ? curr : min
      );
    }

    // Priority 4: Fallback to closest reset day
    return activeWithDues.reduce((min, curr) =>
      curr.daysRemaining < min.daysRemaining ? curr : min
    );
  }, [cardsWithMetrics, snoozedAlertCardId]);

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="CREDIT CARDS" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ─── Upcoming Cycle Due / Payment Alert Card ─── */}
        {nearestDueCard && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(50)}
            style={[
              styles.alertCard,
              nearestDueCard.lifecycleStatus === 'OVERDUE' && styles.alertCardOverdue,
              (nearestDueCard.lifecycleStatus === 'DUE_SOON' || nearestDueCard.lifecycleStatus === 'DUE_TODAY') && styles.alertCardDueSoon,
            ]}
          >
            <View style={styles.alertCardTop}>
              <View style={styles.alertHeaderLeft}>
                <View style={[styles.alertIconCircle, { backgroundColor: `${nearestDueCard.lifecycleStatusColor}22` }]}>
                  <AlertCircle size={16} color={nearestDueCard.lifecycleStatusColor} />
                </View>
                <Text style={[styles.alertCardEyebrow, { color: nearestDueCard.lifecycleStatusColor }]}>
                  {nearestDueCard.lifecycleStatus === 'OVERDUE'
                    ? 'OVERDUE BILL PAYMENT'
                    : nearestDueCard.lifecycleStatus === 'DUE_TODAY'
                    ? 'BILL PAYMENT DUE TODAY'
                    : nearestDueCard.lifecycleStatus === 'DUE_SOON'
                    ? 'BILL DUE IN 3 DAYS OR LESS'
                    : nearestDueCard.lifecycleStatus === 'GRACE_PERIOD'
                    ? 'STATEMENT GENERATED • GRACE PERIOD'
                    : 'UPCOMING BILLING CYCLE'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSnoozedAlertCardId(nearestDueCard.card.id)}
                activeOpacity={0.7}
                style={styles.alertDismissBtn}
              >
                <X size={14} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.alertCardBody}>
              <Text style={styles.alertCardTitle}>
                {nearestDueCard.lifecycleStatus === 'OVERDUE' ? (
                  <>
                    {nearestDueCard.card.name} is{' '}
                    <Text style={{ color: Colors.expense, fontWeight: '700' }}>
                      OVERDUE by {Math.abs(nearestDueCard.daysUntilDue ?? 0)} days
                    </Text>
                  </>
                ) : nearestDueCard.daysUntilDue !== null && nearestDueCard.lifecycleStatus !== 'UNBILLED' ? (
                  <>
                    {nearestDueCard.card.name} bill is due in{' '}
                    <Text style={[styles.alertCardHighlight, { color: nearestDueCard.lifecycleStatusColor }]}>
                      {nearestDueCard.daysUntilDue} days
                    </Text>
                  </>
                ) : (
                  <>
                    {nearestDueCard.card.name} resets in{' '}
                    <Text style={styles.alertCardHighlight}>
                      {nearestDueCard.daysRemaining} days
                    </Text>
                  </>
                )}
              </Text>
              <Text style={styles.alertCardSub}>
                Current bill outstanding: ₹{nearestDueCard.outstanding.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.alertCardActions}>
              <TouchableOpacity
                style={styles.alertPayBtn}
                onPress={() => setPayModalCard(nearestDueCard.card)}
                activeOpacity={0.8}
              >
                <Text style={styles.alertPayText}>Review & Pay Bill</Text>
                <ArrowRight size={13} color={Colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ─── Total Portfolio Utilization Hero ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.heroCard}
        >
          <View style={styles.heroEyebrow}>
            <View style={styles.heroEyebrowLeft}>
              <CreditCardIcon size={14} color={Colors.primaryFixed} />
              <Text style={styles.eyebrowLabel}>PORTFOLIO CREDIT UTILIZATION</Text>
            </View>

            <View style={[styles.statusBadge, { borderColor: portfolio.statusColor }]}>
              <Text style={[styles.statusBadgeText, { color: portfolio.statusColor }]}>
                {portfolio.statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.heroAmountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.heroAmount}>
              {portfolio.totalOutstanding.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.heroDecimals}>.00</Text>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>UTILIZATION</Text>
              <Text style={[styles.statValue, { color: portfolio.statusColor }]}>
                {portfolio.overallUtil}%
              </Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>AVAILABLE LINE</Text>
              <Text style={[styles.statValue, { color: Colors.income }]}>
                ₹{portfolio.totalAvailable.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>AGGREGATE LIMIT</Text>
              <Text style={styles.statValue}>
                ₹{portfolio.totalLimit.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(portfolio.overallUtil, 100)}%`,
                  backgroundColor: portfolio.statusColor,
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* ─── Section Header with + Add Card Action ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>
            ACTIVE CARDS ({cardsWithMetrics.length})
          </Text>

          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => {
              setCardToEdit(null);
              setAddEditVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Plus size={14} color={Colors.primaryFixed} />
            <Text style={styles.addCardText}>Add Card</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Cards List ─── */}
        {cardsWithMetrics.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            style={styles.emptyCardsCard}
          >
            <CreditCardIcon size={36} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyCardsTitle}>No Credit Cards Configured</Text>
            <Text style={styles.emptyCardsSub}>
              Add your credit cards to monitor monthly cycle limits, dues, and payment schedules.
            </Text>
            <TouchableOpacity
              style={styles.emptyCardsAddBtn}
              onPress={() => {
                setCardToEdit(null);
                setAddEditVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#000" />
              <Text style={styles.emptyCardsAddBtnText}>Add First Card</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          cardsWithMetrics.map((item, idx) => {
          const {
            card,
            outstanding,
            utilizationPercentage,
            daysRemaining,
            statusColor,
            statusBadgeText,
            lifecycleStatusColor,
          } = item;

          return (
            <Animated.View
              key={card.id}
              entering={FadeInDown.duration(600).delay(300 + idx * 80)}
              style={styles.cardItem}
            >
              {/* Card visual badge & title */}
              <View style={styles.cardItemHeader}>
                <View style={[styles.cardChip, { backgroundColor: card.color }]}>
                  <CreditCardIcon size={18} color="#FFFFFF" />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardMeta}>
                    {card.issuer} • •••• {card.last4 || '4092'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.utilBadge,
                    { backgroundColor: `${statusColor}20` },
                  ]}
                >
                  <Text style={[styles.utilBadgeText, { color: statusColor }]}>
                    {utilizationPercentage}% used
                  </Text>
                </View>
              </View>

              {/* Outstanding & Limit */}
              <View style={styles.cardMetrics}>
                <View>
                  <Text style={styles.metricLabel}>OUTSTANDING DUE</Text>
                  <Text style={styles.metricValue}>
                    ₹{outstanding.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metricLabel}>CREDIT LIMIT</Text>
                  <Text style={styles.metricSubValue}>
                    ₹{card.credit_limit.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Card utilization bar */}
              <View style={styles.cardProgressBarBg}>
                <View
                  style={[
                    styles.cardProgressBarFill,
                    {
                      width: `${Math.min(utilizationPercentage, 100)}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>

              {/* Cycle info & Pay Actions */}
              <View style={styles.cardFooter}>
                <View style={styles.cycleInfoCol}>
                  <View style={styles.cycleRow}>
                    <Calendar size={12} color={lifecycleStatusColor} />
                    <Text style={[styles.cycleDueBadge, { color: lifecycleStatusColor }]}>
                      {statusBadgeText}
                    </Text>
                  </View>
                  <Text style={styles.cycleSubText}>
                    Statement: {card.cycle_reset_day}th monthly ({daysRemaining}d to reset)
                  </Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => setDetailModalCard(card)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailBtnText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => setPayModalCard(card)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payButtonText}>Pay Bill</Text>
                    <ArrowRight size={11} color={Colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        })
      )}

        {/* ─── Financial Notice ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.infoNotice}
        >
          <Info size={16} color={Colors.onSurfaceVariant} />
          <Text style={styles.infoNoticeText}>
            Credit card outstandings are subtracted automatically from your Total Bank Balance to calculate your real Available to Spend. Paying a bill settles the obligation and decreases bank balance without artificial expenses.
          </Text>
        </Animated.View>

        {/* Bottom padding for tab bar + FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── Pay Bill Modal ─── */}
      <PayCardBillModal
        visible={Boolean(payModalCard)}
        card={payModalCard}
        onClose={() => setPayModalCard(null)}
        onPaymentSuccess={onRefresh}
      />

      {/* ─── Card Detail Modal ─── */}
      <CardDetailModal
        visible={Boolean(detailModalCard)}
        card={detailModalCard}
        onClose={() => setDetailModalCard(null)}
        onPayBill={(c) => setPayModalCard(c)}
        onEditCard={(c) => {
          setCardToEdit(c);
          setAddEditVisible(true);
        }}
        onDeleteCard={() => {
          setDetailModalCard(null);
          onRefresh();
        }}
      />

      {/* ─── Add / Edit Card Modal ─── */}
      <AddEditCardModal
        visible={addEditVisible}
        cardToEdit={cardToEdit}
        onClose={() => {
          setAddEditVisible(false);
          setCardToEdit(null);
        }}
        onSuccess={onRefresh}
      />
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
    gap: Spacing.cardGap,
  },
  alertCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 8,
    ...Elevation.low,
  },
  alertCardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  alertCardDueSoon: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  alertCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCardEyebrow: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.warning,
    letterSpacing: 1,
  },
  alertDismissBtn: {
    padding: 4,
  },
  alertCardBody: {
    gap: 2,
  },
  alertCardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 13,
  },
  alertCardHighlight: {
    color: Colors.warning,
    fontWeight: '700',
  },
  alertCardSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  alertCardActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  alertPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  alertPayText: {
    ...Typography.bodySmMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
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
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  heroEyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowLabel: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    ...Typography.labelCaps,
    fontSize: 8,
    fontWeight: '700',
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
    fontSize: 9,
  },
  statValue: {
    ...Typography.numericMd,
    color: Colors.onSurface,
    marginTop: 2,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  dividerVertical: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeSubtle,
    marginHorizontal: Spacing.sm,
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
    borderRadius: Shapes.pill,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
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
    fontSize: 13,
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
    fontVariant: ['tabular-nums'],
  },
  metricSubValue: {
    ...Typography.numericSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
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
  cycleInfoCol: {
    gap: 2,
    flex: 1,
    paddingRight: 6,
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cycleDueBadge: {
    ...Typography.bodySmMedium,
    fontSize: 11,
    fontWeight: '700',
  },
  cycleSubText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  cycleText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  detailBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 11,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
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
  emptyCardsCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginVertical: Spacing.sm,
  },
  emptyCardsTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: Spacing.sm,
    fontSize: 15,
  },
  emptyCardsSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  emptyCardsAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
  },
  emptyCardsAddBtnText: {
    ...Typography.bodySmMedium,
    color: '#000',
    fontWeight: '700',
  },
});
