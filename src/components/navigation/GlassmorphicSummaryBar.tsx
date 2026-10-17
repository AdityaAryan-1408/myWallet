/**
 * MyWallet — Glassmorphic Floating Summary Bar (A2)
 *
 * A persistent, dismissible frosted-glass floating bar that hugs the bottom
 * of the screen (aligned seamlessly alongside the FAB, above the tab bar).
 *
 * Features:
 * - Real-time "Available to Spend" balance + Safe Daily Pace
 * - Symmetrical 56dp height matching the FAB
 * - Tap to expand into a Mini Breakdown Sheet (Liquid Assets − Card Obligations − Reserved Money)
 * - Deep-link directly to full /breakdown screen
 * - Dismissible with discreet re-summon pill handle
 * - Native 60/120 FPS Reanimated motion & haptic feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import {
  Wallet,
  ChevronUp,
  X,
  ArrowRight,
  Plus,
  Minus,
  Equal,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';

import { useFinancialStore } from '@/stores';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { Colors, Shapes, Spacing, Typography } from '@/theme';

interface GlassmorphicSummaryBarProps {
  bottomOffset?: number;
}

export function GlassmorphicSummaryBar({ bottomOffset = 90 }: GlassmorphicSummaryBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const {
    availableToSpend,
    dailySpendLimit,
    daysRemainingInMonth,
    totalBankCashBalance,
    totalCreditObligations,
    totalReservedMoney,
  } = useFinancialStore();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return SettingsRepository.get('floating_summary_bar_dismissed', '0') === '1';
  });

  const [sheetVisible, setSheetVisible] = useState<boolean>(false);

  // Animation values
  const barScale = useSharedValue(1);
  const barOpacity = useSharedValue(isDismissed ? 0 : 1);
  const pillOpacity = useSharedValue(isDismissed ? 1 : 0);

  useEffect(() => {
    barOpacity.value = withTiming(isDismissed ? 0 : 1, { duration: 220 });
    pillOpacity.value = withTiming(isDismissed ? 1 : 0, { duration: 220 });
  }, [isDismissed, barOpacity, pillOpacity]);

  const handlePressIn = () => {
    barScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    barScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  };

  const handleOpenSheet = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSheetVisible(true);
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setIsDismissed(true);
    SettingsRepository.set('floating_summary_bar_dismissed', '1');
  };

  const handleRestore = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setIsDismissed(false);
    SettingsRepository.set('floating_summary_bar_dismissed', '0');
  };

  const handleNavigateBreakdown = () => {
    handleCloseSheet();
    router.push('/breakdown');
  };

  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barScale.value }],
    opacity: barOpacity.value,
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: 0.85 + 0.15 * pillOpacity.value }],
  }));

  return (
    <>
      {/* ─── Re-summon Pill (Stacked above Dashboard Customize button) ─── */}
      <Animated.View
        pointerEvents={isDismissed ? 'auto' : 'none'}
        style={[
          styles.reSummonPillWrap,
          { bottom: Math.max(bottomOffset + 54, 142), left: 16 },
          animatedPillStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.reSummonPill}
          onPress={handleRestore}
          activeOpacity={0.8}
        >
          <Wallet size={14} color="#C8F322" />
          <Text style={styles.reSummonText}>Available</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Floating Summary Bar ─── */}
      <Animated.View
        pointerEvents={isDismissed ? 'none' : 'auto'}
        style={[
          styles.floatingBarContainer,
          {
            bottom: bottomOffset,
            left: 16,
            right: 84, // Leaves 12px gap before the 56dp FAB at right: 16
          },
          animatedBarStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.floatingBarTouch}
          activeOpacity={0.92}
          onPress={handleOpenSheet}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 25}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* Left Pulse Orb + Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.pulseDot} />
            <Wallet size={16} color="#C8F322" strokeWidth={2.4} />
          </View>

          {/* Center Info: Available Balance + Pace */}
          <View style={styles.infoCol}>
            <View style={styles.labelRow}>
              <Text style={styles.labelCaps}>AVAILABLE TO SPEND</Text>
              <Text style={styles.paceBadge}>₹{dailySpendLimit}/d</Text>
            </View>
            <Text style={styles.amountText} numberOfLines={1}>
              ₹{availableToSpend.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Right Chevron & Dismiss */}
          <View style={styles.rightActions}>
            <View style={styles.chevronWrap}>
              <ChevronUp size={14} color="#A8AF90" strokeWidth={2.2} />
            </View>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <X size={12} color="#787C65" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Mini Breakdown Modal Sheet ─── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseSheet}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={handleCloseSheet}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(24, insets.bottom + 16) },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Available to Spend Math</Text>
                <Text style={styles.sheetSubtitle}>
                  Real-time formula derived from underlying records
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={handleCloseSheet}
                activeOpacity={0.7}
              >
                <X size={18} color="#A8AF90" />
              </TouchableOpacity>
            </View>

            {/* ─── Derivation Math Box ─── */}
            <View style={styles.mathContainer}>
              {/* Row 1: Liquid Bank & Cash */}
              <View style={styles.mathRow}>
                <View style={styles.mathRowLeft}>
                  <View style={[styles.mathIconBadge, { backgroundColor: 'rgba(0, 230, 118, 0.12)' }]}>
                    <Plus size={13} color="#00E676" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.mathLabel}>Total Bank & Cash Balances</Text>
                </View>
                <Text style={[styles.mathAmount, { color: '#00E676' }]}>
                  +₹{totalBankCashBalance.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Row 2: Credit Card Obligations */}
              <View style={styles.mathRow}>
                <View style={styles.mathRowLeft}>
                  <View style={[styles.mathIconBadge, { backgroundColor: 'rgba(255, 82, 82, 0.12)' }]}>
                    <Minus size={13} color="#FF5252" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.mathLabel}>Credit Card Obligations</Text>
                </View>
                <Text style={[styles.mathAmount, { color: '#FF5252' }]}>
                  −₹{totalCreditObligations.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Row 3: Reserved Money */}
              <View style={styles.mathRow}>
                <View style={styles.mathRowLeft}>
                  <View style={[styles.mathIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                    <Minus size={13} color="#A855F7" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.mathLabel}>Reserved Money (Sinking Funds)</Text>
                </View>
                <Text style={[styles.mathAmount, { color: '#A855F7' }]}>
                  −₹{totalReservedMoney.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Divider Line */}
              <View style={styles.mathDivider} />

              {/* Row 4: Net Available to Spend */}
              <View style={styles.mathRowResult}>
                <View style={styles.mathRowLeft}>
                  <View style={[styles.mathIconBadge, { backgroundColor: 'rgba(200, 243, 34, 0.15)' }]}>
                    <Equal size={13} color="#C8F322" strokeWidth={2.6} />
                  </View>
                  <Text style={styles.mathResultLabel}>AVAILABLE TO SPEND</Text>
                </View>
                <Text style={styles.mathResultAmount}>
                  ₹{availableToSpend.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* ─── Safe Pace Runway Banner ─── */}
            <View style={styles.paceBanner}>
              <View style={styles.paceIconBox}>
                <Sparkles size={16} color="#C8F322" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paceBannerTitle}>
                  ₹{dailySpendLimit.toLocaleString('en-IN')}/day Safe Pace
                </Text>
                <Text style={styles.paceBannerDesc}>
                  Paced for remaining {daysRemainingInMonth} days of your current cycle
                </Text>
              </View>
            </View>

            {/* ─── CTA: Deep Dive Breakdown ─── */}
            <TouchableOpacity
              style={styles.detailCta}
              onPress={handleNavigateBreakdown}
              activeOpacity={0.8}
            >
              <Text style={styles.detailCtaText}>View Itemized Breakdown Screen</Text>
              <ArrowRight size={15} color="#101319" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    zIndex: 90,
    backgroundColor: 'rgba(25, 28, 34, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  floatingBarTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#101319',
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C8F322',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelCaps: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 8.5,
    color: '#8F937A',
    letterSpacing: 0.5,
  },
  paceBadge: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#C8F322',
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  amountText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  chevronWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtn: {
    padding: 4,
    opacity: 0.6,
  },
  reSummonPillWrap: {
    position: 'absolute',
    zIndex: 90,
  },
  reSummonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(25, 28, 34, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  reSummonText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#C8F322',
  },

  // Modal Sheet Styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 16, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#191C22',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
    paddingHorizontal: 20,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#353942',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  sheetSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11.5,
    color: '#8F937A',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mathContainer: {
    backgroundColor: '#101319',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  mathRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mathIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mathLabel: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#C5C9AD',
  },
  mathAmount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
  },
  mathDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  mathRowResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  mathResultLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#C8F322',
    letterSpacing: 0.5,
  },
  mathResultAmount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 17,
    color: '#C8F322',
  },
  paceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.22)',
    marginBottom: 16,
  },
  paceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#101319',
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceBannerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#C8F322',
  },
  paceBannerDesc: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#A8AF90',
    marginTop: 1,
  },
  detailCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C8F322',
    borderRadius: 14,
    paddingVertical: 13,
  },
  detailCtaText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#101319',
  },
});
