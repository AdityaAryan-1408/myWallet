/**
 * MyWallet — Zenith AI & Intelligence Screen
 * 
 * Tier 1 Offline Intelligence Layer:
 * 1. REPORT CARD: Auto-generated natural language spending audit & grade
 * 2. ANOMALIES: Statistical outlier detection (>2.5x category median) with live notification alerts
 * 3. PREDICTOR: Cash flow forecaster, trajectory, safe daily spend & budget breach warnings
 * 4. RADAR & AUTOPILOT: Velocity burn monitor (speedometer), round-ups & no-spend streaks
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  ArrowLeft,
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
  Gauge,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Calendar,
  Flame,
  AlertCircle,
  PiggyBank,
  Check,
  TrendingDown,
  Coins,
  Target,
  Zap,
} from 'lucide-react-native';

import {
  AiRepository,
  MonthlyReportCard,
  SpendingAnomaly,
  CashFlowPrediction,
  RecurringPattern,
  SavingsAutopilot,
  VelocityRadar,
  ReservationRepository,
} from '@/repositories';
import { AiIntelligenceService } from '@/services';
import { useFinancialStore } from '@/stores';
import { Colors, FontFamily, Spacing, Shapes } from '@/theme';

type TabKey = 'report' | 'anomalies' | 'predictor' | 'radar';

export default function IntelligenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshFinancials, recentTransactions } = useFinancialStore();

  const [activeTab, setActiveTab] = useState<TabKey>('report');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoundUpTier, setSelectedRoundUpTier] = useState<10 | 50 | 100>(10);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // ─── Data Engine States ──────────────────────────────────────────────────
  const [reportCard, setReportCard] = useState<MonthlyReportCard | null>(null);
  const [anomalies, setAnomalies] = useState<SpendingAnomaly[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowPrediction | null>(null);
  const [recurring, setRecurring] = useState<RecurringPattern[]>([]);
  const [autopilot, setAutopilot] = useState<SavingsAutopilot | null>(null);
  const [velocity, setVelocity] = useState<VelocityRadar | null>(null);

  const loadAiData = useCallback(() => {
    try {
      const rc = AiRepository.getSpendingReportCard();
      const anom = AiRepository.detectAnomalies(20);
      const cf = AiRepository.getPredictiveCashFlow();
      const rec = AiRepository.detectRecurringPatterns();
      const ap = AiRepository.getSavingsAutopilotData();
      const vel = AiRepository.getVelocityRadar();

      setReportCard(rc);
      setAnomalies(anom);
      setCashFlow(cf);
      setRecurring(rec);
      setAutopilot(ap);
      setVelocity(vel);
    } catch (e) {
      console.warn('Failed to compute Zenith AI insights:', e);
    }
  }, []);

  useEffect(() => {
    loadAiData();
  }, [loadAiData, recentTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refreshFinancials();
    loadAiData();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshFinancials, loadAiData]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabKey) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleSendReportCardNotification = async () => {
    if (!reportCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSendingAlert(true);
    try {
      await AiIntelligenceService.dispatchMonthlyReportNotification(reportCard);
      Alert.alert(
        'Report Card Dispatched! 🧠',
        'Your monthly intelligence executive summary has been broadcast to your Android notifications and logged to in-app alerts.'
      );
    } catch {
      Alert.alert('Error', 'Could not dispatch report card notification.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleSimulateAnomalyAlert = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSendingAlert(true);
    try {
      await AiIntelligenceService.triggerTestAnomalyNotification();
      loadAiData();
      Alert.alert(
        'Anomaly Alert Triggered! ⚠️',
        'A simulated high-spend statistical anomaly has been broadcast to your Android status bar and saved in notifications.'
      );
    } catch {
      Alert.alert('Error', 'Could not fire anomaly alert.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleSaveRoundUpsToReservation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!autopilot) return;

    const roundUpAmount =
      selectedRoundUpTier === 10
        ? autopilot.roundUp10Total
        : selectedRoundUpTier === 50
        ? autopilot.roundUp50Total
        : autopilot.roundUp100Total;

    if (roundUpAmount <= 0) {
      Alert.alert('No Round-ups Yet', 'Log expense transactions first to accumulate round-up spare change!');
      return;
    }

    const activeReservations = ReservationRepository.getAllActive();
    if (activeReservations.length > 0) {
      const target = activeReservations[0];
      ReservationRepository.updateAmount(target.id, target.amount + roundUpAmount);
      refreshFinancials();
      Alert.alert(
        'Round-Up Saved! 🐖',
        `₹${roundUpAmount.toLocaleString('en-IN')} spare change has been transferred to "${target.name}".`
      );
    } else {
      // Create new autopilot reservation
      ReservationRepository.create({
        id: `res_roundup_${Date.now()}`,
        name: 'Spare Change Autopilot',
        amount: roundUpAmount,
        target_amount: 10000,
        note: 'Auto-saved spare change round-ups',
        affects_available: 1,
        is_active: 1,
      });
      refreshFinancials();
      Alert.alert(
        'Goal Created & Saved! 🐖',
        `Created "Spare Change Autopilot" and deposited ₹${roundUpAmount.toLocaleString('en-IN')}!`
      );
    }
  };

  // Grade color helper
  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return Colors.chartreuse;
      case 'B':
        return Colors.secondaryFixed;
      case 'C':
        return Colors.warning;
      case 'D':
      default:
        return Colors.expense;
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
      {/* ─── Top Executive Header ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={18} color={Colors.primaryFixed} />
            <Text style={styles.headerTitle}>ZENITH AI</Text>
          </View>
          <Text style={styles.headerSub}>OFFLINE INTELLIGENCE LAYER</Text>
        </View>

        <View style={styles.offlineEngineBadge}>
          <View style={styles.liveEngineDot} />
          <Text style={styles.offlineEngineText}>LOCAL ML</Text>
        </View>
      </View>

      {/* ─── Segmented Tabs Bar ─── */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
            onPress={() => handleTabChange('report')}
            activeOpacity={0.7}
          >
            <Brain
              size={15}
              color={activeTab === 'report' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
            />
            <Text
              style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}
            >
              REPORT CARD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'anomalies' && styles.tabButtonActive]}
            onPress={() => handleTabChange('anomalies')}
            activeOpacity={0.7}
          >
            <AlertTriangle
              size={15}
              color={activeTab === 'anomalies' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
            />
            <Text
              style={[styles.tabText, activeTab === 'anomalies' && styles.tabTextActive]}
            >
              ANOMALIES
            </Text>
            {anomalies.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{anomalies.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'predictor' && styles.tabButtonActive]}
            onPress={() => handleTabChange('predictor')}
            activeOpacity={0.7}
          >
            <TrendingUp
              size={15}
              color={activeTab === 'predictor' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
            />
            <Text
              style={[styles.tabText, activeTab === 'predictor' && styles.tabTextActive]}
            >
              PREDICTOR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'radar' && styles.tabButtonActive]}
            onPress={() => handleTabChange('radar')}
            activeOpacity={0.7}
          >
            <Gauge
              size={15}
              color={activeTab === 'radar' ? Colors.onPrimaryContainer : Colors.onSurfaceVariant}
            />
            <Text
              style={[styles.tabText, activeTab === 'radar' && styles.tabTextActive]}
            >
              RADAR & AUTOPILOT
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Main Content ScrollView ─── */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 48 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: MONTHLY SPENDING REPORT CARD
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'report' && reportCard && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
            {/* Grade Hero Banner */}
            <View style={styles.heroCard}>
              <View style={styles.gradeContainer}>
                <View
                  style={[
                    styles.gradeCircle,
                    { borderColor: getGradeColor(reportCard.grade) },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeText,
                      { color: getGradeColor(reportCard.grade) },
                    ]}
                  >
                    {reportCard.grade}
                  </Text>
                </View>
                <View style={styles.gradeDetails}>
                  <Text style={styles.gradeSubtitle}>{reportCard.monthName.toUpperCase()}</Text>
                  <Text style={styles.gradeTitle}>{reportCard.gradeTitle}</Text>
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsPillText}>
                      Savings Rate: {Math.round(reportCard.savingsRate)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Stat Trio */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Total Inflow</Text>
                  <Text style={[styles.heroStatValue, { color: Colors.income }]}>
                    ₹{Math.round(reportCard.totalIncome).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Expenses</Text>
                  <Text style={[styles.heroStatValue, { color: Colors.expense }]}>
                    ₹{Math.round(reportCard.totalExpense).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Net Saved</Text>
                  <Text
                    style={[
                      styles.heroStatValue,
                      { color: reportCard.netSaved >= 0 ? Colors.chartreuse : Colors.expense },
                    ]}
                  >
                    {reportCard.netSaved >= 0 ? '+' : ''}₹{Math.round(reportCard.netSaved).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Notification Broadcast Action */}
              <TouchableOpacity
                style={styles.broadcastBtn}
                onPress={handleSendReportCardNotification}
                disabled={isSendingAlert}
                activeOpacity={0.7}
              >
                <Bell size={14} color={Colors.primaryFixed} />
                <Text style={styles.broadcastBtnText}>
                  Send Report to Phone Notification
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Executive Narrative */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Brain size={16} color={Colors.primaryFixed} />
                <Text style={styles.cardHeaderTitle}>AI SPENDING AUDIT</Text>
              </View>
              <Text style={styles.narrativeText}>"{reportCard.summaryNarrative}"</Text>
              
              {reportCard.expenseDelta !== 0 && (
                <View style={styles.comparisonBadge}>
                  {reportCard.expenseDelta < 0 ? (
                    <TrendingDown size={14} color={Colors.income} />
                  ) : (
                    <TrendingUp size={14} color={Colors.expense} />
                  )}
                  <Text
                    style={[
                      styles.comparisonText,
                      { color: reportCard.expenseDelta < 0 ? Colors.income : Colors.expense },
                    ]}
                  >
                    {Math.abs(reportCard.expensePercentChange)}% {reportCard.expenseDelta < 0 ? 'less' : 'more'} than last month
                  </Text>
                </View>
              )}
            </View>

            {/* Key Wins */}
            {reportCard.keyWins.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <CheckCircle2 size={16} color={Colors.income} />
                  <Text style={[styles.cardHeaderTitle, { color: Colors.income }]}>
                    FINANCIAL WINS
                  </Text>
                </View>
                {reportCard.keyWins.map((win, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={[styles.bulletDot, { color: Colors.income }]}>✓</Text>
                    <Text style={styles.bulletText}>{win}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Watch-Outs */}
            {reportCard.watchOuts.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={[styles.cardHeaderTitle, { color: Colors.warning }]}>
                    WATCH-OUTS & LEAKS
                  </Text>
                </View>
                {reportCard.watchOuts.map((watch, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <Text style={[styles.bulletDot, { color: Colors.warning }]}>!</Text>
                    <Text style={styles.bulletText}>{watch}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Top Category Outlays */}
            {reportCard.topCategories.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Target size={16} color={Colors.primaryFixed} />
                  <Text style={styles.cardHeaderTitle}>PRIMARY SPENDING CATEGORIES</Text>
                </View>
                {reportCard.topCategories.map((cat, idx) => (
                  <View key={idx} style={styles.catRow}>
                    <View style={styles.catInfoRow}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catAmount}>
                        ₹{Math.round(cat.amount).toLocaleString('en-IN')}{' '}
                        <Text style={styles.catPercent}>({cat.percent}%)</Text>
                      </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(cat.percent, 100)}%`,
                            backgroundColor: cat.color || Colors.primaryFixed,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Top Merchant Highlight */}
            {reportCard.topMerchant && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Coins size={16} color={Colors.secondaryFixed} />
                  <Text style={styles.cardHeaderTitle}>FREQUENT OUTLET</Text>
                </View>
                <View style={styles.merchantHighlightBox}>
                  <View style={styles.merchantIconCircle}>
                    <Text style={styles.merchantInitial}>
                      {reportCard.topMerchant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.merchantContent}>
                    <Text style={styles.merchantName}>{reportCard.topMerchant.name}</Text>
                    <Text style={styles.merchantSub}>
                      {reportCard.topMerchant.transactionCount} transactions logged this month
                    </Text>
                  </View>
                  <Text style={styles.merchantTotal}>
                    ₹{Math.round(reportCard.topMerchant.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            )}

            {/* Tactical AI Tip */}
            <View style={[styles.card, styles.tipCard]}>
              <View style={styles.cardHeader}>
                <Sparkles size={16} color={Colors.primaryFixed} />
                <Text style={styles.cardHeaderTitle}>AI OPTIMIZATION STRATEGY</Text>
              </View>
              <Text style={styles.tipText}>{reportCard.nextMonthOptimizationTip}</Text>
            </View>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: ANOMALY RADAR
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'anomalies' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
            {/* Status Control Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <AlertTriangle size={16} color={Colors.warning} />
                <Text style={styles.cardHeaderTitle}>ANOMALY RADAR ENGINE</Text>
              </View>
              <Text style={styles.cardDesc}>
                Real-time mathematical filter detects expenses exceeding 2.5× the typical category median.
                Instant Android and in-app alerts are dispatched immediately upon logging.
              </Text>

              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={handleSimulateAnomalyAlert}
                disabled={isSendingAlert}
                activeOpacity={0.7}
              >
                <Bell size={14} color={Colors.warning} />
                <Text style={styles.simulateBtnText}>Simulate Test Anomaly Notification</Text>
              </TouchableOpacity>
            </View>

            {/* Anomalies List */}
            {anomalies.length > 0 ? (
              <View>
                <Text style={styles.sectionHeaderLabel}>
                  DETECTED STATISTICAL OUTLIERS ({anomalies.length})
                </Text>
                {anomalies.map((item, idx) => (
                  <Animated.View
                    key={item.transactionId}
                    entering={FadeInRight.delay(idx * 70)}
                    style={styles.anomalyCard}
                  >
                    <View style={styles.anomalyTop}>
                      <View style={styles.anomalyCatBox}>
                        <View
                          style={[
                            styles.anomalyCatDot,
                            { backgroundColor: item.categoryColor || Colors.warning },
                          ]}
                        />
                        <Text style={styles.anomalyCatName}>{item.categoryName}</Text>
                      </View>
                      <View style={styles.anomalyMultiplierPill}>
                        <Text style={styles.anomalyMultiplierText}>
                          {item.multiplier}× TYPICAL
                        </Text>
                      </View>
                    </View>

                    <View style={styles.anomalyAmountRow}>
                      <Text style={styles.anomalyAmount}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.anomalyDate}>{item.date}</Text>
                    </View>

                    <Text style={styles.anomalyMessage}>{item.message}</Text>
                    {item.note ? (
                      <Text style={styles.anomalyNote}>Note: "{item.note}"</Text>
                    ) : null}
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <ShieldCheck size={48} color={Colors.chartreuse} />
                <Text style={styles.emptyStateTitle}>Zero Spending Anomalies</Text>
                <Text style={styles.emptyStateDesc}>
                  Every recorded transaction aligns within the normal standard deviation for its category.
                  Zenith AI is continuously scanning your ledger.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: PREDICTIVE CASH FLOW FORECASTER
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'predictor' && cashFlow && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
            {/* Projected Balance Hero */}
            <View style={styles.heroCard}>
              <Text style={styles.heroPreTitle}>END-OF-MONTH PROJECTION</Text>
              <View style={styles.projectedRow}>
                <Text
                  style={[
                    styles.projectedAmount,
                    {
                      color:
                        cashFlow.trajectoryStatus === 'DEFICIT_WARNING'
                          ? Colors.expense
                          : Colors.chartreuse,
                    },
                  ]}
                >
                  ₹{Math.round(cashFlow.projectedMonthEndBalance).toLocaleString('en-IN')}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        cashFlow.trajectoryStatus === 'DEFICIT_WARNING'
                          ? `${Colors.expense}20`
                          : `${Colors.chartreuse}20`,
                      borderColor:
                        cashFlow.trajectoryStatus === 'DEFICIT_WARNING'
                          ? Colors.expense
                          : Colors.chartreuse,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          cashFlow.trajectoryStatus === 'DEFICIT_WARNING'
                            ? Colors.expense
                            : Colors.chartreuse,
                      },
                    ]}
                  >
                    {cashFlow.trajectoryStatus.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.trajectorySub}>
                Day {cashFlow.currentDay} of {cashFlow.totalDaysInMonth} •{' '}
                {cashFlow.daysRemaining} days remaining in current billing cycle
              </Text>

              {/* Trajectory Daily Metrics */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Safe Daily Spend</Text>
                  <Text style={[styles.heroStatValue, { color: Colors.chartreuse }]}>
                    ₹{Math.round(cashFlow.safeDailySpend).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Current Daily Burn</Text>
                  <Text style={[styles.heroStatValue, { color: Colors.warning }]}>
                    ₹{Math.round(cashFlow.averageDailySpend).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Available Right Now</Text>
                  <Text style={[styles.heroStatValue, { color: Colors.secondaryFixed }]}>
                    ₹{Math.round(cashFlow.currentAvailableToSpend).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget Breach Early Warnings */}
            {cashFlow.budgetBreachRisks.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={[styles.cardHeaderTitle, { color: Colors.warning }]}>
                    BUDGET BREACH FORECAST (NEXT 10 DAYS)
                  </Text>
                </View>
                {cashFlow.budgetBreachRisks.map((risk, idx) => (
                  <View key={idx} style={styles.breachRow}>
                    <View style={styles.breachInfo}>
                      <Text style={styles.breachName}>{risk.categoryName}</Text>
                      <Text style={styles.breachDetails}>
                        Spent ₹{Math.round(risk.currentSpent).toLocaleString('en-IN')} of ₹{risk.budgetLimit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breachBadge}>
                      <Text style={styles.breachBadgeText}>
                        {risk.estimatedDaysToBreach
                          ? `Breach in ~${risk.estimatedDaysToBreach}d`
                          : 'Over Limit'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recurring Outlays & Subscriptions */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar size={16} color={Colors.secondaryFixed} />
                <Text style={styles.cardHeaderTitle}>
                  DETECTED RECURRING COMMITMENTS ({recurring.length})
                </Text>
              </View>
              <Text style={styles.cardDesc}>
                Identified automatically from regular fixed payments and subscriptions:
              </Text>
              {recurring.length > 0 ? (
                recurring.map((rec, idx) => (
                  <View key={idx} style={styles.recurringItem}>
                    <View style={styles.recurringLeft}>
                      <Text style={styles.recurringName}>{rec.name}</Text>
                      <Text style={styles.recurringMeta}>
                        Every ~{rec.frequencyDays} days • Last paid: {rec.lastDate}
                      </Text>
                    </View>
                    <Text style={styles.recurringAmount}>
                      ₹{Math.round(rec.averageAmount).toLocaleString('en-IN')}/mo
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyInlineText}>
                  No repeating subscriptions detected yet. Regular intervals will appear here automatically.
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: VELOCITY RADAR & AUTOPILOT
           ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'radar' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
            {/* Real-Time Speedometer Radar */}
            {velocity && (
              <View style={styles.heroCard}>
                <View style={styles.radarHeader}>
                  <Gauge size={18} color={Colors.primaryFixed} />
                  <Text style={styles.radarTitle}>SPENDING VELOCITY RADAR</Text>
                </View>

                {/* Speedometer Gauge Visual */}
                <View style={styles.gaugeContainer}>
                  <View style={styles.gaugeCenter}>
                    <Text
                      style={[
                        styles.gaugeValue,
                        {
                          color:
                            velocity.status === 'HEALTHY'
                              ? Colors.chartreuse
                              : velocity.status === 'CAUTION'
                              ? Colors.warning
                              : Colors.expense,
                        },
                      ]}
                    >
                      {velocity.velocityMultiplier}×
                    </Text>
                    <Text style={styles.gaugeSub}>PACE MULTIPLIER</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.velocityStatusBadge,
                    {
                      borderColor:
                        velocity.status === 'HEALTHY'
                          ? Colors.chartreuse
                          : velocity.status === 'CAUTION'
                          ? Colors.warning
                          : Colors.expense,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.velocityStatusText,
                      {
                        color:
                          velocity.status === 'HEALTHY'
                            ? Colors.chartreuse
                            : velocity.status === 'CAUTION'
                            ? Colors.warning
                            : Colors.expense,
                      },
                    ]}
                  >
                    BURNING AT {velocity.status} PACE
                  </Text>
                </View>

                <Text style={styles.velocityMsg}>{velocity.statusMessage}</Text>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatLabel}>Current Burn</Text>
                    <Text style={[styles.heroStatValue, { color: Colors.warning }]}>
                      ₹{Math.round(velocity.currentBurnRatePerDay).toLocaleString('en-IN')}/day
                    </Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatLabel}>Recommended Pace</Text>
                    <Text style={[styles.heroStatValue, { color: Colors.chartreuse }]}>
                      ₹{Math.round(velocity.safeBurnRatePerDay).toLocaleString('en-IN')}/day
                    </Text>
                  </View>
                </View>

                {velocity.primarySurgeCategory && (
                  <View style={styles.surgeNotice}>
                    <Zap size={14} color={Colors.warning} />
                    <Text style={styles.surgeText}>
                      Top surge driver:{' '}
                      <Text style={{ fontFamily: FontFamily.headingBold }}>
                        {velocity.primarySurgeCategory.name}
                      </Text>{' '}
                      (₹{Math.round(velocity.primarySurgeCategory.amount).toLocaleString('en-IN')})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Smart Savings Autopilot: Round-Ups */}
            {autopilot && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <PiggyBank size={16} color={Colors.chartreuse} />
                  <Text style={styles.cardHeaderTitle}>SMART ROUND-UP AUTOPILOT</Text>
                </View>
                <Text style={styles.cardDesc}>
                  Virtually round up every expense to accumulate effortless spare change savings:
                </Text>

                {/* Round-up Tier Selectors */}
                <View style={styles.tierSelectorRow}>
                  {[10, 50, 100].map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[
                        styles.tierPill,
                        selectedRoundUpTier === tier && styles.tierPillActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedRoundUpTier(tier as any);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tierText,
                          selectedRoundUpTier === tier && styles.tierTextActive,
                        ]}
                      >
                        Nearest ₹{tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.roundUpDisplayBox}>
                  <Text style={styles.roundUpTotalLabel}>
                    Spare Change Accrued This Month:
                  </Text>
                  <Text style={styles.roundUpTotalValue}>
                    ₹
                    {(selectedRoundUpTier === 10
                      ? autopilot.roundUp10Total
                      : selectedRoundUpTier === 50
                      ? autopilot.roundUp50Total
                      : autopilot.roundUp100Total
                    ).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.roundUpAnnual}>
                    ≈ ₹{(
                      (selectedRoundUpTier === 10
                        ? autopilot.roundUp10Total
                        : selectedRoundUpTier === 50
                        ? autopilot.roundUp50Total
                        : autopilot.roundUp100Total) * 12
                    ).toLocaleString('en-IN')}{' '}
                    annual potential savings
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.saveRoundUpBtn}
                  onPress={handleSaveRoundUpsToReservation}
                  activeOpacity={0.8}
                >
                  <Check size={16} color={Colors.onPrimary} />
                  <Text style={styles.saveRoundUpBtnText}>
                    Lock Round-Ups to Reserved Money
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* No-Spend Streak Tracker */}
            {autopilot && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Flame size={16} color={Colors.warning} />
                  <Text style={styles.cardHeaderTitle}>NO-SPEND STREAK TRACKER</Text>
                </View>

                <View style={styles.streakGrid}>
                  <View style={styles.streakCell}>
                    <Text style={styles.streakVal}>{autopilot.currentNoSpendStreak}</Text>
                    <Text style={styles.streakLbl}>Current Streak (Days)</Text>
                  </View>
                  <View style={styles.streakDivider} />
                  <View style={styles.streakCell}>
                    <Text style={styles.streakVal}>{autopilot.longestNoSpendStreak}</Text>
                    <Text style={styles.streakLbl}>Month Longest Streak</Text>
                  </View>
                  <View style={styles.streakDivider} />
                  <View style={styles.streakCell}>
                    <Text style={styles.streakVal}>{autopilot.noSpendDaysCount}</Text>
                    <Text style={styles.streakLbl}>Zero-Spend Days</Text>
                  </View>
                </View>

                {/* Challenge Progress */}
                <View style={styles.challengeBox}>
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>10-Day Discipline Challenge</Text>
                    <Text style={styles.challengeProgressText}>
                      {autopilot.noSpendChallengeProgress} / 10 Days
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min((autopilot.noSpendChallengeProgress / 10) * 100, 100)}%`,
                          backgroundColor: Colors.chartreuse,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeLight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    letterSpacing: 1.5,
    color: Colors.onSurface,
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 1,
  },
  offlineEngineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.chartreuse}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}40`,
  },
  liveEngineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.chartreuse,
  },
  offlineEngineText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    color: Colors.chartreuse,
    letterSpacing: 0.5,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeLight,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 4,
  },
  tabsScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 4,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryFixed,
  },
  tabText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: Colors.onPrimaryContainer,
    fontFamily: FontFamily.headingBold,
  },
  tabBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    color: '#000000',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  tabContent: {
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    padding: Spacing.xl,
    gap: 16,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gradeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
  },
  gradeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
  },
  gradeDetails: {
    flex: 1,
    gap: 2,
  },
  gradeSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
  },
  gradeTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.onSurface,
  },
  savingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.chartreuse}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    marginTop: 2,
  },
  savingsPillText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 10,
    color: Colors.chartreuse,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  heroStatValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeLight,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 10,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: `${Colors.primaryFixed}30`,
  },
  broadcastBtnText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.primaryFixed,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    padding: Spacing.xl,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.onSurface,
  },
  narrativeText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.onSurface,
    fontStyle: 'italic',
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
  },
  comparisonText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onSurface,
  },
  catRow: {
    gap: 4,
  },
  catInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurface,
  },
  catAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    color: Colors.onSurface,
  },
  catPercent: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  merchantHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainer,
    padding: 10,
    borderRadius: Shapes.md,
  },
  merchantIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: Colors.secondaryFixed,
  },
  merchantContent: {
    flex: 1,
  },
  merchantName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  merchantSub: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  merchantTotal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  tipCard: {
    backgroundColor: `${Colors.primaryFixed}08`,
    borderColor: `${Colors.primaryFixed}25`,
  },
  tipText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onSurface,
  },
  cardDesc: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onSurfaceVariant,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${Colors.warning}15`,
    paddingVertical: 10,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  simulateBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.warning,
  },
  sectionHeaderLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
    marginTop: 4,
  },
  anomalyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
    padding: Spacing.xl,
    marginBottom: 10,
    gap: 12,
  },
  anomalyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anomalyCatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anomalyCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  anomalyCatName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  anomalyMultiplierPill: {
    backgroundColor: `${Colors.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  anomalyMultiplierText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  anomalyAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  anomalyAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 20,
    color: Colors.expense,
  },
  anomalyDate: {
    fontFamily: FontFamily.numeric,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  anomalyMessage: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.onSurface,
  },
  anomalyNote: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  emptyStateCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: 30,
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  emptyStateDesc: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  heroPreTitle: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
  },
  projectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectedAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  trajectorySub: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  breachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeLight,
  },
  breachInfo: {
    flex: 1,
  },
  breachName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: Colors.onSurface,
  },
  breachDetails: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  breachBadge: {
    backgroundColor: `${Colors.expense}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  breachBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: Colors.expense,
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeLight,
  },
  recurringLeft: {
    flex: 1,
  },
  recurringName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: Colors.onSurface,
  },
  recurringMeta: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  recurringAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    color: Colors.secondaryFixed,
  },
  emptyInlineText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radarTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.onSurface,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 34,
  },
  gaugeSub: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 2,
  },
  velocityStatusBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  velocityStatusText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  velocityMsg: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.onSurface,
    textAlign: 'center',
    lineHeight: 18,
  },
  surgeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.warning}15`,
    padding: 8,
    borderRadius: Shapes.md,
  },
  surgeText: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.warning,
  },
  tierSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  tierPillActive: {
    backgroundColor: `${Colors.chartreuse}20`,
    borderColor: Colors.chartreuse,
  },
  tierText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  tierTextActive: {
    fontFamily: FontFamily.headingBold,
    color: Colors.chartreuse,
  },
  roundUpDisplayBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    padding: 12,
    alignItems: 'center',
    gap: 3,
  },
  roundUpTotalLabel: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  roundUpTotalValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 26,
    color: Colors.chartreuse,
  },
  roundUpAnnual: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  saveRoundUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 11,
    borderRadius: Shapes.md,
  },
  saveRoundUpBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: Colors.onPrimary,
  },
  streakGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    paddingVertical: 12,
  },
  streakCell: {
    flex: 1,
    alignItems: 'center',
  },
  streakVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
    color: Colors.warning,
  },
  streakLbl: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  streakDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeLight,
  },
  challengeBox: {
    gap: 6,
    marginTop: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurface,
  },
  challengeProgressText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.chartreuse,
  },
});
