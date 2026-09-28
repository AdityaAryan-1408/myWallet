/**
 * MyWallet — End-of-Month Financial Digest Card
 * 
 * Tier 3: Complete month-end intelligence report card & notification preview:
 * - 💰 The Numbers (Income, Expenses, Saved, Savings Rate, MoM delta)
 * - 🏆 Wins (Category budgets respected, no-spend streaks, debt settlements)
 * - ⚠️ Watch-Outs (Spikes, weekend multipliers, rolling avg surges)
 * - 📊 Top 5 Categories with proportional bars & deltas
 * - 💡 Next Month Game Plan
 * - 📈 Health Score Comparison
 * - 🔔 "Post Test Notification" button: immediately pushes rich notification to Android status bar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bell,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { MonthlyFinancialDigestData } from '@/repositories';
import { NotificationService } from '@/services/notificationService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface MonthlyDigestCardProps {
  digest: MonthlyFinancialDigestData;
}

export function MonthlyDigestCard({ digest }: MonthlyDigestCardProps) {
  const [notificationSent, setNotificationSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendNotificationPreview = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSending(true);

    try {
      const success = await NotificationService.postSystemNotification({
        id: `digest_${digest.monthKey}`,
        title: `📊 ${digest.monthLabel} — Financial Digest`,
        body: digest.formattedNotificationText,
        channelId: 'channel_general',
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNotificationSent(true);
        setTimeout(() => setNotificationSent(false), 4000);
      } else {
        Alert.alert(
          'Notification Notice',
          'Notifications are currently disabled in Settings or permission was not granted.'
        );
      }
    } catch (e: any) {
      Alert.alert('Notification Notice', e.message || 'Unable to post notification.');
    } finally {
      setIsSending(false);
    }
  };

  const isExpenseDown = digest.theNumbers.expensePercentChangeVsPrev <= 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.chartreuse}1A` }]}>
            <FileText size={16} color={Colors.chartreuse} />
          </View>
          <View>
            <Text style={styles.headerTitle}>FINANCIAL DIGEST</Text>
            <Text style={styles.headerSubtitle}>{digest.monthLabel} Intelligence Audit</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.notifBtn,
            notificationSent && { backgroundColor: `${Colors.chartreuse}26`, borderColor: Colors.chartreuse },
          ]}
          onPress={handleSendNotificationPreview}
          disabled={isSending}
          activeOpacity={0.7}
        >
          <Bell size={12} color={notificationSent ? Colors.chartreuse : Colors.onSurface} />
          <Text
            style={[
              styles.notifBtnText,
              notificationSent && { color: Colors.chartreuse, fontWeight: '700' },
            ]}
          >
            {notificationSent ? 'SENT TO DRAWER' : 'PREVIEW NOTIF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 💰 1. THE NUMBERS */}
      <View style={styles.numbersCard}>
        <Text style={styles.sectionLabel}>💰 THE NUMBERS</Text>

        <View style={styles.numbersGrid}>
          <View style={styles.numItem}>
            <Text style={styles.numLabel}>INCOME</Text>
            <Text style={[styles.numVal, { color: Colors.income }]}>
              ₹{digest.theNumbers.income.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.numItem}>
            <Text style={styles.numLabel}>EXPENSES</Text>
            <Text style={[styles.numVal, { color: Colors.expense }]}>
              ₹{digest.theNumbers.expenses.toLocaleString('en-IN')}
            </Text>
            {digest.theNumbers.expensePercentChangeVsPrev !== 0 && (
              <View style={styles.deltaPill}>
                {isExpenseDown ? (
                  <TrendingDown size={11} color={Colors.income} />
                ) : (
                  <TrendingUp size={11} color={Colors.expense} />
                )}
                <Text
                  style={[
                    styles.deltaText,
                    { color: isExpenseDown ? Colors.income : Colors.expense },
                  ]}
                >
                  {Math.abs(digest.theNumbers.expensePercentChangeVsPrev)}% vs prev
                </Text>
              </View>
            )}
          </View>

          <View style={styles.numItem}>
            <Text style={styles.numLabel}>SAVED</Text>
            <Text style={[styles.numVal, { color: Colors.chartreuse }]}>
              ₹{digest.theNumbers.saved.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.savingsRateText}>{digest.theNumbers.savingsRate}% rate</Text>
          </View>
        </View>
      </View>

      {/* 🏆 2. WINS */}
      <View style={styles.winsCard}>
        <Text style={styles.sectionLabel}>🏆 WINS</Text>
        <View style={styles.bulletList}>
          {digest.wins.map((win, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <CheckCircle2 size={14} color={Colors.income} style={styles.bulletIcon} />
              <Text style={styles.winText}>{win}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ⚠️ 3. WATCH OUTS */}
      <View style={styles.watchOutsCard}>
        <Text style={styles.sectionLabel}>⚠️ WATCH OUTS</Text>
        <View style={styles.bulletList}>
          {digest.watchOuts.map((watch, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <AlertTriangle size={14} color={Colors.expense} style={styles.bulletIcon} />
              <Text style={styles.watchText}>{watch}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 📊 4. TOP 5 CATEGORIES */}
      <View style={styles.categoriesCard}>
        <Text style={styles.sectionLabel}>📊 TOP 5 SPENDING CATEGORIES</Text>
        <View style={styles.catList}>
          {digest.topCategories.map((c) => (
            <View key={c.name} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catIconWrap, { backgroundColor: `${c.color}1A` }]}>
                  <CategoryIcon icon={c.icon} color={c.color} size={13} />
                </View>
                <Text style={styles.catName} numberOfLines={1}>
                  {c.name}
                </Text>
              </View>

              <View style={styles.catRight}>
                <Text style={styles.catAmount}>₹{c.amount.toLocaleString('en-IN')}</Text>
                <View style={styles.catBarWrapper}>
                  <View style={styles.catBarTrack}>
                    <View
                      style={[
                        styles.catBarFill,
                        { width: `${c.percentage}%`, backgroundColor: c.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.catPercent}>{c.percentage}%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 💡 5. NEXT MONTH TIP */}
      <View style={styles.tipCard}>
        <View style={styles.tipTop}>
          <Lightbulb size={15} color={Colors.chartreuse} />
          <Text style={styles.tipHeaderTitle}>NEXT MONTH GAME PLAN</Text>
        </View>
        <Text style={styles.tipBody}>"{digest.nextMonthTip}"</Text>
      </View>

      {/* 📈 6. HEALTH SCORE COMPARISON */}
      <View style={styles.scoreRowCard}>
        <View style={styles.scoreLeft}>
          <Activity size={16} color={Colors.primaryFixed} />
          <Text style={styles.scoreLabel}>ZENITH HEALTH SCORE</Text>
        </View>

        <View style={styles.scoreRight}>
          <Text style={styles.scoreFrom}>{digest.scoreComparison.prevScore}</Text>
          <Text style={styles.scoreArrow}>→</Text>
          <Text style={styles.scoreTo}>{digest.scoreComparison.currentScore}</Text>
          <View
            style={[
              styles.scoreDeltaBadge,
              {
                backgroundColor:
                  digest.scoreComparison.scoreDelta >= 0
                    ? `${Colors.chartreuse}1A`
                    : `${Colors.expense}1A`,
              },
            ]}
          >
            <Text
              style={[
                styles.scoreDeltaText,
                {
                  color:
                    digest.scoreComparison.scoreDelta >= 0
                      ? Colors.chartreuse
                      : Colors.expense,
                },
              ]}
            >
              {digest.scoreComparison.scoreDelta >= 0 ? '+' : ''}
              {digest.scoreComparison.scoreDelta} pts
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  notifBtnText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  numbersCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  numbersGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  numItem: {
    flex: 1,
    gap: 2,
  },
  numLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  numVal: {
    fontFamily: FontFamily.display,
    fontSize: 15,
    fontWeight: '800',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  deltaText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '600',
  },
  savingsRateText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.chartreuse,
    fontWeight: '700',
    marginTop: 2,
  },
  winsCard: {
    backgroundColor: `${Colors.income}08`,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.income}26`,
    gap: Spacing.xs,
  },
  watchOutsCard: {
    backgroundColor: `${Colors.expense}08`,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.expense}26`,
    gap: Spacing.xs,
  },
  bulletList: {
    gap: 6,
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletIcon: {
    marginTop: 2,
  },
  winText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 17,
  },
  watchText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 17,
  },
  categoriesCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  catList: {
    gap: Spacing.xs,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  catIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  catRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  catAmount: {
    fontFamily: FontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  catBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catBarTrack: {
    width: 48,
    height: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  catPercent: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  tipCard: {
    backgroundColor: `${Colors.chartreuse}0F`,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}33`,
    gap: 4,
  },
  tipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipHeaderTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.chartreuse,
    letterSpacing: 0.6,
  },
  tipBody: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  scoreRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  scoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreFrom: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  scoreArrow: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  scoreTo: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  scoreDeltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreDeltaText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
  },
});
