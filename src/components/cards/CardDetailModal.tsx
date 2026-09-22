/**
 * MyWallet — Credit Card Detail Modal
 * 
 * Deep inspection sheet matching credit_card_detail_slice UI:
 * - Large outstanding due with utilization health gauge
 * - Billing cycle countdown and reset dates
 * - Current cycle category spend breakdown
 * - Recent card activity feed
 * - Direct "Pay Bill" and "Edit Card" triggers
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  CreditCard as CreditCardIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CreditCard } from '@/db/schema';
import { CreditCardRepository, TransactionWithDetails, CategorySpend } from '@/repositories';
import {
  calculateCardCycle,
  calculateCreditCardLifecycle,
} from '@/domain/financialCalculations';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export interface CardDetailModalProps {
  visible: boolean;
  card: CreditCard | null;
  onClose: () => void;
  onPayBill: (card: CreditCard) => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard?: (card: CreditCard) => void;
}

export function CardDetailModal({
  visible,
  card,
  onClose,
  onPayBill,
  onEditCard,
  onDeleteCard,
}: CardDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { refreshFinancials } = useFinancialStore();

  const outstanding = useMemo(() => {
    if (!card) return 0;
    return CreditCardRepository.getCardOutstanding(card.id);
  }, [card]);

  const cycleInfo = useMemo(() => {
    if (!card) return null;
    return calculateCardCycle(outstanding, card.credit_limit, card.cycle_reset_day);
  }, [card, outstanding]);

  const isPaid = useMemo(() => {
    if (!card || !cycleInfo) return false;
    return CreditCardRepository.isLastStatementPaid(
      card.id,
      cycleInfo.cycleStartDate.toISOString().split('T')[0]
    );
  }, [card, cycleInfo]);

  const lifecycle = useMemo(() => {
    if (!card) return null;
    return calculateCreditCardLifecycle(
      outstanding,
      card.credit_limit,
      card.cycle_reset_day,
      card.payment_due_day,
      isPaid
    );
  }, [card, outstanding, isPaid]);

  const categoryBreakdown = useMemo<CategorySpend[]>(() => {
    if (!card) return [];
    return CreditCardRepository.getCardCycleBreakdown(card.id);
  }, [card]);

  const cardTransactions = useMemo<TransactionWithDetails[]>(() => {
    if (!card) return [];
    return CreditCardRepository.getCardTransactions(card.id, 8);
  }, [card]);

  if (!card || !cycleInfo) return null;

  const availableCredit = Math.max(0, card.credit_limit - outstanding);
  const isOptimal = cycleInfo.utilizationPercentage <= 30;
  const isWarning = cycleInfo.utilizationPercentage > 30 && cycleInfo.utilizationPercentage <= 50;

  const statusColor = isOptimal
    ? Colors.income
    : isWarning
    ? Colors.warning
    : Colors.expense;

  const statusText = isOptimal
    ? 'OPTIMAL RATIO'
    : isWarning
    ? 'CAUTION RATIO'
    : 'HIGH UTILIZATION';

  const handleDeleteCard = () => {
    if (!card) return;
    Alert.alert(
      'Delete Credit Card',
      `Are you sure you want to delete "${card.name}"?\n\nThis will remove the card from your active cards and portfolio. Any historical transactions linked to this card will remain in your activity ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            CreditCardRepository.delete(card.id);
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
            refreshFinancials();
            onClose();
            onDeleteCard?.(card);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>CARD SPECIFICATION</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconButton, { marginRight: 6 }]}
                onPress={handleDeleteCard}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color={Colors.expense} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  onClose();
                  onEditCard(card);
                }}
                activeOpacity={0.7}
              >
                <Edit2 size={15} color={Colors.primaryFixed} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Visual Card Hero */}
            <View style={[styles.cardHero, { backgroundColor: card.color }]}>
              <View style={styles.cardHeroTop}>
                <View style={styles.cardChip}>
                  <CreditCardIcon size={20} color="#FFFFFF" />
                </View>
                <View style={[styles.ratioBadge, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
                  <Text style={[styles.ratioBadgeText, { color: statusColor }]}>
                    {statusText}
                  </Text>
                </View>
              </View>

              <View style={styles.cardHeroMiddle}>
                <Text style={styles.cardHeroLabel}>OUTSTANDING DUE</Text>
                <Text style={styles.cardHeroAmount}>
                  ₹{outstanding.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.cardHeroBottom}>
                <View>
                  <Text style={styles.cardHeroName}>{card.name}</Text>
                  <Text style={styles.cardHeroSub}>{card.issuer} • •••• {card.last4 || '4092'}</Text>
                </View>
                <Text style={styles.utilPercentText}>{cycleInfo.utilizationPercentage}% used</Text>
              </View>
            </View>

            {/* Metrics Breakdown Grid (2x2) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>CREDIT LIMIT</Text>
                <Text style={styles.metricValue}>₹{card.credit_limit.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>AVAILABLE LINE</Text>
                <Text style={[styles.metricValue, { color: Colors.income }]}>
                  ₹{availableCredit.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>BILL STATEMENT DAY</Text>
                <Text style={styles.metricValue}>{card.cycle_reset_day}th monthly</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>PAYMENT DUE DAY</Text>
                <Text style={[styles.metricValue, { color: card.payment_due_day ? Colors.onSurface : Colors.onSurfaceVariant }]}>
                  {card.payment_due_day ? `${card.payment_due_day}th monthly` : 'Not set'}
                </Text>
              </View>
            </View>

            {/* Lifecycle & Billing Cycle Countdown Banner */}
            <View
              style={[
                styles.cycleBanner,
                lifecycle?.lifecycleStatus === 'OVERDUE' && styles.cycleBannerOverdue,
                (lifecycle?.lifecycleStatus === 'DUE_SOON' || lifecycle?.lifecycleStatus === 'DUE_TODAY') && styles.cycleBannerDueSoon,
              ]}
            >
              {lifecycle?.lifecycleStatus === 'OVERDUE' ? (
                <AlertCircle size={20} color={Colors.expense} />
              ) : lifecycle?.lifecycleStatus === 'DUE_SOON' || lifecycle?.lifecycleStatus === 'DUE_TODAY' ? (
                <AlertCircle size={20} color={Colors.warning} />
              ) : (
                <Calendar size={18} color={lifecycle?.statusColor || Colors.primaryFixed} />
              )}
              <View style={styles.cycleInfoText}>
                <Text
                  style={[
                    styles.cycleTitle,
                    lifecycle?.lifecycleStatus === 'OVERDUE' && { color: Colors.expense, fontWeight: '700' },
                    (lifecycle?.lifecycleStatus === 'DUE_SOON' || lifecycle?.lifecycleStatus === 'DUE_TODAY') && { color: Colors.warning, fontWeight: '700' },
                  ]}
                >
                  {lifecycle ? lifecycle.statusBadgeText : `Current cycle resets in ${cycleInfo.daysRemaining} days`}
                </Text>
                <Text style={styles.cycleDates}>
                  {lifecycle?.paymentDueDate
                    ? `Statement: ${cycleInfo.cycleStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Due: ${lifecycle.paymentDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : `${cycleInfo.cycleStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${cycleInfo.cycleEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </Text>
              </View>
            </View>

            {/* PAY BILL Action Button */}
            <TouchableOpacity
              style={styles.payBillCta}
              onPress={() => {
                onClose();
                onPayBill(card);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.payBillCtaText}>
                PAY BILL (₹{outstanding.toLocaleString('en-IN')})
              </Text>
              <ArrowRight size={16} color={Colors.onPrimary} />
            </TouchableOpacity>

            {/* Category Spend Breakdown for this Card */}
            {categoryBreakdown.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <PieChart size={15} color={Colors.onSurfaceVariant} />
                  <Text style={styles.sectionTitle}>CURRENT CYCLE SPEND BREAKDOWN</Text>
                </View>

                <View style={styles.categoryPills}>
                  {categoryBreakdown.map((cat) => (
                    <View key={cat.categoryId} style={styles.categoryPill}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.categoryColor }]} />
                      <Text style={styles.categoryPillText} numberOfLines={1}>
                        {cat.categoryName} ({cat.percentage}%)
                      </Text>
                      <Text style={styles.categoryPillAmount}>
                        ₹{cat.total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Card Transactions */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <CreditCardIcon size={15} color={Colors.onSurfaceVariant} />
                <Text style={styles.sectionTitle}>RECENT CARD ACTIVITY</Text>
              </View>

              {cardTransactions.length > 0 ? (
                <View style={styles.txList}>
                  {cardTransactions.map((tx) => {
                    const isPayment = tx.type === 'transfer';
                    return (
                      <View key={tx.id} style={styles.txItem}>
                        <View
                          style={[
                            styles.txIconCircle,
                            {
                              backgroundColor: isPayment
                                ? 'rgba(0, 230, 118, 0.12)'
                                : 'rgba(255, 82, 82, 0.12)',
                            },
                          ]}
                        >
                          <CategoryIcon
                            name={isPayment ? 'ArrowRightLeft' : tx.category_icon || 'ShoppingBag'}
                            size={16}
                            color={isPayment ? Colors.income : Colors.expense}
                          />
                        </View>

                        <View style={styles.txInfo}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {tx.note || tx.category_name || (isPayment ? 'Bill Payment' : 'Purchase')}
                          </Text>
                          <Text style={styles.txDate}>
                            {tx.date} • {tx.time ? tx.time.slice(0, 5) : ''}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.txAmount,
                            { color: isPayment ? Colors.income : Colors.onSurface },
                          ]}
                        >
                          {isPayment ? '−₹' : '+₹'}{tx.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyActivityText}>No recent transactions on this card.</Text>
              )}
            </View>

            {/* Delete Card Button */}
            <TouchableOpacity
              style={styles.deleteCardBtn}
              onPress={handleDeleteCard}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color={Colors.expense} />
              <Text style={styles.deleteCardBtnText}>Delete This Card</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    borderTopWidth: 1,
    borderColor: Colors.strokeMedium,
    maxHeight: '92%',
    ...Elevation.high,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.onSurfaceVariant,
    opacity: 0.4,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerTitle: {
    ...Typography.labelCaps,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  scroll: {
    maxHeight: 620,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.md,
  },
  cardHero: {
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    gap: 16,
    ...Elevation.high,
  },
  cardHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardChip: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratioBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
  },
  ratioBadgeText: {
    ...Typography.labelCaps,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardHeroMiddle: {
    gap: 2,
  },
  cardHeroLabel: {
    ...Typography.labelCaps,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    letterSpacing: 1,
  },
  cardHeroAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardHeroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 10,
  },
  cardHeroName: {
    ...Typography.bodyMdMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cardHeroSub: {
    ...Typography.bodySm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  utilPercentText: {
    fontFamily: FontFamily.numericSemiBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 2,
  },
  metricLabel: {
    ...Typography.labelCaps,
    fontSize: 8,
    color: Colors.onSurfaceVariant,
  },
  metricValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cycleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  cycleBannerOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cycleBannerDueSoon: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  cycleInfoText: {
    gap: 2,
  },
  cycleTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  cycleDates: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  payBillCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    ...Elevation.medium,
  },
  payBillCtaText: {
    ...Typography.bodyMdMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
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
  txList: {
    gap: 8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 1,
  },
  txTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 12,
  },
  txDate: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  txAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyActivityText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    borderRadius: Shapes.lg,
    paddingVertical: 13,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  deleteCardBtnText: {
    ...Typography.bodyMdMedium,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    color: Colors.expense,
  },
});
