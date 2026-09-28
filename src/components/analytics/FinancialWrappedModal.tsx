/**
 * MyWallet — Financial Wrapped Modal (Year-in-Review)
 * 
 * Tier 2: Spotify-Wrapped style annual financial overview.
 * Story-style carousel cards:
 * 1. The Big Picture (Net Wealth, Earned, Spent, Saved, YoY comparison)
 * 2. Extreme Moments & Records (Biggest spending day, most frugal month, longest no-spend streak)
 * 3. Where Did It Go (Top 5 Categories with ranks & percentages)
 * 4. Payment Anatomy (Bank Accounts vs Credit Cards vs Cash)
 * 5. Financial Personality Badge (Algorithmic Archetype, Traits, & Share Card)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Target,
  Scale,
  Calendar,
  CreditCard,
  Wallet,
  Share2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Award,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { FinancialWrappedData } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface FinancialWrappedModalProps {
  data: FinancialWrappedData;
  visible: boolean;
  onClose: () => void;
}

const WRAPPED_COLORS = {
  bg: '#0A0E12',
  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.09)',
  cardBgElevated: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  chartreuse: '#D4FF32',
  income: '#00E676',
  expense: '#FF5252',
  secondaryFixed: '#7DF4FF',
  pillBg: 'rgba(255, 255, 255, 0.1)',
};

const TOTAL_SLIDES = 5;

export function FinancialWrappedModal({
  data,
  visible,
  onClose,
}: FinancialWrappedModalProps) {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleShare = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);

    try {
      await Share.share({
        message: data.shareableSummaryText,
        title: `MyWallet ${data.year} Financial Wrapped`,
      });
    } catch {
      // Ignored if user dismissed share dialog
    }
  };

  const getArchetypeIcon = () => {
    switch (data.personality.id) {
      case 'disciplined_vault':
        return <ShieldCheck size={36} color={data.personality.color} />;
      case 'strategic_optimizer':
        return <Target size={36} color={data.personality.color} />;
      case 'spontaneous_explorer':
        return <Sparkles size={36} color={data.personality.color} />;
      default:
        return <Scale size={36} color={data.personality.color} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Top Story Header */}
        <View style={styles.topBar}>
          {/* Progress Segment Indicators */}
          <View style={styles.progressBarWrapper}>
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i <= currentSlide && styles.progressSegmentActive,
                  i === currentSlide && { backgroundColor: data.personality.color },
                ]}
              />
            ))}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={styles.badgePill}>
              <Sparkles size={12} color={WRAPPED_COLORS.chartreuse} />
              <Text style={styles.badgePillText}>{data.year} FINANCIAL WRAPPED</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Slide Viewport */}
        <View style={styles.slideViewport}>
          {/* ── SLIDE 0: THE BIG PICTURE ── */}
          {currentSlide === 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.slideCard}>
              <View style={styles.slideHeaderBox}>
                <Text style={styles.slideSuper}>CHAPTER 01</Text>
                <Text style={styles.slideTitle}>THE WEALTH ODYSSEY</Text>
                <Text style={styles.slideSubtitle}>
                  Here is the macro cash flow that fueled your {data.year} journey:
                </Text>
              </View>

              <View style={styles.numbersGrid}>
                {/* Total Earned */}
                <View style={styles.numberTile}>
                  <Text style={styles.numberLabel}>TOTAL INFLOW</Text>
                  <Text style={[styles.numberValue, { color: Colors.income }]}>
                    ₹{data.totalIncome.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.numberSub}>Earned & credited</Text>
                </View>

                {/* Total Spent */}
                <View style={styles.numberTile}>
                  <Text style={styles.numberLabel}>TOTAL BURN</Text>
                  <Text style={[styles.numberValue, { color: Colors.expense }]}>
                    ₹{data.totalExpense.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.numberSub}>
                    {data.yoyPercentChange !== 0
                      ? `${data.yoyPercentChange > 0 ? '↑' : '↓'}${Math.abs(data.yoyPercentChange)}% vs last year`
                      : 'Logged living expenses'}
                  </Text>
                </View>
              </View>

              {/* Net Wealth Surplus Card */}
              <View style={styles.surplusHeroCard}>
                <View style={styles.surplusLeft}>
                  <Text style={styles.surplusTag}>NET WEALTH CAPITALIZED</Text>
                  <Text style={styles.surplusAmount}>
                    ₹{data.totalSaved.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.surplusMeta}>
                    You preserved <Text style={styles.boldText}>{data.savingsRate}%</Text> of every rupee earned.
                  </Text>
                </View>
                <View style={styles.savingsRateBadge}>
                  <Text style={styles.savingsRateDigit}>{data.savingsRate}%</Text>
                  <Text style={styles.savingsRateLabel}>SAVINGS RATE</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── SLIDE 1: EXTREME MOMENTS & RECORDS ── */}
          {currentSlide === 1 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.slideCard}>
              <View style={styles.slideHeaderBox}>
                <Text style={styles.slideSuper}>CHAPTER 02</Text>
                <Text style={styles.slideTitle}>EXTREMES & MILESTONES</Text>
                <Text style={styles.slideSubtitle}>
                  The peaks, valleys, and standout records that defined {data.year}:
                </Text>
              </View>

              <View style={styles.recordsList}>
                {/* Most expensive day */}
                <View style={styles.recordItem}>
                  <View style={[styles.recordIconBox, { backgroundColor: `${Colors.expense}1A` }]}>
                    <Calendar size={18} color={Colors.expense} />
                  </View>
                  <View style={styles.recordDetails}>
                    <Text style={styles.recordSub}>BIGGEST SPENDING DAY</Text>
                    <Text style={styles.recordMain}>
                      {data.mostExpensiveDay
                        ? `₹${data.mostExpensiveDay.totalSpend.toLocaleString('en-IN')} · ${data.mostExpensiveDay.formattedDate}`
                        : 'No expenses logged'}
                    </Text>
                    {data.mostExpensiveDay?.topNote && (
                      <Text style={styles.recordMeta}>
                        Primary note: "{data.mostExpensiveDay.topNote}"
                      </Text>
                    )}
                  </View>
                </View>

                {/* Cheapest month */}
                <View style={styles.recordItem}>
                  <View style={[styles.recordIconBox, { backgroundColor: `${Colors.chartreuse}1A` }]}>
                    <Award size={18} color={Colors.chartreuse} />
                  </View>
                  <View style={styles.recordDetails}>
                    <Text style={styles.recordSub}>MOST FRUGAL MONTH</Text>
                    <Text style={styles.recordMain}>
                      {data.cheapestMonth
                        ? `${data.cheapestMonth.monthName} (₹${data.cheapestMonth.totalSpend.toLocaleString('en-IN')})`
                        : 'All months balanced'}
                    </Text>
                    <Text style={styles.recordMeta}>Your leanest burn rate period</Text>
                  </View>
                </View>

                {/* Longest No-Spend Streak */}
                <View style={styles.recordItem}>
                  <View style={[styles.recordIconBox, { backgroundColor: '#FF9E0B1A' }]}>
                    <Flame size={18} color="#FF9E0B" />
                  </View>
                  <View style={styles.recordDetails}>
                    <Text style={styles.recordSub}>LONGEST NO-SPEND STREAK</Text>
                    <Text style={styles.recordMain}>{data.longestNoSpendStreak} consecutive days</Text>
                    <Text style={styles.recordMeta}>
                      Zero rupee outflow sustained like a fortress
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── SLIDE 2: WHERE DID IT GO (TOP CATEGORIES) ── */}
          {currentSlide === 2 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.slideCard}>
              <View style={styles.slideHeaderBox}>
                <Text style={styles.slideSuper}>CHAPTER 03</Text>
                <Text style={styles.slideTitle}>WHERE DID IT GO?</Text>
                <Text style={styles.slideSubtitle}>
                  Your top 5 expense drivers ranked by total outlay:
                </Text>
              </View>

              <View style={styles.categoriesList}>
                {data.topCategories.map((cat, idx) => (
                  <View key={cat.name} style={styles.categoryRow}>
                    <View style={styles.rankPill}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>

                    <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}1A` }]}>
                      <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
                    </View>

                    <View style={styles.catDetails}>
                      <View style={styles.catTopRow}>
                        <Text style={styles.catName} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <Text style={styles.catAmount}>₹{cat.total.toLocaleString('en-IN')}</Text>
                      </View>

                      <View style={styles.catBarTrack}>
                        <View
                          style={[
                            styles.catBarFill,
                            { width: `${cat.percentage}%`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>

                      <Text style={styles.catPct}>{cat.percentage}% of annual spend</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── SLIDE 3: PAYMENT ANATOMY & CARDS ── */}
          {currentSlide === 3 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.slideCard}>
              <View style={styles.slideHeaderBox}>
                <Text style={styles.slideSuper}>CHAPTER 04</Text>
                <Text style={styles.slideTitle}>PAYMENT CHANNELS</Text>
                <Text style={styles.slideSubtitle}>
                  How you settled liabilities across cards, UPI accounts, and cash:
                </Text>
              </View>

              <View style={styles.channelCards}>
                {/* Bank / UPI */}
                <View style={styles.channelRow}>
                  <View style={[styles.channelIconBox, { backgroundColor: `${Colors.primaryFixed}1A` }]}>
                    <Wallet size={18} color={Colors.primaryFixed} />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelLabel}>Bank Accounts & UPI</Text>
                    <Text style={styles.channelSub}>Direct debit liquidity</Text>
                  </View>
                  <Text style={styles.channelPct}>{data.paymentAnatomy.bankPercent}%</Text>
                </View>

                {/* Credit Cards */}
                <View style={styles.channelRow}>
                  <View style={[styles.channelIconBox, { backgroundColor: `${Colors.secondaryFixed}1A` }]}>
                    <CreditCard size={18} color={Colors.secondaryFixed} />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelLabel}>Credit Cards</Text>
                    <Text style={styles.channelSub}>Revolving credit line</Text>
                  </View>
                  <Text style={styles.channelPct}>{data.paymentAnatomy.ccPercent}%</Text>
                </View>

                {/* Cash */}
                <View style={styles.channelRow}>
                  <View style={[styles.channelIconBox, { backgroundColor: '#FFD93D1A' }]}>
                    <Target size={18} color="#FFD93D" />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelLabel}>Physical Cash</Text>
                    <Text style={styles.channelSub}>Offline notes & coins</Text>
                  </View>
                  <Text style={styles.channelPct}>{data.paymentAnatomy.cashPercent}%</Text>
                </View>
              </View>

              {/* Card Efficiency Insight */}
              {data.paymentAnatomy.highestSpendCardName && (
                <View style={styles.cardEfficiencyBox}>
                  <CreditCard size={16} color={Colors.secondaryFixed} />
                  <View style={styles.cardEfficiencyDetails}>
                    <Text style={styles.cardEfficiencyTitle}>MOST USED CREDIT CARD</Text>
                    <Text style={styles.cardEfficiencyName}>
                      {data.paymentAnatomy.highestSpendCardName}
                    </Text>
                    {data.paymentAnatomy.highestSpendCardTotal && (
                      <Text style={styles.cardEfficiencySpend}>
                        Total volume: ₹{data.paymentAnatomy.highestSpendCardTotal.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── SLIDE 4: FINANCIAL PERSONALITY ── */}
          {currentSlide === 4 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.slideCard}>
              <View style={styles.slideHeaderBox}>
                <Text style={styles.slideSuper}>CHAPTER 05</Text>
                <Text style={styles.slideTitle}>YOUR ARCHETYPE</Text>
                <Text style={styles.slideSubtitle}>
                  Based on your velocity, savings rate, and category balance:
                </Text>
              </View>

              {/* Archetype Hero Card */}
              <View
                style={[
                  styles.archetypeCard,
                  { borderColor: `${data.personality.color}66`, backgroundColor: `${data.personality.color}0D` },
                ]}
              >
                <View style={[styles.archetypeIconWrapper, { backgroundColor: `${data.personality.color}20` }]}>
                  {getArchetypeIcon()}
                </View>

                <Text style={[styles.archetypeBadgeTitle, { color: data.personality.color }]}>
                  {data.personality.badgeTitle}
                </Text>

                <Text style={styles.archetypeMotto}>"{data.personality.tagline}"</Text>

                <Text style={styles.archetypeDesc}>{data.personality.description}</Text>

                <View style={styles.traitsRow}>
                  {data.personality.traits.map((t) => (
                    <View key={t} style={styles.traitPill}>
                      <Check size={11} color={data.personality.color} />
                      <Text style={styles.traitText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Share Summary Button */}
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: data.personality.color }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#000000" />
                <Text style={styles.shareBtnText}>SHARE FINANCIAL SUMMARY</Text>
              </TouchableOpacity>

              {copiedToast && (
                <View style={styles.toast}>
                  <Check size={14} color={Colors.chartreuse} />
                  <Text style={styles.toastText}>Summary ready to share!</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Bottom Navigation Controls */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navBtn, currentSlide === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentSlide === 0}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={currentSlide === 0 ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF'} />
            <Text
              style={[
                styles.navBtnText,
                currentSlide === 0 && { color: 'rgba(255, 255, 255, 0.25)' },
              ]}
            >
              PREVIOUS
            </Text>
          </TouchableOpacity>

          <Text style={styles.slideCounter}>
            {currentSlide + 1} / {TOTAL_SLIDES}
          </Text>

          {currentSlide < TOTAL_SLIDES - 1 ? (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnText}>NEXT</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, { borderColor: WRAPPED_COLORS.chartreuse, backgroundColor: 'rgba(212, 255, 50, 0.12)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.navBtnText, { color: WRAPPED_COLORS.chartreuse }]}>DONE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0E12',
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    gap: 6,
    height: 3,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: WRAPPED_COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.3)',
  },
  badgePillText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: WRAPPED_COLORS.chartreuse,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideViewport: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  slideCard: {
    gap: Spacing.lg,
  },
  slideHeaderBox: {
    gap: 4,
  },
  slideSuper: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: WRAPPED_COLORS.chartreuse,
    letterSpacing: 1,
    fontWeight: '700',
  },
  slideTitle: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: WRAPPED_COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  slideSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: WRAPPED_COLORS.textMuted,
    lineHeight: 18,
  },
  numbersGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  numberTile: {
    flex: 1,
    backgroundColor: WRAPPED_COLORS.cardBg,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: WRAPPED_COLORS.cardBorder,
    gap: 4,
  },
  numberLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: WRAPPED_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  numberValue: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    fontWeight: '800',
  },
  numberSub: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: WRAPPED_COLORS.textSecondary,
  },
  surplusHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 255, 50, 0.08)',
    borderRadius: Shapes.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.35)',
  },
  surplusLeft: {
    flex: 1,
    gap: 4,
  },
  surplusTag: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: WRAPPED_COLORS.chartreuse,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  surplusAmount: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: WRAPPED_COLORS.chartreuse,
  },
  surplusMeta: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: WRAPPED_COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: WRAPPED_COLORS.textPrimary,
  },
  savingsRateBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
    borderWidth: 2,
    borderColor: WRAPPED_COLORS.chartreuse,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  savingsRateDigit: {
    fontFamily: FontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: WRAPPED_COLORS.chartreuse,
  },
  savingsRateLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 7,
    fontWeight: '700',
    color: WRAPPED_COLORS.chartreuse,
  },
  recordsList: {
    gap: Spacing.sm,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WRAPPED_COLORS.cardBg,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: WRAPPED_COLORS.cardBorder,
    gap: Spacing.md,
  },
  recordIconBox: {
    width: 44,
    height: 44,
    borderRadius: Shapes.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordDetails: {
    flex: 1,
    gap: 2,
  },
  recordSub: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: WRAPPED_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  recordMain: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
    color: WRAPPED_COLORS.textPrimary,
  },
  recordMeta: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: WRAPPED_COLORS.textSecondary,
  },
  categoriesList: {
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WRAPPED_COLORS.cardBg,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: WRAPPED_COLORS.cardBorder,
    gap: Spacing.sm,
  },
  rankPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    color: WRAPPED_COLORS.textSecondary,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetails: {
    flex: 1,
    gap: 3,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: WRAPPED_COLORS.textPrimary,
  },
  catAmount: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: WRAPPED_COLORS.textPrimary,
  },
  catBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  catPct: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: WRAPPED_COLORS.textMuted,
  },
  channelCards: {
    gap: Spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WRAPPED_COLORS.cardBg,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: WRAPPED_COLORS.cardBorder,
    gap: Spacing.md,
  },
  channelIconBox: {
    width: 40,
    height: 40,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: WRAPPED_COLORS.textPrimary,
  },
  channelSub: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: WRAPPED_COLORS.textMuted,
  },
  channelPct: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: WRAPPED_COLORS.textPrimary,
  },
  cardEfficiencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(125, 244, 255, 0.08)',
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(125, 244, 255, 0.25)',
  },
  cardEfficiencyDetails: {
    flex: 1,
    gap: 2,
  },
  cardEfficiencyTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: WRAPPED_COLORS.secondaryFixed,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardEfficiencyName: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    color: WRAPPED_COLORS.textPrimary,
  },
  cardEfficiencySpend: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: WRAPPED_COLORS.textSecondary,
  },
  archetypeCard: {
    borderRadius: Shapes.xxl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  archetypeIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  archetypeBadgeTitle: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  archetypeMotto: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontStyle: 'italic',
    color: WRAPPED_COLORS.textMuted,
    textAlign: 'center',
  },
  archetypeDesc: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: WRAPPED_COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  traitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  traitText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: WRAPPED_COLORS.textPrimary,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.xl,
  },
  shareBtnText: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  toastText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: WRAPPED_COLORS.chartreuse,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navBtnDisabled: {
    opacity: 0.4,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  navBtnText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    color: WRAPPED_COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  slideCounter: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: WRAPPED_COLORS.textMuted,
  },
});
