/**
 * MyWallet — Analytics Card Adapters for Modular Dashboard
 * 
 * Self-contained wrappers for the 10 opt-in analytics cards.
 * Each adapter fetches its current data from SQLite and provides seamless
 * tap-through navigation to the corresponding tab on /analytics.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  AnalyticsRepository,
  CategoryRepository,
  MerchantRepository,
} from '@/repositories';
import {
  ResilienceGauge,
  NoSpendHeatmap,
  VelocityAuditCard,
  DayOfWeekChart,
  TimeDistributionBar,
  MonthComparisonCard,
  MerchantIntelligenceCard,
  IncomeExpenseRatioCard,
  CategorySparklinesCard,
  MonthlyDigestCard,
} from '@/components/analytics';
import { Colors, Typography, Spacing, Shapes } from '@/theme';

interface AdapterBaseProps {
  onNavigateAnalytics?: (tab: string) => void;
}

function useCurrentYearMonth() {
  return useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
}

function usePreviousYearMonth() {
  return useMemo(() => {
    const d = new Date();
    const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
}

function AnalyticsCardHeader({
  title,
  tab,
  onNavigate,
}: {
  title: string;
  tab: string;
  onNavigate?: (tab: string) => void;
}) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onNavigate) {
      onNavigate(tab);
    } else {
      router.push({ pathname: '/analytics' as any, params: { tab } });
    }
  };

  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.headerBtn}>
        <Text style={styles.headerBtnText}>Analytics &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

// 1. Resilience Gauge
export function ResilienceGaugeAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const data = useMemo(() => AnalyticsRepository.getFinancialResilienceScore(), []);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Zenith Resilience Score" tab="resilience" onNavigate={onNavigateAnalytics} />
      <ResilienceGauge data={data} />
    </View>
  );
}

// 2. No-Spend Heatmap
export function NoSpendHeatmapAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const data = useMemo(() => AnalyticsRepository.getNoSpendHeatmap(35, new Date()), []);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Habit Heatmap & Streaks" tab="habits" onNavigate={onNavigateAnalytics} />
      <NoSpendHeatmap data={data} />
    </View>
  );
}

// 3. Weekend vs Weekday Velocity Audit
export function VelocityAuditAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const ym = useCurrentYearMonth();
  const data = useMemo(() => AnalyticsRepository.getWeekendVsWeekdayVelocity(ym), [ym]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Velocity Dynamics" tab="habits" onNavigate={onNavigateAnalytics} />
      <VelocityAuditCard data={data} />
    </View>
  );
}

// 4. Day of Week Distribution
export function DayOfWeekAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const ym = useCurrentYearMonth();
  const data = useMemo(() => AnalyticsRepository.getDayOfWeekDistribution(ym), [ym]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Day of Week Spend" tab="habits" onNavigate={onNavigateAnalytics} />
      <DayOfWeekChart data={data} />
    </View>
  );
}

// 5. Time of Day Distribution
export function TimeDistributionAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const ym = useCurrentYearMonth();
  const data = useMemo(() => AnalyticsRepository.getTimeOfDayDistribution(ym), [ym]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Diurnal Spending" tab="habits" onNavigate={onNavigateAnalytics} />
      <TimeDistributionBar data={data} />
    </View>
  );
}

// 6. Month Comparison
export function MonthComparisonAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const currYM = useCurrentYearMonth();
  const prevYM = usePreviousYearMonth();
  const data = useMemo(() => AnalyticsRepository.getMonthComparison(currYM, prevYM), [currYM, prevYM]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Month Comparison" tab="comparison" onNavigate={onNavigateAnalytics} />
      <MonthComparisonCard initialData={data} />
    </View>
  );
}

// 7. Merchant Intelligence
export function MerchantIntelligenceAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const report = useMemo(() => MerchantRepository.getMerchantIntelligence(), []);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Merchant Price Memory" tab="merchants" onNavigate={onNavigateAnalytics} />
      <MerchantIntelligenceCard report={report} />
    </View>
  );
}

// 8. Income vs Expense Ratio
export function IncomeExpenseRatioAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const ym = useCurrentYearMonth();
  const data = useMemo(() => AnalyticsRepository.getIncomeVsExpenseRatio(ym), [ym]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Living Savings Ratio" tab="overview" onNavigate={onNavigateAnalytics} />
      <IncomeExpenseRatioCard data={data} />
    </View>
  );
}

// 9. Category Trends Sparklines
export function CategorySparklinesAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const trends = useMemo(() => CategoryRepository.getCategory6MonthTrends('expense'), []);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Category 6-Month Trends" tab="overview" onNavigate={onNavigateAnalytics} />
      <CategorySparklinesCard trends={trends} />
    </View>
  );
}

// 10. Monthly Financial Digest
export function MonthlyDigestAdapter({ onNavigateAnalytics }: AdapterBaseProps) {
  const ym = useCurrentYearMonth();
  const digest = useMemo(() => AnalyticsRepository.getMonthlyFinancialDigest(ym), [ym]);
  return (
    <View style={styles.adapterContainer}>
      <AnalyticsCardHeader title="Financial Digest" tab="digest" onNavigate={onNavigateAnalytics} />
      <MonthlyDigestCard digest={digest} />
    </View>
  );
}

const styles = StyleSheet.create({
  adapterContainer: {
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  headerTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  headerBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  headerBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 11,
  },
});
