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
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  MonthCalendarModal,
  ProfileNameModal,
} from '@/components/dashboard';
import {
  DashboardCardWrapper,
  DashboardCardRenderer,
  DashboardCardPicker,
} from '@/components/home';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useFinancialStore, useDashboardStore } from '@/stores';
import { BudgetRepository } from '@/repositories';

export interface HomeScreenProps {
  onNavigateTab?: (index: number) => void;
}

export default function HomeScreen({ onNavigateTab }: HomeScreenProps) {
  const router = useRouter();
  const {
    userName,
    availableToSpend,
    totalBankCashBalance,
    totalAvailableBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
    dailySpendLimit,
    daysRemainingInMonth,
    monthlyTotals,
    refreshFinancials,
  } = useFinancialStore();

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
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  };

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
        monthLabel="Sep 2026"
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
        {/* ─── Personalized Greeting (Permanent) ─── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Hi, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>Here is your real-time financial pulse</Text>
        </Animated.View>

        {/* ─── Hero Card: Safe-to-Spend (Permanent) ─── */}
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

              {/* Navigate to full breakdown screen */}
              <TouchableOpacity
                style={styles.breakdownToggle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/breakdown' as any);
                }}
                activeOpacity={0.7}
              >
                <Info size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.breakdownToggleText}>
                  How is this calculated? →
                </Text>
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
                  <Text style={styles.breakdownTotalLabel}>Safe-to-Spend Balance</Text>
                  <Text style={styles.breakdownTotalValue}>
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
