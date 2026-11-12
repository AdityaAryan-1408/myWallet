/**
 * MyWallet — Finans Warm Minimal Home Screen
 * 
 * Implements the Finans design specification from DESIGN.md and UI2 mockups:
 * - Clean humanist greeting header with user avatar & notification trigger
 * - Horizontal swipe card carousel:
 *    1. Remaining to Spend (Safe-to-Spend) card using exact formula from Zenith style
 *    2. Dynamically generated account cards for each user account with balance & primary indicator
 *    3. "+ New Card" add account prompt card
 * - Eye visibility toggle for balance privacy masking across all cards
 * - Ergonomic pill quick-action buttons (Request, Transfer, Add +)
 * - Customizable modular dashboard cards matching Zenith style
 * - Edit mode banner, reordering, pinning, and bottom sheet card picker
 * - Single locked Finans Warm Minimal aesthetic
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Bell,
  Eye,
  EyeOff,
  Plus,
  Landmark,
  Wallet,
  Sparkles,
  LayoutGrid,
  Check,
  Calendar,
  CreditCard as CreditCardIcon,
} from 'lucide-react-native';

import { calculateFinancialHealth, calculateCardCycle, calculateCreditCardLifecycle } from '@/domain/financialCalculations';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';
import { useFinancialStore, useDashboardStore } from '@/stores';
import { BudgetRepository, CreditCardRepository } from '@/repositories';
import { SoundService } from '@/services';
import { MonthCalendarModal } from '@/components/dashboard';
import {
  DashboardCardWrapper,
  DashboardCardRenderer,
  DashboardCardPicker,
} from '@/components/home';

export interface HomeScreenMinimalProps {
  onNavigateTab?: (index: number) => void;
}

export default function HomeScreenMinimal({ onNavigateTab }: HomeScreenMinimalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    userName,
    avatarBadge,
    avatarPhotoUri,
    currency,
    themeMode,
    availableToSpend,
    totalBankCashBalance,
    totalAvailableBankCashBalance,
    dailySpendLimit,
    daysRemainingInMonth,
    monthlyTotals,
    overallBudget,
    refreshFinancials,
    accounts,
    creditCards,
    hiddenCardBalances,
    setPagerScrollEnabled,
    toggleCardBalanceHidden,
    isWheelMenuOpen,
  } = useFinancialStore();

  const isCardBalanceHidden = useCallback(
    (id: string) => hiddenCardBalances.includes(id),
    [hiddenCardBalances]
  );

  const [calendarVisible, setCalendarVisible] = useState(false);

  // Time-based greeting (morning, afternoon, evening, night)
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    if (hour >= 17 && hour < 22) return 'Good evening,';
    return 'Good night,';
  }, []);

  const cards = useDashboardStore((s) => s.cards);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const isPickerOpen = useDashboardStore((s) => s.isPickerOpen);
  const setPickerOpen = useDashboardStore((s) => s.setPickerOpen);
  const setEditMode = useDashboardStore((s) => s.setEditMode);
  const loadStoredLayout = useDashboardStore((s) => s.loadStoredLayout);

  const [refreshing, setRefreshing] = useState(false);

  // Re-enable tab pager scroll on unmount if it was disabled during gesture
  useEffect(() => {
    return () => {
      setPagerScrollEnabled(true);
    };
  }, [setPagerScrollEnabled]);

  // Load customizable cards layout on initial mount
  useEffect(() => {
    loadStoredLayout();
  }, [loadStoredLayout]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    SoundService.play('refresh');
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 500);
  }, [refreshFinancials]);


  // Dynamic Financial Health (Safe-to-Spend formula matching Zenith)
  const healthInfo = useMemo(() => {
    return calculateFinancialHealth({
      availableToSpend,
      overallBudget,
      totalBankCashBalance: totalAvailableBankCashBalance ?? totalBankCashBalance,
    });
  }, [availableToSpend, overallBudget, totalAvailableBankCashBalance, totalBankCashBalance]);

  // Daily Budget Micro-Alerts
  const budgetAlerts = useMemo(() => {
    return BudgetRepository.checkBudgetThresholds();
  }, [refreshing, monthlyTotals.expense]);

  // Sort visible modular cards: pinned cards first, then by display order
  const visibleCards = useMemo(() => {
    return [...cards]
      .filter((c) => c.visible)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.order - b.order;
      });
  }, [cards]);

  // Active user accounts, sorted with primary account first
  const activeAccounts = useMemo(() => {
    return (accounts || [])
      .filter((a) => a.is_active === 1)
      .sort((a, b) => (b.is_primary ?? 0) - (a.is_primary ?? 0));
  }, [accounts]);

  // Active credit cards
  const activeCreditCards = useMemo(() => {
    return (creditCards || []).filter((c) => c.is_active === 1);
  }, [creditCards]);

  // Currency Symbol
  const currencySymbol = useMemo(() => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'INR':
      default:
        return '₹';
    }
  }, [currency]);

  // Currency Flag / Emoji
  const currencyFlag = useMemo(() => {
    switch (currency) {
      case 'USD':
        return '🇺🇸';
      case 'EUR':
        return '🇪🇺';
      case 'GBP':
        return '🇬🇧';
      case 'INR':
      default:
        return '🇮🇳';
    }
  }, [currency]);

  // Format amount
  const formatAmount = (num: number) => {
    return (num ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        scrollEnabled={!isWheelMenuOpen}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 24) + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={Math.max(insets.top, 24)}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ─── 1. TOP GREETING & PROFILE BAR ─── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.profileGroup}
            onPress={() => router.push('/settings?section=profile' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarCircle}>
              {avatarPhotoUri ? (
                <Image
                  source={{ uri: avatarPhotoUri }}
                  style={styles.avatarPhoto}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>{avatarBadge || '🚀'}</Text>
              )}
            </View>
            <View style={styles.greetingMeta}>
              <Text style={styles.greetingSub}>{greetingText}</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {userName || 'Aditya'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Calendar Modal Trigger */}
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCalendarVisible(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Calendar"
            >
              <Calendar size={18} color={Colors.onSurface} strokeWidth={2} />
            </TouchableOpacity>

            {/* Notification Bell Trigger */}
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notifications' as any)}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={18} color={Colors.onSurface} strokeWidth={2} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 2. ACCOUNT SECTION & SWIPABLE CARD CAROUSEL ─── */}
        <View
          style={styles.accountSection}
          onTouchStart={() => setPagerScrollEnabled(false)}
          onTouchEnd={() => setPagerScrollEnabled(true)}
          onTouchCancel={() => setPagerScrollEnabled(true)}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>
                {(activeAccounts.length + activeCreditCards.length) > 0
                  ? `${activeAccounts.length + activeCreditCards.length} Connected`
                  : 'Active'}
              </Text>
            </View>
          </View>

          {/* Horizontal Snap Track */}
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardTrack}
            snapToInterval={302}
            decelerationRate="fast"
            onTouchStart={() => setPagerScrollEnabled(false)}
            onTouchEnd={() => setPagerScrollEnabled(true)}
            onTouchCancel={() => setPagerScrollEnabled(true)}
            onScrollBeginDrag={() => setPagerScrollEnabled(false)}
            onScrollEndDrag={() => setPagerScrollEnabled(true)}
            onMomentumScrollEnd={() => setPagerScrollEnabled(true)}
          >
            {/* ── CARD 1: REMAINING TO SPEND (Formula matches Zenith) ── */}
            <TouchableOpacity
              style={[styles.finansCard, styles.heroCardRemaining]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/breakdown' as any);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.cardGlowAmbient} />

              {/* Card Top: Currency / Shield Pill & Health Tag */}
              <View style={styles.cardTopRow}>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyFlagText}>{currencyFlag}</Text>
                  <Text style={styles.currencyCodeText}>Safe-to-Spend</Text>
                </View>
                <View
                  style={[
                    styles.healthTag,
                    {
                      backgroundColor: healthInfo.badgeBg,
                      borderColor: healthInfo.badgeBorder,
                    },
                  ]}
                >
                  <Text style={[styles.healthTagText, { color: healthInfo.badgeColor }]}>
                    {healthInfo.badgeLabel}
                  </Text>
                </View>
              </View>

              {/* Balance Row */}
              <View style={styles.cardBalanceBlock}>
                <Text style={styles.balanceLabel}>Remaining to spend</Text>
                <View style={styles.balanceNumeralRow}>
                  <Text
                    style={[
                      styles.balanceAmount,
                      availableToSpend < 0 && { color: Colors.error },
                    ]}
                    numberOfLines={1}
                  >
                    {isCardBalanceHidden('safe_to_spend')
                      ? '••••••••'
                      : `${currencySymbol}${formatAmount(availableToSpend)}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleCardBalanceHidden('safe_to_spend');
                    }}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isCardBalanceHidden('safe_to_spend') ? (
                      <EyeOff size={18} color={Colors.onSurfaceVariant} />
                    ) : (
                      <Eye size={18} color={Colors.onSurfaceVariant} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card Bottom Meta */}
              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardMetaLabel}>DAILY LIMIT</Text>
                  <Text style={styles.cardMetaValue}>
                    {currencySymbol}{dailySpendLimit.toLocaleString('en-IN')}/day limit
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardMetaLabel}>CYCLE DAYS</Text>
                  <Text style={styles.cardMetaValue}>
                    {daysRemainingInMonth} days left
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* ── SUBSEQUENT CARDS: USER ACCOUNTS (Total Balance + Primary Indicator) ── */}
            {activeAccounts.map((acc) => {
              const accSymbol =
                acc.currency === 'USD'
                  ? '$'
                  : acc.currency === 'EUR'
                  ? '€'
                  : acc.currency === 'GBP'
                  ? '£'
                  : '₹';
              const isPrimary = acc.is_primary === 1;

              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.finansCard, styles.accountCard]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onNavigateTab?.(2);
                  }}
                  activeOpacity={0.9}
                >
                  {/* Top Row: Type/Currency Badge & Primary Indicator */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.currencyBadge}>
                      {acc.type === 'bank' ? (
                        <Landmark size={14} color={Colors.primaryFixed} />
                      ) : (
                        <Wallet size={14} color={Colors.primaryFixed} />
                      )}
                      <Text style={styles.currencyCodeText}>
                        {acc.currency || currency} {acc.type === 'bank' ? 'Bank' : 'Cash'}
                      </Text>
                    </View>

                    {isPrimary ? (
                      <View style={styles.primaryPill}>
                        <Text style={styles.primaryPillText}>PRIMARY</Text>
                      </View>
                    ) : (
                      <Text style={styles.cardNetworkText}>{acc.type.toUpperCase()}</Text>
                    )}
                  </View>

                  {/* Balance Row */}
                  <View style={styles.cardBalanceBlock}>
                    <Text style={styles.balanceLabel} numberOfLines={1}>
                      {acc.institution ? `${acc.institution} • ${acc.name}` : acc.name}
                    </Text>
                    <View style={styles.balanceNumeralRow}>
                      <Text style={styles.balanceAmount} numberOfLines={1}>
                        {isCardBalanceHidden(acc.id)
                          ? '••••••••'
                          : `${accSymbol}${formatAmount(acc.balance)}`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleCardBalanceHidden(acc.id);
                        }}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {isCardBalanceHidden(acc.id) ? (
                          <EyeOff size={18} color={Colors.onSurfaceVariant} />
                        ) : (
                          <Eye size={18} color={Colors.onSurfaceVariant} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Bottom Meta */}
                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.cardMetaLabel}>ACCOUNT TYPE</Text>
                      <Text style={styles.cardMetaValue}>
                        {acc.type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardMetaLabel}>STATUS</Text>
                      <Text
                        style={[
                          styles.cardMetaValue,
                          {
                            color:
                              acc.exclude_from_total === 1
                                ? Colors.onSurfaceVariant
                                : Colors.income,
                          },
                        ]}
                      >
                        {acc.exclude_from_total === 1 ? 'Excluded' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* ── CREDIT CARDS: AVAILABLE LIMIT, TOTAL LIMIT, DUE DATE & STATEMENT TIME ── */}
            {activeCreditCards.map((card) => {
              const outstanding = CreditCardRepository.getCardOutstanding(card.id) ?? 0;
              const availableCredit = Math.max(0, (card.credit_limit || 0) - outstanding);
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

              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.finansCard, styles.accountCard]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onNavigateTab?.(3);
                  }}
                  activeOpacity={0.9}
                >
                  {/* Top Row: Credit Card Badge & Last4 / Card Pill */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.currencyBadge}>
                      <CreditCardIcon size={14} color={card.color || Colors.primaryFixed} />
                      <Text style={styles.currencyCodeText}>
                        {card.issuer ? `${card.issuer}` : 'Credit Card'}
                      </Text>
                    </View>

                    <View style={styles.primaryPill}>
                      <Text style={styles.primaryPillText}>
                        {card.last4 ? `•••• ${card.last4}` : 'CARD'}
                      </Text>
                    </View>
                  </View>

                  {/* Balance Row: Available Limit */}
                  <View style={styles.cardBalanceBlock}>
                    <Text style={styles.balanceLabel} numberOfLines={1}>
                      {card.name} • Available limit
                    </Text>
                    <View style={styles.balanceNumeralRow}>
                      <Text style={styles.balanceAmount} numberOfLines={1}>
                        {isCardBalanceHidden(card.id)
                          ? '••••••••'
                          : `${currencySymbol}${formatAmount(availableCredit)}`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleCardBalanceHidden(card.id);
                        }}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {isCardBalanceHidden(card.id) ? (
                          <EyeOff size={18} color={Colors.onSurfaceVariant} />
                        ) : (
                          <Eye size={18} color={Colors.onSurfaceVariant} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Bottom Meta: Total Limit + Due Date Time Left + Statement Gen Time Left */}
                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.cardMetaLabel}>TOTAL LIMIT</Text>
                      <Text style={styles.cardMetaValue}>
                        {isCardBalanceHidden(card.id)
                          ? '••••••'
                          : `${currencySymbol}${formatAmount(card.credit_limit)}`}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.cardMetaLabel}>DUE DATE</Text>
                      <Text
                        style={[
                          styles.cardMetaValue,
                          lifecycle.daysUntilDue !== null &&
                            lifecycle.daysUntilDue <= 3 && { color: Colors.warning },
                        ]}
                      >
                        {lifecycle.daysUntilDue !== null
                          ? lifecycle.daysUntilDue <= 0
                            ? 'Due Today'
                            : `${lifecycle.daysUntilDue}d left`
                          : 'All Clear'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardMetaLabel}>STMT GEN</Text>
                      <Text style={styles.cardMetaValue}>
                        {lifecycle.daysUntilReset}d left
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* ── CARD N: ADD ACCOUNT PROMPT ── */}
            <TouchableOpacity
              style={styles.addCardPrompt}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigateTab?.(2);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.addCardIconBox}>
                <Plus size={20} color={Colors.onSurface} />
              </View>
              <Text style={styles.addCardTitle}>New Card</Text>
              <Text style={styles.addCardSub}>Accounts & banks</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ─── 3. CUSTOMIZABLE MODULAR DASHBOARD CARDS (Matching Zenith) ─── */}
        {isEditMode && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.editModeBanner}>
            <Sparkles size={14} color={Colors.onSurface} />
            <Text style={styles.editModeBannerText}>
              Customizing Dashboard • Tap 📌 to pin, arrows to order, ✕ to hide
            </Text>
          </Animated.View>
        )}

        <View style={styles.cardsContainer}>
          {visibleCards.map((c, idx) => (
            <DashboardCardWrapper
              key={c.cardId}
              cardId={c.cardId}
              pinned={c.pinned}
              order={c.order}
              isFirst={idx === 0}
              isLast={idx === visibleCards.length - 1}
            >
              <DashboardCardRenderer
                cardId={c.cardId}
                onNavigateTab={onNavigateTab}
                onNavigateAnalytics={(tab) =>
                  router.push({ pathname: '/analytics' as any, params: { tab } })
                }
                onTransactionLogged={refreshFinancials}
                budgetAlerts={budgetAlerts}
              />
            </DashboardCardWrapper>
          ))}
        </View>

        {/* Space for bottom dock and tab bar */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ─── Floating Customize Button / Edit Mode Dock ─── */}
      {!isEditMode ? (
        <TouchableOpacity
          style={styles.floatingCustomizeBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setPickerOpen(true);
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setEditMode(true);
          }}
          activeOpacity={0.85}
        >
          <LayoutGrid size={15} color={Colors.onSurface} />
          <Text style={styles.floatingCustomizeText}>Customize</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.floatingEditDock}>
          <TouchableOpacity
            style={styles.dockAddBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPickerOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={15} color={Colors.onSurface} />
            <Text style={styles.dockAddText}>Add Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockDoneBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setEditMode(false);
            }}
            activeOpacity={0.85}
          >
            <Check size={15} color={Colors.onPrimaryContainer} />
            <Text style={styles.dockDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Dashboard Card Picker Bottom Sheet ─── */}
      <DashboardCardPicker
        visible={isPickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      {/* ─── Interactive Month Calendar Modal (Matching Zenith) ─── */}
      <MonthCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  greetingMeta: {
    justifyContent: 'center',
  },
  greetingSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
  },
  greetingName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },

  // ─── Account Section ───
  accountSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 19,
    letterSpacing: -0.3,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.chartreuseWash,
  },
  activePillText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.primaryFixed,
    fontWeight: '700',
  },

  // ─── Card Track ───
  cardTrack: {
    paddingHorizontal: Spacing.screenPadding,
    gap: 14,
  },
  finansCard: {
    width: 288,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    minHeight: 184,
    borderWidth: 1,
    borderColor: Colors.strokeLight,
    ...Platform.select({
      ios: {
        shadowColor: '#171717',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroCardRemaining: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  accountCard: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  cardGlowAmbient: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.chartreuseGlow,
    opacity: 0.18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
  },
  currencyFlagText: {
    fontSize: 14,
  },
  currencyCodeText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  cardNetworkText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  primaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.chartreuseWash,
    borderWidth: 1,
    borderColor: 'rgba(255, 219, 47, 0.45)',
  },
  primaryPillText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.onSurface,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  healthTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  healthTagText: {
    fontSize: 9,
    fontFamily: FontFamily.headingBold,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // ─── Balance Block ───
  cardBalanceBlock: {
    marginVertical: 14,
  },
  balanceLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11.5,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceNumeralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    padding: 4,
  },

  // ─── Card Bottom Meta ───
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
    paddingTop: 10,
  },
  cardMetaLabel: {
    ...Typography.labelCaps,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  cardMetaValue: {
    ...Typography.bodySm,
    fontFamily: FontFamily.numericSemiBold,
    fontSize: 12,
    color: Colors.onSurface,
    marginTop: 2,
  },

  // ─── Add Card Prompt ───
  addCardPrompt: {
    width: 130,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    borderStyle: 'dashed',
  },
  addCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addCardTitle: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  addCardSub: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },


  // ─── Modular Dashboard Cards Display ───
  cardsContainer: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.chartreuseWash,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 219, 47, 0.45)',
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  editModeBannerText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },

  // ─── Floating Controls ───
  floatingCustomizeBtn: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
    zIndex: 90,
  },
  floatingCustomizeText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  floatingEditDock: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
    zIndex: 90,
  },
  dockAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  dockAddText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  dockDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Shapes.pill,
  },
  dockDoneText: {
    ...Typography.bodySmMedium,
    color: Colors.onPrimaryContainer,
    fontSize: 12,
    fontWeight: '700',
  },
});
