/**
 * MyWallet — Dashboard Card Renderer (Feature 15: Modular Dashboard)
 * 
 * Maps cardId strings to their respective component implementations,
 * passing contextual props and navigation actions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { MonthlySummaryCard } from './MonthlySummaryCard';
import { CategoryBurnCard } from './CategoryBurnCard';
import { CardsSnapshotCard } from './CardsSnapshotCard';
import { RecentActivityCard } from './RecentActivityCard';
import { QuickActionTemplatesCard } from './QuickActionTemplatesCard';
import { BudgetMicroAlertsCard } from './BudgetMicroAlertsCard';
import { DashboardNoteBlock } from '@/components/dashboard';
import {
  ResilienceGaugeAdapter,
  NoSpendHeatmapAdapter,
  VelocityAuditAdapter,
  DayOfWeekAdapter,
  TimeDistributionAdapter,
  MonthComparisonAdapter,
  MerchantIntelligenceAdapter,
  IncomeExpenseRatioAdapter,
  CategorySparklinesAdapter,
  MonthlyDigestAdapter,
} from './AnalyticsCardAdapters';
import { useDashboardStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes } from '@/theme';
import { BudgetMicroAlert } from '@/repositories';

interface DashboardCardRendererProps {
  cardId: string;
  onNavigateTab?: (index: number) => void;
  onNavigateAnalytics?: (tab: string) => void;
  onTransactionLogged?: () => void;
  budgetAlerts?: BudgetMicroAlert[];
}

export function DashboardCardRenderer({
  cardId,
  onNavigateTab,
  onNavigateAnalytics,
  onTransactionLogged,
  budgetAlerts = [],
}: DashboardCardRendererProps) {
  const isEditMode = useDashboardStore((s) => s.isEditMode);

  switch (cardId) {
    case 'monthly_summary':
      return <MonthlySummaryCard onNavigateTab={onNavigateTab} />;

    case 'quick_actions':
      return <QuickActionTemplatesCard onTransactionLogged={onTransactionLogged} />;

    case 'budget_alerts':
      if (budgetAlerts.length === 0) {
        // In normal mode, if no alerts, hide unless in edit mode where user needs to arrange it
        if (!isEditMode) return null;
        return (
          <View style={styles.emptyAlertsPreview}>
            <ShieldCheck size={16} color={Colors.income} />
            <Text style={styles.emptyAlertsText}>Budget Alerts: All budgets healthy (0 alerts)</Text>
          </View>
        );
      }
      return <BudgetMicroAlertsCard alerts={budgetAlerts} />;

    case 'category_burn':
      return <CategoryBurnCard onNavigateAnalytics={onNavigateAnalytics} />;

    case 'notes':
      return <DashboardNoteBlock />;

    case 'cards_snapshot':
      return <CardsSnapshotCard onNavigateTab={onNavigateTab} />;

    case 'recent_activity':
      return <RecentActivityCard onNavigateTab={onNavigateTab} />;

    // Opt-in Analytics Cards
    case 'resilience_gauge':
      return <ResilienceGaugeAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'no_spend_heatmap':
      return <NoSpendHeatmapAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'velocity_audit':
      return <VelocityAuditAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'day_of_week':
      return <DayOfWeekAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'time_distribution':
      return <TimeDistributionAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'month_comparison':
      return <MonthComparisonAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'merchant_intelligence':
      return <MerchantIntelligenceAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'income_expense_ratio':
      return <IncomeExpenseRatioAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'category_sparklines':
      return <CategorySparklinesAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    case 'monthly_digest':
      return <MonthlyDigestAdapter onNavigateAnalytics={onNavigateAnalytics} />;

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  emptyAlertsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  emptyAlertsText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
});
