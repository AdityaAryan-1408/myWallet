/**
 * MyWallet — Budgets Screen (Placeholder)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Colors, Typography, Spacing, Shapes } from '@/theme';

const BUDGET_ITEMS = [
  { name: 'Food & Dining', spent: 420, budget: 600, icon: '🍽', color: Colors.categoryFood, status: 'On Track' },
  { name: 'Transportation', spent: 310, budget: 400, icon: '🚗', color: Colors.categoryTransport, status: 'Approaching' },
  { name: 'Entertainment', spent: 145, budget: 250, icon: '🎬', color: Colors.categoryEntertainment, status: 'Healthy' },
  { name: 'Shopping', spent: 950, budget: 800, icon: '🛍', color: Colors.categoryShopping, status: 'Over by ₹150' },
  { name: 'Bills & Utilities', spent: 670, budget: 700, icon: '⚡', color: Colors.categoryBills, status: '95.7% Used' },
];

function getStatusColor(spent: number, budget: number) {
  const pct = (spent / budget) * 100;
  if (pct > 100) return Colors.expense;
  if (pct > 90) return Colors.warning;
  if (pct > 70) return '#FFD93D';
  return Colors.primaryFixed;
}

export default function BudgetsScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="BUDGETS" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall budget hero */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>AVAILABLE CAPITAL •</Text>
              <Text style={styles.heroAmount}>₹1,153</Text>
              <Text style={styles.heroSub}>Remaining of ₹3,000 budget</Text>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroCycle}>CYCLE: SEP 1-30</Text>
              <Text style={styles.heroPct}>62%</Text>
              <Text style={styles.heroPctLabel}>BURNED</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '62%', backgroundColor: Colors.primaryFixed }]} />
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>₹1,847 spent</Text>
            <Text style={styles.heroFooterText}>12 days left</Text>
          </View>
        </Animated.View>

        {/* Filter pills */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.filterRow}>
          {['ALL 5', '● HEALTHY', '● CAUTION', '● EXCEEDED'].map((filter, i) => (
            <View key={filter} style={[styles.filterPill, i === 0 && styles.filterPillActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{filter}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Budget category cards */}
        {BUDGET_ITEMS.map((item, i) => {
          const pct = Math.round((item.spent / item.budget) * 100);
          const barColor = getStatusColor(item.spent, item.budget);
          const remaining = item.budget - item.spent;
          return (
            <Animated.View
              key={item.name}
              entering={FadeInDown.duration(500).delay(200 + i * 80)}
              style={styles.budgetCard}
            >
              <View style={styles.budgetHeader}>
                <View style={styles.budgetLeft}>
                  <View style={[styles.budgetIcon, { backgroundColor: `${item.color}20` }]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <View>
                    <Text style={styles.budgetName}>{item.name}</Text>
                    <Text style={styles.budgetRemaining}>
                      {remaining >= 0 ? `Remaining: ₹${remaining}` : `Limit reached`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { borderColor: barColor }]}>
                  <Text style={[styles.statusText, { color: barColor }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
              </View>

              <View style={styles.budgetFooter}>
                <Text style={styles.budgetFooterText}>₹{item.spent} / ₹{item.budget}</Text>
                <Text style={[styles.budgetFooterPct, { color: barColor }]}>{pct.toFixed(1)}%</Text>
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.cardGap },

  heroCard: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg, gap: 12,
    borderWidth: 1, borderColor: Colors.strokeLight,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroLabel: { ...Typography.labelCaps, color: Colors.primaryFixed, fontSize: 10 },
  heroAmount: { fontFamily: 'JetBrainsMono-Bold', fontSize: 32, color: Colors.onSurface, marginVertical: 4 },
  heroSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  heroRight: { alignItems: 'flex-end' },
  heroCycle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 9 },
  heroPct: { fontFamily: 'JetBrainsMono-Bold', fontSize: 28, color: Colors.onSurface },
  heroPctLabel: { ...Typography.labelCaps, color: Colors.primaryFixed, fontSize: 9 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  heroFooterText: { ...Typography.bodySm, color: Colors.onSurfaceVariant },

  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Shapes.pill,
    borderWidth: 1, borderColor: Colors.strokeBright, backgroundColor: 'transparent',
  },
  filterPillActive: { backgroundColor: Colors.primaryFixed, borderColor: Colors.primaryFixed },
  filterText: { ...Typography.labelCaps, color: Colors.onSurface, fontSize: 10 },
  filterTextActive: { color: Colors.onPrimary },

  budgetCard: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shapes.xl,
    padding: Spacing.cardPadding, gap: 12,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  budgetName: { ...Typography.headlineSm, color: Colors.onSurface, fontSize: 16 },
  budgetRemaining: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Shapes.pill,
    borderWidth: 1, backgroundColor: 'transparent',
  },
  statusText: { ...Typography.labelCaps, fontSize: 9 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetFooterText: { fontFamily: 'JetBrainsMono-Medium', fontSize: 12, color: Colors.onSurfaceVariant },
  budgetFooterPct: { fontFamily: 'JetBrainsMono-SemiBold', fontSize: 12 },

  progressBarBg: { height: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
});
