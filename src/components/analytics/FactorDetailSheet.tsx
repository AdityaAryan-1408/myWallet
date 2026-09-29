/**
 * MyWallet — Factor Detail Sheet & "What-If" Simulator
 * 
 * Tier 2: Transparent Financial Health Score Engine
 * Shows factor weight, live SQLite data breakdown, score / 100,
 * 3-month historical trajectory, and an interactive real-time "What-If" simulator slider.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sparkles,
  TrendingUp,
  Sliders,
  History,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { HealthScoreFactor } from '@/repositories';

interface FactorDetailSheetProps {
  factor: HealthScoreFactor | null;
  overallScore: number;
  visible: boolean;
  onClose: () => void;
}

export function FactorDetailSheet({
  factor,
  overallScore,
  visible,
  onClose,
}: FactorDetailSheetProps) {
  const insets = useSafeAreaInsets();

  const [simulatedValue, setSimulatedValue] = useState<number>(0);

  // Initialize or reset slider value whenever factor changes
  useEffect(() => {
    if (factor) {
      setSimulatedValue(factor.sliderConfig.initialValue);
    }
  }, [factor]);

  if (!factor) return null;

  // Calculate simulated factor score given the simulated metric
  const calculateSimulatedFactorScore = (val: number): number => {
    switch (factor.id) {
      case 'savings_rate': {
        // val is % (0..60)
        if (val >= 40) return 100;
        if (val >= 30) return Math.round(88 + ((val - 30) / 10) * 12);
        if (val >= 20) return Math.round(72 + ((val - 20) / 10) * 16);
        if (val >= 10) return Math.round(50 + ((val - 10) / 10) * 22);
        if (val >= 0) return Math.round(20 + (val / 10) * 30);
        return Math.max(5, Math.round(20 + val));
      }
      case 'budget_adherence': {
        // val is adherence % (0..100)
        return Math.min(100, Math.max(15, Math.round(val)));
      }
      case 'debt_health': {
        // val is total owed (0..max)
        if (val === 0) return 100;
        if (val <= 1500) return 88;
        if (val <= 5000) return 72;
        if (val <= 15000) return 55;
        return Math.max(15, 50 - Math.round(val / 3000));
      }
      case 'cc_utilization': {
        // val is % utilization (0..80)
        if (val <= 10) return 98;
        if (val <= 20) return 90;
        if (val <= 30) return 80;
        if (val <= 50) return 58;
        return Math.max(10, 50 - Math.round(val - 50));
      }
      case 'spending_consistency': {
        // val is CV (0.2..2.0)
        if (val <= 0.4) return 95;
        if (val <= 0.7) return 82;
        if (val <= 1.0) return 68;
        if (val <= 1.4) return 50;
        return 32;
      }
      case 'no_spend_discipline': {
        // val is no-spend days in month (0..20)
        const rate = (val / 30) * 100;
        if (rate >= 32) return 96;
        if (rate >= 22) return 82;
        if (rate >= 14) return 65;
        if (rate >= 6) return 48;
        return 28;
      }
      default:
        return factor.score;
    }
  };

  const simFactorScore = calculateSimulatedFactorScore(simulatedValue);
  const factorScoreDelta = simFactorScore - factor.score;

  // Impact on overall score: factor's weight contribution change
  const currentWeightedContrib = (factor.score * factor.weight) / 100;
  const simulatedWeightedContrib = (simFactorScore * factor.weight) / 100;
  const overallDelta = Math.round(simulatedWeightedContrib - currentWeightedContrib);
  const projectedOverallScore = Math.min(100, Math.max(0, overallScore + overallDelta));

  const isSimulated = simulatedValue !== factor.sliderConfig.initialValue;

  const handleStep = (direction: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const step = factor.sliderConfig.step;
    setSimulatedValue((prev) => {
      let next = direction === 'up' ? prev + step : prev - step;
      next = Number(next.toFixed(2));
      return Math.min(factor.sliderConfig.max, Math.max(factor.sliderConfig.min, next));
    });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSimulatedValue(factor.sliderConfig.initialValue);
  };

  const statusColor =
    factor.score >= 75 ? Colors.income : factor.score >= 50 ? '#FFD93D' : Colors.expense;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.weightPill, { backgroundColor: `${Colors.chartreuse}1A` }]}>
                <Text style={styles.weightPillText}>{factor.weight}% WEIGHT</Text>
              </View>
              <Text style={styles.headerTitle}>{factor.name.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Scorecard Hero */}
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroSub}>FACTOR HEALTH SCORE</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.heroScore, { color: statusColor }]}>{factor.score}</Text>
                    <Text style={styles.heroMax}>/ 100</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}4D` },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {factor.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${factor.score}%`, backgroundColor: statusColor },
                  ]}
                />
              </View>

              <View style={styles.heroMetaRow}>
                <Text style={styles.metaLabel}>ZENITH IMPACT</Text>
                <Text style={styles.metaVal}>
                  +{factor.weightedScore} pts towards overall {overallScore}/100
                </Text>
              </View>
            </View>

            {/* Live Data Breakdown */}
            <View style={styles.dataCard}>
              <View style={styles.sectionHeader}>
                <Info size={15} color={Colors.primaryFixed} />
                <Text style={styles.sectionTitle}>YOUR LIVE DATA BREAKDOWN</Text>
              </View>
              <Text style={styles.dataText}>{factor.yourData}</Text>
              <Text style={styles.dataSub}>Derived 100% offline from current SQLite ledger</Text>
            </View>

            {/* Actionable Improvement Roadmap */}
            <View style={styles.tipCard}>
              <View style={styles.sectionHeader}>
                <Sparkles size={15} color={Colors.chartreuse} />
                <Text style={styles.sectionTitle}>HOW TO IMPROVE SCORE</Text>
              </View>
              <Text style={styles.tipText}>{factor.improvementTip}</Text>
            </View>

            {/* 3-Month Trajectory Sparkline */}
            <View style={styles.historyCard}>
              <View style={styles.sectionHeader}>
                <History size={15} color={Colors.secondaryFixed} />
                <Text style={styles.sectionTitle}>3-MONTH TRAJECTORY</Text>
              </View>

              <View style={styles.historyRow}>
                {factor.history3Months.map((h, idx) => {
                  const isCurrent = idx === factor.history3Months.length - 1;
                  const barColor = isCurrent ? Colors.chartreuse : Colors.surfaceContainerHighest;

                  return (
                    <View key={h.monthLabel} style={styles.historyCol}>
                      <Text style={[styles.historyScoreText, isCurrent && { color: Colors.chartreuse, fontWeight: '700' }]}>
                        {h.score}
                      </Text>
                      <View style={styles.historyBarTrack}>
                        <View
                          style={[
                            styles.historyBarFill,
                            {
                              height: `${Math.max(15, h.score)}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.historyLabel, isCurrent && { color: Colors.chartreuse, fontWeight: '700' }]}>
                        {h.monthLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Interactive "What-If" Simulator */}
            <View style={styles.simulatorCard}>
              <View style={styles.simHeader}>
                <View style={styles.sectionHeader}>
                  <Sliders size={16} color={Colors.chartreuse} />
                  <Text style={[styles.sectionTitle, { color: Colors.chartreuse }]}>
                    "WHAT-IF" SIMULATOR
                  </Text>
                </View>

                {isSimulated && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleReset}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <RotateCcw size={12} color={Colors.onSurfaceVariant} />
                    <Text style={styles.resetText}>RESET</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.simSub}>
                Adjust the {factor.sliderConfig.label.toLowerCase()} to simulate its projected effect on both this factor and your total Zenith score:
              </Text>

              {/* Slider Control Row */}
              <View style={styles.simControlRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStep('down')}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={Colors.onSurface} />
                </TouchableOpacity>

                <View style={styles.simValueDisplay}>
                  <Text style={styles.simValueText}>
                    {factor.id === 'debt_health'
                      ? `₹${simulatedValue.toLocaleString('en-IN')}`
                      : `${simulatedValue}${factor.sliderConfig.unit}`}
                  </Text>
                  <Text style={styles.simValueLabel}>{factor.sliderConfig.label}</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStep('up')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetRow}>
                {[
                  { label: 'Low', pct: 0.25 },
                  { label: 'Mid', pct: 0.5 },
                  { label: 'Target', pct: 0.75 },
                  { label: 'Peak', pct: 1.0 },
                ].map((preset) => {
                  const targetVal =
                    factor.sliderConfig.min +
                    (factor.sliderConfig.max - factor.sliderConfig.min) * preset.pct;
                  const rounded = Number(
                    (Math.round(targetVal / factor.sliderConfig.step) * factor.sliderConfig.step).toFixed(1)
                  );

                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        styles.presetPill,
                        simulatedValue === rounded && {
                          backgroundColor: `${Colors.chartreuse}26`,
                          borderColor: Colors.chartreuse,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSimulatedValue(rounded);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetPillText,
                          simulatedValue === rounded && { color: Colors.chartreuse, fontWeight: '700' },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Impact Projection Results */}
              <View style={styles.impactBox}>
                <View style={styles.impactCol}>
                  <Text style={styles.impactLabel}>PROJECTED FACTOR</Text>
                  <View style={styles.impactValRow}>
                    <Text style={styles.impactFrom}>{factor.score}</Text>
                    <Text style={styles.impactArrow}>→</Text>
                    <Text
                      style={[
                        styles.impactTo,
                        factorScoreDelta > 0
                          ? { color: Colors.income }
                          : factorScoreDelta < 0
                          ? { color: Colors.expense }
                          : {},
                      ]}
                    >
                      {simFactorScore}
                    </Text>
                    {factorScoreDelta !== 0 && (
                      <Text
                        style={[
                          styles.impactDeltaBadge,
                          { color: factorScoreDelta > 0 ? Colors.income : Colors.expense },
                        ]}
                      >
                        ({factorScoreDelta > 0 ? '+' : ''}{factorScoreDelta})
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.impactDivider} />

                <View style={styles.impactCol}>
                  <Text style={styles.impactLabel}>TOTAL ZENITH SCORE</Text>
                  <View style={styles.impactValRow}>
                    <Text style={styles.impactFrom}>{overallScore}</Text>
                    <Text style={styles.impactArrow}>→</Text>
                    <Text
                      style={[
                        styles.impactTo,
                        overallDelta > 0
                          ? { color: Colors.chartreuse }
                          : overallDelta < 0
                          ? { color: Colors.expense }
                          : {},
                      ]}
                    >
                      {projectedOverallScore}
                    </Text>
                    {overallDelta !== 0 && (
                      <Text
                        style={[
                          styles.impactDeltaBadge,
                          { color: overallDelta > 0 ? Colors.chartreuse : Colors.expense },
                        ]}
                      >
                        ({overallDelta > 0 ? '+' : ''}{overallDelta})
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.strokeSubtle,
    maxHeight: '90%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerLeft: {
    gap: 4,
  },
  weightPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightPillText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.chartreuse,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSub: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  heroScore: {
    fontFamily: FontFamily.display,
    fontSize: 36,
    fontWeight: '800',
  },
  heroMax: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  metaVal: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  dataCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  dataText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    lineHeight: 20,
  },
  dataSub: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  tipCard: {
    backgroundColor: `${Colors.chartreuse}0F`,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}33`,
    gap: 6,
  },
  tipText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.onSurface,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: Spacing.sm,
  },
  historyCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  historyScoreText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  historyBarTrack: {
    width: 24,
    height: 60,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  historyBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  historyLabel: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  simulatorCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}4D`,
    gap: Spacing.md,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  resetText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  simSub: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },
  simControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.xs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simValueDisplay: {
    alignItems: 'center',
  },
  simValueText: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.chartreuse,
  },
  simValueLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  impactBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  impactCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  impactDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.strokeSubtle,
  },
  impactLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  impactValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  impactFrom: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  impactArrow: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  impactTo: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  impactDeltaBadge: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
  },
});
