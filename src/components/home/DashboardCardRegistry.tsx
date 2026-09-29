/**
 * MyWallet — Dashboard Card Registry (Feature 15: Modular Dashboard)
 * 
 * Defines all 17 available dashboard cards with human-readable names,
 * categories, descriptions, and icon identifiers for the Card Picker.
 */

export interface DashboardCardDefinition {
  id: string;
  displayName: string;
  category: 'core' | 'habits' | 'insights' | 'tools';
  description: string;
  iconName: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

export const DASHBOARD_CARD_REGISTRY: DashboardCardDefinition[] = [
  // ── Core Dashboard Cards (Default Visible) ──
  {
    id: 'monthly_summary',
    displayName: 'Monthly Summary',
    category: 'core',
    description: 'Income, expenses, and net savings overview',
    iconName: 'TrendingUp',
    defaultVisible: true,
    defaultOrder: 0,
  },
  {
    id: 'quick_actions',
    displayName: 'Quick Actions & Templates',
    category: 'tools',
    description: 'One-tap frequent transaction logging',
    iconName: 'Zap',
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: 'budget_alerts',
    displayName: 'Budget Micro-Alerts',
    category: 'core',
    description: 'Proactive warnings at 75%, 90%, 100%+ category spend',
    iconName: 'AlertTriangle',
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: 'category_burn',
    displayName: 'Category Burn & Donut',
    category: 'core',
    description: 'Interactive segmented donut and category breakdown',
    iconName: 'PieChart',
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: 'notes',
    displayName: 'Dashboard Scratchpad',
    category: 'tools',
    description: 'Free-form notes, reminders, and voice memos',
    iconName: 'FileText',
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: 'cards_snapshot',
    displayName: 'Credit Cards Snapshot',
    category: 'core',
    description: 'Active cards, credit limits, and utilization ratios',
    iconName: 'CreditCard',
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: 'recent_activity',
    displayName: 'Recent Activity',
    category: 'core',
    description: 'Latest transaction feed with category icons',
    iconName: 'Clock',
    defaultVisible: true,
    defaultOrder: 6,
  },

  // ── Insights & Resilience Cards (Opt-in) ──
  {
    id: 'resilience_gauge',
    displayName: 'Zenith Resilience Score',
    category: 'insights',
    description: '0-100 financial health quotient & solvency arc',
    iconName: 'ShieldCheck',
    defaultVisible: false,
    defaultOrder: 7,
  },
  {
    id: 'no_spend_heatmap',
    displayName: 'No-Spend Habit Heatmap',
    category: 'habits',
    description: '35-day spending density matrix and habit streaks',
    iconName: 'Flame',
    defaultVisible: false,
    defaultOrder: 8,
  },
  {
    id: 'velocity_audit',
    displayName: 'Weekend Velocity Audit',
    category: 'habits',
    description: 'Weekday vs weekend spending acceleration multiplier',
    iconName: 'Activity',
    defaultVisible: false,
    defaultOrder: 9,
  },
  {
    id: 'day_of_week',
    displayName: 'Day of Week Spend',
    category: 'habits',
    description: 'Mon–Sun spending distribution and peak day identifier',
    iconName: 'Calendar',
    defaultVisible: false,
    defaultOrder: 10,
  },
  {
    id: 'time_distribution',
    displayName: 'Time of Day Spending',
    category: 'habits',
    description: 'Diurnal burn breakdown: morning, afternoon, night',
    iconName: 'Sun',
    defaultVisible: false,
    defaultOrder: 11,
  },
  {
    id: 'month_comparison',
    displayName: 'Month-over-Month Comparison',
    category: 'insights',
    description: 'Side-by-side visual diff of spending & category shift',
    iconName: 'ArrowUpDown',
    defaultVisible: false,
    defaultOrder: 12,
  },
  {
    id: 'merchant_intelligence',
    displayName: 'Merchant Intelligence',
    category: 'insights',
    description: 'Merchant visit frequency and price deviation warnings',
    iconName: 'Store',
    defaultVisible: false,
    defaultOrder: 13,
  },
  {
    id: 'income_expense_ratio',
    displayName: 'Income vs Expense Ratio',
    category: 'insights',
    description: 'Split proportional bar and monthly savings rate target',
    iconName: 'Target',
    defaultVisible: false,
    defaultOrder: 14,
  },
  {
    id: 'category_sparklines',
    displayName: 'Category 6-Month Trends',
    category: 'insights',
    description: 'Sparkline curves tracking rising vs cooling categories',
    iconName: 'TrendingUp',
    defaultVisible: false,
    defaultOrder: 15,
  },
  {
    id: 'monthly_digest',
    displayName: 'Monthly Financial Digest',
    category: 'insights',
    description: 'Month-end report card with wins and actionable directive',
    iconName: 'Sparkles',
    defaultVisible: false,
    defaultOrder: 16,
  },
];

export const CARD_REGISTRY_MAP = new Map<string, DashboardCardDefinition>(
  DASHBOARD_CARD_REGISTRY.map((card) => [card.id, card])
);

export function getCardDefinition(cardId: string): DashboardCardDefinition | undefined {
  return CARD_REGISTRY_MAP.get(cardId);
}
