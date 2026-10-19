/**
 * MyWallet — Home Dashboard Screen
 * 
 * Phase 3 + Feature 15: Fully Modular & Customizable Dashboard.
 * - Dynamic rolling numbers on Available to Spend (Hero card permanently pinned)
 * - 17 Reorganizable, Pinnable, and Removable Dashboard Cards
 * - Long-press or Customize button to enter interactive Edit Mode
 * - Bottom Sheet Card Picker with category filters & toggles
 * - Persistent layout state stored locally in SQLite user_settings
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Info,
  LayoutGrid,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import {
  AnimatedNumber,
  AmbientParticleField,
  HeroBreathingHalo,
} from '@/components/ui';
import {
  MonthCalendarModal,
  ProfileNameModal,
} from '@/components/dashboard';
import {
  DashboardCardWrapper,
  DashboardCardRenderer,
  DashboardCardPicker,
  AtmosphericHorizonGreeting,
  DynamicHeroHealthGradient,
} from '@/components/home';
import { calculateFinancialHealth } from '@/domain/financialCalculations';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useFinancialStore, useDashboardStore } from '@/stores';
import { BudgetRepository } from '@/repositories';
import { SoundService } from '@/services';

export interface HomeScreenProps {
  onNavigateTab?: (index: number) => void;
}

export default function HomeScreen({ onNavigateTab }: HomeScreenProps) {
  const router = useRouter();
  const {
    userName,
    themeMode,
    availableToSpend,
    totalBankCashBalance,
    totalAvailableBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
    dailySpendLimit,
    daysRemainingInMonth,
    monthlyTotals,
    overallBudget,
    refreshFinancials,
  } = useFinancialStore();

  const isLight = themeMode === 'light' || themeMode === 'mono_light';
  const isMonoLight = themeMode === 'mono_light';
  const isMonoDark = themeMode === 'mono_dark';

  // Dynamic Financial Health (A3: Emerald-Teal / Amber-Gold / Crimson Breathing)
  const healthInfo = useMemo(() => {
    return calculateFinancialHealth({
      availableToSpend,
      overallBudget,
      totalBankCashBalance: totalAvailableBankCashBalance ?? totalBankCashBalance,
    });
  }, [availableToSpend, overallBudget, totalAvailableBankCashBalance, totalBankCashBalance]);

  // High-contrast, crystal-clear typography for the dynamic hero card
  const heroEyebrowColor = isLight
    ? (isMonoLight
        ? '#000000'
        : healthInfo.tier === 'critical'
        ? '#991B1B'
        : healthInfo.tier === 'caution'
        ? '#92400E'
        : '#065F46')
    : healthInfo.accentColor;

  const heroBadgeTextColor = isLight
    ? (isMonoLight
        ? '#000000'
        : healthInfo.tier === 'critical'
        ? '#991B1B'
        : healthInfo.tier === 'caution'
        ? '#78350F'
        : '#065F46')
    : healthInfo.badgeColor;

  const heroBadgeBgColor = isLight
    ? (healthInfo.tier === 'critical'
        ? 'rgba(239, 68, 68, 0.16)'
        : healthInfo.tier === 'caution'
        ? 'rgba(245, 158, 11, 0.18)'
        : 'rgba(16, 185, 129, 0.16)')
    : healthInfo.badgeBg;

  const heroBadgeBorderColor = isLight
    ? (healthInfo.tier === 'critical'
        ? 'rgba(220, 38, 38, 0.45)'
        : healthInfo.tier === 'caution'
        ? 'rgba(217, 119, 6, 0.45)'
        : 'rgba(5, 150, 105, 0.45)')
    : healthInfo.badgeBorder;

  const heroAmountColor = isLight
    ? (isMonoLight
        ? '#000000'
        : healthInfo.tier === 'critical'
        ? '#7F1D1D'
        : healthInfo.tier === 'caution'
        ? '#78350F'
        : '#042F2E')
    : isMonoDark
    ? '#FFFFFF'
    : healthInfo.accentColor;

  const heroSubtextColor = isLight
    ? (isMonoLight ? '#1A1A1A' : '#334155')
    : Colors.onSurfaceVariant;

  const heroHighlightColor = isLight
    ? (isMonoLight
        ? '#000000'
        : healthInfo.tier === 'critical'
        ? '#B91C1C'
        : healthInfo.tier === 'caution'
        ? '#B45309'
        : '#047857')
    : healthInfo.accentColor;

  const heroBorderColor = isLight
    ? (healthInfo.tier === 'critical'
        ? 'rgba(239, 68, 68, 0.45)'
        : healthInfo.tier === 'caution'
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(16, 185, 129, 0.40)')
    : healthInfo.borderColor;

  const cards = useDashboardStore((s) => s.cards);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const isPickerOpen = useDashboardStore((s) => s.isPickerOpen);
  const setPickerOpen = useDashboardStore((s) => s.setPickerOpen);
  const setEditMode = useDashboardStore((s) => s.setEditMode);
  const loadStoredLayout = useDashboardStore((s) => s.loadStoredLayout);

  const [refreshing, setRefreshing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  // Load layout on initial mount
  useEffect(() => {
    loadStoredLayout();
  }, [loadStoredLayout]);

  // Daily Budget Micro-Alerts (proactive warnings at 75%, 90%, 100%+)
  const budgetAlerts = useMemo(() => {
    return BudgetRepository.checkBudgetThresholds();
  }, [refreshing, monthlyTotals.expense]);

  const onRefresh = async () => {
    SoundService.play('refresh');
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Current dynamic month label (e.g. "Oct 2026") and end-of-month label (e.g. "Oct 31")
  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  const endOfMonthLabel = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.toLocaleDateString('en-US', { month: 'short' })} ${lastDay.getDate()}`;
  }, []);

  // Sort visible cards: Pinned cards first, sorted by order; then unpinned cards, sorted by order
  const visibleCards = useMemo(() => {
    return [...cards]
      .filter((c) => c.visible)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.order - b.order;
      });
  }, [cards]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="HOME DASHBOARD"
        monthLabel={currentMonthLabel}
        onMonthPress={() => setCalendarVisible(true)}
        onAvatarPress={() => setProfileVisible(true)}
      />

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
        {/* ─── Atmospheric Time-of-Day Horizon (Upgrade 4.3) ─── */}
        <AtmosphericHorizonGreeting userName={userName} />

        {/* ─── Hero Card: Safe-to-Spend with Dynamic Health Gradients (A3) ─── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={[
            styles.heroCard,
            { borderColor: heroBorderColor },
            isLight && { backgroundColor: isMonoLight ? '#FFFFFF' : '#F8FAFC' },
          ]}
        >
          {/* Dynamic Health SVG Gradient (Emerald-Teal / Amber-Gold / Crimson Breathing) */}
          <DynamicHeroHealthGradient healthTier={healthInfo.tier} isLight={isLight} />

          {/* Ambient Glow */}
          <View style={[styles.heroGlow, { backgroundColor: isLight ? 'transparent' : healthInfo.glowColor }]} />

          {/* Living Ambient Particle Field */}
          {!isLight && <AmbientParticleField color={healthInfo.accentColor} />}

          {/* Living Perimeter Breathing Halo */}
          <HeroBreathingHalo
            isDeficit={healthInfo.tier === 'critical'}
            haloColor={isLight ? (healthInfo.tier === 'critical' ? '#EF4444' : healthInfo.tier === 'caution' ? '#F59E0B' : '#10B981') : healthInfo.accentColor}
          />

          <View style={styles.heroContent}>
            {/* Eyebrow with live pulse dot + dynamic health badge */}
            <View style={styles.heroEyebrowRow}>
              <View style={styles.heroEyebrow}>
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: isLight ? (healthInfo.tier === 'critical' ? '#EF4444' : healthInfo.tier === 'caution' ? '#F59E0B' : '#10B981') : healthInfo.accentColor },
                  ]}
                />
                <Text style={[styles.eyebrowLabel, { color: heroEyebrowColor, fontWeight: '700' }]}>
                  {availableToSpend < 0 ? 'DEFICIT ALERT' : 'AVAILABLE TO SPEND'}
                </Text>

                <View
                  style={[
                    styles.healthBadge,
                    {
                      backgroundColor: heroBadgeBgColor,
                      borderColor: heroBadgeBorderColor,
                    },
                  ]}
                >
                  <Text style={[styles.healthBadgeText, { color: heroBadgeTextColor, fontWeight: '800' }]}>
                    {healthInfo.badgeLabel}
                  </Text>
                </View>
              </View>

              {/* Navigate to full breakdown screen */}
              <TouchableOpacity
                style={[
                  styles.breakdownToggle,
                  isLight && {
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(0, 0, 0, 0.14)',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/breakdown' as any);
                }}
                activeOpacity={0.7}
              >
                <Info size={14} color={isLight ? '#000000' : Colors.onSurfaceVariant} />
                <Text style={[styles.breakdownToggleText, isLight && { color: '#000000', fontWeight: '600' }]}>
                  Breakdown →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Oversized Rolling Number in dynamic health accent */}
            <View style={styles.heroAmountRow}>
              <AnimatedNumber
                value={availableToSpend}
                fontSize={50}
                lineHeight={58}
                prefix="₹"
                suffix=".00"
                textStyle={{
                  color: heroAmountColor,
                  fontWeight: '800',
                }}
              />
            </View>

            {/* Pacing Subtext */}
            <Text style={[styles.heroSubtext, { color: heroSubtextColor }]}>
              Safe pace through {endOfMonthLabel} •{' '}
              <Text style={[styles.heroHighlight, { color: heroHighlightColor, fontWeight: '700' }]}>
                ₹{dailySpendLimit.toLocaleString('en-IN')}/day limit
              </Text>{' '}
              ({daysRemainingInMonth} days left)
            </Text>

            {/* Expandable Mathematical Breakdown */}
            {showBreakdown && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[
                  styles.breakdownContainer,
                  isLight && {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderTopColor: 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Bank & Cash (in Total)</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.income }]}>
                    +₹{(totalAvailableBankCashBalance ?? totalBankCashBalance).toLocaleString('en-IN')}
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
                  <Text style={[styles.breakdownTotalLabel, isLight && { color: isMonoLight ? '#000000' : Colors.onSurface }]}>Safe-to-Spend Balance</Text>
                  <Text style={[styles.breakdownTotalValue, isLight && { color: isMonoLight ? '#000000' : Colors.onSurface }]}>
                    = ₹{availableToSpend.toLocaleString('en-IN')}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* ─── Edit Mode Banner ─── */}
        {isEditMode && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.editModeBanner}>
            <Sparkles size={14} color={Colors.chartreuse} />
            <Text style={styles.editModeBannerText}>
              Customizing Dashboard • Tap 📌 to pin, arrows to order, ✕ to hide
            </Text>
          </Animated.View>
        )}

        {/* ─── Modular Dashboard Cards ─── */}
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
              onNavigateAnalytics={(tab) => router.push({ pathname: '/analytics' as any, params: { tab } })}
              onTransactionLogged={refreshFinancials}
              budgetAlerts={budgetAlerts}
            />
          </DashboardCardWrapper>
        ))}

        {/* Bottom padding for tab bar + customize dock */}
        <View style={{ height: 120 }} />
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
          <LayoutGrid size={15} color={Colors.chartreuse} />
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
            <Check size={15} color={Colors.surface} />
            <Text style={styles.dockDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Dashboard Card Picker Bottom Sheet ─── */}
      <DashboardCardPicker
        visible={isPickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      {/* ─── Interactive Month Calendar Modal ─── */}
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
    borderColor: Colors.chartreuseGlow,
    overflow: 'hidden',
    position: 'relative',
    ...Elevation.high,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.chartreuseGlow,
    opacity: 0.18,
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
  healthBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    marginLeft: 4,
  },
  healthBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    letterSpacing: 0.6,
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
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.3)',
  },
  editModeBannerText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.chartreuse,
    fontWeight: '600',
    flex: 1,
  },
  floatingCustomizeBtn: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.35)',
    ...Elevation.high,
    zIndex: 90,
  },
  floatingCustomizeText: {
    ...Typography.bodySmMedium,
    color: Colors.chartreuse,
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
    backgroundColor: Colors.surfaceContainerHighest,
    padding: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.high,
    zIndex: 90,
  },
  dockAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
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
    backgroundColor: Colors.chartreuse,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Shapes.pill,
  },
  dockDoneText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
