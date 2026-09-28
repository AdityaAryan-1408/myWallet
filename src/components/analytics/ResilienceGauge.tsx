/**
 * MyWallet — Personal Financial Resilience Score Gauge
 * 
 * Phase 12: 0-100 Zenith Quotient
 * Evaluates Savings Rate, Credit Discipline, Budget Adherence, and Safety Runway.
 * Rendered using lightweight SVG semi-arc with glowing indicators and pillar scorecards.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  PieChart,
  Users,
  Activity,
  Flame,
  Sparkles,
  ChevronRight,
  Sliders,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import {
  FinancialResilienceData,
  TransparentHealthScoreData,
  HealthScoreFactor,
  ResiliencePillar,
} from '@/repositories';

interface ResilienceGaugeProps {
  data: FinancialResilienceData | TransparentHealthScoreData;
  onFactorPress?: (factor: HealthScoreFactor) => void;
  onPillarPress?: (pillar: ResiliencePillar) => void;
}

export function ResilienceGauge({ data, onFactorPress, onPillarPress }: ResilienceGaugeProps) {
  const size = 200;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 4;

  // Arc from 135 deg to 405 deg (270 degree sweep)
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle; // 270 degrees

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const scoreVal = 'totalScore' in data ? data.totalScore : data.score;
  const normalizedScore = Math.min(100, Math.max(0, scoreVal));
  const currentAngle = startAngle + (normalizedScore / 100) * totalAngle;

  const bgPath = describeArc(center, center, radius, startAngle, endAngle);
  const activePath = describeArc(center, center, radius, startAngle, currentAngle);
  const indicatorPoint = polarToCartesian(center, center, radius, currentAngle);

  const isTransparentData = 'factors' in data && Array.isArray((data as TransparentHealthScoreData).factors);
  const factors = isTransparentData ? (data as TransparentHealthScoreData).factors : [];

  const getFactorIcon = (id: string) => {
    switch (id) {
      case 'savings_rate':
      case 'savings':
        return <TrendingUp size={15} color={Colors.income} />;
      case 'budget_adherence':
      case 'budget':
        return <PieChart size={15} color={Colors.primaryFixed} />;
      case 'debt_health':
        return <Users size={15} color="#FF9E0B" />;
      case 'cc_utilization':
      case 'credit':
        return <CreditCard size={15} color={Colors.secondaryFixed} />;
      case 'spending_consistency':
        return <Activity size={15} color="#A855F7" />;
      case 'no_spend_discipline':
        return <Flame size={15} color="#FF6B6B" />;
      default:
        return <ShieldCheck size={15} color={Colors.chartreuse} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldBadge}>
            <ShieldCheck size={16} color={Colors.chartreuse} />
          </View>
          <View>
            <Text style={styles.headerTitle}>ZENITH RESILIENCE QUOTIENT</Text>
            <Text style={styles.headerSubtitle}>
              {isTransparentData ? '6 Transparent Pillars · Tap to Simulate' : '4-Pillar Solvency & Stability Audit'}
            </Text>
          </View>
        </View>
        <View style={[styles.tierPill, { backgroundColor: `${data.tierColor}1A`, borderColor: `${data.tierColor}4D` }]}>
          <View style={[styles.tierDot, { backgroundColor: data.tierColor }]} />
          <Text style={[styles.tierText, { color: data.tierColor }]}>{data.tier.toUpperCase()}</Text>
        </View>
      </View>

      {/* SVG Arc Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="resilienceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00F0FF" />
              <Stop offset="50%" stopColor="#00E676" />
              <Stop offset="100%" stopColor={data.tierColor} />
            </LinearGradient>
          </Defs>

          {/* Background Track Arc */}
          <Path
            d={bgPath}
            stroke={Colors.surfaceContainerHigh}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Active Score Arc */}
          {normalizedScore > 0 && (
            <Path
              d={activePath}
              stroke="url(#resilienceGrad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Indicator Dot */}
          <Circle
            cx={indicatorPoint.x}
            cy={indicatorPoint.y}
            r={strokeWidth / 2 + 2}
            fill={Colors.surface}
            stroke={data.tierColor}
            strokeWidth={3}
          />
        </Svg>

        {/* Center Numbers */}
        <View style={styles.centerContent}>
          <Text style={styles.scoreText}>{normalizedScore}</Text>
          <Text style={styles.scoreMaxText}>/ 100</Text>
        </View>
      </View>

      {/* Headline Pill Badge beneath the Gauge */}
      <View style={styles.headlineWrapper}>
        <View
          style={[
            styles.headlinePill,
            { backgroundColor: `${data.tierColor}14`, borderColor: `${data.tierColor}40` },
          ]}
        >
          <Sparkles size={13} color={data.tierColor} />
          <Text style={[styles.headlineText, { color: data.tierColor }]}>
            {data.headline.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Interactive Helper Hint */}
      {isTransparentData && (
        <View style={styles.hintRow}>
          <Sliders size={13} color={Colors.chartreuse} />
          <Text style={styles.hintText}>
            Tap any factor below to inspect formula & run "What-If" simulation
          </Text>
        </View>
      )}

      {/* Factors Grid */}
      <View style={styles.pillarsGrid}>
        {isTransparentData
          ? factors.map((factor) => {
              const statusColor =
                factor.score >= 75 ? Colors.income : factor.score >= 50 ? '#FFD93D' : Colors.expense;

              return (
                <TouchableOpacity
                  key={factor.id}
                  style={styles.pillarCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onFactorPress?.(factor);
                  }}
                >
                  <View style={styles.pillarTop}>
                    <View style={styles.pillarIconBox}>{getFactorIcon(factor.id)}</View>
                    <View style={styles.weightBadge}>
                      <Text style={styles.weightBadgeText}>{factor.weight}%</Text>
                    </View>
                  </View>

                  <Text style={styles.pillarName} numberOfLines={1}>
                    {factor.name}
                  </Text>

                  {/* Progress bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${factor.score}%`, backgroundColor: statusColor },
                      ]}
                    />
                  </View>

                  <View style={styles.pillarFooter}>
                    <Text style={styles.pillarMetricLabel}>{factor.metricLabel}</Text>
                    <View style={styles.scoreWithChevron}>
                      <Text style={[styles.pillarScoreVal, { color: statusColor }]}>
                        {factor.score}
                      </Text>
                      <Text style={styles.pillarScoreMax}>/100</Text>
                      <ChevronRight size={12} color={Colors.onSurfaceVariant} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          : (data as FinancialResilienceData).pillars.map((pillar) => {
              const pct = Math.round((pillar.score / pillar.maxScore) * 100);
              const isOptimal = pillar.status === 'optimal';
              const isFair = pillar.status === 'fair';
              const statusColor = isOptimal ? Colors.income : isFair ? '#FFD93D' : Colors.expense;

              return (
                <TouchableOpacity
                  key={pillar.id}
                  style={styles.pillarCard}
                  activeOpacity={0.7}
                  onPress={() => onPillarPress?.(pillar)}
                >
                  <View style={styles.pillarTop}>
                    <View style={styles.pillarIconBox}>{getFactorIcon(pillar.id)}</View>
                    <View style={styles.pillarScoreBox}>
                      <Text style={styles.pillarScoreVal}>{pillar.score}</Text>
                      <Text style={styles.pillarScoreMax}>/25</Text>
                    </View>
                  </View>

                  <Text style={styles.pillarName} numberOfLines={1}>
                    {pillar.name}
                  </Text>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${pct}%`, backgroundColor: statusColor },
                      ]}
                    />
                  </View>

                  <View style={styles.pillarFooter}>
                    <Text style={styles.pillarMetricLabel}>{pillar.metricLabel}</Text>
                    <Text style={[styles.pillarMetricVal, { color: statusColor }]}>
                      {pillar.metricValue}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
      </View>

      {/* Key Recommendation Box */}
      <View style={styles.recBox}>
        <Sparkles size={16} color={Colors.chartreuse} style={styles.recIcon} />
        <View style={styles.recContent}>
          <Text style={styles.recTitle}>AI RESILIENCE DIRECTIVE</Text>
          <Text style={styles.recText}>{data.keyRecommendation}</Text>
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
  shieldBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.chartreuse}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}33`,
  },
  headerTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 11,
    letterSpacing: 1.0,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    gap: 5,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    ...Typography.labelCaps,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.xs,
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 44,
    color: Colors.onSurface,
    lineHeight: 48,
  },
  scoreMaxText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: -2,
  },
  headlineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  headlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    gap: 6,
  },
  headlineText: {
    ...Typography.labelCaps,
    fontSize: 10.5,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pillarCard: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 6,
  },
  pillarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarScoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pillarScoreVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
    color: Colors.onSurface,
  },
  pillarScoreMax: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  pillarName: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pillarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillarMetricLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  pillarMetricVal: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10.5,
    fontWeight: '600',
  },
  recBox: {
    flexDirection: 'row',
    backgroundColor: `${Colors.chartreuse}0D`,
    borderRadius: Shapes.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}33`,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  recIcon: {
    marginTop: 2,
  },
  recContent: {
    flex: 1,
    gap: 2,
  },
  recTitle: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.chartreuse,
    letterSpacing: 0.8,
  },
  recText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.onSurface,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.chartreuse}0F`,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Shapes.md,
    alignSelf: 'center',
  },
  hintText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.chartreuse,
    letterSpacing: 0.3,
  },
  weightBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  weightBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  scoreWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
