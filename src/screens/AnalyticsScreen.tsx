/**
 * MyWallet — Analytics & Financial Resilience Screen
 * 
 * Phase 12: Analytics, Habits & Financial Resilience
 * - 0-100 Zenith Resilience Quotient & 4-Pillar Solvency Gauge
 * - Category Donut chart & Subcategory drill-down
 * - 35-day GitHub-style No-Spend Habit Heatmap & Streaks
 * - Weekend vs. Weekday Velocity Audit & Safe Pace Advisory
 * - Mon–Sun Day of Week & 24-Hour Diurnal Time of Day Distributions
 * - Month-over-Month Category Shift & Delta Comparison
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import {
  ArrowLeft,
  ShieldCheck,
  PieChart,
  Flame,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  Coins,
  Layers,
  Sparkles,
  HelpCircle,
  Store,
  FileText,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { useFinancialStore } from '@/stores';
import {
  AnalyticsRepository,
  CategoryRepository,
  MerchantRepository,
  CategoryWithStats,
  ResiliencePillar,
  HealthScoreFactor,
  TransparentHealthScoreData,
} from '@/repositories';
import { CategoryDonut } from '@/components/ui/CategoryDonut';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  ResilienceGauge,
  NoSpendHeatmap,
  VelocityAuditCard,
  DayOfWeekChart,
  TimeDistributionBar,
  MonthComparisonCard,
  FactorDetailSheet,
  FinancialWrappedModal,
  MerchantIntelligenceCard,
  MonthlyDigestCard,
  CategorySparklinesCard,
  IncomeExpenseRatioCard,
} from '@/components/analytics';

type AnalyticsTab =
  | 'resilience'
  | 'overview'
  | 'merchants'
  | 'digest'
  | 'habits'
  | 'comparison';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab: paramTab } = useLocalSearchParams<{ tab?: AnalyticsTab }>();
  const { monthlyTotals } = useFinancialStore();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(paramTab || 'resilience');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (paramTab && ['resilience', 'overview', 'merchants', 'digest', 'habits', 'comparison'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  // Factor Detail Sheet State (Tier 2: Interactive Health Score)
  const [selectedFactor, setSelectedFactor] = useState<HealthScoreFactor | null>(null);

  // Financial Wrapped Modal State (Tier 2: Year-in-Review)
  const [wrappedModalVisible, setWrappedModalVisible] = useState(false);

  // Month navigation (Defaults to current month)
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const currentYearMonth = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  const previousYearMonth = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  const displayMonthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [selectedDate]);

  // Handle month change
  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Expanded category for drill-down in Overview tab
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // ─── Analytics Queries ───────────────────────────────────────────
  const resilienceData = useMemo(() => {
    return AnalyticsRepository.getFinancialResilienceScore();
  }, [refreshing]);

  // Tier 2: Transparent Health Score with 6 weighted factors & live SQLite
  const transparentHealthData = useMemo(() => {
    return AnalyticsRepository.getTransparentHealthScore(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  // Tier 2: Annual Wrapped Story data
  const wrappedData = useMemo(() => {
    return AnalyticsRepository.getFinancialWrapped(selectedDate.getFullYear());
  }, [selectedDate, refreshing]);

  // Tier 2: Merchant Intelligence & Price Memory
  const merchantReport = useMemo(() => {
    return MerchantRepository.getMerchantIntelligence();
  }, [refreshing]);

  // Tier 3: End-of-Month Financial Digest
  const monthlyDigest = useMemo(() => {
    return AnalyticsRepository.getMonthlyFinancialDigest(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  const momComparisonData = useMemo(() => {
    return AnalyticsRepository.getMonthComparison(currentYearMonth, previousYearMonth);
  }, [currentYearMonth, previousYearMonth, refreshing]);

  const velocityData = useMemo(() => {
    return AnalyticsRepository.getWeekendVsWeekdayVelocity(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  const dayOfWeekData = useMemo(() => {
    return AnalyticsRepository.getDayOfWeekDistribution(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  const timeDistributionData = useMemo(() => {
    return AnalyticsRepository.getTimeOfDayDistribution(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  const heatmapData = useMemo(() => {
    return AnalyticsRepository.getNoSpendHeatmap(35, selectedDate);
  }, [selectedDate, refreshing]);

  const paymentMethods = useMemo(() => {
    return AnalyticsRepository.getPaymentMethodDistribution(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  const categoriesWithStats = useMemo(() => {
    return CategoryRepository.getCategoriesWithStats('expense', currentYearMonth);
  }, [currentYearMonth, refreshing]);

  // Tier 4, Feature 11: 6-Month Category Spending Curves
  const categoryTrends = useMemo(() => {
    return CategoryRepository.getCategory6MonthTrends('expense');
  }, [refreshing]);

  // Tier 4, Feature 14: Income vs Expense Ratio & Living Savings Rate
  const incomeVsExpenseRatio = useMemo(() => {
    return AnalyticsRepository.getIncomeVsExpenseRatio(currentYearMonth);
  }, [currentYearMonth, refreshing]);

  // Donut data formatted for CategoryDonut
  const donutData = useMemo(() => {
    const totalSpend = categoriesWithStats.reduce((sum, c) => sum + c.monthly_spend, 0);
    return categoriesWithStats
      .filter((c) => c.monthly_spend > 0)
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        categoryColor: c.color,
        total: c.monthly_spend,
        percentage: totalSpend > 0 ? Math.round((c.monthly_spend / totalSpend) * 100) : 0,
      }));
  }, [categoriesWithStats]);

  const totalMonthlySpend = useMemo(() => {
    return categoriesWithStats.reduce((sum, c) => sum + c.monthly_spend, 0);
  }, [categoriesWithStats]);

  // Subcategories for the currently expanded category
  const subcategoriesForExpanded = useMemo(() => {
    if (!expandedCategoryId) return [];
    return CategoryRepository.getSubcategoriesWithStats(expandedCategoryId, currentYearMonth);
  }, [expandedCategoryId, currentYearMonth, refreshing]);

  const toggleCategoryDrilldown = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, []);

  const TABS: { id: AnalyticsTab; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
    { id: 'resilience', label: 'Resilience', icon: ShieldCheck },
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'merchants', label: 'Merchants', icon: Store },
    { id: 'digest', label: 'Digest', icon: FileText },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'comparison', label: 'Comparison', icon: ArrowUpDown },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerSubtitle}>INTELLIGENCE ENGINE</Text>
          <Text style={styles.headerTitle}>ANALYTICS & RESILIENCE</Text>
        </View>

        {/* Month Picker Pill */}
        <View style={styles.monthPicker}>
          <TouchableOpacity
            style={styles.monthChevron}
            onPress={handlePrevMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={16} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{displayMonthLabel}</Text>

          <TouchableOpacity
            style={styles.monthChevron}
            onPress={handleNextMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronRight size={16} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Hero Banner: Financial Wrapped (Tier 2) ─── */}
      <View style={styles.wrappedBannerContainer}>
        <TouchableOpacity
          style={styles.wrappedBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setWrappedModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.wrappedBannerLeft}>
            <View style={styles.sparkleIconBox}>
              <Sparkles size={16} color="#000000" />
            </View>
            <View style={styles.wrappedTextCol}>
              <View style={styles.wrappedBadgeRow}>
                <Text style={styles.wrappedYearText}>{selectedDate.getFullYear()} WRAPPED</Text>
                <View style={styles.archetypeBadge}>
                  <Text style={styles.archetypeBadgeText}>
                    {wrappedData.personality.badgeTitle}
                  </Text>
                </View>
              </View>
              <Text style={styles.wrappedBannerTitle}>
                Explore Annual Story & Personality
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.chartreuse} />
        </TouchableOpacity>
      </View>

      {/* Segmented Scrollable Tab Navigator (6 Tabs) */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const activeColor =
              tab.id === 'resilience'
                ? Colors.chartreuse
                : tab.id === 'merchants'
                ? Colors.primaryFixed
                : tab.id === 'digest'
                ? '#00F0FF'
                : tab.id === 'habits'
                ? '#FF9E0B'
                : tab.id === 'overview'
                ? Colors.secondaryFixed
                : '#A855F7';

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && {
                    backgroundColor: `${activeColor}1A`,
                    borderColor: `${activeColor}4D`,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
              >
                <Icon size={14} color={isActive ? activeColor : Colors.onSurfaceVariant} />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && { color: activeColor, fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.chartreuse}
            colors={[Colors.chartreuse]}
          />
        }
      >
        {/* ─── TAB 1: RESILIENCE (Transparent Health Score) ────────── */}
        {activeTab === 'resilience' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            <ResilienceGauge
              data={transparentHealthData}
              onFactorPress={(factor) => setSelectedFactor(factor)}
            />

            {/* Explanatory Intelligence Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoTop}>
                <Sparkles size={16} color={Colors.chartreuse} />
                <Text style={styles.infoTitle}>TRANSPARENT 6-PILLAR HEALTH AUDIT</Text>
              </View>
              <Text style={styles.infoText}>
                Zenith Quotient is computed 100% offline from your live ledger across 6 weighted quantitative pillars:
              </Text>
              <View style={styles.pillarRules}>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>Savings Rate (25%)</Text>: Targets ≥ 20–30% of incoming cash preserved.
                </Text>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>Budget Adherence (20%)</Text>: Category spending kept strictly within limits.
                </Text>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>Debt Health (15%)</Text>: Unsettled peer IOUs and net receivable stability.
                </Text>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>CC Utilization (15%)</Text>: Portfolio credit balance kept safely below 30%.
                </Text>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>Spending Consistency (15%)</Text>: Smooth daily burn avoiding volatile spikes.
                </Text>
                <Text style={styles.ruleItem}>
                  • <Text style={styles.boldText}>No-Spend Discipline (10%)</Text>: Number of zero-outflow days logged.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ─── TAB 2: OVERVIEW (Spend & Drill-down) ────────────────── */}
        {activeTab === 'overview' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            {/* Income vs Expense Ratio Tracker (Tier 4, Feature 14) */}
            <IncomeExpenseRatioCard
              data={incomeVsExpenseRatio}
              onTargetUpdated={() => setRefreshing(true)}
            />

            {/* Donut Chart Card */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.iconBox}>
                  <PieChart size={16} color={Colors.primaryFixed} />
                </View>
                <View>
                  <Text style={styles.chartTitle}>SPENDING DISTRIBUTION</Text>
                  <Text style={styles.chartSubtitle}>{displayMonthLabel} • Categorical Burn</Text>
                </View>
              </View>

              {donutData.length > 0 ? (
                <CategoryDonut
                  categories={donutData}
                  totalSpend={totalMonthlySpend}
                  size={190}
                  strokeWidth={22}
                />
              ) : (
                <View style={styles.emptyDonutBox}>
                  <Text style={styles.emptyText}>No expenses logged in {displayMonthLabel}.</Text>
                </View>
              )}
            </View>

            {/* Payment Method Distribution Card */}
            <View style={styles.paymentMethodCard}>
              <View style={styles.chartHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${Colors.secondaryFixed}1A` }]}>
                  <Wallet size={16} color={Colors.secondaryFixed} />
                </View>
                <View>
                  <Text style={styles.chartTitle}>PAYMENT SOURCE DISTRIBUTION</Text>
                  <Text style={styles.chartSubtitle}>Credit Cards vs. Bank vs. Cash</Text>
                </View>
              </View>

              <View style={styles.paymentMethodsList}>
                {paymentMethods.map((pm) => {
                  const Icon =
                    pm.type === 'credit_card' ? CreditCard : pm.type === 'cash' ? Coins : Wallet;

                  return (
                    <View key={pm.type} style={styles.paymentMethodRow}>
                      <View style={[styles.pmIconBox, { backgroundColor: `${pm.color}1A` }]}>
                        <Icon size={16} color={pm.color} />
                      </View>
                      <View style={styles.pmDetails}>
                        <View style={styles.pmTopRow}>
                          <Text style={styles.pmLabel}>{pm.label}</Text>
                          <Text style={styles.pmAmount}>₹{pm.total.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.pmBarTrack}>
                          <View
                            style={[
                              styles.pmBarFill,
                              { width: `${pm.percentage}%`, backgroundColor: pm.color },
                            ]}
                          />
                        </View>
                        <View style={styles.pmBottomRow}>
                          <Text style={styles.pmTxCount}>
                            {pm.count} transaction{pm.count !== 1 ? 's' : ''}
                          </Text>
                          <Text style={[styles.pmPct, { color: pm.color }]}>{pm.percentage}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Categories Drill-down List */}
            <View style={styles.drilldownCard}>
              <View style={styles.chartHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${Colors.chartreuse}1A` }]}>
                  <Layers size={16} color={Colors.chartreuse} />
                </View>
                <View>
                  <Text style={styles.chartTitle}>CATEGORY DRILL-DOWN</Text>
                  <Text style={styles.chartSubtitle}>Tap any category to reveal subcategories</Text>
                </View>
              </View>

              <View style={styles.categoriesList}>
                {categoriesWithStats
                  .filter((c) => c.monthly_spend > 0)
                  .map((cat) => {
                    const isExpanded = expandedCategoryId === cat.id;
                    const pctOfTotal =
                      totalMonthlySpend > 0
                        ? Math.round((cat.monthly_spend / totalMonthlySpend) * 100)
                        : 0;

                    return (
                      <View key={cat.id} style={styles.categoryCard}>
                        <TouchableOpacity
                          style={styles.categoryMainRow}
                          activeOpacity={0.7}
                          onPress={() => toggleCategoryDrilldown(cat.id)}
                        >
                          <View
                            style={[
                              styles.catIconWrap,
                              { backgroundColor: `${cat.color}1A` },
                            ]}
                          >
                            <CategoryIcon name={cat.icon} size={18} color={cat.color} />
                          </View>

                          <View style={styles.catMeta}>
                            <Text style={styles.catTitle} numberOfLines={1}>
                              {cat.name}
                            </Text>
                            <Text style={styles.catSubText}>
                              {cat.transactions_count} transactions • {pctOfTotal}% of total
                            </Text>
                          </View>

                          <View style={styles.catRight}>
                            <Text style={styles.catSpend}>
                              ₹{cat.monthly_spend.toLocaleString('en-IN')}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={16} color={Colors.onSurfaceVariant} />
                            ) : (
                              <ChevronDown size={16} color={Colors.onSurfaceVariant} />
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Subcategories Drawer */}
                        {isExpanded && (
                          <View style={styles.subcategoriesContainer}>
                            <Text style={styles.subHeaderLabel}>SUBCATEGORIES</Text>
                            {subcategoriesForExpanded.length === 0 ? (
                              <Text style={styles.noSubText}>No nested subcategory expenses.</Text>
                            ) : (
                              subcategoriesForExpanded.map((sub) => {
                                const subPct =
                                  cat.monthly_spend > 0
                                    ? Math.round((sub.monthly_spend / cat.monthly_spend) * 100)
                                    : 0;

                                return (
                                  <View key={sub.id} style={styles.subcategoryRow}>
                                    <View style={styles.subLeft}>
                                      <View
                                        style={[
                                          styles.subDot,
                                          { backgroundColor: sub.color || cat.color },
                                        ]}
                                      />
                                      <Text style={styles.subName}>{sub.name}</Text>
                                    </View>

                                    <View style={styles.subRight}>
                                      <Text style={styles.subAmount}>
                                        ₹{sub.monthly_spend.toLocaleString('en-IN')}
                                      </Text>
                                      <Text style={styles.subPct}>{subPct}%</Text>
                                    </View>
                                  </View>
                                );
                              })
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Category Trend Sparklines (Tier 4, Feature 11) */}
            <CategorySparklinesCard trends={categoryTrends} />
          </Animated.View>
        )}

        {/* ─── TAB 3: MERCHANTS (Intelligence & Price Memory) ─────── */}
        {activeTab === 'merchants' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            <MerchantIntelligenceCard report={merchantReport} />
          </Animated.View>
        )}

        {/* ─── TAB 4: DIGEST (End-of-Month Intelligence Report) ─────── */}
        {activeTab === 'digest' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            <MonthlyDigestCard digest={monthlyDigest} />
          </Animated.View>
        )}

        {/* ─── TAB 5: HABITS ──────────────────────────────────────── */}
        {activeTab === 'habits' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            <NoSpendHeatmap data={heatmapData} />
            <VelocityAuditCard data={velocityData} />
            <DayOfWeekChart data={dayOfWeekData} />
            <TimeDistributionBar data={timeDistributionData} />
          </Animated.View>
        )}

        {/* ─── TAB 6: COMPARISON ──────────────────────────────────── */}
        {activeTab === 'comparison' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.sectionGap}>
            <MonthComparisonCard data={momComparisonData} />
          </Animated.View>
        )}

        {/* Sovereignty Footer */}
        <View style={styles.vaultFooter}>
          <ShieldCheck size={16} color={Colors.chartreuse} />
          <View style={styles.vaultContent}>
            <Text style={styles.vaultTitle}>100% OFFLINE ANALYTICS VAULT</Text>
            <Text style={styles.vaultSub}>
              All habit streaks, velocity models, and resilience quotient scores run strictly on device.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── MODAL 1: Factor Detail Sheet (Interactive Health Score) ─── */}
      <FactorDetailSheet
        visible={selectedFactor !== null}
        factor={selectedFactor}
        overallScore={transparentHealthData.totalScore}
        onClose={() => setSelectedFactor(null)}
      />

      {/* ─── MODAL 2: Financial Wrapped Story (Year-in-Review) ─── */}
      <FinancialWrappedModal
        visible={wrappedModalVisible}
        data={wrappedData}
        onClose={() => setWrappedModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  headerTitles: {
    flex: 1,
    gap: 1,
  },
  headerSubtitle: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.chartreuse,
    letterSpacing: 1.0,
  },
  headerTitle: {
    ...Typography.bodyMdMedium,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 4,
  },
  monthChevron: {
    padding: 2,
  },
  monthLabel: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11,
    color: Colors.onSurface,
  },
  wrappedBannerContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
  },
  wrappedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.chartreuse}14`,
    borderRadius: Shapes.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}40`,
  },
  wrappedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sparkleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.chartreuse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrappedTextCol: {
    flex: 1,
    gap: 2,
  },
  wrappedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrappedYearText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.chartreuse,
    letterSpacing: 0.6,
  },
  archetypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  archetypeBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  wrappedBannerTitle: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  tabBarWrapper: {
    paddingVertical: Spacing.sm,
  },
  tabBarScroll: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.xs,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainer,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  tabLabel: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  sectionGap: {
    gap: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoTitle: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.chartreuse,
    letterSpacing: 0.8,
  },
  infoText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  pillarRules: {
    gap: 6,
    marginTop: 4,
  },
  ruleItem: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurface,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.primaryFixed,
  },
  chartCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primaryFixed}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    ...Typography.labelCaps,
    fontSize: 11,
    color: Colors.onSurface,
    letterSpacing: 1.0,
  },
  chartSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  emptyDonutBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  paymentMethodCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  paymentMethodsList: {
    gap: Spacing.sm + 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  pmIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmDetails: {
    flex: 1,
    gap: 4,
  },
  pmTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmLabel: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pmAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  pmBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  pmBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pmBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmTxCount: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  pmPct: {
    fontFamily: FontFamily.numericBold,
    fontSize: 10.5,
  },
  drilldownCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.md,
  },
  categoriesList: {
    gap: Spacing.sm,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    overflow: 'hidden',
  },
  categoryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catMeta: {
    flex: 1,
    gap: 2,
  },
  catTitle: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  catSubText: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  catRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  catSpend: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13.5,
    color: Colors.onSurface,
  },
  subcategoriesContainer: {
    backgroundColor: Colors.surfaceContainerHighest,
    padding: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
    gap: 6,
  },
  subHeaderLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  noSubText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  subcategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subName: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
  },
  subRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subAmount: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11.5,
    color: Colors.onSurface,
  },
  subPct: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    width: 28,
    textAlign: 'right',
  },
  vaultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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
