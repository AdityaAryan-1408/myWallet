/**
 * MyWallet — Merchant Intelligence & Price Memory Card
 * 
 * Tier 2: Merchant Spend Leaderboard, Frequency Cadence, and Price Deviation Alerts.
 * Tracks price history per merchant/category combination:
 * "You usually spend ₹250–300 at this merchant. Recent ₹580 is 93% higher than typical."
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Store,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  CreditCard,
  Calendar,
  Layers,
  Search,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { MerchantIntelligenceReport, MerchantIntelligenceItem } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface MerchantIntelligenceCardProps {
  report: MerchantIntelligenceReport;
}

type FilterType = 'all' | 'alerts' | 'frequent';

export function MerchantIntelligenceCard({ report }: MerchantIntelligenceCardProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredMerchants = report.merchants.filter((m) => {
    if (filter === 'alerts') {
      return m.deviationAlert !== null && m.deviationAlert !== undefined;
    }
    if (filter === 'frequent') {
      return m.visitsPerWeek > 0 || m.transactionCount >= 2;
    }
    return true;
  });

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={12} color={Colors.expense} />;
      case 'decreasing':
        return <TrendingDown size={12} color={Colors.income} />;
      default:
        return <Minus size={12} color={Colors.onSurfaceVariant} />;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.primaryFixed}1A` }]}>
            <Store size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>MERCHANT INTELLIGENCE</Text>
            <Text style={styles.headerSubtitle}>Price Memory & Frequency Map</Text>
          </View>
        </View>

        {report.deviationAlerts.length > 0 && (
          <View style={styles.alertPill}>
            <AlertTriangle size={11} color={Colors.expense} />
            <Text style={styles.alertPillText}>
              {report.deviationAlerts.length} SPIKE{report.deviationAlerts.length > 1 ? 'S' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Top 3 Metric Pills */}
      <View style={styles.statGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MERCHANTS</Text>
          <Text style={styles.statVal}>{report.totalTrackedMerchants}</Text>
          <Text style={styles.statSub}>Tracked offline</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOP SPEND PAYEE</Text>
          <Text style={styles.statVal} numberOfLines={1}>
            {report.topMerchantBySpend ? report.topMerchantBySpend.name : 'None'}
          </Text>
          <Text style={styles.statSub}>
            {report.topMerchantBySpend
              ? `₹${report.topMerchantBySpend.totalSpend.toLocaleString('en-IN')}`
              : '₹0'}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PRICE SPIKES</Text>
          <Text
            style={[
              styles.statVal,
              report.deviationAlerts.length > 0 && { color: Colors.expense },
            ]}
          >
            {report.deviationAlerts.length}
          </Text>
          <Text style={styles.statSub}>&gt;25% over avg</Text>
        </View>
      </View>

      {/* Price Deviation Warning Box (If any alerts active) */}
      {report.deviationAlerts.length > 0 && (
        <View style={styles.deviationAlertBanner}>
          <View style={styles.deviationTopRow}>
            <AlertTriangle size={15} color={Colors.expense} />
            <Text style={styles.deviationBannerTitle}>PRICE DEVIATION WARNING</Text>
          </View>

          {report.deviationAlerts.slice(0, 2).map((alertMerchant) => (
            <View key={alertMerchant.name} style={styles.deviationItem}>
              <Text style={styles.deviationItemMerchant}>{alertMerchant.name}</Text>
              <Text style={styles.deviationItemMessage}>
                {alertMerchant.deviationAlert?.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'all' as FilterType, label: `All (${report.merchants.length})` },
          { id: 'alerts' as FilterType, label: `Spikes (${report.deviationAlerts.length})` },
          { id: 'frequent' as FilterType, label: 'Frequent' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                isActive && {
                  backgroundColor: `${Colors.primaryFixed}1A`,
                  borderColor: Colors.primaryFixed,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(tab.id);
              }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && { color: Colors.primaryFixed, fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Merchant Leaderboard List */}
      <View style={styles.merchantsList}>
        {filteredMerchants.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No merchants matching this filter.</Text>
          </View>
        ) : (
          filteredMerchants.map((m) => {
            const hasAlert = m.deviationAlert !== null && m.deviationAlert !== undefined;

            return (
              <View
                key={m.name}
                style={[
                  styles.merchantRow,
                  hasAlert && { borderColor: `${Colors.expense}40`, backgroundColor: `${Colors.expense}08` },
                ]}
              >
                <View style={styles.merchantTopRow}>
                  <View style={styles.merchantLeft}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${m.categoryColor}1A` }]}>
                      <CategoryIcon icon={m.categoryIcon} color={m.categoryColor} size={15} />
                    </View>
                    <View>
                      <View style={styles.nameWithBadge}>
                        <Text style={styles.merchantName} numberOfLines={1}>
                          {m.name}
                        </Text>
                        {hasAlert && (
                          <View style={styles.miniAlertPill}>
                            <Text style={styles.miniAlertText}>
                              +{m.deviationAlert?.percentDiff}% SPIKE
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.merchantCategory}>{m.categoryName}</Text>
                    </View>
                  </View>

                  <View style={styles.merchantRight}>
                    <Text style={styles.merchantSpend}>
                      ₹{m.totalSpend.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.merchantCount}>
                      {m.transactionCount} visit{m.transactionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Price Memory & Frequency Strip */}
                <View style={styles.memoryStrip}>
                  {/* Cadence */}
                  <View style={styles.cadencePill}>
                    {getTrendIcon(m.trend)}
                    <Text style={styles.cadenceText}>
                      {m.visitsPerWeek > 0 ? `${m.visitsPerWeek}x / week` : `${m.transactionCount} total`}
                    </Text>
                  </View>

                  {/* Typical Price Range */}
                  <View style={styles.priceMemoryPill}>
                    <Text style={styles.priceMemoryText}>
                      Typical: ₹{m.minSpend}–₹{m.maxSpend} (Avg ₹{m.averageSpend})
                    </Text>
                  </View>
                </View>

                {/* Credit Card Recommendation Tip */}
                {m.rewardTip && (
                  <View style={styles.perkRow}>
                    <CreditCard size={11} color={Colors.secondaryFixed} />
                    <Text style={styles.perkText} numberOfLines={1}>
                      {m.rewardTip}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
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
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.expense}1A`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: `${Colors.expense}33`,
  },
  alertPillText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.expense,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 2,
  },
  statLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: FontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statSub: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
  },
  deviationAlertBanner: {
    backgroundColor: `${Colors.expense}12`,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.expense}40`,
    gap: 6,
  },
  deviationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviationBannerTitle: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.expense,
    letterSpacing: 0.5,
  },
  deviationItem: {
    gap: 2,
    marginTop: 2,
  },
  deviationItemMerchant: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  deviationItemMessage: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  filterTabText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  merchantsList: {
    gap: Spacing.sm,
  },
  merchantRow: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.xs,
  },
  merchantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  merchantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  merchantName: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  miniAlertPill: {
    backgroundColor: `${Colors.expense}26`,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniAlertText: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.expense,
  },
  merchantCategory: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  merchantRight: {
    alignItems: 'flex-end',
  },
  merchantSpend: {
    fontFamily: FontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  merchantCount: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  memoryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  cadencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  cadenceText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  priceMemoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${Colors.chartreuse}10`,
  },
  priceMemoryText: {
    fontFamily: FontFamily.mono,
    fontSize: 9.5,
    color: Colors.chartreuse,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.secondaryFixed}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  perkText: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Colors.secondaryFixed,
    fontWeight: '500',
    flex: 1,
  },
  emptyBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
});
