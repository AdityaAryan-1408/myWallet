/**
 * MyWallet — Accounts & Reserved Money Screen
 *
 * Phase 9: Comprehensive Bank & Cash Accounts + Visual Sinking Funds (Savings Envelopes).
 * - Liquid assets overview hero card with breakdown (Total Liquid, Available to Spend, Reserved)
 * - Bank & Cash Accounts list with primary account indicator, balances, and quick edit
 * - Sinking Funds & Goals list with SVG circular progress rings, target tracking, and affects_available tags
 * - Interactive modals for adding and editing accounts and sinking fund envelopes
 * - Zero-telemetry offline security guarantee notice
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import {
  ArrowLeft,
  Wallet,
  Landmark,
  Coins,
  Plus,
  Star,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  CreditCard as CreditCardIcon,
  ChevronRight,
  EyeOff,
} from 'lucide-react-native';

import { Account, Reservation } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { AddEditAccountModal, AddEditReservationModal } from '@/components/accounts';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

type TabSection = 'all' | 'accounts' | 'reservations';

// ─── Mini SVG Progress Ring ──────────────────────────────────────────
interface MiniProgressRingProps {
  current: number;
  target?: number | null;
  size?: number;
  strokeWidth?: number;
}

function MiniProgressRing({
  current,
  target,
  size = 48,
  strokeWidth = 4,
}: MiniProgressRingProps) {
  const hasTarget = target != null && target > 0;
  const progress = hasTarget ? Math.min(Math.max(current / target, 0), 1) : 1;
  const percent = hasTarget ? Math.round((current / target) * 100) : 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColor = !hasTarget
    ? Colors.secondaryFixed
    : percent >= 100
      ? Colors.chartreuse
      : percent >= 70
        ? Colors.income
        : percent >= 40
          ? Colors.secondaryFixedDim
          : Colors.secondaryFixed;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceContainerHighest}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {hasTarget ? (
            <Text style={[styles.ringPercent, { color: ringColor }]}>
              {percent}%
            </Text>
          ) : (
            <Shield size={16} color={Colors.secondaryFixed} />
          )}
        </View>
      </View>
    </View>
  );
}

export default function AccountsReservationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    accounts,
    reservations,
    totalBankCashBalance,
    totalReservedMoney,
    availableToSpend,
    totalCreditObligations,
    refreshFinancials,
  } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabSection>('all');

  // Modal States
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);

  // Set initial tab if directed to reservations
  useEffect(() => {
    if (params.section === 'reservations') {
      setActiveTab('reservations');
    } else if (params.section === 'accounts') {
      setActiveTab('accounts');
    }
  }, [params.section]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshFinancials]);

  // Filter active accounts and reservations
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active === 1),
    [accounts],
  );

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.is_active === 1),
    [reservations],
  );

  // Account actions
  const handleOpenAddAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccountToEdit(null);
    setAccountModalVisible(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccountToEdit(acc);
    setAccountModalVisible(true);
  };

  // Reservation actions
  const handleOpenAddReservation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReservationToEdit(null);
    setReservationModalVisible(true);
  };

  const handleOpenEditReservation = (res: Reservation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReservationToEdit(res);
    setReservationModalVisible(true);
  };

  const showAccounts = activeTab === 'all' || activeTab === 'accounts';
  const showReservations = activeTab === 'all' || activeTab === 'reservations';

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
            <Text style={styles.topBarTitle}>Accounts & Reserves</Text>
            <Text style={styles.topBarSubtitle}>LIQUIDITY & SINKING FUNDS</Text>
          </View>
        </View>

        <View style={styles.topBarAvatar}>
          <Text style={styles.avatarInitial}>
            {useFinancialStore.getState().userName?.[0]?.toUpperCase() || 'A'}
          </Text>
        </View>
      </Animated.View>

      {/* ─── Segmented Navigation Filter ─── */}
      <Animated.View entering={FadeIn.duration(400).delay(50)} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('all');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
            ALL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'accounts' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('accounts');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterPillText, activeTab === 'accounts' && styles.filterPillTextActive]}>
            ACCOUNTS ({activeAccounts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'reservations' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('reservations');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterPillText, activeTab === 'reservations' && styles.filterPillTextActive]}>
            RESERVES ({activeReservations.length})
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Main Content ─── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
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
            HERO SUMMARY CARD
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>TOTAL LIQUID CAPITAL</Text>
            <View style={styles.heroBadge}>
              <View style={styles.heroDot} />
              <Text style={styles.heroBadgeText}>{activeAccounts.length} ACCOUNTS</Text>
            </View>
          </View>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>₹</Text>
            <Text style={styles.heroAmount}>
              {totalBankCashBalance.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* 3-Col Mini Metrics */}
          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>AVAILABLE</Text>
              <Text style={[styles.heroMetricVal, { color: Colors.chartreuse }]}>
                ₹{availableToSpend.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.heroMetricDivider} />

            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>RESERVED</Text>
              <Text style={[styles.heroMetricVal, { color: Colors.secondaryFixed }]}>
                ₹{totalReservedMoney.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.heroMetricDivider} />

            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>CREDIT DUE</Text>
              <Text style={[styles.heroMetricVal, { color: Colors.expense }]}>
                ₹{totalCreditObligations.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: BANK & CASH ACCOUNTS
            ═══════════════════════════════════════════════════════════ */}
        {showAccounts && (
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Landmark size={18} color={Colors.primaryFixed} />
                <Text style={styles.sectionTitle}>BANK & CASH ACCOUNTS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{activeAccounts.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.quickAddBtn}
                onPress={handleOpenAddAccount}
                activeOpacity={0.7}
              >
                <Plus size={14} color={Colors.primaryFixed} />
                <Text style={styles.quickAddText}>Add Account</Text>
              </TouchableOpacity>
            </View>

            {activeAccounts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Wallet size={32} color={Colors.onSurfaceVariant} />
                <Text style={styles.emptyTitle}>No Accounts Yet</Text>
                <Text style={styles.emptyDesc}>
                  Add your primary savings, current, or physical cash balance.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={handleOpenAddAccount}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#000" />
                  <Text style={styles.emptyBtnText}>Add First Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {activeAccounts.map((account) => {
                  const isBank = account.type === 'bank';
                  const isPrimary = account.is_primary === 1;
                  const isExcluded = account.exclude_from_total === 1;

                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountCard,
                        isPrimary && styles.primaryAccountCard,
                        isExcluded && styles.excludedAccountCard,
                      ]}
                      onPress={() => handleOpenEditAccount(account)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardLeft}>
                          <View
                            style={[
                              styles.accountIconBox,
                              isBank ? styles.bankIconBox : styles.cashIconBox,
                            ]}
                          >
                            {isBank ? (
                              <Landmark size={18} color={isExcluded ? Colors.onSurfaceVariant : Colors.primaryFixed} />
                            ) : (
                              <Coins size={18} color={isExcluded ? Colors.onSurfaceVariant : Colors.secondaryFixed} />
                            )}
                          </View>

                          <View style={styles.accountInfo}>
                            <View style={styles.accountNameRow}>
                              <Text style={[styles.accountName, isExcluded && styles.accountNameExcluded]}>
                                {account.name}
                              </Text>
                              {isPrimary && (
                                <View style={styles.primaryBadge}>
                                  <Star size={10} color="#000" fill="#000" />
                                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                                </View>
                              )}
                              {isExcluded && (
                                <View style={styles.excludedBadge}>
                                  <EyeOff size={9} color={Colors.warning} />
                                  <Text style={styles.excludedBadgeText}>EXCLUDED</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.accountSub}>
                              {account.institution || (isBank ? 'Bank Account' : 'Physical Cash')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardRight}>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.balanceText, isExcluded && styles.balanceTextExcluded]}>
                              ₹{account.balance.toLocaleString('en-IN')}
                            </Text>
                            {isExcluded && (
                              <Text style={styles.excludedSubText}>Excluded from Total</Text>
                            )}
                          </View>
                          <ChevronRight size={16} color={Colors.onSurfaceVariant} />
                        </View>
                      </View>

                      {account.notes ? (
                        <View style={styles.noteBox}>
                          <Text style={styles.noteText} numberOfLines={1}>
                            {account.notes}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}

                {/* Bottom Add CTA */}
                <TouchableOpacity
                  style={styles.dashedAddBtn}
                  onPress={handleOpenAddAccount}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dashedAddText}>Add Bank / Cash Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: SINKING FUNDS & RESERVES
            ═══════════════════════════════════════════════════════════ */}
        {showReservations && (
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <PiggyBank size={18} color={Colors.secondaryFixed} />
                <Text style={styles.sectionTitle}>SINKING FUNDS & RESERVES</Text>
                <View style={[styles.countPill, { backgroundColor: 'rgba(125, 244, 255, 0.12)' }]}>
                  <Text style={[styles.countPillText, { color: Colors.secondaryFixed }]}>
                    {activeReservations.length}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.quickAddBtn, { borderColor: 'rgba(125, 244, 255, 0.3)' }]}
                onPress={handleOpenAddReservation}
                activeOpacity={0.7}
              >
                <Plus size={14} color={Colors.secondaryFixed} />
                <Text style={[styles.quickAddText, { color: Colors.secondaryFixed }]}>
                  Add Fund
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionDesc}>
              Earmarked money protected from daily spending. Locked funds reduce your Available to Spend balance.
            </Text>

            {activeReservations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Shield size={32} color={Colors.onSurfaceVariant} />
                <Text style={styles.emptyTitle}>No Sinking Funds</Text>
                <Text style={styles.emptyDesc}>
                  Set up envelopes for emergency funds, rent deposits, or vacation savings goals.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: Colors.secondaryFixed }]}
                  onPress={handleOpenAddReservation}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#000" />
                  <Text style={styles.emptyBtnText}>Create First Envelope</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {activeReservations.map((reservation) => {
                  const hasTarget = reservation.target_amount != null && reservation.target_amount > 0;
                  const isComplete = hasTarget && reservation.amount >= reservation.target_amount!;
                  const isLocked = reservation.affects_available === 1;

                  return (
                    <TouchableOpacity
                      key={reservation.id}
                      style={styles.reservationCard}
                      onPress={() => handleOpenEditReservation(reservation)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.reservationTopRow}>
                        {/* SVG Progress Ring */}
                        <MiniProgressRing
                          current={reservation.amount}
                          target={reservation.target_amount}
                          size={48}
                          strokeWidth={4.5}
                        />

                        <View style={styles.reservationDetails}>
                          <View style={styles.reservationTitleRow}>
                            <Text style={styles.reservationName} numberOfLines={1}>
                              {reservation.name}
                            </Text>

                            {/* Affects Available Status Badge */}
                            <View
                              style={[
                                styles.lockBadge,
                                isLocked ? styles.lockBadgeActive : styles.lockBadgeMuted,
                              ]}
                            >
                              {isLocked ? (
                                <>
                                  <Lock size={10} color={Colors.chartreuse} />
                                  <Text style={styles.lockBadgeText}>LOCKED</Text>
                                </>
                              ) : (
                                <>
                                  <Unlock size={10} color={Colors.onSurfaceVariant} />
                                  <Text style={[styles.lockBadgeText, { color: Colors.onSurfaceVariant }]}>
                                    UNLOCKED
                                  </Text>
                                </>
                              )}
                            </View>
                          </View>

                          {reservation.note ? (
                            <Text style={styles.reservationNote} numberOfLines={1}>
                              {reservation.note}
                            </Text>
                          ) : null}

                          <View style={styles.reservationAmountRow}>
                            <Text style={styles.currentAmountText}>
                              ₹{reservation.amount.toLocaleString('en-IN')}
                            </Text>

                            {hasTarget ? (
                              <Text style={styles.targetAmountText}>
                                {' / '}₹{reservation.target_amount!.toLocaleString('en-IN')}
                              </Text>
                            ) : (
                              <Text style={styles.targetAmountText}> (Buffer fund)</Text>
                            )}

                            {isComplete && (
                              <View style={styles.goalCompleteTag}>
                                <CheckCircle2 size={11} color={Colors.income} />
                                <Text style={styles.goalCompleteText}>GOAL REACHED</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <ChevronRight size={16} color={Colors.onSurfaceVariant} />
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Bottom Add CTA */}
                <TouchableOpacity
                  style={styles.dashedAddBtn}
                  onPress={handleOpenAddReservation}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.onSurfaceVariant} />
                  <Text style={styles.dashedAddText}>Add Sinking Fund Envelope</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ZERO-TELEMETRY VAULT NOTICE
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.vaultNotice}>
          <ShieldCheck size={18} color={Colors.chartreuse} />
          <View style={styles.vaultContent}>
            <Text style={styles.vaultTitle}>SOVEREIGN DATA SECURITY</Text>
            <Text style={styles.vaultSub}>
              All bank details, reserve amounts, and balances are stored exclusively on your device SQLite database. Never transmitted, zero telemetry.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Modals ─── */}
      <AddEditAccountModal
        visible={accountModalVisible}
        accountToEdit={accountToEdit}
        onClose={() => setAccountModalVisible(false)}
        onSuccess={() => {
          setAccountModalVisible(false);
          refreshFinancials();
        }}
      />

      <AddEditReservationModal
        visible={reservationModalVisible}
        reservationToEdit={reservationToEdit}
        onClose={() => setReservationModalVisible(false)}
        onSuccess={() => {
          setReservationModalVisible(false);
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

  // ─── Filter Bar ───────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  filterPillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  filterPillTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // ─── Scroll View ──────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },

  // ─── Hero Card ────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    ...Elevation.medium,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroEyebrow: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.chartreuse,
  },
  heroBadgeText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9,
    fontWeight: '700',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 16,
  },
  heroCurrency: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 22,
    color: Colors.onSurfaceVariant,
  },
  heroAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 34,
    color: Colors.onSurface,
    letterSpacing: -1,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Shapes.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeSubtle,
  },
  heroMetricLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  heroMetricVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
  },

  // ─── Sections ─────────────────────────────────────────────────────
  sectionBlock: {
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  sectionDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  countPill: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  countPillText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10,
    color: Colors.primaryFixed,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    backgroundColor: 'rgba(200, 243, 34, 0.06)',
  },
  quickAddText: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // ─── Items List ───────────────────────────────────────────────────
  itemsList: {
    gap: Spacing.sm,
  },

  // ─── Account Card ─────────────────────────────────────────────────
  accountCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: 8,
  },
  primaryAccountCard: {
    borderColor: 'rgba(200, 243, 34, 0.30)',
    backgroundColor: Colors.surfaceContainer,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bankIconBox: {
    backgroundColor: 'rgba(200, 243, 34, 0.10)',
    borderColor: 'rgba(200, 243, 34, 0.25)',
  },
  cashIconBox: {
    backgroundColor: 'rgba(125, 244, 255, 0.10)',
    borderColor: 'rgba(125, 244, 255, 0.25)',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 15,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Shapes.pill,
  },
  primaryBadgeText: {
    ...Typography.labelCaps,
    color: '#000',
    fontSize: 8,
    fontWeight: '800',
  },
  excludedAccountCard: {
    opacity: 0.9,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  accountNameExcluded: {
    color: Colors.onSurfaceVariant,
  },
  excludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Shapes.pill,
  },
  excludedBadgeText: {
    ...Typography.labelCaps,
    color: Colors.warning,
    fontSize: 8,
    fontWeight: '800',
  },
  balanceTextExcluded: {
    color: Colors.onSurfaceVariant,
  },
  excludedSubText: {
    ...Typography.bodySm,
    color: Colors.warning,
    fontSize: 9,
    fontWeight: '600',
  },
  accountSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  noteBox: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  noteText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },

  // ─── Reservation Card ─────────────────────────────────────────────
  reservationCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  reservationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ringPercent: {
    fontFamily: FontFamily.numericBold,
    fontSize: 11,
  },
  reservationDetails: {
    flex: 1,
    gap: 3,
  },
  reservationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reservationName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  lockBadgeActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: 'rgba(200, 243, 34, 0.3)',
  },
  lockBadgeMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.strokeSubtle,
  },
  lockBadgeText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 8,
    fontWeight: '700',
  },
  reservationNote: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  reservationAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
  },
  currentAmountText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
    color: Colors.onSurface,
  },
  targetAmountText: {
    fontFamily: FontFamily.numeric,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  goalCompleteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Shapes.pill,
  },
  goalCompleteText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 8,
    fontWeight: '700',
  },

  // ─── Dashed Add Button ────────────────────────────────────────────
  dashedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.strokeMedium,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  dashedAddText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.8,
  },

  // ─── Empty State ──────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptyDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    marginTop: 6,
  },
  emptyBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 11,
  },

  // ─── Vault Notice ─────────────────────────────────────────────────
  vaultNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  vaultContent: {
    flex: 1,
    gap: 2,
  },
  vaultTitle: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9.5,
    letterSpacing: 1.0,
  },
  vaultSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
  },
});
